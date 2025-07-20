#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies (use install instead of ci for better compatibility)
echo "Installing dependencies..."
npm install --include-workspace-root --workspaces

# Build client (which includes building shared)
echo "Building client and dependencies..."
npm run build:client

echo "Build completed successfully!"