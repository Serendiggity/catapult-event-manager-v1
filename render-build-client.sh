#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies
echo "Installing dependencies..."
npm ci --include-workspace-root --workspaces

# Build client (which includes building shared)
echo "Building client and dependencies..."
npm run build:client

echo "Build completed successfully!"