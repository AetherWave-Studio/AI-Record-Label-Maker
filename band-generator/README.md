# 🎸 AetherWave Band Generator

Standalone AI-powered virtual band generation service extracted from the Ghost/AetherWave platform.

## Features

- **Dual-mode generation**: Explore (4 candidates) or Refine (single polished result)
- **Audio analysis**: Automatic tempo, key, energy, and vocal gender detection
- **AI-powered creation**: OpenAI GPT-4o + Google Gemini for band identity
- **Image generation**: DALL-E + Google Imagen with SVG fallbacks
- **Trading card generation**: Beautiful SVG trading cards with stats, portrait, and styling
- **PDF profile generation**: Complete, print-ready PDF documents with all band details
- **Rich world-building**: Origin stories, member archetypes, visual identity
- **Scoring system**: Novelty, clarity, brand fit, constraint fit

## Quick Start

### 1. Install Dependencies

```bash
cd band-generator
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Run Development Server

```bash
npm run dev
```

Server runs on **http://localhost:5001**

## API Endpoints

### `POST /api/band-generation`

Generate a virtual band from an audio file.

**Request:**
- `audio` (file, required): MP3/WAV audio file
- `customPhoto` (file, optional): Custom band photo
- `mode` (string): "explore" or "refine" (default: explore)
- `artStyle` (string): "realistic", "anime", "abstract" (default: realistic)
- `cardTheme` (string): "dark", "light", "neon" (default: dark)
- `userBandName` (string, optional): Override band name
- `songName` (string, optional): Override song name
- `userGenre` (string, optional): Preferred genre
- `artistType` (string): "solo" or "ensemble" (default: ensemble)

**Response:**
```json
{
  "winner": {
    "bandName": "The Echoes",
    "songName": "Midnight Hour",
    "genre": "Alternative Rock",
    "philosophy": "Raw emotion, no boundaries",
    "bandConcept": "Formed in Seattle 2018...",
    "members": [...],
    "imageUrl": "https://...",
    "cardImageUrl": "data:image/svg+xml;base64,...",
    "band_motto": "Sound beyond boundaries",
    "tags": ["alternative", "rock", "emotional"],
    "world_building": {...}
  },
  "alternatives": [...],  // Only in explore mode
  "metadata": {
    "mode": "explore",
    "processingTime": 8.5,
    "candidatesGenerated": 4
  }
}
```

### `GET /api/band-generation/modes`

Get available generation modes and their descriptions.

### `GET /api/band-generation/scoring`

Get scoring criteria and weights.

### `POST /api/band-profile-pdf`

Generate a complete PDF profile for a band.

**Request:**
```json
{
  "bandData": { ... },  // EnhancedBandData object
  "imageUrl": "https://..."  // Optional band image
}
```

**Response:** PDF file (application/pdf)

### `GET /api/health`

Health check endpoint.

## Comparison: Ghost vs Band Generator

| Feature | Ghost (Gaming Platform) | Band Generator (Standalone) |
|---------|------------------------|----------------------------|
| Size | 500MB+ | ~50MB |
| Dependencies | 91 packages | 7 packages |
| Database | Required (PostgreSQL) | Not required |
| Features | Full gaming + generation | Generation only |
| Focus | Career progression, XP, rankings | Pure band creation |

## Integration Examples

### Node.js / Express

```typescript
import { setupBandGenerationRoutes } from '@aetherwave/band-generator';
import express from 'express';

const app = express();
setupBandGenerationRoutes(app, {
  openaiApiKey: process.env.OPENAI_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY
});
```

### Direct Usage (No Express)

```typescript
import { EnhancedBandGenerator } from '@aetherwave/band-generator';
import { ServerAudioAnalyzer } from '@aetherwave/band-generator/audio';

const generator = new EnhancedBandGenerator({
  openaiApiKey: process.env.OPENAI_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY
});

const audioBuffer = await fs.readFile('song.mp3');
const audioMetrics = ServerAudioAnalyzer.analyzeBuffer(audioBuffer, 'song.mp3');

const result = await generator.generateBand({
  audioMetrics,
  artStyle: 'realistic',
  cardTheme: 'dark',
  mode: 'explore'
});

console.log(result.winner.bandName);
```

## Environment Variables

- `BAND_GEN_PORT`: Server port (default: 5001)
- `OPENAI_API_KEY`: Required for GPT-4o and DALL-E
- `GEMINI_API_KEY`: Required for Gemini 1.5 Flash
- `GOOGLE_API_KEY`: Optional for Google Imagen

## Documentation

- **Trading Cards**: See [CARD-GENERATION.md](./CARD-GENERATION.md)
- **PDF Profiles**: See [PDF-GENERATION.md](./PDF-GENERATION.md)

## License

MIT
