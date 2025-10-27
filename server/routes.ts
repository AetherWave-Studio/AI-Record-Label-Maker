import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import multer from "multer";
import { db } from "./db";
import OpenAI from "openai";
import { HttpsProxyAgent } from "https-proxy-agent";
import nodeFetch from "node-fetch";
import { fal } from "@fal-ai/client";
import { 
  uploadedAudio, 
  PLAN_FEATURES,
  SERVICE_CREDIT_COSTS,
  type PlanType,
  type VideoResolution,
  type ImageEngine,
  type MusicModel
} from "@shared/schema";
import { eq } from "drizzle-orm";

// Create proxy agent for KIE.ai API calls
function createProxyAgent() {
  const { PROXY_HOST, PROXY_PORT, PROXY_USERNAME, PROXY_PASSWORD } = process.env;
  
  if (PROXY_HOST && PROXY_PORT && PROXY_USERNAME && PROXY_PASSWORD) {
    const proxyUrl = `http://${PROXY_USERNAME}:${PROXY_PASSWORD}@${PROXY_HOST}:${PROXY_PORT}`;
    console.log(`Using proxy: http://${PROXY_USERNAME}:***@${PROXY_HOST}:${PROXY_PORT}`);
    return new HttpsProxyAgent(proxyUrl);
  }
  
  console.log('No proxy configured, using direct connection');
  return undefined;
}

// Plan-based validation helpers
function validateVideoResolution(planType: PlanType, resolution: VideoResolution): boolean {
  const allowedResolutions = PLAN_FEATURES[planType].allowedVideoResolutions;
  return allowedResolutions.includes(resolution);
}

function validateImageEngine(planType: PlanType, engine: ImageEngine): boolean {
  const allowedEngines = PLAN_FEATURES[planType].allowedImageEngines;
  return allowedEngines.includes(engine);
}

function validateMusicModel(planType: PlanType, model: MusicModel): boolean {
  const allowedModels = PLAN_FEATURES[planType].allowedMusicModels;
  return allowedModels.includes(model);
}

// Calculate video generation credits based on quality settings
function calculateVideoCredits(
  modelVersion: 'lite' | 'pro',
  resolution: '512p' | '720p' | '1080p' | '4k',
  duration: number
): number {
  // Base cost by model
  const modelMultiplier = modelVersion === 'pro' ? 2 : 1; // Pro is 2x
  
  // Resolution multiplier (512p=1x, 720p=1.5x, 1080p=2x, 4k=3x)
  let resolutionMultiplier = 1;
  if (resolution === '720p') resolutionMultiplier = 1.5;
  if (resolution === '1080p') resolutionMultiplier = 2;
  if (resolution === '4k') resolutionMultiplier = 3;
  
  // Duration multiplier (3s = 1x, 5s = 1.67x, 10s = 3.33x)
  const durationMultiplier = duration / 3;
  
  // Base cost is 3 credits for lowest settings (lite, 512p, 3s)
  const baseCredits = 3;
  const totalCredits = Math.ceil(baseCredits * modelMultiplier * resolutionMultiplier * durationMultiplier);
  
  console.log(`Video credits calculation: ${modelVersion} ${resolution} ${duration}s = ${totalCredits} credits (base: ${baseCredits}, model: ${modelMultiplier}x, res: ${resolutionMultiplier}x, duration: ${durationMultiplier}x)`);
  
  return totalCredits;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);

  // Auth user route
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log('Auth check for user ID:', userId);
      let user = await storage.getUser(userId);
      
      // If user doesn't exist in database, create them from session claims
      if (!user) {
        console.log('User not found in database, creating from session claims...');
        const claims = req.user.claims;
        user = await storage.upsertUser({
          id: claims.sub,
          email: claims.email,
          firstName: claims.first_name,
          lastName: claims.last_name,
          profileImageUrl: claims.profile_image_url,
        });
        console.log('User created successfully:', user.id, user.email, `Credits: ${user.credits}`);
      } else {
        console.log('User found in database:', user.id, user.email, `Credits: ${user.credits}`);
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Chat endpoint using OpenAI (via Replit AI Integrations)
  // Note: Authenticated to prevent abuse of OpenAI integration credits
  app.post("/api/chat", isAuthenticated, async (req: any, res) => {
    try {
      const { message } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Initialize OpenAI client with Replit AI Integrations credentials
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      // Call OpenAI chat API
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are AetherWave AI, a helpful assistant for AetherWave Studio - an AI music and media creation platform. Help users with questions about creating music, generating album art, and using the platform's features."
          },
          {
            role: "user",
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      const responseMessage = completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response. Please try again.";

      res.json({ message: responseMessage });

    } catch (error: any) {
      console.error('Chat error:', error);
      res.status(500).json({ 
        error: 'Failed to process chat message',
        details: error.message 
      });
    }
  });

  // Music generation route with vocal gender support (KIE.ai API)
  app.post("/api/generate-music", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { 
        prompt, 
        model = 'V4_5', 
        instrumental = false, 
        vocalGender = 'm',
        customMode = false,
        title,
        style
      } = req.body;

      // Validate required inputs FIRST
      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Prompt is required and must be a non-empty string'
        });
      }

      // Validate SUNO API key is configured BEFORE deducting credits
      const sunoApiKey = process.env.SUNO_API_KEY;
      if (!sunoApiKey) {
        return res.status(500).json({ 
          error: 'SUNO API key not configured',
          details: 'Please add SUNO_API_KEY to your Replit Secrets'
        });
      }

      // Validate music model is allowed for user's plan BEFORE deducting credits
      const userPlan = user.subscriptionPlan as PlanType;
      if (!validateMusicModel(userPlan, model)) {
        return res.status(403).json({
          error: 'Model not allowed',
          message: `Your ${user.subscriptionPlan} plan does not include ${model} model. Upgrade to Studio or higher to unlock premium models.`,
          allowedModels: PLAN_FEATURES[userPlan].allowedMusicModels
        });
      }
      
      // ALL validations passed - NOW deduct credits
      const creditResult = await storage.deductCredits(userId, 'music_generation');
      
      if (!creditResult.success) {
        return res.status(403).json({ 
          error: 'Insufficient credits',
          credits: creditResult.newBalance,
          required: SERVICE_CREDIT_COSTS.music_generation,
          message: creditResult.error || 'You need more credits to generate music. Upgrade your plan or wait for daily reset.'
        });
      }

      console.log('Music generation request:', { prompt, model, instrumental, vocalGender, customMode, title, style });

      // Build KIE.ai API request
      // KIE.ai requires a valid callback URL (even if we don't use it for polling)
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
        : 'https://example.com';
      const callbackUrl = `${baseUrl}/api/music-callback`;
      
      // Build complete KIE.ai payload with all optional parameters
      const sunoPayload: any = {
        prompt: prompt,
        model: model,
        instrumental: instrumental,
        customMode: customMode,
        callBackUrl: callbackUrl
      };

      // Add optional parameters when in custom mode
      if (customMode) {
        if (vocalGender) sunoPayload.vocalGender = vocalGender;
        if (title) sunoPayload.title = title;
        if (style) sunoPayload.style = style;
      }

      console.log('Sending to KIE.ai:', JSON.stringify(sunoPayload, null, 2));

      // Call KIE.ai SUNO API with proxy
      const proxyAgent = createProxyAgent();
      const sunoResponse = await nodeFetch('https://api.kie.ai/api/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sunoApiKey}`
        },
        body: JSON.stringify(sunoPayload),
        agent: proxyAgent
      });

      if (!sunoResponse.ok) {
        const errorData = await sunoResponse.json().catch(() => ({}));
        console.error('KIE.ai API error:', errorData);
        return res.status(sunoResponse.status).json({
          error: 'SUNO API error',
          details: errorData.msg || errorData.message || sunoResponse.statusText
        });
      }

      const sunoData = await sunoResponse.json();
      console.log('KIE.ai response:', JSON.stringify(sunoData, null, 2));
      
      // KIE.ai returns { code: 200, msg: "success", data: { taskId: "xxx" } }
      if (sunoData.code === 200) {
        // Return task ID - frontend will need to poll for results
        res.json({
          taskId: sunoData.data.taskId,
          status: 'processing',
          message: 'Music generation started. Check status with task ID.'
        });
      } else {
        res.status(500).json({
          error: 'Generation failed',
          details: sunoData.msg || 'Unknown error'
        });
      }

    } catch (error: any) {
      console.error('Music generation error:', error);
      res.status(500).json({ 
        error: 'Failed to generate music',
        details: error.message 
      });
    }
  });

  // Upload & Cover Audio route (KIE.ai API)
  app.post("/api/upload-cover-music", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { 
        uploadUrl,
        prompt, 
        model = 'V4_5', 
        instrumental = false, 
        vocalGender = 'm',
        customMode = false,
        title,
        style,
        styleWeight,
        weirdnessConstraint,
        audioWeight,
        negativeTags
      } = req.body;

      // Validate required inputs FIRST
      if (!uploadUrl || typeof uploadUrl !== 'string' || uploadUrl.trim().length === 0) {
        return res.status(400).json({
          error: 'Upload URL required',
          message: 'Please provide a valid audio URL to cover'
        });
      }

      if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
        return res.status(400).json({
          error: 'Invalid request',
          message: 'Prompt is required and must be a non-empty string'
        });
      }

      // Validate SUNO API key is configured BEFORE deducting credits
      const sunoApiKey = process.env.SUNO_API_KEY;
      if (!sunoApiKey) {
        return res.status(500).json({ 
          error: 'SUNO API key not configured',
          details: 'Please add SUNO_API_KEY to your Replit Secrets'
        });
      }

      // Validate music model is allowed for user's plan BEFORE deducting credits
      const userPlan = user.subscriptionPlan as PlanType;
      if (!validateMusicModel(userPlan, model)) {
        return res.status(403).json({
          error: 'Model not allowed',
          message: `Your ${user.subscriptionPlan} plan does not include ${model} model. Upgrade to Studio or higher to unlock premium models.`,
          allowedModels: PLAN_FEATURES[userPlan].allowedMusicModels
        });
      }
      
      // ALL validations passed - NOW deduct credits
      const creditResult = await storage.deductCredits(userId, 'music_generation');
      
      if (!creditResult.success) {
        return res.status(403).json({ 
          error: 'Insufficient credits',
          credits: creditResult.newBalance,
          required: SERVICE_CREDIT_COSTS.music_generation,
          message: creditResult.error || 'You need more credits to generate music. Upgrade your plan or wait for daily reset.'
        });
      }

      console.log('Upload-cover request:', { uploadUrl, prompt, model, instrumental, vocalGender, customMode });

      // Build KIE.ai upload-cover API request
      // KIE.ai requires a valid callback URL (even if we don't use it for polling)
      const baseUrl = process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}` 
        : 'https://example.com';
      const callbackUrl = `${baseUrl}/api/music-callback`;
      
      const coverPayload: any = {
        uploadUrl: uploadUrl,
        prompt: prompt,
        model: model,
        instrumental: instrumental,
        customMode: customMode,
        callBackUrl: callbackUrl
      };

      // Add vocal gender only in custom mode (per KIE.ai API spec)
      if (customMode) {
        coverPayload.vocalGender = vocalGender;
      }

      if (customMode && title) {
        coverPayload.title = title;
      }
      
      if (customMode && style) {
        coverPayload.style = style;
      }

      // Add optional advanced parameters
      if (styleWeight !== undefined) {
        coverPayload.styleWeight = styleWeight;
      }
      if (weirdnessConstraint !== undefined) {
        coverPayload.weirdnessConstraint = weirdnessConstraint;
      }
      if (audioWeight !== undefined) {
        coverPayload.audioWeight = audioWeight;
      }
      if (negativeTags) {
        coverPayload.negativeTags = negativeTags;
      }

      console.log('Sending to KIE.ai upload-cover:', JSON.stringify(coverPayload, null, 2));

      // Call KIE.ai upload-cover SUNO API with proxy
      const proxyAgent = createProxyAgent();
      const sunoResponse = await nodeFetch('https://api.kie.ai/api/v1/generate/upload-cover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sunoApiKey}`
        },
        body: JSON.stringify(coverPayload),
        agent: proxyAgent
      });

      if (!sunoResponse.ok) {
        const errorData = await sunoResponse.json().catch(() => ({}));
        console.error('KIE.ai upload-cover API error:', errorData);
        return res.status(sunoResponse.status).json({
          error: 'SUNO upload-cover API error',
          details: errorData.msg || errorData.message || sunoResponse.statusText
        });
      }

      const sunoData = await sunoResponse.json();
      console.log('KIE.ai upload-cover response:', JSON.stringify(sunoData, null, 2));
      
      // KIE.ai returns { code: 200, msg: "success", data: { taskId: "xxx" } }
      if (sunoData.code === 200) {
        res.json({
          taskId: sunoData.data.taskId,
          status: 'processing',
          message: 'Audio cover generation started. Check status with task ID.'
        });
      } else {
        res.status(500).json({
          error: 'Upload-cover generation failed',
          details: sunoData.msg || 'Unknown error'
        });
      }

    } catch (error: any) {
      console.error('Upload-cover error:', error);
      res.status(500).json({ 
        error: 'Failed to cover audio',
        details: error.message 
      });
    }
  });

  // Get music generation status (for KIE.ai polling)
  app.get("/api/music-status/:taskId", async (req, res) => {
    try {
      const { taskId } = req.params;
      const sunoApiKey = process.env.SUNO_API_KEY;

      if (!sunoApiKey) {
        return res.status(500).json({ error: 'API key not configured' });
      }

      console.log('Checking status for taskId:', taskId);
      const proxyAgent = createProxyAgent();
      const response = await nodeFetch(`https://api.kie.ai/api/v1/generate/record-info?taskId=${taskId}`, {
        headers: {
          'Authorization': `Bearer ${sunoApiKey}`
        },
        agent: proxyAgent
      });

      const data = await response.json();
      console.log(`KIE.ai status for task ${taskId}:`, JSON.stringify(data, null, 2));
      
      // KIE.ai response format: { code: 200, data: { taskId, status, response: { sunoData: [...] } } }
      if (data.code === 200 && data.data) {
        const taskData = data.data;
        const taskStatus = taskData.status; // PENDING, TEXT_SUCCESS, FIRST_SUCCESS, SUCCESS
        
        // Extract tracks from response.sunoData if available
        const sunoData = taskData.response?.sunoData || [];
        const tracks = sunoData.map((track: any) => ({
          id: track.id,
          title: track.title,
          audioUrl: track.audioUrl,
          streamAudioUrl: track.streamAudioUrl,
          imageUrl: track.imageUrl,
          prompt: track.prompt,
          tags: track.tags,
          duration: track.duration
        }));

        res.json({
          status: taskStatus,
          tracks: tracks
        });
      } else {
        // Return error or pending status
        res.json({ 
          status: 'pending', 
          tracks: [],
          error: data.msg || 'Unknown status'
        });
      }

    } catch (error: any) {
      console.error('Status check error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // User preferences route
  app.get("/api/user/preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ vocalGenderPreference: user.vocalGenderPreference });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update user vocal preference
  app.post("/api/user/preferences", isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const { vocalGenderPreference } = req.body;
      const user = await storage.updateUserVocalPreference(userId, vocalGenderPreference);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ success: true, vocalGenderPreference: user.vocalGenderPreference });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Configure multer for audio file uploads (in-memory)
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
    },
    fileFilter: (req, file, cb) => {
      const allowedMimeTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/ogg', 'audio/flac', 'audio/x-m4a'];
      if (allowedMimeTypes.includes(file.mimetype) || file.originalname.match(/\.(mp3|wav|m4a|ogg|flac)$/i)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only audio files are allowed.'));
      }
    }
  });

  // Upload audio file endpoint
  app.post("/api/upload-audio", upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded',
          details: 'Please select an audio file to upload'
        });
      }

      const userId = (req as any).user?.claims?.sub || null;

      // Convert buffer to base64
      const base64Audio = req.file.buffer.toString('base64');

      // Store in database
      const [newAudio] = await db.insert(uploadedAudio).values({
        fileName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size.toString(),
        audioData: base64Audio,
        userId: userId,
      }).returning();

      // Return public URL for accessing the audio
      const publicUrl = `${req.protocol}://${req.get('host')}/api/audio/${newAudio.id}`;

      res.json({
        success: true,
        url: publicUrl,
        id: newAudio.id,
        fileName: newAudio.fileName,
        fileSize: newAudio.fileSize
      });

    } catch (error: any) {
      console.error('Audio upload error:', error);
      res.status(500).json({
        error: 'Failed to upload audio',
        details: error.message
      });
    }
  });

  // Serve audio file by ID
  app.get("/api/audio/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const [audio] = await db.select().from(uploadedAudio).where(eq(uploadedAudio.id, id));

      if (!audio) {
        return res.status(404).json({
          error: 'Audio file not found'
        });
      }

      // Convert base64 back to buffer
      const audioBuffer = Buffer.from(audio.audioData, 'base64');

      // Set appropriate headers
      res.set({
        'Content-Type': audio.mimeType,
        'Content-Length': audioBuffer.length,
        'Content-Disposition': `inline; filename="${audio.fileName}"`,
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      });

      res.send(audioBuffer);

    } catch (error: any) {
      console.error('Audio serve error:', error);
      res.status(500).json({
        error: 'Failed to serve audio',
        details: error.message
      });
    }
  });

  // Credit Management Routes
  
  // Get user's current credits
  app.get('/api/user/credits', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        credits: user.credits,
        planType: user.subscriptionPlan,
        lastCreditReset: user.lastCreditReset
      });
    } catch (error) {
      console.error("Error fetching credits:", error);
      res.status(500).json({ message: "Failed to fetch credits" });
    }
  });
  
  // Check and reset daily credits if needed
  app.post('/api/user/credits/check-reset', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Only reset for free users
      if (user.subscriptionPlan !== 'free') {
        return res.json({ 
          credits: user.credits,
          resetOccurred: false 
        });
      }
      
      // Check if 24 hours have passed since last reset
      const now = new Date();
      const lastReset = new Date(user.lastCreditReset);
      const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceReset >= 24) {
        // Reset credits to 50 for free users
        await storage.updateUserCredits(userId, 50, now);
        res.json({ 
          credits: 50,
          resetOccurred: true,
          message: "Daily credits reset to 50"
        });
      } else {
        res.json({ 
          credits: user.credits,
          resetOccurred: false,
          hoursUntilReset: Math.ceil(24 - hoursSinceReset)
        });
      }
    } catch (error) {
      console.error("Error checking credit reset:", error);
      res.status(500).json({ message: "Failed to check credit reset" });
    }
  });
  
  // Check if user has sufficient credits for a service (pre-validation)
  app.post('/api/user/credits/check', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { serviceType } = req.body;
      
      if (!serviceType || !SERVICE_CREDIT_COSTS[serviceType as keyof typeof SERVICE_CREDIT_COSTS]) {
        return res.status(400).json({ 
          error: 'Invalid service type',
          validTypes: Object.keys(SERVICE_CREDIT_COSTS)
        });
      }
      
      const checkResult = await storage.checkCredits(userId, serviceType);
      
      res.json({
        allowed: checkResult.allowed,
        reason: checkResult.reason,
        currentCredits: checkResult.currentCredits,
        requiredCredits: checkResult.requiredCredits,
        planType: checkResult.planType,
        serviceCost: SERVICE_CREDIT_COSTS[serviceType as keyof typeof SERVICE_CREDIT_COSTS]
      });
    } catch (error) {
      console.error("Error checking credits:", error);
      res.status(500).json({ message: "Failed to check credits" });
    }
  });
  
  // Deduct credits for a specific service (used internally by generation endpoints)
  app.post('/api/user/credits/deduct', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { serviceType } = req.body;
      
      if (!serviceType || !SERVICE_CREDIT_COSTS[serviceType as keyof typeof SERVICE_CREDIT_COSTS]) {
        return res.status(400).json({ 
          error: 'Invalid service type',
          validTypes: Object.keys(SERVICE_CREDIT_COSTS)
        });
      }
      
      const deductResult = await storage.deductCredits(userId, serviceType);
      
      if (!deductResult.success) {
        return res.status(403).json({ 
          error: 'Credit deduction failed',
          message: deductResult.error,
          currentCredits: deductResult.newBalance
        });
      }
      
      res.json({ 
        success: true,
        newBalance: deductResult.newBalance,
        amountDeducted: deductResult.amountDeducted,
        wasUnlimited: deductResult.wasUnlimited
      });
    } catch (error) {
      console.error("Error deducting credits:", error);
      res.status(500).json({ message: "Failed to deduct credits" });
    }
  });

  // Example: Video generation endpoint stub (for future implementation)
  // This demonstrates server-side plan validation for video resolution
  app.post("/api/generate-video", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { prompt, resolution = '720p' } = req.body;
      const userPlan = user.subscriptionPlan as PlanType;
      
      // Validate resolution is allowed for user's plan
      if (!validateVideoResolution(userPlan, resolution as VideoResolution)) {
        return res.status(403).json({
          error: 'Resolution not allowed',
          message: `Your ${user.subscriptionPlan} plan does not include ${resolution} resolution. Upgrade to Studio or higher to unlock HD and 4K video.`,
          allowedResolutions: PLAN_FEATURES[userPlan].allowedVideoResolutions
        });
      }
      
      // TODO: Call video generation API (e.g., Fal.ai Seedance)
      return res.status(501).json({
        message: 'Video generation not yet implemented',
        validatedResolution: resolution
      });
    } catch (error: any) {
      console.error('Video generation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Convert audio to WAV format (paid users only)
  app.post("/api/convert-to-wav", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const userPlan = user.subscriptionPlan as PlanType;
      
      // WAV conversion is paid-only feature
      if (!PLAN_FEATURES[userPlan].wavConversion) {
        return res.status(403).json({
          error: 'WAV conversion not available',
          message: 'WAV conversion is only available for Studio, Creator, and All Access plans. Upgrade to unlock high-quality WAV exports.',
          requiredPlan: 'Studio'
        });
      }
      
      const { taskId, audioId } = req.body;
      
      if (!taskId || !audioId) {
        return res.status(400).json({
          error: 'Missing parameters',
          message: 'taskId and audioId are required'
        });
      }
      
      const sunoApiKey = process.env.SUNO_API_KEY;
      if (!sunoApiKey) {
        return res.status(500).json({ 
          error: 'SUNO API key not configured',
          details: 'Please add SUNO_API_KEY to your Replit Secrets'
        });
      }
      
      // Construct callback URL (will be called when conversion completes)
      const replitDomains = process.env.REPLIT_DOMAINS || process.env.REPLIT_DEV_DOMAIN;
      const domain = replitDomains?.split(',')[0] || 'localhost:5000';
      const protocol = domain.includes('localhost') ? 'http' : 'https';
      const callBackUrl = `${protocol}://${domain}/api/wav-callback`;
      
      console.log('WAV conversion request:', { taskId, audioId, callBackUrl });
      
      // Call SUNO WAV conversion API with proxy
      const proxyAgent = createProxyAgent();
      const wavResponse = await nodeFetch('https://api.kie.ai/api/v1/wav/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sunoApiKey}`
        },
        body: JSON.stringify({
          taskId,
          audioId,
          callBackUrl
        }),
        agent: proxyAgent
      });
      
      if (!wavResponse.ok) {
        const errorData = await wavResponse.json().catch(() => ({}));
        console.error('SUNO WAV API error:', errorData);
        return res.status(wavResponse.status).json({
          error: 'WAV conversion failed',
          details: errorData.msg || errorData.message || wavResponse.statusText
        });
      }
      
      const wavData = await wavResponse.json();
      console.log('SUNO WAV response:', JSON.stringify(wavData, null, 2));
      
      if (wavData.code === 200) {
        res.json({
          taskId: wavData.data.taskId,
          status: 'processing',
          message: 'WAV conversion started. You will receive the download URL via callback or can poll the status endpoint.'
        });
      } else {
        res.status(500).json({
          error: 'WAV conversion failed',
          details: wavData.msg || 'Unknown error'
        });
      }
      
    } catch (error: any) {
      console.error('WAV conversion error:', error);
      res.status(500).json({ 
        error: 'Failed to convert to WAV',
        details: error.message 
      });
    }
  });
  
  // WAV conversion callback (receives completion updates from SUNO)
  app.post("/api/wav-callback", async (req, res) => {
    try {
      // Basic validation - ensure callback has expected SUNO structure
      const { code, data, msg } = req.body;
      
      if (typeof code !== 'number') {
        console.warn('Invalid WAV callback structure - missing code');
        return res.status(400).json({ error: 'Invalid callback format' });
      }
      
      console.log('WAV callback received:', JSON.stringify(req.body, null, 2));
      
      // TODO: Store WAV conversion result in database or emit via WebSocket
      // The callback includes:
      // - code: status code
      // - data: { taskId, wavUrl, ... }
      // - msg: message
      
      // For now, just acknowledge receipt
      // When implementing storage/notification:
      // 1. Store data.wavUrl in database linked to taskId
      // 2. Emit WebSocket event to notify user
      // 3. Or have frontend poll /api/wav-status/:taskId
      
      res.json({ received: true });
      
    } catch (error: any) {
      console.error('WAV callback error:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Get WAV conversion status (polling alternative to callback)
  app.get("/api/wav-status/:taskId", isAuthenticated, async (req: any, res) => {
    try {
      const { taskId } = req.params;
      const sunoApiKey = process.env.SUNO_API_KEY;
      
      if (!sunoApiKey) {
        return res.status(500).json({ error: 'API key not configured' });
      }
      
      // Call SUNO API to get WAV status with proxy
      // Note: Exact endpoint for status polling may vary - check SUNO docs
      const proxyAgent = createProxyAgent();
      const response = await nodeFetch(`https://api.kie.ai/api/v1/wav/get?taskId=${taskId}`, {
        headers: {
          'Authorization': `Bearer ${sunoApiKey}`
        },
        agent: proxyAgent
      });
      
      if (!response.ok) {
        return res.status(response.status).json({
          error: 'Failed to fetch WAV status'
        });
      }
      
      const data = await response.json();
      res.json(data);
      
    } catch (error: any) {
      console.error('WAV status check error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Album Art Generation with Fal.ai Nano Banana
  app.post("/api/generate-art", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { prompt, style = 'abstract', referenceImage } = req.body;
      
      // Validate inputs
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Invalid prompt' });
      }
      
      if (prompt.length > 1000) {
        return res.status(400).json({ error: 'Prompt too long (max 1000 characters)' });
      }
      
      // Validate Fal.ai API key
      const falApiKey = process.env.FAL_KEY;
      
      if (!falApiKey) {
        return res.status(500).json({ error: 'Fal.ai API key not configured. Please add FAL_KEY to your secrets.' });
      }
      
      // Set API key for Fal client
      process.env.FAL_KEY = falApiKey;
      
      // Deduct credits for album art generation
      const creditResult = await storage.deductCredits(userId, 'album_art_generation');
      
      if (!creditResult.success) {
        return res.status(403).json({ 
          error: 'Insufficient credits',
          credits: creditResult.newBalance,
          required: SERVICE_CREDIT_COSTS.album_art_generation,
          message: creditResult.error || 'You need more credits to generate album art. Upgrade your plan or wait for daily reset.'
        });
      }
      
      // Style descriptions for enhanced prompts
      const styleDescriptions: Record<string, string> = {
        cyberpunk: 'cyberpunk aesthetic with neon lights, futuristic cityscape, dark background with bright neon accents',
        abstract: 'abstract art with flowing shapes, vibrant colors, artistic interpretation',
        retro: 'retro vaporwave aesthetic, 80s style, pink and purple gradients, nostalgic vibes',
        minimal: 'minimalist design with clean lines, simple composition, modern aesthetic',
        surreal: 'surrealist art with dreamlike imagery, unexpected elements, artistic creativity',
        photorealistic: 'photorealistic with highly detailed, professional photography style'
      };
      
      const styleHint = styleDescriptions[style] || styleDescriptions.abstract;
      
      // Determine which model to use based on whether reference image is provided
      const hasReference = referenceImage && referenceImage.trim().length > 0;
      const modelId = hasReference ? 'fal-ai/nano-banana/edit' : 'fal-ai/nano-banana';
      
      let enhancedPrompt: string;
      if (hasReference) {
        // For image-to-image: focus on transformation/editing instructions
        enhancedPrompt = `Transform this into an album cover art. ${prompt}. Apply ${styleHint}. Professional music album cover design with square 1:1 aspect ratio.`;
      } else {
        // For text-to-image: full detailed description
        enhancedPrompt = `Album cover art: ${prompt}. Style: ${styleHint}. Square format, professional music album cover design.`;
      }
      
      console.log('Generating album art with Fal.ai Nano Banana:', { 
        model: modelId,
        prompt, 
        style, 
        hasReference,
        enhancedPrompt 
      });
      
      // Build request input
      const input: any = {
        prompt: enhancedPrompt,
        num_images: 1,
        output_format: 'jpeg',
        aspect_ratio: '1:1'
      };
      
      // Add reference image if provided (supports both data URIs and HTTP URLs)
      if (hasReference) {
        input.image_urls = [referenceImage];
        console.log('Using reference image for style guidance');
      }
      
      // Call Fal.ai Nano Banana API
      const result = await fal.subscribe(modelId, {
        input: input,
        logs: true,
        onQueueUpdate: (update: any) => {
          console.log('Fal.ai Nano Banana queue update:', update.status);
        }
      });
      
      console.log('Fal.ai Nano Banana generation complete');
      
      // Extract image URL from response
      const resultData = result as any;
      const imageUrl = resultData.data?.images?.[0]?.url || 
                       resultData.images?.[0]?.url ||
                       resultData.data?.image_url ||
                       resultData.image_url;
      
      if (imageUrl) {
        console.log('✅ Image URL extracted:', imageUrl);
        return res.status(200).json({
          imageUrl: imageUrl,
          prompt: prompt,
          style: style,
          description: resultData.data?.description || resultData.description,
          hasReference: hasReference
        });
      } else {
        console.error('❌ No image URL found in response');
        return res.status(500).json({
          error: 'Image generation completed but no image URL found in response',
          result: result
        });
      }
      
    } catch (error: any) {
      console.error('Album art generation error:', error);
      res.status(500).json({
        error: 'Failed to generate album art',
        details: error.message,
        body: error.body
      });
    }
  });

  // Proxy endpoint for downloading external images (bypasses CORS)
  app.get("/api/download-image", isAuthenticated, async (req: any, res) => {
    try {
      const { url, filename } = req.query;

      if (!url || !filename) {
        return res.status(400).json({ error: 'URL and filename are required' });
      }

      // Fetch the image from the external URL
      const response = await fetch(url as string);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/png';

      // Set headers to force download
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.byteLength.toString());

      // Send the image buffer
      res.send(Buffer.from(buffer));

    } catch (error: any) {
      console.error('Image download proxy error:', error);
      res.status(500).json({ error: 'Failed to download image', details: error.message });
    }
  });

  // Music Video Generation with Fal.ai Seedance
  app.post("/api/generate-video-fal", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const {
        prompt,
        imageData,
        imageUrl,
        image_url,
        end_image_url,
        imageMode = 'first-frame',
        modelVersion = 'lite',
        resolution = '720p',
        duration = '5',
        cameraFixed = false,
        seed = -1,
        enableSafetyChecker = true
      } = req.body;

      if (!prompt) {
        return res.status(400).json({
          error: 'Invalid request. Prompt is required for video generation.'
        });
      }

      // Validate Fal.ai API key
      const falApiKey = process.env.FAL_KEY;
      if (!falApiKey) {
        return res.status(500).json({ error: 'Fal.ai API key not configured. Please add FAL_KEY to your secrets.' });
      }

      // Set API key for Fal client
      process.env.FAL_KEY = falApiKey;

      // Validate quality settings for free accounts
      if (user.subscriptionPlan === 'free') {
        if (modelVersion !== 'lite' || resolution !== '512p' || parseInt(duration) !== 3) {
          return res.status(403).json({
            error: 'Free accounts can only use default settings (Lite model, 512p, 3 seconds)',
            message: 'Please upgrade your plan to access higher quality video generation settings.'
          });
        }
      }

      // Calculate credits based on quality settings
      const requiredCredits = calculateVideoCredits(
        modelVersion as 'lite' | 'pro',
        resolution as '512p' | '720p' | '1080p' | '4k',
        parseInt(duration)
      );

      // Check if plan has unlimited video generation
      const hasUnlimitedVideo = ['all_access'].includes(user.subscriptionPlan);

      // Deduct credits for video generation (skip for unlimited plans)
      if (!hasUnlimitedVideo) {
        const currentCredits = user.credits || 0;
        if (currentCredits < requiredCredits) {
          return res.status(403).json({
            error: 'Insufficient credits',
            credits: currentCredits,
            required: requiredCredits,
            message: `You need ${requiredCredits} credits to generate this video. Upgrade your plan or wait for daily reset.`
          });
        }

        // Deduct the calculated amount
        const newCredits = currentCredits - requiredCredits;
        await storage.updateUserCredits(userId, newCredits);
        console.log(`Deducted ${requiredCredits} credits for video generation. New balance: ${newCredits}`);
      } else {
        console.log('Unlimited plan - skipping credit deduction');
      }

      // Determine which Fal.ai model to use
      // Support both imageData (base64), imageUrl (camelCase), and image_url (snake_case)
      const finalImageUrl = imageUrl || image_url;
      const hasImage = imageData || finalImageUrl;
      
      let modelId;
      if (hasImage) {
        if (imageMode === 'reference') {
          modelId = modelVersion === 'pro'
            ? 'fal-ai/bytedance/seedance/v1/pro/reference-to-video'
            : 'fal-ai/bytedance/seedance/v1/lite/reference-to-video';
        } else {
          modelId = modelVersion === 'pro'
            ? 'fal-ai/bytedance/seedance/v1/pro/image-to-video'
            : 'fal-ai/bytedance/seedance/v1/lite/image-to-video';
        }
      } else {
        modelId = modelVersion === 'pro'
          ? 'fal-ai/bytedance/seedance/v1/pro/text-to-video'
          : 'fal-ai/bytedance/seedance/v1/lite/text-to-video';
      }

      console.log('Generating video with Fal.ai Seedance:', {
        model: modelId,
        prompt: prompt,
        hasImage: hasImage,
        imageMode: hasImage ? imageMode : 'none',
        imageSource: imageData ? 'base64' : (finalImageUrl ? 'url' : 'none'),
        imageUrl: finalImageUrl,
        resolution: resolution,
        duration: duration
      });

      // Build request input
      // Frame calculation: ~24fps + 1 end frame (3s=73, 5s=121, 10s=241)
      let numFrames = 121; // default 5 seconds
      if (duration === '3') numFrames = 73;
      else if (duration === '10') numFrames = 241;
      
      const input: any = {
        prompt: prompt,
        num_frames: numFrames,
        enable_safety_checker: enableSafetyChecker
      };

      // Add resolution
      if (resolution === '512p') {
        input.resolution = '480p';
      } else {
        input.resolution = resolution;
      }

      // Add image if provided (support both base64 and URL)
      const imageSource = imageData || finalImageUrl;
      
      if (imageSource) {
        if (imageMode === 'reference') {
          // Reference mode uses array of image URLs
          input.image_urls = [imageSource];
        } else {
          // First-frame mode uses single image URL (image-to-video)
          input.image_url = imageSource;
          
          // Add end frame if provided (only for image-to-video mode)
          if (end_image_url) {
            input.end_image_url = end_image_url;
            console.log('Using end frame:', end_image_url);
          }
        }
      }

      // Subscribe to the model (streaming response)
      const result = await fal.subscribe(modelId, {
        input: input,
        logs: true,
        onQueueUpdate: (update: any) => {
          console.log('Fal.ai queue update:', update.status);
        }
      });

      console.log('Fal.ai video generation complete');

      // Extract video URL (type assertion needed for Fal.ai response structure)
      const resultData = result as any;
      const videoUrl = resultData.data?.video?.url ||
        resultData.video?.url ||
        resultData.video_url ||
        resultData.data?.video_url ||
        resultData.url;

      if (videoUrl) {
        console.log('✅ Video URL extracted:', videoUrl);
        return res.status(200).json({
          status: 'complete',
          videoUrl: videoUrl,
          model: modelId,
          seed: resultData.data?.seed || resultData.seed,
          timings: resultData.timings || resultData.data?.timings
        });
      } else {
        console.error('❌ No video URL found in response');
        return res.status(500).json({
          error: 'Video generation completed but no video URL found in response',
          result: result
        });
      }

    } catch (error: any) {
      console.error('Fal.ai Video Generation Error:', error);
      res.status(500).json({
        error: 'Failed to generate video with Fal.ai',
        details: error.message,
        body: error.body
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
