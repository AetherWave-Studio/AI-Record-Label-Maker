/**
 * Simple HTTPS server for Outlook add-in development
 * Requires SSL certificates (use mkcert to generate)
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const PORT = 3000;

// Serve static files from project root
app.use(express.static(__dirname));

// CORS headers for development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Check for SSL certificates
const certPath = path.join(__dirname, 'localhost.pem');
const keyPath = path.join(__dirname, 'localhost-key.pem');

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  // HTTPS server (required for Outlook add-ins)
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  };

  https.createServer(options, app).listen(PORT, () => {
    console.log('🔒 HTTPS Server running at https://localhost:' + PORT);
    console.log('📅 Protocol Calendar Extension');
    console.log('');
    console.log('Next steps:');
    console.log('1. Open Outlook on the web: https://outlook.office.com');
    console.log('2. Go to Settings > Manage Add-ins');
    console.log('3. Upload manifest.xml from this directory');
    console.log('4. Open a calendar event and look for "Protocol Calendar" button');
    console.log('');
    console.log('Press Ctrl+C to stop the server');
  });
} else {
  console.log('⚠️  SSL certificates not found!');
  console.log('');
  console.log('Outlook add-ins require HTTPS. Please generate certificates:');
  console.log('');
  console.log('Option 1 - Using mkcert (recommended):');
  console.log('  1. Install mkcert: https://github.com/FiloSottile/mkcert');
  console.log('  2. Run: mkcert -install');
  console.log('  3. Run: mkcert localhost 127.0.0.1 ::1');
  console.log('  4. Rename files to localhost.pem and localhost-key.pem');
  console.log('');
  console.log('Option 2 - Using OpenSSL:');
  console.log('  openssl req -x509 -newkey rsa:2048 -keyout localhost-key.pem -out localhost.pem -days 365 -nodes');
  console.log('');
  console.log('Starting HTTP server for now (won\'t work with Outlook)...');
  console.log('');

  // Fallback to HTTP (won't work with Outlook but useful for testing)
  http.createServer(app).listen(PORT, () => {
    console.log('⚠️  HTTP Server running at http://localhost:' + PORT);
    console.log('⚠️  This will NOT work with Outlook - HTTPS required!');
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down server...');
  process.exit(0);
});
