// Vercel Serverless Function - Music Generation API
// Uses KIE.AI SUNO API to generate music from text prompts

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
  const sunoApiKey = process.env.SUNO_API_KEY;

  if (!sunoApiKey) {
    return res.status(500).json({ error: 'SUNO API key not configured' });
  }

  // Validate request body
  const {
    prompt,
    title,
    style,
    model = 'V5',
    instrumental = false,
    customMode = false
  } = req.body;

  if (!prompt && (!customMode || !title || !style)) {
    return res.status(400).json({
      error: 'Invalid request. Simple mode requires prompt. Custom mode requires title and style.'
    });
  }

  // Rate limiting check
  if (prompt && prompt.length > 3000) {
    return res.status(400).json({ error: 'Prompt/Lyrics too long (max 3000 characters)' });
  }

  // Proxy setup - use your Webshare details here
  const proxyUrl = 'http://mfvrmgdc:3281gl8vgvlp@142.111.48.253:7030';  // From Webshare
  const agent = new HttpsProxyAgent(proxyUrl);

  try {
    let requestPayload = {
      model: model,
      instrumental: instrumental,
      customMode: customMode,
      callBackUrl: 'https://aetherwavestudio.com/api/suno-callback'  // Required by KIE.AI API
    };

    if (customMode) {
      // Custom Mode: title, style, and optional lyrics/prompt
      requestPayload.title = title;
      requestPayload.style = style;
      if (prompt) {
        requestPayload.prompt = prompt; // Lyrics
      }
      console.log('Generating music with SUNO API (Custom Mode):', {
        title,
        style,
        hasLyrics: !!prompt,
        model,
        instrumental
      });
    } else {
      // Simple Mode: just prompt
      requestPayload.prompt = prompt;
      console.log('Generating music with SUNO API (Simple Mode):', {
        prompt,
        model,
        instrumental
      });
    }

    const generateResponse = await fetch('https://api.kie.ai/api/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sunoApiKey}`
      },
      body: JSON.stringify(requestPayload),
      agent  // Route through proxy
    });

    if (!generateResponse.ok) {
      const errorText = await generateResponse.text();
      console.error('SUNO Generate Error (raw):', errorText);
      console.error('Response status:', generateResponse.status);
      console.error('Response headers:', Object.fromEntries(generateResponse.headers.entries()));

      let errorDetails;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetails = errorJson.msg || errorJson.message || 'Unknown error';
      } catch (e) {
        errorDetails = errorText.substring(0, 200); // First 200 chars if not JSON
      }

      return res.status(generateResponse.status).json({
        error: 'Music generation request failed',
        details: errorDetails
      });
    }

    const responseText = await generateResponse.text();
    console.log('SUNO API Response (raw):', responseText);

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
    console.log('SUNO API Response:', JSON.stringify(generateData, null, 2));

    const taskId = generateData.data?.taskId;

    if (!taskId) {
      console.error('No taskId found. Full response:', generateData);
      return res.status(500).json({
        error: 'No taskId returned from SUNO API',
        details: 'Response: ' + JSON.stringify(generateData)
      });
    }

    console.log('Music generation started, taskId:', taskId);

    // Step 2: Poll for completion (with timeout)
    const maxAttempts = 30; // 30 attempts
    const pollInterval = 2000; // 2 seconds
    let attempts = 0;
    let musicData = null;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      attempts++;

      const statusResponse = await fetch(
        `https://api.kie.ai/api/v1/generate/record-info?taskId=${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${sunoApiKey}`
          },
          agent  // Route through proxy
        }
      );

      if (!statusResponse.ok) {
        console.error('Status check failed');
        continue;
      }

      const statusData = await statusResponse.json();
      const status = statusData.data?.status;
      const response = statusData.data?.response;

      console.log(`Attempt ${attempts}: Status = ${status}, has response = ${!!response}`);

      // Check if generation is complete
      // Wait for status to be SUCCESS/COMPLETE and response to be populated
      if (status && status !== 'PENDING' && status !== 'PROCESSING') {
        if (status === 'SUCCESS' || status === 'COMPLETE' || response) {
          musicData = statusData.data;
          console.log('Music generation complete! Data:', JSON.stringify(musicData, null, 2));
          break;
        }
      }

      // Check for errors
      if (statusData.data?.status === 'error' || statusData.data?.status === 'failed') {
        return res.status(500).json({
          error: 'Music generation failed',
          details: statusData.data?.errorMessage || 'Generation failed'
        });
      }
    }

    // Check if we got the music data
    if (!musicData || !musicData.response || !musicData.response.sunoData) {
      return res.status(408).json({
        error: 'Music generation timeout',
        message: 'Generation is taking longer than expected. Please try again.',
        taskId: taskId
      });
    }

    // Extract music tracks (KIE.AI returns multiple variations)
    const tracks = musicData.response.sunoData;

    // Return successful response with all tracks
    return res.status(200).json({
      tracks: tracks.map(track => ({
        id: track.id,
        audioUrl: track.audioUrl || track.streamAudioUrl,
        streamAudioUrl: track.streamAudioUrl,
        imageUrl: track.imageUrl,
        title: track.title,
        prompt: track.prompt,
        tags: track.tags,
        duration: track.duration,
        modelName: track.modelName
      })),
      taskId: taskId,
      originalPrompt: prompt,
      style: style
    });

  } catch (error) {
    console.error('Music Generation Error:', error);
    return res.status(500).json({
      error: 'Failed to generate music',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
