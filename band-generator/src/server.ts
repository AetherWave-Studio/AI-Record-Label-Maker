import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from project root
dotenv.config({ path: resolve(__dirname, '../../.env') });
import express from 'express';
import cors from 'cors';
import { setupRoutes } from './routes.js';

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'band-generator',
    timestamp: Date.now()
  });
});

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'band-generator',
    timestamp: Date.now()
  });
});

// Setup API routes
setupRoutes(app);

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Error:', err);
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ error: message });
});

// Start server on multiple ports
const PORTS = [5000, 5001];

PORTS.forEach((port, index) => {
  app.listen(port, '0.0.0.0', () => {
    console.log(`🎸 Band Generator Service running on http://localhost:${port}`);

    // Only show detailed info on first port
    if (index === 0) {
      console.log(`📡 Health check: http://localhost:${port}/health`);
      console.log(`🎵 API endpoint: http://localhost:${port}/api/band-generation`);

      // Check for required environment variables
      const requiredVars = ['OPENAI_API_KEY'];
      const missing = requiredVars.filter(v => !process.env[v]);

      if (missing.length > 0) {
        console.warn(`⚠️  Warning: Missing environment variables: ${missing.join(', ')}`);
        console.warn(`   Some features may not work properly.`);
      } else {
        console.log('✅ All required environment variables are set');
      }
    }
  });
});
