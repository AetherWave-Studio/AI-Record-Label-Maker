// Vercel Serverless Function - Check Cover Generation Status
// Polls KIE.AI API to check if cover generation is complete

import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key from environment variables
  const sunoApiKey = process.env.SUNO_API_KEY;

  if (!sunoApiKey) {
    return res.status(500).json({ error: 'SUNO API key not configured' });
  }

  // Get taskId from query parameters
  const { taskId } = req.query;

  if (!taskId) {
    return res.status(400).json({ error: 'taskId is required' });
  }

  // Proxy setup
  const proxyUrl = 'http://mfvrmgdc:3281gl8vgvlp@142.111.48.253:7030';
  const agent = new HttpsProxyAgent(proxyUrl);

  try {
    // Check cover generation status (using SUNO cover pattern)
    const statusResponse = await fetch(
      `https://api.kie.ai/api/v1/suno/cover/record-info?taskId=${taskId}`,
      {
        headers: {
          'Authorization': `Bearer ${sunoApiKey}`
        },
        agent  // Route through proxy
      }
    );

    if (!statusResponse.ok) {
      return res.status(statusResponse.status).json({
        error: 'Failed to check cover status',
        details: await statusResponse.text()
      });
    }

    const statusData = await statusResponse.json();
    const status = statusData.data?.status;
    const response = statusData.data?.response;

    console.log('Cover status check:', { taskId, status, hasResponse: !!response });

    // Check if generation is complete
    if (status && status !== 'PENDING' && status !== 'PROCESSING') {
      if (status === 'SUCCESS' || status === 'COMPLETE' || response) {
        // Cover is ready
        const imageUrl = response?.imageUrl || response?.coverUrl || response?.url;

        return res.status(200).json({
          status: 'complete',
          imageUrl: imageUrl,
          taskId: taskId
        });
      }
    }

    // Check for errors
    if (status === 'error' || status === 'failed') {
      return res.status(500).json({
        status: 'failed',
        error: 'Cover generation failed',
        details: statusData.data?.errorMessage || 'Generation failed'
      });
    }

    // Still processing
    return res.status(200).json({
      status: 'processing',
      message: 'Cover is still being generated',
      taskId: taskId
    });

  } catch (error) {
    console.error('Cover Status Check Error:', error);
    return res.status(500).json({
      error: 'Failed to check cover status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
