import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { setupRoutes } from './routes.js';

const app = express();
const PORT = parseInt(process.env.BAND_GEN_PORT || '5001', 10);

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

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎸 Band Generator Service running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🎵 API endpoint: http://localhost:${PORT}/api/band-generation`);

  // Check for required environment variables
  const requiredVars = ['OPENAI_API_KEY'];
  const missing = requiredVars.filter(v => !process.env[v]);

  if (missing.length > 0) {
    console.warn(`⚠️  Warning: Missing environment variables: ${missing.join(', ')}`);
    console.warn(`   Some features may not work properly.`);
  } else {
    console.log('✅ All required environment variables are set');
  }
});
