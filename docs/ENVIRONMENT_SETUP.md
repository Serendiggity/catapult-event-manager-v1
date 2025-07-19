# Environment Variables Setup Guide

This guide will walk you through setting up environment variables for local development and production deployment.

## Local Development Setup

### Step 1: Create Local Environment Files

1. **Server Environment** (`packages/server/.env`):
   ```bash
   cd packages/server
   cp .env.example .env
   ```
   Edit `.env` and set:
   - `PORT=3001` (or your preferred port)
   - `CORS_ORIGIN=http://localhost:5173`

2. **Client Environment** (`packages/client/.env`):
   ```bash
   cd packages/client
   cp .env.example .env
   ```
   Edit `.env` and set:
   - `VITE_API_URL=http://localhost:3001`

## Production Setup (GitHub & Render)

### Step 2: Get Render API Credentials

1. **Create Render Account**: Go to [render.com](https://render.com) and sign up
2. **Get API Key**:
   - Go to Account Settings → API Keys
   - Create a new API key
   - Copy the key (you'll need it for GitHub secrets)

### Step 3: Create Render Services

You have two options:

#### Option A: Use render.yaml (Recommended)
1. Push your code to GitHub
2. In Render Dashboard, click "New" → "Blueprint"
3. Connect your GitHub repo
4. Render will automatically create services from `render.yaml`

#### Option B: Manual Creation
1. **Create Web Service** (for server):
   - Click "New" → "Web Service"
   - Connect GitHub repo
   - Name: `catapult-event-manager-server`
   - Root Directory: `.`
   - Build Command: `npm install && npm run build --workspace=@catapult-event-manager/shared && npm run build --workspace=@catapult-event-manager/server`
   - Start Command: `npm run start --workspace=@catapult-event-manager/server`

2. **Create Static Site** (for client):
   - Click "New" → "Static Site"
   - Connect GitHub repo
   - Name: `catapult-event-manager-client`
   - Root Directory: `.`
   - Build Command: `npm install && npm run build --workspace=@catapult-event-manager/shared && npm run build --workspace=@catapult-event-manager/client`
   - Publish Directory: `packages/client/dist`

### Step 4: Get Service IDs

After creating services:
1. Go to each service's settings page
2. Copy the Service ID from the URL or settings
   - URL format: `https://dashboard.render.com/web/srv-YOUR_SERVICE_ID`

### Step 5: Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to Settings → Secrets and variables → Actions
3. Add these repository secrets:

   | Secret Name | Value |
   |------------|-------|
   | `RENDER_API_KEY` | Your Render API key from Step 2 |
   | `RENDER_CLIENT_SERVICE_ID` | Static site service ID |
   | `RENDER_SERVER_SERVICE_ID` | Web service service ID |

### Step 6: Configure Render Environment Variables

#### For the Server Service:
1. Go to your server service in Render
2. Navigate to Environment
3. Add these variables:
   - `NODE_ENV` = `production`
   - `PORT` = `10000` (Render's default)
   - `CORS_ORIGIN` = `https://your-client-service.onrender.com`
   - Add any other production secrets (database, JWT, etc.)

#### For the Client Service:
1. Go to your client service in Render
2. Navigate to Environment
3. Add these variables:
   - `VITE_API_URL` = `https://your-server-service.onrender.com`

## Verification Steps

### Local Development:
```bash
# Start both services
npm run dev

# Server should be at http://localhost:3001
# Client should be at http://localhost:5173
```

### Production Deployment:
1. Push code to main/master branch
2. Check GitHub Actions → workflows → "Deploy to Render"
3. Monitor Render dashboard for deployment status
4. Test endpoints:
   - Server health: `https://your-server.onrender.com/health`
   - Client: `https://your-client.onrender.com`

## Security Best Practices

1. **Never commit** `.env` files
2. **Use different values** for development and production
3. **Rotate secrets** regularly
4. **Limit API key permissions** where possible
5. **Use GitHub Environments** for staging/production separation

## Troubleshooting

### CORS Errors
- Verify `CORS_ORIGIN` matches your client URL exactly
- Include protocol (https://)
- No trailing slash

### API Connection Issues
- Check `VITE_API_URL` is correct
- Verify server is running and healthy
- Check browser console for errors

### Build Failures
- Check GitHub Actions logs
- Verify all environment variables are set
- Ensure dependencies are correctly installed

## Next Steps

Once environment variables are configured:
1. Test local development setup
2. Create a test deployment
3. Set up monitoring and alerts
4. Configure custom domain (optional)