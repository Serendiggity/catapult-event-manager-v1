# Deployment Guide

This guide explains how to deploy the Catapult Event Manager to Render.

## Prerequisites

1. GitHub repository with the code
2. Render account (https://render.com)
3. Render API key

## Setup Instructions

### 1. Create Render Services

1. Log in to your Render dashboard
2. Create two new services:
   - **Static Site** for the client (React app)
   - **Web Service** for the server (Express API)

### 2. Configure GitHub Secrets

Add the following secrets to your GitHub repository:

- `RENDER_API_KEY`: Your Render API key (found in Account Settings)
- `RENDER_CLIENT_SERVICE_ID`: The service ID of your client static site
- `RENDER_SERVER_SERVICE_ID`: The service ID of your server web service

### 3. Service Configuration

#### Client (Static Site)
- **Build Command**: `npm install && npm run build --workspace=@catapult-event-manager/shared && npm run build --workspace=@catapult-event-manager/client`
- **Publish Directory**: `packages/client/dist`
- **Environment Variables**:
  - `VITE_API_URL`: Your server URL (e.g., `https://your-server.onrender.com`)

#### Server (Web Service)
- **Build Command**: `npm install && npm run build --workspace=@catapult-event-manager/shared && npm run build --workspace=@catapult-event-manager/server`
- **Start Command**: `npm run start --workspace=@catapult-event-manager/server`
- **Environment Variables**:
  - `NODE_ENV`: `production`
  - `PORT`: `10000` (Render's default)
  - `CORS_ORIGIN`: Your client URL (e.g., `https://your-client.onrender.com`)

### 4. Automatic Deployment

The repository includes:

1. **CI Pipeline** (`.github/workflows/ci.yml`):
   - Runs on all pushes and pull requests
   - Tests and builds all packages
   - Ensures code quality

2. **CD Pipeline** (`.github/workflows/deploy.yml`):
   - Runs on pushes to main/master branch
   - Automatically triggers deployments to Render
   - Can be manually triggered via GitHub Actions

3. **Render Configuration** (`render.yaml`):
   - Blueprint for Render services
   - Can be used for one-click deployment

## Manual Deployment

To deploy manually:

1. Push code to the main branch
2. GitHub Actions will automatically trigger the deployment
3. Monitor deployment progress in Render dashboard

## Environment Variables

### Required for Server

```env
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://your-client-domain.onrender.com
# Add database and other secrets as needed
```

### Required for Client

```env
VITE_API_URL=https://your-server-domain.onrender.com
```

## Monitoring

- Check GitHub Actions for CI/CD pipeline status
- Monitor Render dashboard for deployment logs
- Server health check endpoint: `/health`

## Troubleshooting

1. **Build Failures**: Check GitHub Actions logs
2. **Deployment Failures**: Check Render service logs
3. **CORS Issues**: Verify CORS_ORIGIN environment variable
4. **API Connection**: Ensure VITE_API_URL is correctly set