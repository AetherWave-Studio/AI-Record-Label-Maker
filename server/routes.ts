import type { Express } from "express";
//import { Express } from "express";
import { createServer, type Server } from "http";
import fs from "fs/promises";
import { storage } from "./storage";
import { BandGenerator } from "../band-generator/src/bandGenerator.js";
import { AudioAnalyzer } from "../band-generator/src/audioAnalyzer.js";
import { CardGenerator } from "../band-generator/src/cardGenerator.js";
import type { GenerationOptions } from "../band-generator/src/types.js";
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
// Stripe will be imported dynamically to avoid module format conflicts
import {
  PLAN_FEATURES,
  SERVICE_CREDIT_COSTS,
  type PlanType,
  type VideoResolution,
  type VideoModel,
  type ImageEngine,
  type MusicModel,
  CREDIT_BUNDLES
} from "../shared/schema";

import { eq, lt } from "drizzle-orm";
import virtualArtistsRouter from './VirtualArtistsRoutes.js';
import { setupVideoRoutes } from './video-routes';
import aiMachineRouter from './aiMachineRoutes.js';

const isDevelopment = process.env.IS_DEVELOPMENT === "true";



function validateEnvVars(requiredVars: string[], isProduction: boolean) {
  const missing = requiredVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    const message = `Missing environment variables: ${missing.join(", ")}`;
    if (isProduction) {
      console.error(message);
      process.exit(1);
    } else {
      console.warn(`Warning: ${message}`);
    }
  }
}
// Initialize Stripe (from blueprint:javascript_stripe)
/*if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}*/

function getStripeSecret(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("Missing required Stripe secret: STRIPE_SECRET_KEY");
  }
  return key;
}

// Stripe functionality temporarily disabled to avoid module format conflicts
// let stripeInstance: any = null;

// export async function getStripe(): Promise<any> {
//   if (!stripeInstance) {
//     const { default: Stripe } = await import('stripe');
//     stripeInstance = new Stripe(getStripeSecret(), {
//       apiVersion: "2025-10-29.clover",
//     });
//   }
//   return stripeInstance;
// }

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

// Authentication helper - works for both dev and production auth
function getUserId(req: any): string {
  // Production (Replit OIDC): req.user.claims.sub
  // Development: req.user.id
  if (req.user?.claims?.sub) {
    return req.user.claims.sub;
  }
  if (req.user?.id) {
    return req.user.id;
  }
  throw new Error('User ID not found in request');
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
    // Sora 2: Fixed pricing from documentation
    if (duration === 10) {
      return 30; // 30 credits for 10 seconds
    } else if (duration === 15) {
      return 45; // 45 credits for 15 seconds (30 credits/10s × 1.5)
    } else {
      throw new Error('Sora 2 only supports 10 or 15 second durations');
    }
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


/*const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-10-29.clover",
});*/

export async function registerRoutes(app: Express): Promise<Server> {
  // Automatically detect environment and use appropriate authentication
  const isDevelopment = process.env.NODE_ENV !== 'production';

  // Validate required environment variables
  if (!isDevelopment) {
    console.log(`⚠️  Running in production mode - checking required vars...`);
    const requiredEnvVars = ['REPLIT_DOMAINS', 'SESSION_SECRET', 'DATABASE_URL', 'REPL_ID'];
    const missing = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables for production: ${missing.join(', ')}\n` +
        `Please set these variables before running in production mode.`
      );
    }

    console.log('✅ All required production environment variables are set');
  } else {
    if (!process.env.SESSION_SECRET) {
      console.warn('⚠️  SESSION_SECRET not set - using default (not recommended for production)');
    }
  }

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

  // ============================================================================
  // STRIPE PAYMENT ROUTES (from blueprint:javascript_stripe)
  // ============================================================================

  // Get available credit bundles
  app.get("/api/credit-bundles", authMiddleware, async (req, res) => {
    try {
      res.json(CREDIT_BUNDLES);
    } catch (error: any) {
      console.error('Error fetching credit bundles:', error);
      res.status(500).json({ message: "Error fetching credit bundles: " + error.message });
    }
  });

  // Create payment intent for credit purchase
  app.post("/api/create-payment-intent", authMiddleware, async (req: any, res) => {
    try {
      const { bundleId } = req.body;
      
      if (!bundleId) {
        return res.status(400).json({ message: "Bundle ID is required" });
      }

      // Find the bundle
      const bundle = CREDIT_BUNDLES.find(b => b.id === bundleId);
      if (!bundle) {
        return res.status(400).json({ message: "Invalid bundle ID" });
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(bundle.priceUSD * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userId: getUserId(req),
          bundleId: bundle.id,
          credits: bundle.credits,
          bonusCredits: bundle.bonusCredits,
        },
      });
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        bundle 
      });
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Confirm payment and add credits to user account
  app.post("/api/confirm-payment", authMiddleware, async (req: any, res) => {
    try {
      const { paymentIntentId } = req.body;
      
      if (!paymentIntentId) {
        return res.status(400).json({ message: "Payment intent ID is required" });
      }

      // Retrieve the payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      // Verify payment succeeded
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({ message: "Payment not successful" });
      }

      // Verify the user matches
      const userId = getUserId(req);
      if (paymentIntent.metadata.userId !== userId) {
        return res.status(403).json({ message: "Payment user mismatch" });
      }

      // Calculate total credits
      const credits = parseInt(paymentIntent.metadata.credits || '0');
      const bonusCredits = parseInt(paymentIntent.metadata.bonusCredits || '0');
      const totalCredits = credits + bonusCredits;

      // Add credits to user account
      const updatedUser = await storage.addCredits(userId, totalCredits);

      console.log(`✅ Payment confirmed: User ${userId} purchased ${credits} credits + ${bonusCredits} bonus = ${totalCredits} total`);

      res.json({ 
        success: true, 
        creditsAdded: totalCredits,
        newBalance: updatedUser.credits 
      });
    } catch (error: any) {
      console.error('Error confirming payment:', error);
      res.status(500).json({ message: "Error confirming payment: " + error.message });
    }
  });
  // Auth user route
  app.get('/api/auth/user', authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
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

  // Check username availability
  app.post('/api/user/check-username', async (req: any, res) => {
    try {
      const { username } = req.body;

      if (!username || typeof username !== 'string') {
        return res.status(400).json({ 
          available: false, 
          message: "Username is required" 
        });
      }

      const trimmedUsername = username.trim();

      // Validate username format
      if (trimmedUsername.length < 3) {
        return res.status(400).json({ 
          available: false, 
          message: "Username must be at least 3 characters long" 
        });
      }

      if (trimmedUsername.length > 20) {
        return res.status(400).json({ 
          available: false, 
          message: "Username must be 20 characters or less" 
        });
      }

      if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
        return res.status(400).json({ 
          available: false, 
          message: "Username can only contain letters, numbers, underscores, and hyphens" 
        });
      }

      // Check if username is already taken
      const existingUser = await storage.getUserByUsername(trimmedUsername);
      
      if (existingUser) {
        return res.status(200).json({ 
          available: false, 
          message: "Username is already taken" 
        });
      }

      res.json({ 
        available: true, 
        message: "Username is available" 
      });
    } catch (error: any) {
      console.error("Error checking username:", error);
      res.status(500).json({ 
        available: false, 
        message: "Failed to check username availability" 
      });
    }
  });

  // Get username change restriction info
  app.get('/api/user/username-restriction', authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let canChangeUsername = true;
      let daysRemaining = 0;
      let nextChangeDate = null;

      if (user.lastUsernameChange) {
        const lastChange = new Date(user.lastUsernameChange);
        const now = new Date();
        const daysSinceChange = Math.floor((now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24));

        if (daysSinceChange < 30) {
          canChangeUsername = false;
          daysRemaining = 30 - daysSinceChange;
          nextChangeDate = new Date(lastChange.getTime() + (30 * 24 * 60 * 60 * 1000));
        }
      }

      res.json({
        canChangeUsername,
        daysRemaining,
        lastUsernameChange: user.lastUsernameChange,
        nextChangeDate
      });
    } catch (error: any) {
      console.error("Error fetching username restriction:", error);
      res.status(500).json({ message: "Failed to fetch username restriction info" });
    }
  });

  // Update user profile
  app.patch('/api/user/profile', authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { firstName, lastName, username, vocalGenderPreference } = req.body;

      // Get current user to preserve other fields
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Username validation with 30-day restriction
      let finalUsername = currentUser.username;
      let lastUsernameChange = currentUser.lastUsernameChange;

      // Only process username change if a non-empty username is provided AND it's different from current
      if (username !== undefined && username !== null && username.trim() !== '') {
        const trimmedUsername = username.trim();
        
        // Only enforce restriction if username is actually changing
        if (trimmedUsername !== currentUser.username) {
          // Check if username is being changed
          if (currentUser.lastUsernameChange) {
            const lastChange = new Date(currentUser.lastUsernameChange);
            const now = new Date();
            const daysSinceChange = Math.floor((now.getTime() - lastChange.getTime()) / (1000 * 60 * 60 * 24));

            if (daysSinceChange < 30) {
              const daysRemaining = 30 - daysSinceChange;
              return res.status(429).json({
                message: `Username can only be changed once every 30 days. Please wait ${daysRemaining} more days.`,
                daysRemaining,
                lastUsernameChange: currentUser.lastUsernameChange
              });
            }
          }

          // Username validation
          if (trimmedUsername.length < 3) {
            return res.status(400).json({ message: "Username must be at least 3 characters long" });
          }

          if (trimmedUsername.length > 20) {
            return res.status(400).json({ message: "Username must be 20 characters or less" });
          }

          // Check if username contains only valid characters (letters, numbers, underscores, hyphens)
          if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
            return res.status(400).json({ message: "Username can only contain letters, numbers, underscores, and hyphens" });
          }

          finalUsername = trimmedUsername;
          lastUsernameChange = new Date(); // Set to current time when username changes
        }
      }

      // Update user with new profile data
      const updatedUser = await storage.upsertUser({
        id: userId,
        email: currentUser.email,
        firstName: firstName !== undefined ? firstName : currentUser.firstName,
        lastName: lastName !== undefined ? lastName : currentUser.lastName,
        username: finalUsername,
        lastUsernameChange: lastUsernameChange,
        vocalGenderPreference: vocalGenderPreference !== undefined ? vocalGenderPreference : currentUser.vocalGenderPreference,
        profileImageUrl: currentUser.profileImageUrl,
        subscriptionPlan: currentUser.subscriptionPlan,
        credits: currentUser.credits,
        stripeCustomerId: currentUser.stripeCustomerId,
        stripeSubscriptionId: currentUser.stripeSubscriptionId,
      });

      console.log('Profile updated for user:', userId);
      res.json({
        ...updatedUser,
        usernameChanged: username !== undefined && username !== currentUser.username,
        lastUsernameChange: lastUsernameChange
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      // Check for unique constraint violations
      if (error.message?.includes('unique')) {
        return res.status(400).json({ message: "Username already taken" });
      }
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Logout endpoint
  app.post('/api/auth/logout', (req: any, res) => {
    req.logout((err: any) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ message: "Logout failed" });
      }
      req.session.destroy((destroyErr: any) => {
        if (destroyErr) {
          console.error('Session destroy error:', destroyErr);
          return res.status(500).json({ message: "Session cleanup failed" });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: "Logged out successfully" });
      });
    });
  });


  // Chat endpoint using OpenAI
  // Note: Authenticated to prevent abuse of OpenAI credits
  app.post("/api/chat", authMiddleware, async (req: any, res) => {
    try {
      const { message } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Initialize OpenAI client with direct API key (no proxy)
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        // Don't set baseURL to use default OpenAI endpoint
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
      const userId = getUserId(req);
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
      const userId = getUserId(req);
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
  app.get("/api/music-status/:taskId", authMiddleware, async (req, res) => {
    try {
      const { taskId } = req.params;
      const { checkForTimeout } = req.query; // Frontend can request timeout check
      const sunoApiKey = process.env.SUNO_API_KEY;

      if (!sunoApiKey) {
        return res.status(500).json({ error: 'API key not configured' });
      }

      console.log('Checking status for taskId:', taskId, checkForTimeout ? '(final timeout check)' : '');
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
        const taskStatus = taskData.status; // PENDING, TEXT_SUCCESS, FIRST_SUCCESS, SUCCESS, or *_FAILED/*_ERROR

        // Check for explicit FAILURE status codes from KIE.ai (TRUE service failures)
        const isExplicitFailure = taskStatus.includes('FAIL') || taskStatus.includes('ERROR');

        if (isExplicitFailure) {
          console.log(`🚫 KIE.ai reports task ${taskId} FAILED with status: ${taskStatus}`);
          return res.json({
            status: 'FAILED',
            failed: true,
            failureReason: taskStatus,
            tracks: [],
            error: `Music generation failed: ${taskStatus}`
          });
        }

        // Check for timeout scenario (frontend polling exceeded limit)
        // Only consider it a stuck task if:
        // 1. Frontend is doing a final timeout check
        // 2. Status is still PENDING (not actively progressing)
        // 3. This indicates the task has been stuck for 6+ minutes
        if (checkForTimeout === 'true' && taskStatus === 'PENDING') {
          console.log(`⏱️ Task ${taskId} stuck in PENDING after timeout - treating as failed`);
          return res.json({
            status: 'TIMEOUT',
            timeout: true,
            tracks: [],
            error: 'Task stuck in pending state after extended wait time'
          });
        }

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
        // KIE.ai API error response
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

  // Refund music generation credits when task fails or times out
  app.post("/api/music-refund/:taskId", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { taskId } = req.params;
      const { reason } = req.body; // 'timeout' or 'failed'

      console.log(`📋 Refund request for music task ${taskId} by user ${userId}. Reason: ${reason}`);

      // Verify the task status one final time before refunding
      const sunoApiKey = process.env.SUNO_API_KEY;
      if (sunoApiKey) {
        try {
          const proxyAgent = createProxyAgent();
          const response = await nodeFetch(`https://api.kie.ai/api/v1/generate/record-info?taskId=${taskId}`, {
            headers: {
              'Authorization': `Bearer ${sunoApiKey}`
            },
            agent: proxyAgent
          });
          const data = await response.json();

          if (data.code === 200 && data.data) {
            const taskStatus = data.data.status;

            // Don't refund if task actually succeeded!
            if (taskStatus === 'SUCCESS') {
              console.log(`✅ Task ${taskId} actually completed successfully - no refund needed`);
              return res.json({
                refunded: false,
                message: 'Task completed successfully',
                status: taskStatus,
                tracks: data.data.response?.sunoData || []
              });
            }

            // Don't refund if task is actively progressing (not stuck)
            if (taskStatus === 'TEXT_SUCCESS' || taskStatus === 'FIRST_SUCCESS') {
              console.log(`⏳ Task ${taskId} is actively progressing (${taskStatus}) - no refund yet`);
              return res.json({
                refunded: false,
                message: 'Task is still progressing',
                status: taskStatus
              });
            }
          }
        } catch (verifyError) {
          console.error('Error verifying task status before refund:', verifyError);
          // Continue with refund if we can't verify
        }
      }

      // Confirmed failure or timeout - process refund
      const refundResult = await storage.refundCredits(userId, 'music_generation');

      if (refundResult.success) {
        const wasRefunded = refundResult.amountRefunded > 0;

        console.log(wasRefunded
          ? `✅ Refunded ${refundResult.amountRefunded} credits to user ${userId}. New balance: ${refundResult.newBalance}`
          : `ℹ️ User ${userId} has unlimited plan - no credits to refund`
        );

        return res.json({
          refunded: true,
          creditsRefunded: refundResult.amountRefunded,
          newBalance: refundResult.newBalance,
          message: wasRefunded
            ? `${refundResult.amountRefunded} credits have been refunded to your account`
            : 'Task failed (unlimited plan - no credits deducted)',
          reason: reason
        });
      } else {
        console.error(`❌ Failed to refund credits for user ${userId}:`, refundResult.error);
        return res.status(500).json({
          error: 'Failed to process refund',
          details: refundResult.error
        });
      }

    } catch (error: any) {
      console.error('Music refund error:', error);
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

  // Get user profile by ID
  app.get("/api/users/:userId", authMiddleware, async (req, res) => {
    try {
      const requestedUserId = req.params.userId;
      const user = await storage.getUser(requestedUserId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Return user profile data (excluding sensitive fields)
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        profileImageUrl: user.profileImageUrl,
        subscriptionPlan: user.subscriptionPlan,
        credits: user.credits,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      });
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Configure multer for image uploads (profile pictures)
  const uploadImage = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB max for profile images
    },
    fileFilter: (req, file, cb) => {
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
      }
    }
  });

  // Upload profile image
  app.post('/api/user/profile/image', authMiddleware, uploadImage.single('profileImage'), async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Get current user
      const currentUser = await storage.getUser(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      // Convert uploaded file to base64
      const base64Image = req.file.buffer.toString('base64');
      const mimeType = req.file.mimetype;
      const base64WithPrefix = `data:${mimeType};base64,${base64Image}`;

      // Upload to ImgBB
      const imgbbApiKey = process.env.IMGBB_API_KEY;
      if (!imgbbApiKey) {
        return res.status(500).json({ message: "Image upload service not configured" });
      }

      console.log(`Uploading profile image for user ${userId}...`);
      const imageUrl = await uploadImageToKie(base64WithPrefix, imgbbApiKey);
      console.log(`Profile image uploaded successfully: ${imageUrl}`);

      // Update user's profileImageUrl in database
      const updatedUser = await storage.upsertUser({
        ...currentUser,
        profileImageUrl: imageUrl,
      });

      res.json({
        success: true,
        imageUrl,
        user: updatedUser
      });
    } catch (error: any) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ message: error.message || "Failed to upload profile image" });
    }
  });

  // Credit Management Routes
  
  // Get user's current credits
  app.get('/api/user/credits', authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
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
  app.post('/api/user/credits/check-reset', authMiddleware, async (req: any, res: any) => {
    try {
      const userId = getUserId(req);
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
      const userId = getUserId(req);
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
      const userId = getUserId(req);
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
      const userId = getUserId(req);
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
      } else if (model === 'hailou23') {
        // Hailou 2.3 uses standard format
        kieInput.aspect_ratio = aspectRatio;
        kieInput.duration = duration;
      } else {
        // Seedance uses standard format
        kieInput.aspect_ratio = aspectRatio;
        kieInput.duration = duration;
      }

      // Add image if provided
      if (imageData) {
        // SORA 2 requires publicly accessible URLs, not base64 data
        if (model.startsWith('sora')) {
          console.log(`SORA 2: Uploading base64 image to ImgBB...`);
          try {
            const publicUrl = await uploadImageToKie(imageData, process.env.KIE_API_KEY!);
            console.log(`SORA 2: Image uploaded successfully: ${publicUrl}`);
            kieInput.image_urls = [publicUrl];
          } catch (uploadError: any) {
            console.error(`SORA 2: Image upload failed:`, uploadError);
            throw new Error(`Failed to upload image for SORA 2: ${uploadError.message}`);
          }
        } else if (model === 'hailou23') {
          // Hailou 2.3 image handling - upload to public URL if needed
          console.log(`Hailou 2.3: Processing image input...`);
          try {
            const publicUrl = await uploadImageToKie(imageData, process.env.KIE_API_KEY!);
            console.log(`Hailou 2.3: Image uploaded successfully: ${publicUrl}`);
            kieInput.image_url = publicUrl; // Assuming it uses image_url parameter
          } catch (uploadError: any) {
            console.error(`Hailou 2.3: Image upload failed:`, uploadError);
            throw new Error(`Failed to upload image for Hailou 2.3: ${uploadError.message}`);
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

      // Call appropriate API based on model
      console.log(`Generating video with model: ${model}`);

      if (model === 'hailou23') {
        // Hailou 2.3 uses different API endpoint and format
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
        const domain = process.env.REPLIT_DOMAIN || 'localhost:5000';
        const callBackUrl = `${protocol}://${domain}/api/hailou-callback`;

        console.log('Hailou 2.3: Creating task with callback...');

        // Prepare Hailou 2.3 request
        const hailouRequest = {
          model: "hailuo/02-text-to-video-pro",
          callBackUrl: callBackUrl,
          input: {
            prompt: kieInput.prompt,
            prompt_optimizer: true
          }
        };

        // Add image to input if provided
        if (kieInput.image_url) {
          hailouRequest.input.image_url = kieInput.image_url;
        }

        // Add duration and aspect ratio to prompt if specified
        if (duration && aspectRatio) {
          hailouRequest.input.prompt += `, ${duration} seconds, ${aspectRatio} aspect ratio`;
        }

        console.log('Hailou 2.3 request:', JSON.stringify(hailouRequest, null, 2));

        // Make API call to Hailou 2.3 endpoint
        const proxyAgent = createProxyAgent();
        const hailouResponse = await nodeFetch('https://api.kie.ai/api/v1/jobs/createTask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.KIE_API_KEY}`
          },
          body: JSON.stringify(hailouRequest),
          agent: proxyAgent
        });

        if (!hailouResponse.ok) {
          const errorData = await hailouResponse.json().catch(() => ({}));
          console.error('Hailou 2.3 API error:', errorData);
          throw new Error(`Hailou 2.3 API error: ${errorData.msg || errorData.message || hailouResponse.statusText}`);
        }

        const hailouData = await hailouResponse.json();
        console.log('Hailou 2.3 response:', JSON.stringify(hailouData, null, 2));

        // Deduct credits (unless unlimited)
        if (!creditCheck.reason || creditCheck.reason !== 'unlimited') {
          await storage.deductCredits(userId, 'video_generation');
        }

        return res.json({
          status: 'processing',
          taskId: hailouData.taskId || hailouData.data?.taskId,
          model: model,
          creditsUsed: creditCheck.reason === 'unlimited' ? 0 : creditCost,
          message: 'Hailou 2.3 video generation started. You will be notified when complete.'
        });

      } else {
        // Other models use existing kieSubscribe function
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
      }
    } catch (error: any) {
      console.error('Video generation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Hailou 2.3 callback (receives completion updates from KIE.ai)
  app.post("/api/hailou-callback", async (req, res) => {
    try {
      // Basic validation - ensure callback has expected structure
      const { taskId, status, result, error } = req.body;

      console.log('Hailou 2.3 callback received:', JSON.stringify(req.body, null, 2));

      // TODO: Store Hailou 2.3 result in database or emit via WebSocket
      // The callback should include:
      // - taskId: The task identifier
      // - status: 'success' or 'failed'
      // - result: { videoUrl: ... } if successful
      // - error: error message if failed

      // For now, just log the result
      if (status === 'success' && result?.videoUrl) {
        console.log(`✅ Hailou 2.3 task ${taskId} completed successfully: ${result.videoUrl}`);
        // TODO: Store in database and/or notify user via WebSocket
      } else if (status === 'failed') {
        console.error(`❌ Hailou 2.3 task ${taskId} failed:`, error);
        // TODO: Store failure and/or notify user via WebSocket
      }

      // Acknowledge receipt
      res.json({ received: true, taskId });

    } catch (error: any) {
      console.error('Hailou 2.3 callback error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Convert audio to WAV format (paid users only)
  app.post("/api/convert-to-wav", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
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
    const userId = getUserId(req);
    
    try {
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
        const openaiApiKey = process.env.OPENAI_API_KEY;

        if (!openaiApiKey) {
          return res.status(500).json({ error: 'OpenAI API key not configured' });
        }

        const openai = new OpenAI({
          apiKey: openaiApiKey,
          // Don't set baseURL to use default OpenAI endpoint
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

          // Automatically refund credits on API failure
          const refundResult = await storage.refundCredits(userId, 'album_art_generation');

          if (refundResult.success) {
            console.log(refundResult.amountRefunded > 0
              ? `✅ Refunded ${refundResult.amountRefunded} credits to user ${userId} after DALL-E failure. New balance: ${refundResult.newBalance}`
              : `ℹ️ DALL-E failed for unlimited plan user - no credits to refund`
            );

            return res.status(500).json({
              error: 'Failed to generate album art with DALL-E 3',
              details: error.message,
              refunded: true,
              creditsRefunded: refundResult.amountRefunded,
              newBalance: refundResult.newBalance
            });
          } else {
            console.error(`❌ Failed to refund credits for user ${userId}:`, refundResult.error);
            return res.status(500).json({
              error: 'Failed to generate album art with DALL-E 3',
              details: error.message,
              refundError: refundResult.error
            });
          }
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

      // Automatically refund credits on API failure
      const refundResult = await storage.refundCredits(userId, 'album_art_generation');

      if (refundResult.success) {
        console.log(refundResult.amountRefunded > 0
          ? `✅ Refunded ${refundResult.amountRefunded} credits to user ${userId} after art generation failure. New balance: ${refundResult.newBalance}`
          : `ℹ️ Art generation failed for unlimited plan user - no credits to refund`
        );

        return res.status(500).json({
          error: 'Failed to generate album art',
          details: error.message,
          body: error.body,
          refunded: true,
          creditsRefunded: refundResult.amountRefunded,
          newBalance: refundResult.newBalance
        });
      } else {
        console.error(`❌ Failed to refund credits for user ${userId}:`, refundResult.error);
        return res.status(500).json({
          error: 'Failed to generate album art',
          details: error.message,
          body: error.body,
          refundError: refundResult.error
        });
      }
    }
  });

  // Midjourney image generation via ttapi.io
  app.post("/api/media/midjourney-ttapi", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
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
    const userId = getUserId(req);
    
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
    
    let user;
    
    try {
      user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
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
      // Use DurationEnum instead of calculating frames
      const input: any = {
        prompt: prompt,
        duration: duration,
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

      // Automatically refund credits on API failure
      // Note: Video generation uses custom credit calculation, so we refund using the same method
      const hasUnlimitedVideo = user ? ['all_access'].includes(user.subscriptionPlan) : false;

      if (!hasUnlimitedVideo) {
        try {
          // Refund the credits that were deducted
          const creditModelName = modelVersion === 'pro-fast' ? 'seedance-pro-fast' :
            modelVersion === 'pro' ? 'seedance-pro' : 'seedance-lite';

          const requiredCredits = calculateVideoCredits(
            creditModelName,
            resolution as '480p' | '720p' | '1080p' | '4k',
            parseInt(duration)
          );

          const currentCredits = (await storage.getUser(userId))?.credits || 0;
          const newCredits = currentCredits + requiredCredits;
          await storage.updateUserCredits(userId, newCredits);

          console.log(`✅ Refunded ${requiredCredits} credits to user ${userId} after Fal.ai video generation failure. New balance: ${newCredits}`);

          return res.status(500).json({
            error: 'Failed to generate video with Fal.ai',
            details: error.message,
            body: error.body,
            refunded: true,
            creditsRefunded: requiredCredits,
            newBalance: newCredits
          });
        } catch (refundError) {
          console.error(`❌ Failed to refund credits for user ${userId}:`, refundError);
          return res.status(500).json({
            error: 'Failed to generate video with Fal.ai',
            details: error.message,
            body: error.body,
            refundError: 'Failed to process refund'
          });
        }
      } else {
        console.log(`ℹ️ Fal.ai video failed for unlimited plan user - no credits to refund`);
        return res.status(500).json({
          error: 'Failed to generate video with Fal.ai',
          details: error.message,
          body: error.body,
          refunded: false
        });
      }
    }
  });

  // Unified Video Generation with Premium Models (Veo 3, Sora 2, Seedance)
  app.post("/api/generate-video-premium", authMiddleware, async (req: any, res) => {
    try {
      const userId = getUserId(req);
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
        const falInput: any = {
          prompt: prompt,
          duration: duration,
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


  // Setup video generation and editing routes
  setupVideoRoutes(app);

  // Setup AI Machine interface
  app.use("/api/aimachine", authMiddleware, aiMachineRouter);

  // Configure multer for audio uploads
  const uploadAudio = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/flac', 'audio/ogg'];
      if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
        cb(null, true);
      } else {
        cb(new Error('Only audio files are allowed'));
      }
    }
  });

  // Band Generation - integrated directly into main server
  const bandGenerator = new BandGenerator();

  app.post("/api/band-generation", authMiddleware, uploadAudio.single('audio'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Audio file is required' });
      }

      console.log(`📁 Received audio file: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);

      // Parse options
      const options: GenerationOptions = {
        mode: (req.body.mode || 'explore') as 'explore' | 'refine',
        artStyle: (req.body.artStyle || 'realistic') as any,
        cardTheme: (req.body.cardTheme || 'dark') as any,
        userBandName: req.body.userBandName,
        songName: req.body.songName || req.file.originalname.replace(/\.[^/.]+$/, ''),
        userGenre: req.body.userGenre,
        artistType: (req.body.artistType || 'ensemble') as any
      };

      console.log('🎛️  Options:', options);

      // Analyze audio
      console.log('🔊 Analyzing audio...');
      const audioMetrics = AudioAnalyzer.analyzeBuffer(req.file.buffer, req.file.originalname);
      console.log('📊 Audio metrics:', audioMetrics);

      // Generate band
      console.log('🎨 Generating band profile...');
      const result = await bandGenerator.generateBand(audioMetrics, options);

      // Generate trading card
      console.log('🎴 Generating trading card...');
      const cardSvg = CardGenerator.generateCard(result.winner, options.cardTheme);
      result.winner.cardImageUrl = CardGenerator.toDataUrl(cardSvg);

      console.log(`✅ Generation complete: ${result.winner.bandName}`);

      res.json(result);
    } catch (error: any) {
      console.error('❌ Band generation error:', error);
      res.status(500).json({
        error: 'Band generation failed',
        message: error.message
      });
    }
  });

  // Profile image upload endpoint using IMGBB
  app.post("/api/user/profile-image", authMiddleware, (req, res, next) => {
    console.log("Profile image upload route hit, before multer");
    next();
  }, uploadImage.single("profileImage"), (req, res, next) => {
    console.log("After multer, file present:", !!req.file);
    next();
  }, async (req: any, res) => {
    try {
      console.log("Profile image upload request received");

      if (!req.file) {
        console.log("No file provided in request");
        return res.status(400).json({
          error: "No image file provided"
        });
      }

      const userId = req.user?.id;
      console.log("User ID from request:", userId);
      if (!userId) {
        console.log("User not authenticated");
        return res.status(401).json({
          error: "User not authenticated"
        });
      }

      // Convert buffer to base64 for IMGBB upload
      const base64Image = req.file.buffer.toString("base64");

      console.log("Uploading to IMGBB for user:", userId);
      console.log("IMGBB API Key present:", !!process.env.IMGBB_API_KEY);
      console.log("Base64 image length:", base64Image.length);
      console.log("Using corrected base64 format (no data URL prefix) - Fixed!");

      // Upload to IMGBB (send raw base64 without data URL prefix)
      const imgbbResponse = await fetch("https://api.imgbb.com/1/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          key: process.env.IMGBB_API_KEY || "your_imgbb_api_key_here",
          image: base64Image,
          name: `profile-${userId}-${Date.now()}`,
          expiration: "0", // No expiration (must be string for URLSearchParams)
        }),
      });

      if (!imgbbResponse.ok) {
        const errorText = await imgbbResponse.text();
        console.error("IMGBB API Error Response:", errorText);
        throw new Error(`Failed to upload image to IMGBB: ${imgbbResponse.status} ${errorText}`);
      }

      const imgbbResult = await imgbbResponse.json();

      if (!imgbbResult.success) {
        throw new Error(imgbbResult.error?.message || "IMGBB upload failed");
      }

      const imageUrl = imgbbResult.data.url;

      // Update user profile image URL in database
      await storage.updateUserProfileImage(userId, imageUrl);

      console.log("Profile image uploaded for user:", userId, "URL:", imageUrl);

      res.status(200).json({
        success: true,
        profileImageUrl: imageUrl
      });

    } catch (error: any) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({
        error: "Failed to upload profile image",
        message: error.message
      });
    }
  });

  // ============================================================================
  // DEV LOGIN/REGISTER ROUTES (for testing multiple users)
  // ============================================================================
  if (isDevelopment) {
    // Schema for user registration
    const registerSchema = z.object({
      username: z.string().min(3, "Username must be at least 3 characters"),
      password: z.string().min(6, "Password must be at least 6 characters"),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
    });

    // Register a new test user
    app.post("/api/register", async (req, res) => {
      try {
        const validatedData = registerSchema.parse(req.body);
        const { username, password, firstName, lastName } = validatedData;

        // Check if username already exists
        const existingUsers = await storage.getAllUsers();
        const existingUser = existingUsers.find(u => u.username === username);
        if (existingUser) {
          return res.status(400).json({ message: "Username already exists" });
        }

        // Create new user with generated ID
        const userId = `test-user-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        const newUser = {
          id: userId,
          username,
          email: `${username}@test.local`,
          firstName: firstName || username,
          lastName: lastName || 'User',
          profileImageUrl: null,
          vocalGenderPreference: 'm',
          credits: 1000,
          subscriptionPlan: 'creator' as const,
          lastCreditReset: new Date(),
          welcomeBonusClaimed: 1,
          stripeCustomerId: null,
          stripeSubscriptionId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        await storage.upsertUser(newUser);
        console.log('✅ New test user registered:', { id: userId, username, email: newUser.email });

        // Auto-login after registration by setting session
        (req.session as any).devUser = {
          claims: {
            sub: newUser.id,
            email: newUser.email,
            first_name: newUser.firstName,
            last_name: newUser.lastName,
            profile_image_url: newUser.profileImageUrl,
          },
          expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 1 week from now
        };

        res.status(201).json({
          message: "User registered successfully",
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            subscriptionPlan: newUser.subscriptionPlan,
            credits: newUser.credits,
          }
        });
      } catch (error: any) {
        console.error("Registration error:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            message: "Invalid input",
            errors: error.errors
          });
        }
        res.status(500).json({ message: "Registration failed", error: error.message });
      }
    });

    // Login with username/password for test users
    app.post("/api/login", async (req, res) => {
      try {
        const { username, password } = req.body;

        if (!username || !password) {
          return res.status(400).json({ message: "Username and password required" });
        }

        // Get all users and find matching username
        const users = await storage.getAllUsers();
        const user = users.find(u => u.username === username);

        if (!user) {
          return res.status(401).json({ message: "Invalid username or password" });
        }

        // For dev testing, accept any password for existing test users
        // In production, you'd hash and verify passwords properly
        console.log('✅ Test user logged in:', { id: user.id, username: user.username });

        // Set session
        (req.session as any).devUser = {
          claims: {
            sub: user.id,
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
            profile_image_url: user.profileImageUrl,
          },
          expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 1 week from now
        };

        res.json({
          message: "Login successful",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            subscriptionPlan: user.subscriptionPlan,
            credits: user.credits,
          }
        });
      } catch (error: any) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Login failed", error: error.message });
      }
    });

    // Logout
    app.post("/api/logout", (req, res) => {
      req.session.destroy(() => {
        console.log('👋 User logged out');
        res.json({ message: "Logout successful" });
      });
    });
  }

  // Add multer error handling
  app.use((err: any, req: any, res: any, next: any) => {
    if (err instanceof multer.MulterError) {
      console.error("Multer error:", err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large' });
      }
      return res.status(400).json({ error: 'File upload error: ' + err.message });
    }
    next(err);
  });

  const httpServer = createServer(app);

  return httpServer;
}
