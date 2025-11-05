#!/bin/bash
# Production build script with clean vite.config paths
set -e

echo "🏗️  Building AetherWave Studio for production..."
echo ""

# Build frontend with override config (no Ghost-Musician paths)
echo "📦 Building frontend with Vite..."
vite build --config vite.config.override.ts

# Build backend
echo "📦 Building backend with esbuild..."
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo ""
echo "✅ Build complete!"
