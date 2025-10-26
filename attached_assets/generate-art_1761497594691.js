// Vercel Serverless Function - Album Art Generation API
// Uses OpenAI DALL-E to generate album artwork from text prompts

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
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!openaiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  // Validate request body
  const { prompt, style = 'abstract' } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Invalid prompt' });
  }

  // Rate limiting check
  if (prompt.length > 1000) {
    return res.status(400).json({ error: 'Prompt too long' });
  }

  try {
    // Build enhanced prompt with style
    const styleDescriptions = {
      cyberpunk: 'cyberpunk aesthetic, neon lights, futuristic cityscape, dark background with bright neon accents',
      abstract: 'abstract art, flowing shapes, vibrant colors, artistic interpretation',
      retro: 'retro vaporwave aesthetic, 80s style, pink and purple gradients, nostalgic vibes',
      minimal: 'minimalist design, clean lines, simple composition, modern aesthetic',
      surreal: 'surrealist art, dreamlike imagery, unexpected elements, artistic creativity',
      photorealistic: 'photorealistic, highly detailed, professional photography style'
    };

    const styleHint = styleDescriptions[style] || styleDescriptions.abstract;
    const enhancedPrompt = `Album cover art: ${prompt}. Style: ${styleHint}. Square format, professional music album cover design.`;

    // Call OpenAI DALL-E API
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI DALL-E Error:', error);
      return res.status(response.status).json({
        error: 'Image generation failed',
        details: error.error?.message || 'Unknown error',
        code: error.error?.code
      });
    }

    const data = await response.json();

    return res.status(200).json({
      imageUrl: data.data[0].url,
      prompt: prompt,
      style: style,
      revisedPrompt: data.data[0].revised_prompt
    });

  } catch (error) {
    console.error('Art Generation Error:', error);
    return res.status(500).json({
      error: 'Failed to generate artwork',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
