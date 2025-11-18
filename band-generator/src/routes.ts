import type { Express, Request, Response } from 'express';
import multer from 'multer';
import { BandGenerator } from './bandGenerator.js';
import { AudioAnalyzer } from './audioAnalyzer.js';
import { CardGenerator } from './cardGenerator.js';
import type { GenerationOptions } from './types.js';

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/flac', 'audio/ogg'];
    if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

/**
 * Setup API routes
 */
export function setupRoutes(app: Express) {
  const generator = new BandGenerator();

  /**
   * POST /api/band-generation
   * Generate a virtual band from audio file
   */
  app.post('/api/band-generation', upload.single('audio'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Audio file is required' });
      }

      console.log(`📁 Received audio file: ${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)} MB)`);

      // Parse options
      const options: GenerationOptions = {
        mode: (req.body.mode || 'explore') as 'explore' | 'refine',
        artStyle: (req.body.artStyle || 'realistic') as any,
        cardTheme: (req.body.cardTheme || 'dark') as any,
        userBandName: req.body.userBandName,
        songName: req.body.songName || req.file.originalname.replace(/\.[^/.]+$/, ''),
        userGenre: req.body.userGenre,
        artistType: (req.body.artistType || 'ensemble') as any
      };

      console.log('🎛️  Options:', options);

      // Analyze audio
      console.log('🔊 Analyzing audio...');
      const audioMetrics = AudioAnalyzer.analyzeBuffer(req.file.buffer, req.file.originalname);
      console.log('📊 Audio metrics:', audioMetrics);

      // Generate band
      console.log('🎨 Generating band profile...');
      const result = await generator.generateBand(audioMetrics, options);

      // Generate trading card
      console.log('🎴 Generating trading card...');
      const cardSvg = CardGenerator.generateCard(result.winner, options.cardTheme);
      result.winner.cardImageUrl = CardGenerator.toDataUrl(cardSvg);

      console.log(`✅ Generation complete: ${result.winner.bandName}`);

      res.json(result);
    } catch (error: any) {
      console.error('❌ Band generation error:', error);
      res.status(500).json({
        error: 'Band generation failed',
        message: error.message
      });
    }
  });

  /**
   * GET /api/band-generation/modes
   * Get available generation modes
   */
  app.get('/api/band-generation/modes', (_req: Request, res: Response) => {
    res.json({
      modes: [
        {
          id: 'explore',
          name: 'Explore',
          description: 'Generate 4 candidates and automatically select the best one',
          recommended: true
        },
        {
          id: 'refine',
          name: 'Refine',
          description: 'Generate a single polished result',
          recommended: false
        }
      ]
    });
  });

  /**
   * GET /api/band-generation/options
   * Get available generation options
   */
  app.get('/api/band-generation/options', (_req: Request, res: Response) => {
    res.json({
      artStyles: ['realistic', 'anime', 'abstract'],
      cardThemes: ['dark', 'light', 'vibrant'],
      artistTypes: ['solo', 'ensemble']
    });
  });

  /**
   * POST /api/band-profile-pdf
   * Generate PDF profile (placeholder - requires pdfkit implementation)
   */
  app.post('/api/band-profile-pdf', async (req: Request, res: Response) => {
    try {
      const { bandData } = req.body;

      if (!bandData) {
        return res.status(400).json({ error: 'Band data is required' });
      }

      // TODO: Implement PDF generation with pdfkit
      res.status(501).json({
        error: 'PDF generation not yet implemented',
        message: 'This feature will be available in a future update'
      });
    } catch (error: any) {
      console.error('PDF generation error:', error);
      res.status(500).json({
        error: 'PDF generation failed',
        message: error.message
      });
    }
  });
}
