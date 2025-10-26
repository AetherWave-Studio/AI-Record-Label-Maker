import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { z } from "zod";
import multer from "multer";
import { db } from "./db";
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);

  // Auth user route
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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
      
      // Centralized credit check and deduction
      const creditResult = await storage.deductCredits(userId, 'music_generation');
      
      if (!creditResult.success) {
        return res.status(403).json({ 
          error: 'Insufficient credits',
          credits: creditResult.newBalance,
          required: SERVICE_CREDIT_COSTS.music_generation,
          message: creditResult.error || 'You need more credits to generate music. Upgrade your plan or wait for daily reset.'
        });
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

      // Validate music model is allowed for user's plan
      const userPlan = user.planType as PlanType;
      if (!validateMusicModel(userPlan, model)) {
        return res.status(403).json({
          error: 'Model not allowed',
          message: `Your ${user.planType} plan does not include ${model} model. Upgrade to Studio or higher to unlock premium models.`,
          allowedModels: PLAN_FEATURES[userPlan].allowedMusicModels
        });
      }

      console.log('Music generation request:', { prompt, model, instrumental, vocalGender, customMode, title, style });

      const sunoApiKey = process.env.SUNO_API_KEY;
      if (!sunoApiKey) {
        return res.status(500).json({ 
          error: 'SUNO API key not configured',
          details: 'Please add SUNO_API_KEY to your Replit Secrets'
        });
      }

      // Build KIE.ai API request
      const sunoPayload: any = {
        prompt: prompt,
        model: model,
        instrumental: instrumental,
        customMode: customMode
      };

      // Add vocal gender only in custom mode (per KIE.ai API spec)
      if (customMode) {
        sunoPayload.vocalGender = vocalGender;
      }

      if (customMode && title) {
        sunoPayload.title = title;
      }
      
      if (customMode && style) {
        sunoPayload.style = style;
      }

      console.log('Sending to KIE.ai:', JSON.stringify(sunoPayload, null, 2));

      // Call KIE.ai SUNO API
      const sunoResponse = await fetch('https://api.kie.ai/api/v1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sunoApiKey}`
        },
        body: JSON.stringify(sunoPayload)
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
      
      // Centralized credit check and deduction
      const creditResult = await storage.deductCredits(userId, 'music_generation');
      
      if (!creditResult.success) {
        return res.status(403).json({ 
          error: 'Insufficient credits',
          credits: creditResult.newBalance,
          required: SERVICE_CREDIT_COSTS.music_generation,
          message: creditResult.error || 'You need more credits to generate music. Upgrade your plan or wait for daily reset.'
        });
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

      // Validate music model is allowed for user's plan
      const userPlan = user.planType as PlanType;
      if (!validateMusicModel(userPlan, model)) {
        return res.status(403).json({
          error: 'Model not allowed',
          message: `Your ${user.planType} plan does not include ${model} model. Upgrade to Studio or higher to unlock premium models.`,
          allowedModels: PLAN_FEATURES[userPlan].allowedMusicModels
        });
      }

      console.log('Upload-cover request:', { uploadUrl, prompt, model, instrumental, vocalGender, customMode });

      const sunoApiKey = process.env.SUNO_API_KEY;
      if (!sunoApiKey) {
        return res.status(500).json({ 
          error: 'SUNO API key not configured',
          details: 'Please add SUNO_API_KEY to your Replit Secrets'
        });
      }

      if (!uploadUrl) {
        return res.status(400).json({
          error: 'Upload URL required',
          details: 'Please provide an audio URL to cover'
        });
      }

      // Build KIE.ai upload-cover API request
      const coverPayload: any = {
        uploadUrl: uploadUrl,
        prompt: prompt,
        model: model,
        instrumental: instrumental,
        customMode: customMode,
        callBackUrl: '' // Optional - we're polling instead
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

      // Call KIE.ai upload-cover SUNO API
      const sunoResponse = await fetch('https://api.kie.ai/api/v1/generate/upload-cover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sunoApiKey}`
        },
        body: JSON.stringify(coverPayload)
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

      const response = await fetch(`https://api.kie.ai/api/v1/get?ids=${taskId}`, {
        headers: {
          'Authorization': `Bearer ${sunoApiKey}`
        }
      });

      const data = await response.json();
      
      // Format response for frontend
      if (data.code === 200 && data.data && data.data.length > 0) {
        const tracks = data.data.map((track: any) => ({
          id: track.id,
          title: track.title,
          audioUrl: track.audio_url,
          streamAudioUrl: track.stream_audio_url,
          imageUrl: track.image_url,
          status: track.status
        }));

        res.json({
          status: data.data[0].status,
          tracks: tracks
        });
      } else {
        res.json({ status: 'pending', tracks: [] });
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
        planType: user.planType,
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
      if (user.planType !== 'free') {
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
      const userPlan = user.planType as PlanType;
      
      // Validate resolution is allowed for user's plan
      if (!validateVideoResolution(userPlan, resolution as VideoResolution)) {
        return res.status(403).json({
          error: 'Resolution not allowed',
          message: `Your ${user.planType} plan does not include ${resolution} resolution. Upgrade to Studio or higher to unlock HD and 4K video.`,
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
      
      const userPlan = user.planType as PlanType;
      
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
      
      // Call SUNO WAV conversion API
      const wavResponse = await fetch('https://api.kie.ai/api/v1/wav/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sunoApiKey}`
        },
        body: JSON.stringify({
          taskId,
          audioId,
          callBackUrl
        })
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
      
      // Call SUNO API to get WAV status
      // Note: Exact endpoint for status polling may vary - check SUNO docs
      const response = await fetch(`https://api.kie.ai/api/v1/wav/get?taskId=${taskId}`, {
        headers: {
          'Authorization': `Bearer ${sunoApiKey}`
        }
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

  // Example: Image generation endpoint stub (for future implementation)
  // This demonstrates server-side plan validation for image engines
  app.post("/api/generate-image", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { prompt, engine = 'dall-e-2' } = req.body;
      const userPlan = user.planType as PlanType;
      
      // Validate engine is allowed for user's plan
      if (!validateImageEngine(userPlan, engine as ImageEngine)) {
        return res.status(403).json({
          error: 'Engine not allowed',
          message: `Your ${user.planType} plan does not include ${engine} engine. Upgrade to Studio or higher to unlock premium image engines.`,
          allowedEngines: PLAN_FEATURES[userPlan].allowedImageEngines
        });
      }
      
      // TODO: Call image generation API (e.g., OpenAI DALL-E, Stability AI, etc.)
      return res.status(501).json({
        message: 'Image generation not yet implemented',
        validatedEngine: engine
      });
    } catch (error: any) {
      console.error('Image generation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
