#!/usr/bin/env node
/**
 * Production start script for AetherWave Studio
 * Runs the bundled server from dist/index.js
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serverPath = join(__dirname, 'dist', 'index.js');

console.log('🚀 Starting AetherWave Studio production server...');
console.log(`📂 Server path: ${serverPath}`);

const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: { ...process.env }
});

server.on('error', (err) => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Server exited with code ${code}`);
    process.exit(code || 1);
  }
});

// Handle termination signals
process.on('SIGTERM', () => {
  console.log('⏹️  Received SIGTERM, shutting down gracefully...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('⏹️  Received SIGINT, shutting down gracefully...');
  server.kill('SIGINT');
});
