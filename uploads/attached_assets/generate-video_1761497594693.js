// Vercel Serverless Function - Video Generation API
// Uses KIE.AI Seedance 1.0 API to generate videos from text/image

// Import node-fetch explicitly to use with proxy agent
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

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
  const seedanceApiKey = process.env.SEEDANCE1_API_KEY;

  if (!seedanceApiKey) {
    return res.status(500).json({ error: 'Seedance API key not configured' });
  }

  // Validate request body
  const {
    prompt,
    imageUrl, // Optional: for image-to-video (URL)
    imageData, // Optional: for image-to-video (base64 data)
    modelVersion = 'lite', // 'lite' or 'pro'
    resolution = '720p', // 720p or 1080p
    duration = '5', // 5 or 10 seconds
    cameraFixed = false,
    seed = -1,
    enableSafetyChecker = true,
    musicTaskId, // Optional: for music video generation
    audioId // Optional: Individual track ID (for reference)
  } = req.body;

  if (!prompt) {
    return res.status(400).json({
      error: 'Invalid request. Prompt is required for video generation.'
    });
  }

  // Determine final image URL
  let finalImageUrl = imageUrl;

  // If base64 image data is provided, upload to image hosting
  if (imageData && !imageUrl) {
    try {
      const imgbbApiKey = process.env.IMGBB_API_KEY;
      const imgurClientId = process.env.IMGUR_CLIENT_ID;

      // Remove data URL prefix
      const base64Image = imageData.replace(/^data:image\/\w+;base64,/, '');

      let uploadSuccess = false;

      // Try ImgBB first (if API key is configured)
      if (imgbbApiKey) {
        console.log('Uploading image to imgbb...');

        const formBody = `key=${imgbbApiKey}&image=${encodeURIComponent(base64Image)}`;

        const uploadResponse = await fetch('https://api.imgbb.com/1/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formBody
        });

        const uploadData = await uploadResponse.json();

        if (uploadResponse.ok && uploadData.success) {
          finalImageUrl = uploadData.data.url;
          console.log('✅ Uploaded image to imgbb:', finalImageUrl);
          uploadSuccess = true;
        } else {
          console.warn('ImgBB upload failed, trying Imgur...', uploadData.error);
        }
      }

      // Try Imgur as fallback (if ImgBB failed or not configured)
      if (!uploadSuccess && imgurClientId) {
        console.log('Uploading image to Imgur...');

        const uploadResponse = await fetch('https://api.imgur.com/3/image', {
          method: 'POST',
          headers: {
            'Authorization': `Client-ID ${imgurClientId}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64Image,
            type: 'base64'
          })
        });

        const uploadData = await uploadResponse.json();

        if (uploadResponse.ok && uploadData.success) {
          finalImageUrl = uploadData.data.link;
          console.log('✅ Uploaded image to Imgur:', finalImageUrl);
          uploadSuccess = true;
        } else {
          console.error('Imgur upload failed:', uploadData);
        }
      }

      // If both failed or no API keys configured
      if (!uploadSuccess) {
        return res.status(500).json({
          error: 'Image upload failed. Please configure IMGBB_API_KEY or IMGUR_CLIENT_ID in environment variables.',
          details: 'Get a free API key from https://api.imgbb.com/ or https://api.imgur.com/'
        });
      }

    } catch (uploadError) {
      console.error('Image upload error:', uploadError);
      return res.status(500).json({
        error: 'Failed to process uploaded image.',
        details: uploadError.message
      });
    }
  }

  // Proxy setup - use your Webshare details here
  const proxyUrl = 'http://mfvrmgdc:3281gl8vgvlp@142.111.48.253:7030';
  const agent = new HttpsProxyAgent(proxyUrl);

  try {
    // Determine which model to use based on version and whether an image is provided
    const modelPrefix = modelVersion === 'pro' ? 'bytedance/v1-pro' : 'bytedance/v1-lite';
    const model = finalImageUrl
      ? `${modelPrefix}-image-to-video`
      : `${modelPrefix}-text-to-video`;

    // Build request payload for Seedance API
    const requestPayload = {
      model: model,
      callBackUrl: 'https://aetherwavestudio.com/api/video-callback',
      input: {
        prompt: prompt,
        resolution: resolution,
        duration: duration,
        camera_fixed: cameraFixed,
        seed: seed,
        enable_safety_checker: enableSafetyChecker
      }
    };

    // Add image_url only for image-to-video
    if (finalImageUrl) {
      requestPayload.input.image_url = finalImageUrl;
    }

    console.log('Generating video with Seedance 1.0 API:', {
      model,
      prompt,
      imageUrl: finalImageUrl,
      resolution,
      duration,
      musicTaskId,
      audioId
    });

    // Use KIE.AI jobs/createTask endpoint for Seedance
    const generateResponse = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${seedanceApiKey}`
      },
      body: JSON.stringify(requestPayload),
      agent  // Route through proxy
    });

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error('Seedance Video Generate Error (raw):', errorText);
      console.error('Response status:', generateResponse.status);
      console.error('Response headers:', Object.fromEntries(generateResponse.headers.entries()));

      let errorDetails;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson.msg || errorJson.message || 'Unknown error';
      } catch (e) {
        errorDetails = errorText.substring(0, 200);
      }

      return res.status(generateResponse.status).json({
        error: 'Video generation request failed',
        details: errorDetails
      });
    }

    const responseText = await generateResponse.text();
    console.log('Seedance API Response (raw):', responseText);

    let generateData;
    try {
      generateData = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e.message);
      return res.status(500).json({
        error: 'Invalid API response',
        details: responseText.substring(0, 200)
      });
    }
    console.log('Seedance API Response:', JSON.stringify(generateData, null, 2));

    // Check if the API accepted the request
    // KIE.AI Seedance API returns: { code: 200, msg: "success", data: { taskId: "..." } }
    if (generateData.code !== 200) {
      return res.status(500).json({
        error: 'Video generation request failed',
        details: generateData.msg || 'Unknown error',
        code: generateData.code
      });
    }

    const taskId = generateData.data?.taskId || generateData.data?.task_id;

    if (!taskId) {
      console.error('No taskId found. Full response:', generateData);
      return res.status(500).json({
        error: 'No taskId returned from Seedance API',
        details: 'Response: ' + JSON.stringify(generateData)
      });
    }

    console.log('Video generation started with Seedance, taskId:', taskId);

    // Return immediately - video generation is async
    // KIE.AI will call our webhook when complete
    // Client should poll the status endpoint to check progress
    return res.status(202).json({
      status: 'processing',
      message: 'Video generation started with Seedance 1.0. This may take 5-10 minutes.',
      taskId: taskId,
      model: model,
      resolution: resolution,
      duration: duration,
      prompt: prompt,
      musicTaskId: musicTaskId, // Include for reference if this is a music video
      audioId: audioId
    });

  } catch (error) {
    console.error('Video Generation Error:', error);
    return res.status(500).json({
      error: 'Failed to generate video',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
