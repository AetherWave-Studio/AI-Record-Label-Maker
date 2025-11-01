import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import type { User } from "@shared/schema";
import { fal } from "@fal-ai/client";
import { uploadImageToKie } from "./kieClient";
import { isAuthenticated } from "./replitAuth";
import {
  extractLoopFrames,
  downloadVideo,
  concatenateVideos,
  cleanupFile,
  getVideoDuration,
  transcodeToH264
} from "./videoUtils";
import path from "path";
import os from "os";
import { writeFile } from "fs/promises";
import multer from "multer";

// Configure multer for video uploads
const upload = multer({
  dest: os.tmpdir(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max
  }
});

// Video generation models configuration
const VIDEO_MODELS = {
  veo3: {
    name: "Veo 3",
    credits: 50,
    maxDuration: 60,
    quality: "High",
    provider: "Google"
  },
  sora2: {
    name: "Sora 2",
    credits: 75,
    maxDuration: 30,
    quality: "Premium",
    provider: "OpenAI"
  },
  seedance: {
    name: "Seedance",
    credits: 25,
    maxDuration: 30,
    quality: "Standard",
    provider: "Custom"
  }
};

// Mock video generation responses (replace with actual AI model integration)
const mockVideoGeneration = async (prompt: string, model: string, imageFile?: File) => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

  return {
    id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    url: `/api/video/mock/${Date.now()}.webm`,
    thumbnail: `/api/video/mock/${Date.now()}_thumb.jpg`,
    duration: Math.floor(Math.random() * 30) + 5,
    size: Math.floor(Math.random() * 5000000) + 1000000, // 1-6MB
    model: model,
    prompt: prompt,
    createdAt: new Date().toISOString(),
    status: "completed"
  };
};

// Mock background removal (integrate with existing Python scripts)
const mockBackgroundRemoval = async (videoFile: File, format: 'webm' | 'mov' = 'webm') => {
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 5000));

  return {
    id: `bg_removed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    originalUrl: URL.createObjectURL(videoFile),
    processedUrl: `/api/video/bg-removed/${Date.now()}.${format}`,
    thumbnail: `/api/video/bg-removed/${Date.now()}_thumb.jpg`,
    format: format,
    size: videoFile.size,
    createdAt: new Date().toISOString(),
    status: "completed"
  };
};

export function setupVideoRoutes(app: Express) {
  // Download temporary video files
  app.get("/api/video/download-temp/:filename", async (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(os.tmpdir(), filename);
      
      // Security: only allow files in temp directory with expected pattern
      if (!filename.match(/^seamless-loop-\d+\.mp4$/)) {
        return res.status(400).json({ error: "Invalid filename" });
      }
      
      res.download(filePath, filename, (err) => {
        if (err) {
          console.error("Download error:", err);
          if (!res.headersSent) {
            res.status(404).json({ error: "File not found" });
          }
        }
        // Clean up file after download
        cleanupFile(filePath).catch(console.error);
      });
    } catch (error) {
      console.error("Error serving download:", error);
      res.status(500).json({ error: "Failed to download file" });
    }
  });

  // Get available video models
  app.get("/api/video/models", async (req: Request, res: Response) => {
    try {
      res.json({
        success: true,
        models: VIDEO_MODELS
      });
    } catch (error) {
      console.error("Error fetching video models:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch video models"
      });
    }
  });

  // Generate video from prompt/image
  app.post("/api/video/generate", async (req: Request, res: Response) => {
    try {
      const { prompt, model, settings = {} } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required"
        });
      }

      if (!prompt) {
        return res.status(400).json({
          success: false,
          error: "Prompt is required"
        });
      }

      // Validate model
      if (!VIDEO_MODELS[model as keyof typeof VIDEO_MODELS]) {
        return res.status(400).json({
          success: false,
          error: "Invalid model specified"
        });
      }

      const modelConfig = VIDEO_MODELS[model as keyof typeof VIDEO_MODELS];

      // Get user and check credits
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }

      // Check if user has enough credits
      if (user.credits < modelConfig.credits) {
        return res.status(400).json({
          success: false,
          error: `Insufficient credits. Required: ${modelConfig.credits}, Available: ${user.credits}`
        });
      }

      // Handle file upload if present
      let imageFile = null;
      if (req.file) {
        imageFile = req.file;
      }

      // Start processing (this would be the actual AI model call)
      console.log(`Starting video generation for user ${userId} with model ${model}`);

      // Deduct credits immediately
      await storage.deductCredits(userId, 'video_generation' as any);

      // Generate video (mock implementation)
      const result = await mockVideoGeneration(prompt, model, imageFile);

      // Store video metadata (you might want to add a videos table to the schema)
      // For now, we'll just return the result

      res.json({
        success: true,
        video: result,
        creditsUsed: modelConfig.credits,
        newBalance: user.credits - modelConfig.credits
      });

    } catch (error) {
      console.error("Error generating video:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate video"
      });
    }
  });

  // Remove video background
  app.post("/api/video/remove-background", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { format = 'webm' } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required"
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "Video file is required"
        });
      }

      const videoFile = req.file;

      // Validate file type
      if (!videoFile.mimetype.startsWith('video/')) {
        return res.status(400).json({
          success: false,
          error: "Invalid file type. Please upload a video file."
        });
      }

      // Check user credits (background removal costs 20 credits)
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }

      const BACKGROUND_REMOVAL_COST = 20;
      if (user.credits < BACKGROUND_REMOVAL_COST) {
        return res.status(400).json({
          success: false,
          error: `Insufficient credits. Required: ${BACKGROUND_REMOVAL_COST}, Available: ${user.credits}`
        });
      }

      console.log(`Starting background removal for user ${userId}`);

      // Deduct credits
      await storage.deductCredits(userId, 'background_removal' as any);

      // Process background removal (mock implementation - integrate with Python scripts)
      const result = await mockBackgroundRemoval(videoFile, format as 'webm' | 'mov');

      res.json({
        success: true,
        video: result,
        creditsUsed: BACKGROUND_REMOVAL_COST,
        newBalance: user.credits - BACKGROUND_REMOVAL_COST
      });

    } catch (error) {
      console.error("Error removing background:", error);
      res.status(500).json({
        success: false,
        error: "Failed to remove background"
      });
    }
  });

  // Get user's video library
  app.get("/api/video/library", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required"
        });
      }

      // TODO: Implement actual video library retrieval from database
      // For now, return empty library
      res.json({
        success: true,
        videos: []
      });

    } catch (error) {
      console.error("Error fetching video library:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch video library"
      });
    }
  });

  // Delete video
  app.delete("/api/video/:videoId", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { videoId } = req.params;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required"
        });
      }

      // TODO: Implement actual video deletion from database and storage
      console.log(`Deleting video ${videoId} for user ${userId}`);

      res.json({
        success: true,
        message: "Video deleted successfully"
      });

    } catch (error) {
      console.error("Error deleting video:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete video"
      });
    }
  });

  // Get video generation status
  app.get("/api/video/status/:generationId", async (req: Request, res: Response) => {
    try {
      const { generationId } = req.params;

      // TODO: Implement actual status checking from your processing queue
      res.json({
        success: true,
        status: "processing", // processing, completed, failed
        progress: 75, // 0-100
        message: "Generating video frames..."
      });

    } catch (error) {
      console.error("Error checking video status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to check video status"
      });
    }
  });

  // Download video
  app.get("/api/video/download/:videoId", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { videoId } = req.params;
      const { format = 'webm' } = req.query;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required"
        });
      }

      // TODO: Implement actual video file serving
      // For now, return a placeholder response
      res.json({
        success: false,
        error: "Video download not yet implemented"
      });

    } catch (error) {
      console.error("Error downloading video:", error);
      res.status(500).json({
        success: false,
        error: "Failed to download video"
      });
    }
  });

  // Get video processing settings
  app.get("/api/video/settings", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required"
        });
      }

      // TODO: Implement user-specific settings retrieval
      res.json({
        success: true,
        settings: {
          defaultModel: "veo3",
          defaultQuality: "high",
          defaultDuration: 15,
          autoSave: true,
          notifications: true
        }
      });

    } catch (error) {
      console.error("Error fetching video settings:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch video settings"
      });
    }
  });

  // Update video processing settings
  app.put("/api/video/settings", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const settings = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required"
        });
      }

      // TODO: Implement settings storage
      console.log(`Updating video settings for user ${userId}:`, settings);

      res.json({
        success: true,
        message: "Settings updated successfully"
      });

    } catch (error) {
      console.error("Error updating video settings:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update video settings"
      });
    }
  });

  // SEAMLESS LOOP CREATOR - Upload existing video and create perfect loop
  app.post("/api/video/create-seamless-loop", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required"
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "Video file is required"
        });
      }

      const videoFile = req.file;

      // Validate file type
      if (!videoFile.mimetype.startsWith('video/')) {
        return res.status(400).json({
          success: false,
          error: "Invalid file type. Please upload a video file."
        });
      }

      // Get user and check credits (30 credits for VEO 3 Fast loop generation)
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }

      const SEAMLESS_LOOP_COST = 30; // VEO 3 Fast generation cost
      if (user.credits < SEAMLESS_LOOP_COST) {
        return res.status(400).json({
          success: false,
          error: `Insufficient credits. Required: ${SEAMLESS_LOOP_COST}, Available: ${user.credits}`
        });
      }

      console.log(`Starting seamless loop creation for user ${userId}`);

      // TODO: Implement actual seamless loop processing:
      // 1. Extract first frame and last frame of first 50% using ffmpeg
      // 2. Upload frames to ImgBB
      // 3. Call VEO 3 with FIRST_AND_LAST_FRAMES_2_VIDEO mode
      // 4. Concatenate original first 50% + VEO-generated second 50%
      // 5. Return final seamless loop video

      res.status(501).json({
        success: false,
        error: "Seamless loop processing not yet implemented - needs ffmpeg integration"
      });

    } catch (error) {
      console.error("Error creating seamless loop:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create seamless loop"
      });
    }
  });

  // SEAMLESS LOOP CREATOR - Generate new looping video from text
  app.post("/api/video/generate-seamless-loop", async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { prompt, duration = 8 } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: "Authentication required"
        });
      }

      if (!prompt) {
        return res.status(400).json({
          success: false,
          error: "Prompt is required"
        });
      }

      // Get user and check credits
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }

      // Cost: Seedance Lite for 8s loop = 16 credits (2 credits per second)
      const halfDuration = duration / 2;
      const CREDITS_PER_SECOND = 2.0; // Seedance Lite: 8 credits / 4s = 2 credits/sec
      const LOOP_GENERATION_COST = Math.ceil(CREDITS_PER_SECOND * duration); // Total for both halves
      
      if (user.credits < LOOP_GENERATION_COST) {
        return res.status(400).json({
          success: false,
          error: `Insufficient credits. Required: ${LOOP_GENERATION_COST}, Available: ${user.credits}`
        });
      }

      console.log(`Starting seamless loop generation for user ${userId} with prompt: "${prompt}"`);

      // Deduct credits upfront using manual method since we need custom amount
      const updatedUser = await storage.updateUser(userId, {
        credits: user.credits - LOOP_GENERATION_COST
      });

      let firstHalfPath: string | null = null;
      let secondHalfPath: string | null = null;
      let finalLoopPath: string | null = null;

      try {
        // Step 1: Generate first half with Seedance Lite (text-to-video)
        console.log(`Generating first half (${halfDuration}s) with Seedance Lite...`);
        
        const firstHalfResult = await fal.subscribe("fal-ai/bytedance/seedance/v1/lite/text-to-video", {
          input: {
            prompt: `${prompt} (first half of looping motion)`,
            duration: String(Math.round(halfDuration)) as any, // Cast to match Fal.ai's string literal union type
            resolution: "720p",
            enable_safety_checker: true
          },
          logs: true,
          onQueueUpdate: (update: any) => {
            console.log('First half generation update:', update.status);
          }
        });

        const firstHalfVideoUrl = (firstHalfResult as any).video?.url;
        if (!firstHalfVideoUrl) {
          throw new Error('No video URL in first half generation result');
        }

        // Download first half
        console.log('Downloading first half video...');
        firstHalfPath = await downloadVideo(firstHalfVideoUrl);

        // Step 2: Extract first and last frames from first half
        console.log('Extracting loop frames from first half...');
        const { firstFrame, lastFrame } = await extractLoopFrames(firstHalfPath);

        // Step 3: Upload frames to ImgBB for Seedance reference
        console.log('Uploading reference frames to ImgBB...');
        const imgbbApiKey = process.env.IMGBB_API_KEY;
        if (!imgbbApiKey) {
          throw new Error('IMGBB_API_KEY not configured - cannot upload reference frames');
        }
        const firstFrameUrl = await uploadImageToKie(firstFrame, imgbbApiKey);
        const lastFrameUrl = await uploadImageToKie(lastFrame, imgbbApiKey);

        // Step 4: Generate second half with Seedance Lite (image-to-video)
        // Using first-frame mode: start with last frame of first half, return to first frame
        console.log(`Generating second half (${halfDuration}s) - completing the loop...`);
        
        const secondHalfResult = await fal.subscribe("fal-ai/bytedance/seedance/v1/lite/image-to-video", {
          input: {
            prompt: `${prompt} (completing the loop back to start)`,
            image_url: lastFrameUrl, // Start from last frame of first half
            duration: String(Math.round(halfDuration)) as any, // Cast to match Fal.ai's string literal union type
            resolution: "720p",
            enable_safety_checker: true
          },
          logs: true,
          onQueueUpdate: (update: any) => {
            console.log('Second half generation update:', update.status);
          }
        });

        const secondHalfVideoUrl = (secondHalfResult as any).video?.url;
        if (!secondHalfVideoUrl) {
          throw new Error('No video URL in second half generation result');
        }

        // Download second half
        console.log('Downloading second half video...');
        secondHalfPath = await downloadVideo(secondHalfVideoUrl);

        // Step 5: Concatenate both halves
        console.log('Concatenating both halves into seamless loop...');
        finalLoopPath = path.join('/tmp/video-processing', `seamless_loop_${Date.now()}.mp4`);
        await concatenateVideos(firstHalfPath, secondHalfPath, finalLoopPath);

        // TODO: Upload final loop to permanent storage and return URL
        // For now, return success with temp path
        console.log('Seamless loop created successfully!');

        res.json({
          success: true,
          videoUrl: finalLoopPath, // In production, upload to storage and return permanent URL
          message: "Seamless loop generated successfully",
          creditsUsed: LOOP_GENERATION_COST,
          newBalance: user.credits - LOOP_GENERATION_COST
        });

      } catch (generationError: any) {
        console.error('Loop generation failed:', generationError);
        
        // Refund credits on failure
        await storage.updateUser(userId, {
          credits: user.credits // Restore original balance
        });
        
        throw generationError;
      } finally {
        // Clean up temporary files
        if (firstHalfPath) await cleanupFile(firstHalfPath);
        if (secondHalfPath) await cleanupFile(secondHalfPath);
        // Don't delete finalLoopPath yet - user needs to download it
      }

    } catch (error: any) {
      console.error("Error generating seamless loop:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to generate seamless loop"
      });
    }
  });

  // Upload mode: Convert existing video to seamless loop
  app.post('/api/video/generate-seamless-loop-upload', isAuthenticated, upload.single('video'), async (req, res) => {
    try {
      const userId = req.user!.id;
      const videoFile = req.file;

      if (!videoFile) {
        return res.status(400).json({
          success: false,
          error: 'No video file uploaded'
        });
      }

      // Validate MIME type (security)
      const allowedMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
      if (!allowedMimeTypes.includes(videoFile.mimetype)) {
        await cleanupFile(videoFile.path); // Clean up rejected file
        return res.status(400).json({
          success: false,
          error: `Invalid file type. Allowed: ${allowedMimeTypes.join(', ')}`
        });
      }

      // Get user for credit check
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: "User not found"
        });
      }

      // Detect uploaded video duration
      console.log('Detecting uploaded video duration...');
      const uploadedDuration = await getVideoDuration(videoFile.path);
      
      // For upload mode, we generate a second half matching the uploaded video duration
      // Cost: Seedance Lite image-to-video at 2 credits/sec
      const CREDITS_PER_SECOND = 2.0;
      const uploadLoopCost = Math.ceil(CREDITS_PER_SECOND * uploadedDuration);
      
      if (user.credits < uploadLoopCost) {
        await cleanupFile(videoFile.path); // Clean up before returning error
        return res.status(400).json({
          success: false,
          error: `Insufficient credits. Required: ${uploadLoopCost} (${uploadedDuration}s × ${CREDITS_PER_SECOND} credits/sec), Available: ${user.credits}`
        });
      }

      console.log(`Converting uploaded video (${uploadedDuration}s) to seamless loop for user ${userId}, cost: ${uploadLoopCost} credits`);

      // Deduct credits upfront
      const updatedUser = await storage.updateUser(userId, {
        credits: user.credits - uploadLoopCost
      });

      let uploadedVideoPath: string | null = videoFile.path;
      let transcodedVideoPath: string | null = null;
      let secondHalfPath: string | null = null;
      let finalLoopPath: string | null = null;

      try {
        // Step 1: Transcode uploaded video to H.264 MP4 for consistent concatenation
        console.log('Transcoding uploaded video to H.264 MP4...');
        const timestamp = Date.now();
        transcodedVideoPath = path.join(os.tmpdir(), `transcoded-upload-${timestamp}.mp4`);
        await transcodeToH264(uploadedVideoPath, transcodedVideoPath);
        
        // Step 2: Extract first and last frames from transcoded video
        console.log('Extracting frames from transcoded video...');
        const { firstFrame, lastFrame } = await extractLoopFrames(transcodedVideoPath);

        // Step 2: Upload last frame to ImgBB for Seedance reference
        console.log('Uploading reference frame to ImgBB...');
        const imgbbApiKey = process.env.IMGBB_API_KEY;
        if (!imgbbApiKey) {
          throw new Error('IMGBB_API_KEY not configured - cannot upload reference frames');
        }
        const lastFrameUrl = await uploadImageToKie(lastFrame, imgbbApiKey);

        // Step 3: Generate second half with Seedance Lite (image-to-video)
        // This completes the loop by transitioning from last frame back to first frame
        console.log(`Generating return journey (${uploadedDuration}s) with Seedance Lite...`);
        
        const secondHalfResult = await fal.subscribe("fal-ai/bytedance/seedance/v1/lite/image-to-video", {
          input: {
            prompt: "smooth transition completing the seamless loop, return to starting position",
            image_url: lastFrameUrl, // Start from last frame of uploaded video
            duration: String(Math.round(uploadedDuration)) as any, // Match uploaded video duration
            resolution: "720p",
            enable_safety_checker: true
          },
          logs: true,
          onQueueUpdate: (update: any) => {
            console.log('Second half generation update:', update.status);
          }
        });

        if (!secondHalfResult.data?.video?.url) {
          throw new Error('Seedance Lite failed to generate second half video');
        }

        // Download second half
        console.log('Downloading second half...');
        secondHalfPath = await downloadVideo(secondHalfResult.data.video.url, 'loop-second-half');

        // Step 4: Concatenate transcoded video + second half
        console.log('Concatenating videos into seamless loop...');
        finalLoopPath = path.join(os.tmpdir(), `seamless-loop-${timestamp}.mp4`);
        await concatenateVideos(transcodedVideoPath, secondHalfPath, finalLoopPath);

        console.log(`Seamless loop created successfully: ${finalLoopPath}`);

        // Return success response with download URL
        res.json({
          success: true,
          videoUrl: `/api/video/download-temp/${path.basename(finalLoopPath)}`,
          message: `Seamless loop created successfully from ${uploadedDuration}s video!`,
          duration: uploadedDuration * 2, // Total loop duration (original + generated)
          creditsUsed: uploadLoopCost,
          newBalance: user.credits - uploadLoopCost
        });

      } catch (generationError: any) {
        console.error('Upload loop creation failed:', generationError);
        
        // Refund credits on failure - restore to original balance
        try {
          await storage.updateUser(userId, {
            credits: user.credits // Restore original balance
          });
          console.log(`Refunded ${uploadLoopCost} credits to user ${userId}`);
        } catch (refundError) {
          console.error('Failed to refund credits:', refundError);
        }
        
        throw generationError;
      } finally {
        // Clean up temporary files
        if (uploadedVideoPath) await cleanupFile(uploadedVideoPath);
        if (transcodedVideoPath) await cleanupFile(transcodedVideoPath);
        if (secondHalfPath) await cleanupFile(secondHalfPath);
        // Don't delete finalLoopPath yet - user needs to download it
      }

    } catch (error: any) {
      console.error('Upload seamless loop error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create seamless loop from uploaded video'
      });
    }
  });
}