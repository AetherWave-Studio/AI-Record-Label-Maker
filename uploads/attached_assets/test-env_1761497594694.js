// Test endpoint to check if environment variables are loaded
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const seedanceKey = process.env.SEEDANCE1_API_KEY;

  return res.status(200).json({
    hasKey: !!seedanceKey,
    keyLength: seedanceKey ? seedanceKey.length : 0,
    keyPrefix: seedanceKey ? seedanceKey.substring(0, 8) + '...' : 'NOT SET',
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('API'))
  });
}
