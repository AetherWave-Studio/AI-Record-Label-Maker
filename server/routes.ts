import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { setupDevAuth, isDevAuthenticated } from "./devAuth";
import { z } from "zod";
import multer from "multer";
import { db } from "./db";
import OpenAI from "openai";
import { HttpsProxyAgent } from "https-proxy-agent";
import nodeFetch from "node-fetch";
import { fal } from "@fal-ai/client";
import { kieSubscribe, uploadImageToKie, generateMidjourney, KIE_MODELS } from "./kieClient";
import { generateMidjourneyTtapi } from "./ttapiClient";
import {
  uploadedAudio,
  PLAN_FEATURES,
  SERVICE_CREDIT_COSTS,
  type PlanType,
  type VideoResolution,
  type VideoModel,
  type ImageEngine,
  type MusicModel,
  type QuestType,
  QUEST_REWARDS
} from "@shared/schema";
import { eq, lt } from "drizzle-orm";
import virtualArtistsRouter from './VirtualArtistsRoutes.js';



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

function validateVideoModel(planType: PlanType, model: VideoModel): boolean {
  const allowedModels = PLAN_FEATURES[planType].allowedVideoModels;
  return allowedModels.includes(model);
}

function validateImageEngine(planType: PlanType, engine: ImageEngine): boolean {
  const allowedEngines = PLAN_FEATURES[planType].allowedImageEngines;
  return allowedEngines.includes(engine);
}

function validateMusicModel(planType: PlanType, model: MusicModel): boolean {
  const allowedModels = PLAN_FEATURES[planType].allowedMusicModels;
  return allowedModels.includes(model);
}

// Calculate video generation credits based on model and quality settings
// Updated 2025-01 with KIE.ai premium models (Veo 3, Sora 2)
// All pricing includes 50% margin for infrastructure and profit
function calculateVideoCredits(
  model: VideoModel,
  resolution?: '480p' | '720p' | '1080p' | '4k',
  duration?: number,
  quality?: 'standard' | 'hd'
): number {
  let costPerSecond = 0;

  // Premium KIE.ai models (VEO 3.1 has fixed cost per generation, not per-second)
  if (model === 'veo3_fast') {
    return 0.30; // $0.30 per 8s generation (fixed cost)
  } else if (model === 'sora2') {
    costPerSecond = 0.015; // $0.15/10s via KIE.ai (60% cheaper than OpenAI!)
    // Seedance models (fal.ai) - resolution-dependent pricing
  } else if (model === 'seedance-lite') {
    if (resolution === '480p') costPerSecond = 0.010;        // 480p pricing
    else if (resolution === '720p') costPerSecond = 0.0225;  // 720p pricing
    else if (resolution === '1080p') costPerSecond = 0.050;  // 1080p pricing
    else if (resolution === '4k') costPerSecond = 0.100;     // 4k estimate
  } else if (model === 'seedance-pro-fast') {
    // Pro Fast: $1.0 per million tokens (API cost, 50% markup applied below)
    // tokens = (height × width × FPS × duration) / 1024
    if (resolution === '480p') costPerSecond = 0.00922;   // 9,220 tokens/sec at $1.0/million
    else if (resolution === '720p') costPerSecond = 0.0216;  // 21,600 tokens/sec at $1.0/million
    else if (resolution === '1080p') costPerSecond = 0.0486; // 48,600 tokens/sec at $1.0/million
    // No 4K for Pro Fast
  } else if (model === 'seedance-pro') {
    if (resolution === '480p') costPerSecond = 0.020;
    else if (resolution === '720p') costPerSecond = 0.045;
    else if (resolution === '1080p') costPerSecond = 0.100;
    else if (resolution === '4k') costPerSecond = 0.200;
  }

  // Calculate total API cost
  const apiCost = costPerSecond * (duration || 5);

  // Add 50% margin for infrastructure, storage, and profit
  const totalCost = apiCost * 1.5;

  // Convert to credits (1 credit = $0.01)
  const totalCredits = Math.ceil(totalCost / 0.01);

  console.log(`Video credits: ${model}${resolution ? ` ${resolution}` : ''} ${duration || 5}s = ${totalCredits} credits ($${totalCost.toFixed(3)} with margin, API: $${apiCost.toFixed(3)})`);

  return totalCredits;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Determine if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Setup authentication based on environment
  if (isDevelopment) {
    console.log('🔧 Using development authentication');
    await setupDevAuth(app);
  } else {
    console.log('🔒 Using Replit authentication');
    await setupAuth(app);
  }

  // Use appropriate auth middleware based on environment
  const authMiddleware = isDevelopment ? isDevAuthenticated : isAuthenticated;
        app.use(virtualArtistsRouter);
  // Auth user route
  app.get('/api/auth/user', authMiddleware, async (req: any, res) => {
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
  app.post("/api/chat", authMiddleware, async (req: any, res) => {
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
  app.post("/api/generate-music", authMiddleware, async (req: any, res) => {
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
  app.post("/api/upload-cover-music", authMiddleware, async (req: any, res) => {
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
  app.get("/api/user/preferences", authMiddleware, async (req, res) => {
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
  app.post("/api/user/preferences", authMiddleware, async (req, res) => {
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
      fileSize: 100 * 1024 * 1024, // 100MB max (supports 8-min WAV files)
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
  app.post("/api/upload-audio", authMiddleware, upload.single('audio'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'No file uploaded',
          details: 'Please select an audio file to upload'
        });
      }

      const userId = req.user?.claims?.sub;

      // Get user to check their plan
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check file size against plan limit
      const userPlan = user.subscriptionPlan as PlanType;
      const maxSizeMB = PLAN_FEATURES[userPlan].maxAudioUploadSizeMB;
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      const fileSizeMB = (req.file.size / 1024 / 1024).toFixed(2);

      if (req.file.size > maxSizeBytes) {
        return res.status(413).json({
          error: 'File too large',
          message: `Your ${user.subscriptionPlan} plan has a ${maxSizeMB}MB upload limit. Your file is ${fileSizeMB}MB. Upgrade to a paid plan for 100MB uploads.`,
          yourPlan: user.subscriptionPlan,
          maxSizeMB: maxSizeMB,
          fileSizeMB: parseFloat(fileSizeMB)
        });
      }

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

  // Cleanup old uploaded audio files (older than 1 hour)
  // This runs every 10 minutes to keep the database clean
  const cleanupOldAudioFiles = async () => {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const deletedFiles = await db
        .delete(uploadedAudio)
        .where(lt(uploadedAudio.createdAt, oneHourAgo))
        .returning();

      if (deletedFiles.length > 0) {
        console.log(`🧹 Cleaned up ${deletedFiles.length} old uploaded audio file(s)`);
      }
    } catch (error) {
      console.error('Audio cleanup error:', error);
    }
  };

  // Run cleanup every 10 minutes
  setInterval(cleanupOldAudioFiles, 10 * 60 * 1000);

  // Run cleanup on startup
  cleanupOldAudioFiles();

  // Credit Management Routes
  
  // Get user's current credits
  app.get('/api/user/credits', authMiddleware, async (req: any, res) => {
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
  app.post('/api/user/credits/check-reset', authMiddleware, async (req: any, res) => {
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
  app.post('/api/user/credits/check', authMiddleware, async (req: any, res) => {
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
  app.post('/api/user/credits/deduct', authMiddleware, async (req: any, res) => {
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
  app.post("/api/generate-video", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { prompt, model, aspectRatio = '16:9', duration = 5, imageData, endImageData, imageMode = 'reference', quality = 'standard' } = req.body;
      const userPlan = user.subscriptionPlan as PlanType;

      // Validate model is allowed for user's plan
      if (!validateVideoModel(userPlan, model as VideoModel)) {
        return res.status(403).json({
          error: 'Model not allowed',
          message: `Your ${user.subscriptionPlan} plan does not include ${model}. Upgrade to access premium AI models.`,
          allowedModels: PLAN_FEATURES[userPlan].allowedVideoModels
        });
      }

      // Calculate credit cost for this video
      const creditCost = calculateVideoCredits(model, '1080p', duration); // KIE models are resolution-independent

      // Check if user has enough credits (or unlimited access)
      const creditCheck = await storage.checkCredits(userId, 'video_generation');
      if (!creditCheck.allowed) {
        return res.status(403).json({
          error: 'Insufficient credits',
          message: `You need ${creditCost} credits to generate this video. You currently have ${creditCheck.currentCredits} credits.`,
          requiredCredits: creditCost,
          currentCredits: creditCheck.currentCredits
        });
      }

      // Prepare KIE.ai input
      const kieInput: any = {
        prompt
      };

      // SORA 2 uses different parameter names and values
      if (model.startsWith('sora')) {
        // SORA 2: aspect_ratio must be 'landscape' or 'portrait'
        kieInput.aspect_ratio = aspectRatio === '16:9' ? 'landscape' : aspectRatio === '9:16' ? 'portrait' : 'landscape';
        // SORA 2: n_frames must be exactly "10" or "15" (seconds as string)
        kieInput.n_frames = duration.toString();
        // SORA 2: Always remove watermark (Starter+ plan required)
        kieInput.remove_watermark = true;
        // SORA 2 PRO: Set size/quality based on frontend selection
        if (model.includes('pro')) {
          kieInput.size = quality === 'hd' ? 'high' : 'standard';
        }
      } else {
        // Seedance and VEO 3 use standard format
        kieInput.aspect_ratio = aspectRatio;
        kieInput.duration = duration;
      }

      // Add image if provided
      if (imageData) {
        // SORA 2 and VEO 3 require publicly accessible URLs, not base64 data
        if (model.startsWith('sora') || model.startsWith('veo3')) {
          const modelName = model.startsWith('sora') ? 'SORA 2' : 'VEO 3';
          console.log(`${modelName}: Uploading base64 image to ImgBB...`);
          try {
            const publicUrl = await uploadImageToKie(imageData, process.env.KIE_API_KEY!);
            console.log(`${modelName}: Image uploaded successfully: ${publicUrl}`);

            if (model.startsWith('sora')) {
              kieInput.image_urls = [publicUrl];
            } else {
              // VEO 3: Use imageUrl parameter
              kieInput.imageUrl = publicUrl;

              // If second image provided (for FIRST_AND_LAST_FRAMES_2_VIDEO)
              if (endImageData) {
                console.log(`${modelName}: Uploading second image (last frame) to ImgBB...`);
                const endPublicUrl = await uploadImageToKie(endImageData, process.env.KIE_API_KEY!);
                console.log(`${modelName}: Second image uploaded successfully: ${endPublicUrl}`);
                kieInput.endImageUrl = endPublicUrl;
              }
            }
          } catch (uploadError: any) {
            console.error(`${modelName}: Image upload failed:`, uploadError);
            throw new Error(`Failed to upload image for ${modelName}: ${uploadError.message}`);
          }
        } else {
          // Seedance accepts base64 data URLs
          kieInput.image_url = imageData;
          if (imageMode === 'first-frame') {
            kieInput.image_end = false; // Image at start
          } else if (imageMode === 'last-frame') {
            kieInput.image_end = true; // Image at end
          }
          // For 'reference' mode, just include the image_url
        }
      }

      // Call KIE.ai API
      console.log(`Generating video with KIE.ai model: ${model}`);

      
      const result = await kieSubscribe({
        model,
        input: kieInput,
        apiKey: process.env.KIE_API_KEY!,
        logs: true
      });

      if (result.status === 'failed') {
        throw new Error(result.error || 'Video generation failed');
      }

      // Deduct credits (unless unlimited)
      if (!creditCheck.reason || creditCheck.reason !== 'unlimited') {
        await storage.deductCredits(userId, 'video_generation');
      }

      return res.json({
        status: 'complete',
        videoUrl: result.videoUrl,
        model: model,
        creditsUsed: creditCheck.reason === 'unlimited' ? 0 : creditCost
      });
    } catch (error: any) {
      console.error('Video generation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Convert audio to WAV format (paid users only)
  app.post("/api/convert-to-wav", authMiddleware, async (req: any, res) => {
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
  app.get("/api/wav-status/:taskId", authMiddleware, async (req: any, res) => {
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

  // Album Art Generation with DALL-E 3 (Panel 1) or Fal.ai Nano Banana (Panel 3)
  app.post("/api/generate-art", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { prompt, style = 'abstract', aspectRatio = '1:1', referenceImage, useDallE = false } = req.body;
      
      // Validate inputs
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Invalid prompt' });
      }
      
      if (prompt.length > 1000) {
        return res.status(400).json({ error: 'Prompt too long (max 1000 characters)' });
      }

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

      // DALL-E 3 path (Panel 1 - Professional album art)
      if (useDallE) {
        const openaiApiKey = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

        if (!openaiApiKey) {
          return res.status(500).json({ error: 'OpenAI API key not configured' });
        }

        const openai = new OpenAI({
          apiKey: openaiApiKey,
          baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
        });

        // Style descriptions for DALL-E prompts
        const styleDescriptions: Record<string, string> = {
          cyberpunk: 'Cyberpunk aesthetic with neon lights, futuristic cityscape, dark background with bright neon accents',
          abstract: 'Abstract art with flowing shapes, vibrant colors, artistic interpretation',
          retro: 'Retro vaporwave aesthetic, 80s style, pink and purple gradients, nostalgic vibes',
          minimal: 'Minimalist design with clean lines, simple composition, modern aesthetic',
          surreal: 'Surrealist art with dreamlike imagery, unexpected elements, artistic creativity',
          photorealistic: 'Photorealistic with highly detailed, professional photography style'
        };

        const styleHint = styleDescriptions[style] || styleDescriptions.abstract;
        
        // Map aspect ratio to DALL-E 3 size parameter
        let dalleSize: "1024x1024" | "1024x1792" | "1792x1024" = "1024x1024";
        let formatHint = "Square format";
        
        if (aspectRatio === '16:9') {
          dalleSize = "1792x1024";
          formatHint = "Landscape format (16:9)";
        } else if (aspectRatio === '9:16') {
          dalleSize = "1024x1792";
          formatHint = "Portrait format (9:16)";
        } else if (aspectRatio === '4:3') {
          dalleSize = "1792x1024"; // Use landscape for classic landscape
          formatHint = "Landscape format (4:3)";
        } else if (aspectRatio === '3:4') {
          dalleSize = "1024x1792"; // Use portrait for classic portrait
          formatHint = "Portrait format (3:4)";
        }
        
        const enhancedPrompt = `Professional album cover art: ${prompt}. Style: ${styleHint}. ${formatHint}, high quality, artistic composition.`;

        console.log('Generating album art with DALL-E 3:', { prompt, style, aspectRatio, dalleSize, enhancedPrompt });

        try {
          const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: enhancedPrompt,
            n: 1,
            size: dalleSize,
            quality: "standard",
            style: "vivid"
          });

          const imageUrl = response.data?.[0]?.url;
          const revisedPrompt = response.data?.[0]?.revised_prompt;

          if (imageUrl) {
            console.log('✅ DALL-E 3 image generated:', imageUrl);
            return res.status(200).json({
              imageUrl: imageUrl,
              prompt: prompt,
              style: style,
              revisedPrompt: revisedPrompt,
              model: 'dall-e-3'
            });
          } else {
            throw new Error('No image URL in DALL-E response');
          }
        } catch (error: any) {
          console.error('DALL-E 3 generation error:', error);
          return res.status(500).json({
            error: 'Failed to generate album art with DALL-E 3',
            details: error.message
          });
        }
      }

      // Fal.ai Nano Banana path (Panel 3 - Quick media generation)
      const falApiKey = process.env.FAL_KEY;

      if (!falApiKey) {
        return res.status(500).json({ error: 'Fal.ai API key not configured. Please add FAL_KEY to your secrets.' });
      }

      // Set API key for Fal client
      process.env.FAL_KEY = falApiKey;

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
      
      // Get aspect ratio description for prompt
      const aspectRatioDescriptions: Record<string, string> = {
        '1:1': 'square 1:1 aspect ratio',
        '16:9': 'landscape 16:9 aspect ratio',
        '9:16': 'portrait 9:16 aspect ratio',
        '4:3': 'classic landscape 4:3 aspect ratio',
        '3:4': 'classic portrait 3:4 aspect ratio'
      };
      const aspectRatioHint = aspectRatioDescriptions[aspectRatio] || 'square 1:1 aspect ratio';
      
      let enhancedPrompt: string;
      if (hasReference) {
        // For image-to-image: focus on transformation/editing instructions
        enhancedPrompt = `Transform this into an album cover art. ${prompt}. Apply ${styleHint}. Professional music album cover design with ${aspectRatioHint}.`;
      } else {
        // For text-to-image: full detailed description
        enhancedPrompt = `Album cover art: ${prompt}. Style: ${styleHint}. ${aspectRatioHint.charAt(0).toUpperCase() + aspectRatioHint.slice(1)}, professional music album cover design.`;
      }
      
      console.log('Generating album art with Fal.ai Nano Banana:', { 
        model: modelId,
        prompt, 
        style, 
        aspectRatio,
        hasReference,
        enhancedPrompt 
      });
      
      // Build request input
      const input: any = {
        prompt: enhancedPrompt,
        num_images: 1,
        output_format: 'jpeg',
        aspect_ratio: aspectRatio
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

  // Midjourney image generation via ttapi.io
  app.post("/api/media/midjourney-ttapi", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      const { prompt, style = 'photorealistic', aspectRatio = '1:1', speed = 'fast' } = req.body;

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Validate inputs
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Invalid prompt' });
      }
      
      if (prompt.length > 1000) {
        return res.status(400).json({ error: 'Prompt too long (max 1000 characters)' });
      }

      // Validate speed parameter (lowercase)
      if (speed !== 'fast' && speed !== 'turbo' && speed !== 'relax') {
        return res.status(400).json({ error: 'Invalid speed. Must be "fast", "turbo", or "relax"' });
      }

      // Determine service type based on speed (same credit costs as KIE.ai Midjourney)
      const serviceType = speed === 'turbo' ? 'midjourney_generation_turbo' : 'midjourney_generation';
      
      // Deduct credits for Midjourney generation
      const creditResult = await storage.deductCredits(userId, serviceType);
      
      if (!creditResult.success) {
        return res.status(403).json({
          error: 'Insufficient credits',
          credits: creditResult.newBalance,
          required: SERVICE_CREDIT_COSTS[serviceType],
          message: creditResult.error || `You need more credits to generate with Midjourney ${speed} mode. Upgrade your plan or wait for daily reset.`
        });
      }

      // Style prefixes for Midjourney prompts
      const styleNames: Record<string, string> = {
        photorealistic: 'photorealistic',
        abstract: 'abstract art',
        cyberpunk: 'cyberpunk',
        retro: 'retro vaporwave',
        minimal: 'minimalist',
        surreal: 'surrealist',
        cinematic: 'cinematic',
        artistic: 'artistic'
      };

      const styleName = styleNames[style] || 'photorealistic';
      const styledPrompt = `In the style of ${styleName}, ${prompt}`;

      console.log('Generating images with Midjourney via ttapi.io:', { originalPrompt: prompt, styledPrompt, style, aspectRatio, speed });

      // Set timeout based on speed mode (turbo = 120s, fast = 180s, relax = 300s)
      const timeoutSeconds = speed === 'turbo' ? 120 : speed === 'relax' ? 300 : 180;

      // Call Midjourney via ttapi.io with styled prompt
      const result = await generateMidjourneyTtapi(
        styledPrompt,
        speed as "fast" | "turbo" | "relax",
        aspectRatio,
        timeoutSeconds
      );

      if (!result.success) {
        console.error('ttapi.io Midjourney generation failed:', result.error);
        
        // Check if it's a timeout error and refund credits
        if (result.error && result.error.includes('did not complete within')) {
          console.log(`⏱️ ttapi.io Midjourney timed out after ${timeoutSeconds}s, refunding ${SERVICE_CREDIT_COSTS[serviceType]} credits to user ${userId}`);
          
          const refundResult = await storage.refundCredits(userId, serviceType);
          
          if (refundResult.success) {
            // Only log refund if credits were actually refunded (not unlimited plan)
            if (refundResult.amountRefunded > 0) {
              console.log(`✅ Refunded ${refundResult.amountRefunded} credits. New balance: ${refundResult.newBalance}`);
            } else {
              console.log(`ℹ️ Timeout for unlimited plan user - no credits to refund`);
            }
            
            // Build appropriate message based on whether credits were refunded
            const timeoutMessage = refundResult.amountRefunded > 0 
              ? `ttapi.io Midjourney servers are experiencing delays. Your ${refundResult.amountRefunded} credits have been refunded. Try Nano Banana for instant results, or try again later.`
              : `ttapi.io Midjourney servers are experiencing delays. Try Nano Banana for instant results, or try again later.`;
            
            return res.status(408).json({
              error: 'Generation timeout',
              timeout: true,
              timeoutSeconds,
              creditsRefunded: refundResult.amountRefunded,
              newBalance: refundResult.newBalance,
              message: timeoutMessage,
              details: result.error
            });
          } else {
            console.error('❌ Failed to refund credits:', refundResult.error);
          }
        }
        
        return res.status(500).json({
          error: 'ttapi.io Midjourney generation failed',
          details: result.error
        });
      }

      // Extract image URLs from result
      const imageUrls = result.imageUrls || (result.imageUrl ? [result.imageUrl] : []);

      if (imageUrls.length === 0) {
        console.error('No images returned from ttapi.io Midjourney');
        return res.status(500).json({
          error: 'ttapi.io Midjourney generation completed but no images found'
        });
      }

      console.log(`✅ ttapi.io Midjourney generated ${imageUrls.length} images successfully`);
      
      return res.status(200).json({
        imageUrls,
        prompt,
        hasReference: false,
        model: 'midjourney-ttapi'
      });

    } catch (error: any) {
      console.error('ttapi.io Midjourney generation error:', error);
      res.status(500).json({
        error: 'Failed to generate with ttapi.io Midjourney',
        details: error.message
      });
    }
  });

  // Proxy endpoint for downloading external images (bypasses CORS)
  app.get("/api/download-image", authMiddleware, async (req: any, res) => {
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
  app.post("/api/generate-video-fal", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const {
        prompt,
        model, // Frontend sends model like 'seedance-lite' or 'seedance-pro'
        imageData,
        imageUrl,
        image_url,
        endImageData, // Support endImageData from frontend
        imageMode = 'first-frame',
        resolution = '720p',
        aspectRatio, // For Pro Fast only: '16:9', '9:16', '1:1', '4:3', '21:9', '3:4', 'auto'
        duration = '5',
        cameraFixed = false,
        seed = -1,
        enableSafetyChecker = true
      } = req.body;
      
      // Extract model version from model name (e.g., 'seedance-lite' -> 'lite', 'seedance-pro-fast' -> 'pro-fast')
      const modelVersion = model ? model.replace('seedance-', '') || 'lite' : 'lite';
      
      // Support end_image_url field (endImageData is the new frontend field)
      const end_image_url = endImageData;
      
      console.log('📦 Received request body:', {
        model: model,
        modelVersion: modelVersion,
        hasImage: !!imageData || !!imageUrl || !!image_url,
        hasEndImage: !!end_image_url,
        imageMode: imageMode,
        resolution: resolution,
        duration: duration
      });

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
        if (modelVersion !== 'lite' || resolution !== '480p' || parseInt(duration) !== 5) {
          return res.status(403).json({
            error: 'Free accounts can only use default settings (Lite model, 480p, 5 seconds)',
            message: 'Please upgrade your plan to access higher quality video generation settings.'
          });
        }
      }

      // Map model version to credit calculation format
      let creditModelName: 'seedance-lite' | 'seedance-pro' | 'seedance-pro-fast';
      if (modelVersion === 'pro-fast') {
        creditModelName = 'seedance-pro-fast';
      } else if (modelVersion === 'pro') {
        creditModelName = 'seedance-pro';
      } else {
        creditModelName = 'seedance-lite';
      }

      // Calculate credits based on quality settings
      const requiredCredits = calculateVideoCredits(
        creditModelName,
        resolution as '480p' | '720p' | '1080p' | '4k',
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
        // All variants use image-to-video for ANY image-based generation
        // The image-to-video model handles both reference mode and first-frame mode
        if (modelVersion === 'pro') {
          modelId = 'fal-ai/bytedance/seedance/v1/pro/image-to-video';
        } else if (modelVersion === 'pro-fast') {
          modelId = 'fal-ai/bytedance/seedance/v1/pro/fast/image-to-video';
        } else {
          modelId = 'fal-ai/bytedance/seedance/v1/lite/image-to-video';
        }
      } else {
        if (modelVersion === 'pro') {
          modelId = 'fal-ai/bytedance/seedance/v1/pro/text-to-video';
        } else if (modelVersion === 'pro-fast') {
          modelId = 'fal-ai/bytedance/seedance/v1/pro/fast/text-to-video';
        } else {
          modelId = 'fal-ai/bytedance/seedance/v1/lite/text-to-video';
        }
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
      // Frame calculation: ~24fps + 1 end frame
      // Formula: (duration * 24) + 1
      const durationNum = parseInt(duration);
      const numFrames = (durationNum * 24) + 1;
      
      const input: any = {
        prompt: prompt,
        num_frames: numFrames,
        enable_safety_checker: enableSafetyChecker
      };

      // Add resolution (already 480p from frontend)
      input.resolution = resolution;

      // Add aspect ratio for Pro Fast only
      if (modelVersion === 'pro-fast' && aspectRatio) {
        input.aspect_ratio = aspectRatio;
      }

      // Add image if provided (support both base64 and URL)
      const imageSource = imageData || finalImageUrl;
      
      if (imageSource) {
        // Seedance image-to-video accepts image_url parameter (supports base64 and URLs)
        input.image_url = imageSource;
        
        // Add end frame if provided (for first+last frame mode)
        if (end_image_url) {
          input.end_image_url = end_image_url;
          console.log('Using end frame for first+last frame mode');
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

  // Unified Video Generation with Premium Models (Veo 3, Sora 2, Seedance)
  app.post("/api/generate-video-premium", authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const {
        prompt,
        model = 'seedance-lite', // 'seedance-lite', 'seedance-pro', 'veo3_fast', 'sora2'
        imageData, // Base64 or URL
        imageUrl,
        endImageUrl, // For first+last frame (Seedance only)
        imageMode = 'first-frame', // 'first-frame', 'last-frame', 'reference'
        resolution = '720p', // Only applies to Seedance models
        duration = 5, // Duration in seconds
        aspectRatio = '16:9', // For Veo/Sora: '16:9', '9:16', '1:1', '4:3', '21:9'
        seed,
        soraQuality = 'standard', // 'standard' or 'high' for SORA 2 Pro
        enableSafetyChecker = true
      } = req.body;

      if (!prompt) {
        return res.status(400).json({
          error: 'Invalid request. Prompt is required for video generation.'
        });
      }

      // Validate plan restrictions for free accounts
      if (user.subscriptionPlan === 'free') {
        // Free users can only use Seedance Lite 480p 5s
        if (model !== 'seedance-lite' || resolution !== '480p' || duration !== 5) {
          return res.status(403).json({
            error: 'Free accounts can only use Seedance Lite (480p, 5 seconds)',
            message: 'Please upgrade your plan to access premium models like Veo 3 or Sora 2.'
          });
        }
      }

      // Calculate credits based on model and settings
      const requiredCredits = calculateVideoCredits(
        model,
        resolution,
        duration,
        soraQuality
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
        console.log(`Deducted ${requiredCredits} credits for ${model} video. New balance: ${newCredits}`);
      } else {
        console.log('Unlimited plan - skipping credit deduction');
      }

      // Determine which provider to use and generate video
      let result;

      // KIE.ai models (Veo 3, Sora 2)
      if (model.startsWith('veo') || model.startsWith('sora')) {
        const kieApiKey = process.env.KIE_API_KEY;
        if (!kieApiKey) {
          return res.status(500).json({ error: 'KIE.ai API key not configured. Please add KIE_API_KEY to your secrets.' });
        }

        console.log(`Generating video with KIE.ai ${model}:`, {
          prompt,
          duration,
          aspectRatio,
          hasImage: !!(imageData || imageUrl)
        });

        // Build KIE.ai input according to their API specification
        const kieInput: any = {
          prompt: prompt,
        };

        // SORA 2 uses different parameter names than VEO 3
        console.log(`DEBUG: Checking model.startsWith('sora'): model="${model}", result=${model.startsWith('sora')}`);
        console.log(`DEBUG: duration value: ${duration} (type: ${typeof duration})`);
        if (model.startsWith('sora')) {
          console.log('DEBUG: Inside SORA 2 block');
          // SORA 2 API parameters
          kieInput.aspect_ratio = aspectRatio === '16:9' ? 'landscape' : aspectRatio === '9:16' ? 'portrait' : 'landscape';
          kieInput.n_frames = duration.toString(); // "10" or "15" as string
          console.log(`DEBUG: Setting n_frames to: ${kieInput.n_frames}`);

          // SORA 2 requires Starter+ plan, so all SORA 2 users are paid users
          // Always remove watermark for SORA 2 (free users can't access it)
          kieInput.remove_watermark = true;
          // SORA 2 PRO: Set size/quality based on frontend selection
          if (model.includes('pro')) {
            kieInput.size = soraQuality === 'hd' ? 'high' : 'standard';
          }

          console.log(`SORA 2 watermark removal: true (plan: ${user.subscriptionPlan})`);
          console.log(`SORA 2 kieInput after format:`, JSON.stringify(kieInput, null, 2));
        } else {
          console.log('DEBUG: Inside VEO 3 block');
          // VEO 3 API parameters (keep existing format)
          kieInput.aspect_ratio = aspectRatio;
          kieInput.duration = duration;
        }

        // Add image if provided (different format for SORA 2 vs VEO 3)
        if (imageData || imageUrl) {
          const imageSource = imageData || imageUrl;
          console.log(`DEBUG: Adding image. model="${model}", startsWith sora=${model.startsWith('sora')}`);

          if (model.startsWith('sora')) {
            // SORA 2 requires publicly accessible URLs, not base64 data
            // Upload base64 images to KIE.ai's file storage first
            console.log('SORA 2: Checking if image needs upload...');

            if (imageSource.startsWith('data:')) {
              console.log('SORA 2: Image is base64, uploading to KIE.ai file storage...');
              try {
                const publicUrl = await uploadImageToKie(imageSource, kieApiKey);
                console.log(`SORA 2: Image uploaded successfully: ${publicUrl}`);
                kieInput.image_urls = [publicUrl];
              } catch (uploadError: any) {
                console.error('SORA 2: Image upload failed:', uploadError);
                throw new Error(`Failed to upload image for SORA 2: ${uploadError.message}`);
              }
            } else {
              // Already a URL, use it directly
              console.log('SORA 2: Image is already a URL, using directly');
              kieInput.image_urls = [imageSource];
            }
            console.log(`SORA 2: image_urls set, length=${kieInput.image_urls.length}`);
          } else {
            // VEO 3 uses image_url as a single string (also needs public URL but we'll handle that separately)
            console.log('VEO 3: Setting image_url as string');
            kieInput.image_url = imageSource;
          }
        }

        console.log('DEBUG: Final kieInput before calling kieSubscribe:', JSON.stringify(kieInput, null, 2));

        if (seed) {
          kieInput.seed = seed;
        }

        // Call KIE.ai via our wrapper
        result = await kieSubscribe({
          model: model,
          input: kieInput,
          apiKey: kieApiKey,
          logs: true,
          onQueueUpdate: (update) => {
            console.log(`KIE.ai ${model} queue update:`, update.status, update.progress ? `${update.progress}%` : '');
          }
        });

        if (result.status === 'failed') {
          return res.status(500).json({
            error: 'Video generation failed',
            details: result.error
          });
        }

        return res.status(200).json({
          status: 'complete',
          videoUrl: result.videoUrl,
          model: model,
          provider: 'kie.ai',
          credits: requiredCredits
        });
      }

      // Fal.ai Seedance models
      else if (model.startsWith('seedance')) {
        const falApiKey = process.env.FAL_KEY;
        if (!falApiKey) {
          return res.status(500).json({ error: 'Fal.ai API key not configured. Please add FAL_KEY to your secrets.' });
        }

        process.env.FAL_KEY = falApiKey;

        const modelVersion = model === 'seedance-pro' ? 'pro' : 'lite';
        const finalImageUrl = imageUrl || imageData;
        const hasImage = !!finalImageUrl;

        // Determine Fal.ai model ID
        let modelId;
        if (hasImage) {
          // Seedance Pro: Always reference mode (doesn't support first/last frame)
          // Seedance Lite: Supports both reference and first-frame modes
          if (modelVersion === 'pro') {
            modelId = 'fal-ai/bytedance/seedance/v1/pro/reference-to-video';
          } else if (imageMode === 'reference') {
            modelId = 'fal-ai/bytedance/seedance/v1/lite/reference-to-video';
          } else {
            modelId = 'fal-ai/bytedance/seedance/v1/lite/image-to-video';
          }
        } else {
          modelId = modelVersion === 'pro'
            ? 'fal-ai/bytedance/seedance/v1/pro/text-to-video'
            : 'fal-ai/bytedance/seedance/v1/lite/text-to-video';
        }

        console.log(`Generating video with Fal.ai ${model}:`, {
          modelId,
          prompt,
          resolution,
          duration,
          hasImage
        });

        // Build Fal.ai input
        const numFrames = duration === 3 ? 73 : duration === 10 ? 241 : 121;
        const falInput: any = {
          prompt: prompt,
          num_frames: numFrames,
          resolution: resolution,
          enable_safety_checker: enableSafetyChecker
        };

        // Add image support
        if (finalImageUrl) {
          if (imageMode === 'reference') {
            falInput.image_urls = [finalImageUrl];
          } else {
            falInput.image_url = finalImageUrl;
            if (endImageUrl) {
              falInput.end_image_url = endImageUrl;
            }
          }
        }

        // Generate with Fal.ai
        const falResult = await fal.subscribe(modelId, {
          input: falInput,
          logs: true,
          onQueueUpdate: (update: any) => {
            console.log('Fal.ai queue update:', update.status);
          }
        });

        const resultData = falResult as any;
        const videoUrl = resultData.data?.video?.url ||
          resultData.video?.url ||
          resultData.video_url ||
          resultData.data?.video_url ||
          resultData.url;

        if (!videoUrl) {
          return res.status(500).json({
            error: 'Video generation completed but no video URL found in response'
          });
        }

        return res.status(200).json({
          status: 'complete',
          videoUrl: videoUrl,
          model: model,
          provider: 'fal.ai',
          credits: requiredCredits,
          seed: resultData.data?.seed || resultData.seed
        });
      }

      // Unknown model
      else {
        return res.status(400).json({
          error: 'Invalid model specified',
          validModels: ['seedance-lite', 'seedance-pro', 'veo3_fast', 'sora2']
        });
      }

    } catch (error: any) {
      console.error('Premium Video Generation Error:', error);
      res.status(500).json({
        error: 'Failed to generate video',
        details: error.message
      });
    }
  });

  // ===== QUEST SYSTEM ENDPOINTS =====

  // Get user's quests (completed and available)
  app.get('/api/quests', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Get user's completed quests
      const userQuests = await storage.getUserQuests(userId);

      // Define all available quests
      const allQuests: Array<{ type: QuestType; name: string; description: string; reward: number; completed: boolean }> = [
        {
          type: 'twitter_follow',
          name: 'Follow us on X',
          description: 'Follow @AetherWaveStudio on X.com',
          reward: QUEST_REWARDS.twitter_follow,
          completed: userQuests.some(q => q.questType === 'twitter_follow' && q.completed === 1)
        },
        {
          type: 'discord_join',
          name: 'Join our Discord',
          description: 'Join the AetherWave Studio Discord community',
          reward: QUEST_REWARDS.discord_join,
          completed: userQuests.some(q => q.questType === 'discord_join' && q.completed === 1)
        },
        {
          type: 'facebook_follow',
          name: 'Follow us on Facebook',
          description: 'Follow AetherWave Studio on Facebook',
          reward: QUEST_REWARDS.facebook_follow,
          completed: userQuests.some(q => q.questType === 'facebook_follow' && q.completed === 1)
        },
        {
          type: 'tiktok_follow',
          name: 'Follow us on TikTok',
          description: 'Follow @AetherWaveStudio on TikTok',
          reward: QUEST_REWARDS.tiktok_follow,
          completed: userQuests.some(q => q.questType === 'tiktok_follow' && q.completed === 1)
        }
      ];

      res.status(200).json({
        quests: allQuests,
        totalCompleted: userQuests.filter(q => q.completed === 1).length,
        totalAvailable: Object.keys(QUEST_REWARDS).length
      });

    } catch (error: any) {
      console.error('Error fetching quests:', error);
      res.status(500).json({ error: 'Failed to fetch quests' });
    }
  });

  // Complete a quest and award credits
  app.post('/api/quests/complete', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { questType } = req.body;

      if (!questType) {
        return res.status(400).json({ error: 'Quest type is required' });
      }

      // Validate quest type
      const validQuestTypes: QuestType[] = ['twitter_follow', 'discord_join', 'facebook_follow', 'tiktok_follow'];
      if (!validQuestTypes.includes(questType)) {
        return res.status(400).json({ error: 'Invalid quest type' });
      }

      // Complete the quest and award credits
      const result = await storage.completeQuest(userId, questType);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      // Get updated user info
      const updatedUser = await storage.getUser(userId);

      res.status(200).json({
        success: true,
        creditsAwarded: result.creditsAwarded,
        newBalance: updatedUser?.credits || 0,
        message: `Quest completed! You earned ${result.creditsAwarded} credits.`
      });

    } catch (error: any) {
      console.error('Error completing quest:', error);
      res.status(500).json({ error: 'Failed to complete quest' });
    }
  });

  // ===== DAILY LOGIN REWARDS SYSTEM =====

  // Record daily login and award credits
  app.post('/api/daily-login', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id;

      // Record login and check if credits should be awarded
      const result = await storage.recordDailyLogin(userId);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      // Get updated user info
      const updatedUser = await storage.getUser(userId);

      res.status(200).json({
        success: true,
        creditsAwarded: result.creditsAwarded,
        streak: result.streak,
        firstLoginToday: result.firstLoginToday,
        newBalance: updatedUser?.credits || 0,
        message: result.firstLoginToday && result.creditsAwarded > 0
          ? `Welcome back! You earned ${result.creditsAwarded} credits. Day ${result.streak} streak!`
          : result.firstLoginToday
          ? `Welcome back! Day ${result.streak} streak!`
          : 'Login already recorded today'
      });

    } catch (error: any) {
      console.error('Error recording daily login:', error);
      res.status(500).json({ error: 'Failed to record login' });
    }
  });

  // ===== ACTIVITY FEED SYSTEM =====

  // Get global activity feed
  app.get('/api/feed', authMiddleware, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const feedEvents = await storage.getFeedEvents(limit, offset);

      res.status(200).json({
        events: feedEvents,
        count: feedEvents.length
      });

    } catch (error: any) {
      console.error('Error fetching feed:', error);
      res.status(500).json({ error: 'Failed to fetch feed' });
    }
  });

  // Get user-specific activity feed
  app.get('/api/feed/user/:userId', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.params.userId;
      const limit = parseInt(req.query.limit as string) || 20;

      const feedEvents = await storage.getUserFeedEvents(userId, limit);

      res.status(200).json({
        events: feedEvents,
        count: feedEvents.length
      });

    } catch (error: any) {
      console.error('Error fetching user feed:', error);
      res.status(500).json({ error: 'Failed to fetch user feed' });
    }
  });

  // ============================================================================
  // GHOSTMUSICIAN RPG ROUTES
  // ============================================================================

  // Get user's RPG stats (total bands, limits, credits, plan)
  app.get('/api/rpg/stats', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const bands = await storage.getUserBands(userId);
      const bandLimitCheck = await storage.checkBandLimit(userId);
      
      res.status(200).json({
        plan: user.subscriptionPlan,
        credits: user.credits,
        totalBands: bands.length,
        bandLimit: bandLimitCheck.limit,
        canCreateBand: bandLimitCheck.allowed,
        bands: bands.map(b => ({
          id: b.id,
          bandName: b.bandName,
          genre: b.genre,
          fame: b.fame,
          totalStreams: b.totalStreams,
          chartPosition: b.chartPosition,
          lastGrowthApplied: b.lastGrowthApplied,
        })),
      });
    } catch (error: any) {
      console.error('Error fetching RPG stats:', error);
      res.status(500).json({ error: 'Failed to fetch RPG stats' });
    }
  });

  // Create a new virtual band
  app.post('/api/rpg/bands', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Validate request body FIRST (before any credit operations)
      const bandSchema = z.object({
        bandName: z.string().min(1, 'Band name is required'),
        genre: z.string().min(1, 'Genre is required'),
        concept: z.string().optional(),
        philosophy: z.string().optional(),
        influences: z.array(z.string()).optional(),
        colorPalette: z.array(z.string()).optional(),
        members: z.any(), // JSONB field
        audioFileId: z.string().optional(),
        songTitle: z.string().optional(),
      });

      const validationResult = bandSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: 'Invalid band data', 
          details: validationResult.error.errors 
        });
      }

      const { bandName, genre, concept, philosophy, influences, colorPalette, members, audioFileId, songTitle } = validationResult.data;
      
      // Check band limit
      const limitCheck = await storage.checkBandLimit(userId);
      if (!limitCheck.allowed) {
        return res.status(400).json({ error: limitCheck.error || 'Band limit reached' });
      }

      // Check for free band generations first
      const user = await storage.getUser(userId);
      let usedFreeBand = false;
      
      if (user && user.freeBandGenerations > 0) {
        // Use free band generation
        const decrementResult = await storage.decrementFreeBandGenerations(userId);
        if (!decrementResult.success) {
          return res.status(400).json({ error: decrementResult.error || 'Failed to use free band generation' });
        }
        usedFreeBand = true;
      } else {
        // No free bands available, use credits
        const creditCheck = await storage.checkRpgCredits(userId, 'band_creation');
        if (!creditCheck.allowed) {
          return res.status(400).json({ 
            error: `Insufficient credits. Need ${creditCheck.requiredCredits}, have ${creditCheck.currentCredits}` 
          });
        }

        const deduction = await storage.deductRpgCredits(userId, 'band_creation');
        if (!deduction.success) {
          return res.status(400).json({ error: deduction.error || 'Failed to deduct credits' });
        }
      }

      // Create the band (with auto-refund on failure, matching AetherWave refund pattern)
      let band;
      try {
        band = await storage.createBand({
          userId,
          bandName,
          genre,
          concept,
          philosophy,
          influences: influences || [],
          colorPalette: colorPalette || [],
          members,
          audioFileId,
          songTitle,
        });
      } catch (createError: any) {
        // CRITICAL: Refund on failure
        if (usedFreeBand) {
          // Restore the free band generation
          await storage.incrementFreeBandGenerations(userId);
          console.log(`Restored 1 free band generation to user ${userId} after band creation failure`);
        } else {
          // Refund RPG credits
          const { RPG_CREDIT_COSTS } = await import('@shared/schema');
          const refundAmount = RPG_CREDIT_COSTS.band_creation;
          const currentUser = await storage.getUser(userId);
          if (currentUser) {
            await storage.updateUserCredits(userId, currentUser.credits + refundAmount);
            console.log(`Refunded ${refundAmount} credits to user ${userId} after band creation failure`);
          }
        }
        console.error('Band creation failed, resources refunded:', createError);
        return res.status(500).json({ error: 'Failed to create band. Your resources have been refunded.' });
      }

      // Create feed event for band creation
      try {
        await storage.createFeedEvent({
          userId,
          eventType: 'band_created',
          bandId: band.id,
          data: {
            bandName: band.bandName,
            genre: band.genre,
            description: `Created ${band.bandName} (${band.genre})`
          }
        });
      } catch (feedError) {
        console.error('Failed to create feed event for band creation:', feedError);
        // Don't fail the request if feed event creation fails
      }

      // Get updated user data for response
      const updatedUser = await storage.getUser(userId);

      res.status(201).json({
        success: true,
        band,
        usedFreeBand,
        freeBandGenerationsRemaining: updatedUser?.freeBandGenerations || 0,
        creditsRemaining: updatedUser?.credits || 0,
      });
    } catch (error: any) {
      console.error('Error in band creation endpoint:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Get all bands for the authenticated user
  app.get('/api/rpg/bands', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const bands = await storage.getUserBands(userId);
      
      res.status(200).json({ bands });
    } catch (error: any) {
      console.error('Error fetching bands:', error);
      res.status(500).json({ error: 'Failed to fetch bands' });
    }
  });

  // Get a specific band by ID
  app.get('/api/rpg/bands/:id', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const bandId = req.params.id;
      
      const band = await storage.getBand(bandId);
      
      if (!band) {
        return res.status(404).json({ error: 'Band not found' });
      }

      if (band.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get achievements for this band
      const achievements = await storage.getBandAchievements(bandId);

      res.status(200).json({ band, achievements });
    } catch (error: any) {
      console.error('Error fetching band:', error);
      res.status(500).json({ error: 'Failed to fetch band' });
    }
  });

  // Update a band
  app.put('/api/rpg/bands/:id', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const bandId = req.params.id;
      
      const band = await storage.getBand(bandId);
      
      if (!band) {
        return res.status(404).json({ error: 'Band not found' });
      }

      if (band.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updates = req.body;
      const updatedBand = await storage.updateBand(bandId, updates);

      res.status(200).json({ band: updatedBand });
    } catch (error: any) {
      console.error('Error updating band:', error);
      res.status(500).json({ error: 'Failed to update band' });
    }
  });

  // Delete a band
  app.delete('/api/rpg/bands/:id', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const bandId = req.params.id;
      
      const band = await storage.getBand(bandId);
      
      if (!band) {
        return res.status(404).json({ error: 'Band not found' });
      }

      if (band.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const success = await storage.deleteBand(bandId);

      if (success) {
        res.status(200).json({ success: true, message: 'Band deleted successfully' });
      } else {
        res.status(500).json({ error: 'Failed to delete band' });
      }
    } catch (error: any) {
      console.error('Error deleting band:', error);
      res.status(500).json({ error: 'Failed to delete band' });
    }
  });

  // Apply daily growth to a band
  app.post('/api/rpg/bands/:id/daily-growth', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const bandId = req.params.id;

      const result = await storage.applyDailyGrowth(userId, bandId);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      // Create feed event for daily growth
      if (result.band) {
        try {
          await storage.createFeedEvent({
            userId,
            eventType: 'daily_growth',
            bandId: result.band.id,
            data: {
              bandName: result.band.bandName,
              fame: result.band.fame,
              totalStreams: result.band.totalStreams,
              description: `${result.band.bandName} grew! FAME: ${result.band.fame}, Streams: ${result.band.totalStreams.toLocaleString()}`
            }
          });
        } catch (feedError) {
          console.error('Failed to create feed event for daily growth:', feedError);
          // Don't fail the request if feed event creation fails
        }
      }

      res.status(200).json({
        success: true,
        band: result.band,
        growthApplied: result.growthApplied,
        message: 'Daily growth applied successfully!'
      });
    } catch (error: any) {
      console.error('Error applying daily growth:', error);
      res.status(500).json({ error: 'Failed to apply daily growth' });
    }
  });

  // Get band achievements
  app.get('/api/rpg/bands/:id/achievements', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const bandId = req.params.id;
      
      const band = await storage.getBand(bandId);
      
      if (!band) {
        return res.status(404).json({ error: 'Band not found' });
      }

      if (band.userId !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const achievements = await storage.getBandAchievements(bandId);

      res.status(200).json({ achievements });
    } catch (error: any) {
      console.error('Error fetching achievements:', error);
      res.status(500).json({ error: 'Failed to fetch achievements' });
    }
  });

  // =====================================================
  // Ghost-Musician Compatibility Routes (Alias routes)
  // Map /api/artist-cards to /api/rpg/bands
  // =====================================================
  
  app.get('/api/artist-cards', authMiddleware, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const bands = await storage.getUserBands(userId);
      
      // Transform band data to match Ghost-Musician's expected format
      const artistCards = bands.map((band: any) => ({
        id: band.id,
        artistData: {
          bandName: band.bandName,
          genre: band.genre,
          philosophy: band.philosophy,
          bandConcept: band.concept,
          members: band.members,
          influences: band.influences || [],
          signatureSound: band.genre,
          imageUrl: band.tradingCardUrl,
          cardImageUrl: band.tradingCardUrl,
          fileName: band.songTitle || 'Unknown',
          duration: 180,
          tempo: 120,
          key: 'C',
          energy: 'High',
          createdAt: band.createdAt,
          rarity: band.fame > 70 ? 'Legendary' : band.fame > 50 ? 'Epic' : band.fame > 30 ? 'Rare' : 'Common',
          streamCount: band.totalStreams,
          monthlyListeners: Math.floor(band.totalStreams / 30),
        },
        rarity: band.fame > 70 ? 'Legendary' : band.fame > 50 ? 'Epic' : band.fame > 30 ? 'Rare' : 'Common',
      }));
      
      res.json(artistCards);
    } catch (error: any) {
      console.error('Error fetching artist cards:', error);
      res.status(500).json({ error: 'Failed to fetch artist cards' });
    }
  });

  app.get('/api/artist-cards/:id', authMiddleware, async (req: any, res) => {
    try {
      const { id } = req.params;
      const band = await storage.getBand(id);
      
      if (!band) {
        return res.status(404).json({ error: 'Artist card not found' });
      }

      // Transform band data to match Ghost-Musician's expected format
      const artistCard = {
        id: band.id,
        artistData: {
          bandName: band.bandName,
          genre: band.genre,
          philosophy: band.philosophy,
          bandConcept: band.concept,
          members: band.members,
          influences: band.influences || [],
          signatureSound: band.genre,
          imageUrl: band.tradingCardUrl,
          cardImageUrl: band.tradingCardUrl,
          fileName: band.songTitle || 'Unknown',
          duration: 180,
          tempo: 120,
          key: 'C',
          energy: 'High',
          createdAt: band.createdAt,
          rarity: band.fame > 70 ? 'Legendary' : band.fame > 50 ? 'Epic' : band.fame > 30 ? 'Rare' : 'Common',
          streamCount: band.totalStreams,
          monthlyListeners: Math.floor(band.totalStreams / 30),
        },
        rarity: band.fame > 70 ? 'Legendary' : band.fame > 50 ? 'Epic' : band.fame > 30 ? 'Rare' : 'Common',
      };
      
      res.json(artistCard);
    } catch (error: any) {
      console.error('Error fetching artist card:', error);
      res.status(500).json({ error: 'Failed to fetch artist card' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
