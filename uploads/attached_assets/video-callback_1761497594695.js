// Vercel Serverless Function - Video Generation Callback
// Receives webhook from KIE.AI when video generation completes

import { setVideoStatus } from './video-store.js';

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

  try {
    // Log the callback data from KIE.AI
    console.log('Video callback received:', JSON.stringify(req.body, null, 2));

    // KIE.AI sends the completed video data in the callback:
    // { code: 200, msg: "success", data: { task_id: "...", video_url: "..." } }
    const callbackData = req.body;

    // Parse video URL from different response formats
    let videoUrl = null;

    // Try direct video_url field
    if (callbackData.data?.video_url || callbackData.data?.videoUrl) {
      videoUrl = callbackData.data.video_url || callbackData.data.videoUrl;
    }
    // Try parsing resultJson field (Seedance format)
    else if (callbackData.data?.resultJson) {
      try {
        const result = JSON.parse(callbackData.data.resultJson);
        if (result.resultUrls && result.resultUrls.length > 0) {
          videoUrl = result.resultUrls[0];
        }
      } catch (e) {
        console.error('Failed to parse resultJson:', e);
      }
    }

    const taskId = callbackData.data?.taskId || callbackData.data?.task_id;

    // Check for success
    if (callbackData.code === 200 && videoUrl) {
      console.log('✅ Video generation complete!', {
        taskId: taskId,
        videoUrl: videoUrl,
        model: callbackData.data?.model,
        costTime: callbackData.data?.costTime,
        state: callbackData.data?.state
      });

      // Store success status for polling endpoint
      setVideoStatus(taskId, {
        status: 'complete',
        videoUrl: videoUrl,
        model: callbackData.data?.model,
        costTime: callbackData.data?.costTime,
        resolution: callbackData.data?.resolution
      });

    } else if (callbackData.code !== 200 || callbackData.data?.state === 'fail' || callbackData.data?.state === 'failed') {
      // Extract failure details
      const failMsg = callbackData.data?.failMsg ||
                      callbackData.data?.fail_msg ||
                      callbackData.data?.errorMessage ||
                      callbackData.data?.error_message ||
                      callbackData.msg ||
                      'Video generation failed';

      console.error('❌ Video generation FAILED:', {
        code: callbackData.code,
        message: callbackData.msg || callbackData.message,
        taskId: taskId,
        state: callbackData.data?.state,
        failCode: callbackData.data?.failCode,
        failMsg: failMsg,
        fullData: callbackData.data
      });

      // Store failure status for polling endpoint
      setVideoStatus(taskId, {
        status: 'failed',
        error: failMsg,
        failCode: callbackData.data?.failCode,
        code: callbackData.code
      });

    } else {
      console.warn('⚠️ Callback received but no video URL:', callbackData);
    }

    return res.status(200).json({
      success: true,
      message: 'Callback received'
    });

  } catch (error) {
    console.error('Video Callback Error:', error);
    return res.status(500).json({
      error: 'Failed to process callback',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
