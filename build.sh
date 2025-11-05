#!/bin/bash
# Production build script - recreates Ghost-Musician symlinks for protected configs
set -e

echo "🏗️  Building AetherWave Studio for production..."
echo ""

# Recreate Ghost-Musician directory structure (for protected vite configs)
echo "🔗 Setting up directory structure..."
mkdir -p Ghost-Musician
ln -sfn ../client Ghost-Musician/client
ln -sfn ../attached_assets Ghost-Musician/attached_assets
echo "   ✓ Ghost-Musician symlinks created"

# Build frontend with override config (clean paths, no Ghost-Musician)
echo "📦 Building frontend with Vite..."
vite build --config vite.config.override.ts

# Build backend
echo "📦 Building backend with esbuild..."
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

echo ""
echo "✅ Build complete!"
