#!/bin/bash
set -e

echo "Installing dependencies..."
npm ci

echo "Building shared package..."
cd packages/shared
npm run build
cd ../..

echo "Building server package..."
cd packages/server
npm run build
cd ../..

echo "Build complete!"