#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies
echo "Installing dependencies..."
npm ci --include-workspace-root --workspaces

# Build server (which includes building shared)
echo "Building server and dependencies..."
npm run build:server

echo "Build completed successfully!"