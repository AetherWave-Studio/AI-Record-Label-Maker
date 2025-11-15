import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import type { User } from "#shared/schema";
import { fal } from "@fal-ai/client";
import { uploadImageToKie } from "./kieClient";
import { lumaTextToLoop, lumaImageToLoop, lumaVideoToLoop } from "./lumaClient";
import { isAuthenticated } from "./replitAuth";
import { isDevAuthenticated } from "./devAuth";

// Use dev-aware auth middleware
const isDevelopment = process.env.NODE_ENV === "development";
const authMiddleware = isDevelopment ? isDevAuthenticated : isAuthenticated;
import {
  extractLoopFrames,
  downloadVideo,
  concatenateVideos,
  cleanupFile,
  getVideoDuration,
  transcodeToH264,
  saveVideoMetadata
} from "./videoUtils";
import path from "path";
import os from "os";
import fs from "fs";
import fsPromises from "fs/promises";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import multer from "multer";
import { EventEmitter } from "events";

// Create __dirname equivalent for ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Configure multer for video uploads
const upload = multer({
  dest: os.tmpdir(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max
  }
});

// Progress event emitters for active processing jobs
const progressEmitters = new Map<string, EventEmitter>();

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

// Actual background removal using Python scripts with real-time progress
const removeBackgroundFromVideo = async (
  videoFile: Express.Multer.File,
  format: 'webm' | 'mov' | 'gif' = 'webm',
  jobId: string
) => {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));

  // Create unique filename
  const timestamp = Date.now();
  const outputFilename = `bg_removed_${timestamp}.${format}`;
  const outputPath = path.join(currentDir, '..', 'uploads', 'processed', outputFilename);

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  await fsPromises.mkdir(outputDir, { recursive: true });

  // Path to NEW STREAMING Python script
  const pythonScript = path.join(currentDir, '..', 'Remove_Video_Background', 'create_transparent_video_streaming.py');
  const inputPath = videoFile.path;

  console.log(`Processing video with job ID: ${jobId}`);
  console.log(`Using streaming Python script: ${pythonScript}`);

  // Get or create progress emitter for this job
  const emitter = progressEmitters.get(jobId) || new EventEmitter();
  progressEmitters.set(jobId, emitter);

  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [
      pythonScript,
      inputPath,
      outputPath,
      format
    ]);

    let stdoutBuffer = '';

    pythonProcess.stdout.on('data', (data) => {
      stdoutBuffer += data.toString();

      // Process complete JSON lines
      const lines = stdoutBuffer.split('\n');
      stdoutBuffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim()) {
          try {
            const progressData = JSON.parse(line);
            console.log(`Progress [${jobId}]:`, progressData);

            // Emit to SSE clients
            emitter.emit('progress', progressData);
          } catch (e) {
            console.log(`Non-JSON output: ${line}`);
          }
        }
      }
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`Python stderr [${jobId}]: ${data}`);
    });

    pythonProcess.on('close', async (code) => {
      // Clean up
      try {
        await fsPromises.unlink(inputPath);
      } catch (err) {
        console.error('Failed to delete input file:', err);
      }

      // Clean up emitter
      progressEmitters.delete(jobId);

      if (code !== 0) {
        reject(new Error(`Python process exited with code ${code}`));
        return;
      }

      // Check output file
      try {
        const stats = await fsPromises.stat(outputPath);

        resolve({
          id: `bg_removed_${timestamp}`,
          processedUrl: `/api/video/download-processed/${outputFilename}`,
          format: format,
          size: stats.size,
          createdAt: new Date().toISOString(),
          status: "completed"
        });
      } catch (err) {
        reject(new Error(`Output file not created: ${err}`));
      }
    });

    pythonProcess.on('error', (error) => {
      progressEmitters.delete(jobId);
      reject(new Error(`Failed to start Python process: ${error.message}`));
    });
  });
};

export function setupVideoRoutes(app: Express) {
  // Download temporary video files AND metadata - serves for both video playback and metadata download
  app.get("/api/video/download-temp/:filename", async (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(os.tmpdir(), filename);
      
      // Security: only allow video (.mp4) and metadata (.json) files with expected pattern
      if (!filename.match(/^seamless-loop-\d+\.(mp4|json)$/)) {
        return res.status(400).json({ error: "Invalid filename" });
      }
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: "File not found or expired" });
      }
      
      // Determine content type and disposition based on file extension
      const isJson = filename.endsWith('.json');
      const contentType = isJson ? 'application/json' : 'video/mp4';
      const disposition = isJson ? 'attachment' : 'inline'; // JSON downloads, videos play inline
      
      // Serve file with proper headers for both streaming and download
      // Don't use res.download() as it triggers cleanup on partial requests (206)
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error("Error sending file:", err);
          if (!res.headersSent) {
            res.status(404).json({ error: "File not found" });
          }
        }
        // Note: Files are NOT auto-cleaned up to allow multiple requests (video streaming, download)
        // Consider implementing periodic cleanup or TTL-based cleanup in production
      });
    } catch (error) {
      console.error("Error serving download:", error);
      res.status(500).json({ error: "Failed to serve file" });
    }
  });

  // Serve processed background-removed videos
  app.get("/api/video/download-processed/:filename", async (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(__dirname, '..', 'uploads', 'processed', filename);

      // Debug logging
      console.log(`Download request for: ${filename}`);
      console.log(`Constructed path: ${filePath}`);
      console.log(`Regex test: ${filename.match(/^bg_removed_\d+\.(webm|mov|gif)$/)} `);
      console.log(`File exists: ${fs.existsSync(filePath)}`);

      // Security: only allow expected patterns for background-removed videos
      if (!filename.match(/^bg_removed_\d+\.(webm|mov|gif)$/)) {
        console.log(`Invalid filename rejected: ${filename}`);
        return res.status(400).json({ error: "Invalid filename" });
      }

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return res.status(404).json({ error: "File not found" });
      }

      // Determine content type based on extension
      const extension = filename.split('.').pop();
      let contentType;
      if (extension === 'webm') {
        contentType = 'video/webm';
      } else if (extension === 'mov') {
        contentType = 'video/quicktime';
      } else if (extension === 'gif') {
        contentType = 'image/gif';
      } else {
        contentType = 'application/octet-stream';
      }

      // Serve file with proper headers for streaming and download
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      res.sendFile(filePath, (err) => {
        if (err) {
          console.error("Error sending processed video:", err);
          if (!res.headersSent) {
            res.status(404).json({ error: "File not found" });
          }
        }
      });
    } catch (error) {
      console.error("Error serving processed video:", error);
      res.status(500).json({ error: "Failed to serve file" });
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

  // Simple polling endpoint for progress (works with frontend progress bar)
  app.get("/api/video/progress/:jobId", (req: Request, res: Response) => {
    const { jobId } = req.params;

    // Get progress emitter for this job
    const emitter = progressEmitters.get(jobId);

    if (!emitter) {
      return res.json({
        percentage: 0,
        status: 'not_found'
      });
    }

    // Store the latest progress data for this job
    let latestProgress: any = { percentage: 0, status: 'processing' };

    // Listen for progress updates temporarily
    const progressListener = (data: any) => {
      latestProgress = data;
    };

    emitter.on('progress', progressListener);

    // Return the latest progress data
    res.json(latestProgress);

    // Clean up listener after response
    setTimeout(() => {
      emitter.off('progress', progressListener);
    }, 100);
  });

  // SSE endpoint for real-time progress updates
  app.get("/api/video/remove-background/progress/:jobId", (req: Request, res: Response) => {
    const { jobId } = req.params;

    console.log(`SSE client connected for job: ${jobId}`);

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Get or create emitter for this job
    const emitter = progressEmitters.get(jobId) || new EventEmitter();
    progressEmitters.set(jobId, emitter);

    // Listen for progress events
    const progressListener = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    emitter.on('progress', progressListener);

    // Send initial connection message
    res.write(`data: ${JSON.stringify({ step: 'connected', message: 'Connected to progress stream' })}\n\n`);

    // Clean up on client disconnect
    req.on('close', () => {
      console.log(`SSE client disconnected for job: ${jobId}`);
      emitter.off('progress', progressListener);
    });
  });

  // Remove video background
  app.post("/api/video/remove-background", authMiddleware, upload.single('video'), async (req: Request, res: Response) => {
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

      // Generate unique job ID for progress tracking
      const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Deduct credits
      await storage.deductCredits(userId, 'background_removal' as any);

      // Process background removal with Python scripts (with job ID for progress tracking)
      const result = await removeBackgroundFromVideo(videoFile, format as 'webm' | 'mov' | 'gif', jobId);

      res.json({
        success: true,
        jobId: jobId,
        processedUrl: result.processedUrl,
        format: result.format,
        size: result.size,
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

  // SEAMLESS LOOP CREATOR - Generate new looping video from text using Luma Ray 2 Flash
  app.post("/api/video/generate-seamless-loop", authMiddleware, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.id;
      const { prompt } = req.body;
      
      // Parse duration to number (frontend sends string)
      const durationNum = Number(req.body.duration) || 5;

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

      // Validate duration (Luma Ray 2 Flash only supports 5s or 9s)
      if (durationNum !== 5 && durationNum !== 9) {
        return res.status(400).json({
          success: false,
          error: "Duration must be 5 or 9 seconds for Luma Ray 2 Flash"
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

      // Cost: Luma Ray 2 Flash = 2 credits per second (same as before, but better quality!)
      const CREDITS_PER_SECOND = 2.0;
      const LOOP_GENERATION_COST = Math.ceil(CREDITS_PER_SECOND * durationNum);
      
      if (user.credits < LOOP_GENERATION_COST) {
        return res.status(400).json({
          success: false,
          error: `Insufficient credits. Required: ${LOOP_GENERATION_COST}, Available: ${user.credits}`
        });
      }

      console.log(`🎬 Starting Luma seamless loop generation for user ${userId} with prompt: "${prompt}"`);

      // ✅ FIXED: Deduct credits AFTER all validation passes
      await storage.updateUserCredits(userId, user.credits - LOOP_GENERATION_COST);

      let finalLoopPath: string | null = null;

      try {
        // Generate seamless loop with Luma Ray 2 Flash (single AI call!)
        console.log(`Generating ${durationNum}s seamless loop with Luma Ray 2 Flash...`);
        
        const lumaResult = await lumaTextToLoop({
          prompt: prompt,
          duration: `${durationNum}s` as "5s" | "9s",
          aspect_ratio: "16:9",
          loop: true // Enable native loop mode
        });

        if (lumaResult.status === "failed" || !lumaResult.videoUrl) {
          throw new Error(lumaResult.error || 'Luma generation failed');
        }

        // Download video from Luma
        console.log('Downloading Luma-generated seamless loop...');
        const timestamp = Date.now();
        const filename = `seamless-loop-${timestamp}.mp4`;
        const tempDownloadPath = await downloadVideo(lumaResult.videoUrl);
        
        // Apply FFmpeg faststart to move moov atom to beginning for browser playback
        console.log('Applying FFmpeg faststart for browser streaming...');
        const faststartPath = path.join(os.tmpdir(), filename);
        const { execSync } = await import('child_process');
        
        try {
          execSync(`ffmpeg -i "${tempDownloadPath}" -c copy -movflags +faststart "${faststartPath}"`, {
            stdio: 'pipe' // Suppress FFmpeg output
          });
          console.log('✅ Faststart applied successfully');
        } catch (ffmpegError) {
          console.error('FFmpeg faststart failed:', ffmpegError);
          // Fallback: use original file if faststart fails
          fs.renameSync(tempDownloadPath, faststartPath);
        } finally {
          // Clean up temp download file
          if (fs.existsSync(tempDownloadPath)) {
            fs.unlinkSync(tempDownloadPath);
          }
        }
        
        finalLoopPath = faststartPath;
        console.log('✅ Luma seamless loop created successfully!');

        // Save metadata for prompt testing
        await saveVideoMetadata({
          filename: filename,
          mode: 'text-to-loop-luma',
          duration: durationNum,
          creditsUsed: LOOP_GENERATION_COST,
          userPrompt: prompt,
          aiPrompts: {
            luma: `${prompt}, seamless loop, continuous motion`
          }
        });

        // Return download URL
        const downloadUrl = `/api/video/download-temp/${filename}`;

        res.json({
          success: true,
          videoUrl: downloadUrl,
          message: "Seamless loop generated successfully with Luma Ray 2 Flash",
          creditsUsed: LOOP_GENERATION_COST,
          newBalance: user.credits - LOOP_GENERATION_COST
        });

      } catch (generationError: any) {
        console.error('❌ Luma loop generation failed:', generationError);
        
        // Refund credits on failure
        await storage.updateUserCredits(userId, user.credits);
        
        // Clean up files on failure
        if (finalLoopPath) await cleanupFile(finalLoopPath);
        
        throw generationError;
      }

    } catch (error: any) {
      console.error("Error generating seamless loop:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to generate seamless loop"
      });
    }
  });

  // IMAGE-TO-LOOP: Create seamless loop from single image using Luma Ray 2 Flash
  app.post('/api/video/generate-seamless-loop-image', authMiddleware, upload.single('image'), async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const imageFile = req.file;
      const duration = parseInt(req.body.duration) || 5; // Luma supports 5s or 9s
      const userPrompt = req.body.prompt || '';

      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      if (!imageFile) {
        return res.status(400).json({
          success: false,
          error: 'No image file uploaded'
        });
      }

      if (!userPrompt.trim()) {
        return res.status(400).json({
          success: false,
          error: 'Motion prompt is required - describe how the image should animate'
        });
      }

      // Validate duration (Luma only supports 5s or 9s)
      if (duration !== 5 && duration !== 9) {
        await cleanupFile(imageFile.path);
        return res.status(400).json({
          success: false,
          error: 'Duration must be 5 or 9 seconds for Luma Ray 2 Flash'
        });
      }

      // Validate MIME type
      const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!allowedMimeTypes.includes(imageFile.mimetype)) {
        await cleanupFile(imageFile.path);
        return res.status(400).json({
          success: false,
          error: `Invalid file type. Allowed: JPG, PNG, WebP`
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

      const LOOP_COST = duration * 2; // 2 credits per second (same pricing)

      // Check credits
      if (user.credits < LOOP_COST) {
        await cleanupFile(imageFile.path);
        return res.status(402).json({
          success: false,
          error: `Insufficient credits. Required: ${LOOP_COST}, Available: ${user.credits}`
        });
      }

      console.log(`🎬 Creating ${duration}s Luma loop from image for user ${userId}, cost: ${LOOP_COST} credits`);

      // Deduct credits upfront
      await storage.updateUserCredits(userId, user.credits - LOOP_COST);

      let finalLoopPath: string | null = null;

      try {
        // Step 1: Upload image to ImgBB (Luma needs a public URL)
        console.log('Uploading image to ImgBB...');
        const imgbbApiKey = process.env.IMGBB_API_KEY;
        if (!imgbbApiKey) {
          throw new Error('IMGBB_API_KEY not configured');
        }
        
        const imageBuffer = fs.readFileSync(imageFile.path);
        const base64Image = imageBuffer.toString('base64');
        const imageUrl = await uploadImageToKie(base64Image, imgbbApiKey);
        console.log('Image uploaded successfully:', imageUrl);

        // Step 2: Generate seamless loop with Luma Ray 2 Flash (single AI call!)
        console.log(`Generating ${duration}s seamless loop from image with Luma...`);
        
        const lumaResult = await lumaImageToLoop({
          prompt: userPrompt,
          image_url: imageUrl,
          duration: `${duration}s` as "5s" | "9s",
          aspect_ratio: "16:9",
          loop: true // Enable native loop mode
        });

        if (lumaResult.status === "failed" || !lumaResult.videoUrl) {
          throw new Error(lumaResult.error || 'Luma image-to-loop generation failed');
        }

        // Step 3: Download video from Luma
        console.log('Downloading Luma-generated seamless loop...');
        const timestamp = Date.now();
        const filename = `seamless-loop-${timestamp}.mp4`;
        const tempDownloadPath = await downloadVideo(lumaResult.videoUrl);
        
        // Apply FFmpeg faststart to move moov atom to beginning for browser playback
        console.log('Applying FFmpeg faststart for browser streaming...');
        const faststartPath = path.join(os.tmpdir(), filename);
        const { execSync } = await import('child_process');
        
        try {
          execSync(`ffmpeg -i "${tempDownloadPath}" -c copy -movflags +faststart "${faststartPath}"`, {
            stdio: 'pipe' // Suppress FFmpeg output
          });
          console.log('✅ Faststart applied successfully');
        } catch (ffmpegError) {
          console.error('FFmpeg faststart failed:', ffmpegError);
          // Fallback: use original file if faststart fails
          fs.renameSync(tempDownloadPath, faststartPath);
        } finally {
          // Clean up temp download file
          if (fs.existsSync(tempDownloadPath)) {
            fs.unlinkSync(tempDownloadPath);
          }
        }
        
        finalLoopPath = faststartPath;
        console.log('✅ Luma image-to-loop created successfully!');

        // Save metadata for prompt testing
        await saveVideoMetadata({
          filename: filename,
          mode: 'image-to-loop-luma',
          duration: duration,
          creditsUsed: LOOP_COST,
          userPrompt: userPrompt,
          aiPrompts: {
            luma: `${userPrompt}, seamless loop, continuous motion, smooth return to starting position`
          },
          sourceFile: imageFile.originalname
        });

        const downloadUrl = `/api/video/download-temp/${filename}`;

        res.json({
          success: true,
          videoUrl: downloadUrl,
          message: "Seamless loop created from image with Luma Ray 2 Flash",
          creditsUsed: LOOP_COST,
          newBalance: user.credits - LOOP_COST
        });

      } catch (generationError: any) {
        console.error('❌ Luma image-to-loop generation failed:', generationError);
        
        // Refund credits on failure
        await storage.updateUserCredits(userId, user.credits);
        
        // Clean up files on failure
        if (finalLoopPath) await cleanupFile(finalLoopPath);
        
        throw generationError;
      } finally {
        // Clean up uploaded image file
        await cleanupFile(imageFile.path);
      }

    } catch (error: any) {
      console.error("Error creating loop from image:", error);
      res.status(500).json({
        success: false,
        error: error.message || "Failed to create loop from image"
      });
    }
  });

  // Upload mode: Convert existing video to seamless loop
  app.post('/api/video/generate-seamless-loop-upload', authMiddleware, upload.single('video'), async (req, res) => {
    try {
      const userId = (req as any).user?.id;
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
      const updatedUser = await storage.updateUserCredits(userId, user.credits - uploadLoopCost);

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
        secondHalfPath = await downloadVideo(secondHalfResult.data.video.url);

        // Step 4: Concatenate transcoded video + second half
        console.log('Concatenating videos into seamless loop...');
        finalLoopPath = path.join(os.tmpdir(), `seamless-loop-${timestamp}.mp4`);
        await concatenateVideos(transcodedVideoPath, secondHalfPath, finalLoopPath);

        console.log(`Seamless loop created successfully: ${finalLoopPath}`);

        // Save metadata for prompt testing and optimization
        await saveVideoMetadata({
          filename: path.basename(finalLoopPath),
          mode: 'upload-to-loop',
          duration: uploadedDuration * 2, // Total loop duration
          creditsUsed: uploadLoopCost,
          userPrompt: 'smooth transition completing the seamless loop, return to starting position',
          aiPrompts: {
            firstHalf: 'Original uploaded video',
            secondHalf: 'smooth transition completing the seamless loop, return to starting position'
          },
          sourceFile: videoFile.originalname
        });

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
          await storage.updateUserCredits(userId, user.credits);
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