#!/bin/bash
set -e

echo "Installing dependencies..."
npm ci

echo "Building shared package..."
cd packages/shared
npm run build
cd ../..

echo "Building client package..."
cd packages/client
npm run build
cd ../..

echo "Client build complete!"