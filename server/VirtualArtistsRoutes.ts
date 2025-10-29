import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();

const API_KEY = process.env.PUBLISH_API_KEY || process.env.REPLIT_API_KEY;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getContentJsonPath() {
  const isProd =
    process.env.NODE_ENV === 'production' ||
    process.env.VITE_ENV === 'production' ||
    process.env.REPLIT_ENV === 'production';
  const base = isProd
    ? path.resolve(__dirname, '..', 'dist')   // vite build output
    : path.resolve(__dirname, '..');          // project root in dev
  return path.join(base, 'virtual-artists', 'data', 'content.json');
}

router.get('/api/virtual-artists/health', (_req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV || 'development' });
});

router.post('/api/virtual-artists/content', async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({ error: 'Server misconfigured: missing PUBLISH_API_KEY' });
    }
    const provided = req.header('x-api-key');
    if (!provided || provided !== API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { artists, gallery, merch, meta } = req.body || {};
    if (!Array.isArray(artists)) {
      return res.status(400).json({ error: '`artists` must be an array' });
    }
    const invalidArtist = artists.some(
      a => typeof a !== 'object' || !a || typeof a.slug !== 'string' || !a.slug.trim()
    );
    if (invalidArtist) {
      return res.status(400).json({ error: 'Each artist must include a non-empty string `slug`' });
    }

    const payload = {
      company: 'AetherWave Studio',
      tagline: 'AI Music • Human Soul • Immersive Sound',
      updatedAt: new Date().toISOString(),
      artists,
      gallery: Array.isArray(gallery) ? gallery : [],
      merch: Array.isArray(merch) ? merch : [],
      meta: meta ?? { source: 'admin-panel' },
    };

    const contentPath = getContentJsonPath();
    await fs.mkdir(path.dirname(contentPath), { recursive: true });
    await fs.writeFile(contentPath, JSON.stringify(payload, null, 2), 'utf-8');

    return res.json({ ok: true, path: contentPath });
  } catch (err: any) {
    console.error('Publish error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err?.message });
  }
});

export default router;