// Vercel Serverless Function - Video Generation with Fal.ai
// Uses Fal.ai Seedance 1.0 API for more reliable video generation

import { fal } from "@fal-ai/client";

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key from environment variables
  const falApiKey = process.env.FAL_KEY;

  if (!falApiKey) {
    return res.status(500).json({ error: 'Fal.ai API key not configured' });
  }

  // Set API key (no config method needed, set directly on fal)
  process.env.FAL_KEY = falApiKey;

  // Validate request body
  const {
    prompt,
    imageData, // Base64 image data
    imageMode = 'first-frame', // 'first-frame' or 'reference'
    modelVersion = 'lite', // 'lite' or 'pro'
    resolution = '720p', // 512p, 720p, or 1080p
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

  try {
    // Determine which Fal.ai model to use
    let modelId;
    if (imageData) {
      // Image-to-video or reference-to-video
      if (imageMode === 'reference') {
        // Reference mode - use image as style reference
        modelId = modelVersion === 'pro'
          ? 'fal-ai/bytedance/seedance/v1/pro/reference-to-video'
          : 'fal-ai/bytedance/seedance/v1/lite/reference-to-video';
      } else {
        // First frame mode - standard image-to-video
        modelId = modelVersion === 'pro'
          ? 'fal-ai/bytedance/seedance/v1/pro/image-to-video'
          : 'fal-ai/bytedance/seedance/v1/lite/image-to-video';
      }
    } else {
      // Text-to-video
      modelId = modelVersion === 'pro'
        ? 'fal-ai/bytedance/seedance/v1/pro/text-to-video'
        : 'fal-ai/bytedance/seedance/v1/lite/text-to-video';
    }

    console.log('Generating video with Fal.ai Seedance:', {
      model: modelId,
      prompt: prompt,
      hasImage: !!imageData,
      imageMode: imageData ? imageMode : 'none',
      resolution: resolution,
      duration: duration
    });

    // Build request input
    const input = {
      prompt: prompt,
      num_frames: duration === '10' ? 241 : 121, // 121 frames = 5s, 241 frames = 10s at 24fps
      enable_safety_checker: enableSafetyChecker
    };

    // Add resolution if supported (480p, 720p, 1080p)
    if (resolution === '512p') {
      input.resolution = '480p'; // Map 512p to 480p (closest available)
    } else {
      input.resolution = resolution;
    }

    // Add image if provided
    if (imageData) {
      if (imageMode === 'reference') {
        // For reference mode, image can be single or array of images
        input.image_urls = [imageData]; // Fal.ai reference mode uses array
      } else {
        // For first-frame mode, use single image
        input.image_url = imageData; // Fal.ai can accept base64 data URLs directly
      }
    }

    // Subscribe to the model (streaming response)
    const result = await fal.subscribe(modelId, {
      input: input,
      logs: true,
      onQueueUpdate: (update) => {
        console.log('Queue update:', update.status);
      }
    });

    console.log('Fal.ai video generation complete (full result):', JSON.stringify(result, null, 2));

    // Extract video URL - Fal.ai returns it at data.video.url
    const videoUrl = result.data?.video?.url ||
                     result.video?.url ||
                     result.video_url ||
                     result.data?.video_url ||
                     result.url;

    if (videoUrl) {
      console.log('✅ Video URL extracted:', videoUrl);
      return res.status(200).json({
        status: 'complete',
        videoUrl: videoUrl,
        model: modelId,
        seed: result.data?.seed || result.seed,
        timings: result.timings || result.data?.timings
      });
    } else {
      console.error('❌ No video URL found in response');
      return res.status(500).json({
        error: 'Video generation completed but no video URL found in response',
        result: result,
        keys: Object.keys(result),
        dataKeys: result.data ? Object.keys(result.data) : null
      });
    }

  } catch (error) {
    console.error('Fal.ai Video Generation Error:', error);
    return res.status(500).json({
      error: 'Failed to generate video with Fal.ai',
      details: error.message,
      body: error.body
    });
  }
}
