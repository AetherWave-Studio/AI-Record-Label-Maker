// Vercel Serverless Function - Cover Generation Callback
// Receives webhook from KIE.AI when cover generation completes

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
    console.log('Cover callback received:', JSON.stringify(req.body, null, 2));

    // KIE.AI sends the completed cover data in the callback
    const callbackData = req.body;

    // Store this data temporarily (in a real app, you'd use a database)
    // For now, we'll just log it and return success
    // The frontend will need to poll the status endpoint instead

    return res.status(200).json({
      success: true,
      message: 'Callback received'
    });

  } catch (error) {
    console.error('Cover Callback Error:', error);
    return res.status(500).json({
      error: 'Failed to process callback',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
