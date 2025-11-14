// Vercel Serverless Function - Chat API
// This function acts as a secure proxy between your frontend and AI APIs
// Your API keys are stored safely in Vercel environment variables

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

  // Get API keys from environment variables
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  console.log('OpenAI key exists:', !!openaiKey);
  console.log('Request body:', JSON.stringify(req.body));

  // Validate request body
  const { message, provider = 'openai', systemPrompt } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Invalid message' });
  }

  // Rate limiting check (basic protection)
  if (message.length > 4000) {
    return res.status(400).json({ error: 'Message too long' });
  }

  try {
    let response;
    let result;

    // Default system prompt for AetherWave AI
    const defaultSystemPrompt = `You are AetherWave AI, a helpful and creative assistant for AetherWave Studio.
AetherWave Studio is a platform that welcomes all intelligence - human and AI alike.
We offer:
- Curated music playlists (DarkWave Essentials, Meditation Soundscapes, Coastal Pulse, SynthWave Epic Loops)
- AI Tools Hub with cutting-edge AI tools for creators
- Featured Artists showcasing talented musicians
- Shop with exclusive music collections and media toolkits
- Virtual Artists - AI-generated artist personas and content

Be friendly, informative, and help users discover our platform. Keep responses concise and engaging.`;

    const systemMessage = systemPrompt || defaultSystemPrompt;

    if (provider === 'openai') {
      if (!openaiKey) {
        return res.status(500).json({ error: 'OpenAI API key not configured' });
      }

      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Fast and cost-effective
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: message }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('OpenAI API Error:', error);
        return res.status(response.status).json({
          error: 'OpenAI API request failed',
          details: error.error?.message || 'Unknown error',
          code: error.error?.code
        });
      }

      const data = await response.json();
      result = {
        message: data.choices[0].message.content,
        provider: 'openai',
        model: 'gpt-4o-mini'
      };

    } else if (provider === 'anthropic') {
      if (!anthropicKey) {
        return res.status(500).json({ error: 'Anthropic API key not configured' });
      }

      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-20241022', // Fast and cost-effective
          max_tokens: 500,
          system: systemMessage,
          messages: [
            { role: 'user', content: message }
          ]
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Anthropic API Error:', error);
        return res.status(response.status).json({ error: 'Anthropic API request failed' });
      }

      const data = await response.json();
      result = {
        message: data.content[0].text,
        provider: 'anthropic',
        model: 'claude-3-5-haiku-20241022'
      };

    } else {
      return res.status(400).json({ error: 'Invalid provider. Use "openai" or "anthropic"' });
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('API Handler Error:', error);
    return res.status(500).json({
      error: 'Failed to process request',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
