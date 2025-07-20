# Render Deployment - Lessons Learned

## Issue Summary
Failed to deploy npm workspace monorepo to Render due to multiple build configuration issues affecting both server and client deployments.

## Root Causes
1. **TypeScript type definitions in devDependencies** - Render doesn't install devDependencies in production
2. **npm ci strictness** - Package-lock.json was out of sync
3. **Workspace complexity** - Build commands didn't properly handle monorepo structure
4. **Shell script execution** - Initial attempt with .sh scripts failed
5. **Vite crypto.hash error** - Absolute path imports failed in Render's Node environment
6. **Missing build tools** - Vite and TypeScript must be in dependencies for client builds

## Solution Steps

### 1. Server Type Dependencies Fix
```json
// Move from devDependencies to dependencies:
"dependencies": {
  "@types/node": "^24.0.15",
  "@types/express": "^5.0.3",
  "@types/cors": "^2.8.19"
}
```

### 2. Client Dependencies Fix
```json
// Client package.json - ALL build dependencies to dependencies:
"dependencies": {
  "react": "^19.1.0",
  "react-dom": "^19.1.0",
  "@types/react": "^19.1.8",
  "@types/react-dom": "^19.1.6",
  "@types/node": "^24.0.15",
  "vite": "^7.0.4",
  "@vitejs/plugin-react": "^4.6.0",
  "typescript": "~5.8.3"
}
```

### 3. Build Command Simplification
```yaml
# render.yaml for both services
buildCommand: npm install --workspaces --include-workspace-root && npm run build:server
# or for client:
buildCommand: npm install --workspaces --include-workspace-root && npm run build:client
```

### 4. Proper Build Scripts
```json
// package.json
"build:shared": "npm run build --workspace=@catapult-event-manager/shared",
"build:server": "npm run build:shared && npm run build --workspace=@catapult-event-manager/server",
"build:client": "npm run build:shared && npm run build --workspace=@catapult-event-manager/client"
```

### 5. TypeScript Configuration
```json
// Remove explicit types array, add typeRoots
{
  "compilerOptions": {
    // Remove: "types": ["node"],
    "typeRoots": ["./node_modules/@types"]
  }
}
```

### 6. Vite Asset Import Fix
```typescript
// Change absolute imports to relative
// From:
import viteLogo from '/vite.svg'
// To:
import viteLogo from './vite.svg'
```

## Key Lessons

1. **ALL build-time dependencies must be in dependencies for Render**
   - TypeScript type definitions
   - Build tools (vite, typescript)
   - Build plugins (@vitejs/plugin-react)
2. **Use npm install instead of npm ci for better compatibility**
3. **Avoid shell scripts - use npm scripts directly in render.yaml**
4. **Test with exact production commands locally**
5. **Monorepo builds need explicit dependency order**
6. **Use relative imports for assets to avoid crypto module issues**

## Final Working Configuration

### render.yaml (Complete)
```yaml
services:
  - type: web
    name: catapult-event-manager-server
    runtime: node
    buildCommand: npm install --workspaces --include-workspace-root && npm run build:server
    startCommand: node packages/server/dist/index.js
    envVars:
      - key: NODE_VERSION
        value: 20.11.1
      - key: CORS_ORIGIN
        value: https://catapult-event-manager-client.onrender.com

  - type: web
    name: catapult-event-manager-client
    runtime: static
    buildCommand: npm install --workspaces --include-workspace-root && npm run build:client
    staticPublishPath: ./packages/client/dist
    envVars:
      - key: NODE_VERSION
        value: 20.11.1
      - key: VITE_API_URL
        value: https://catapult-event-manager-server.onrender.com
```

## Debug Process
1. Started with shell scripts → Failed with execution errors
2. Simplified to direct npm commands → Failed with npm ci sync
3. Changed to npm install → Failed with TypeScript errors (server)
4. Moved server types to dependencies → Server deployed successfully
5. Client failed with same TypeScript errors
6. Moved client types and build tools to dependencies → Failed with crypto.hash error
7. Fixed asset imports to relative paths → Both services deployed successfully!

## Time to Resolution
~1.5 hours with multiple deployment attempts for both services

## Prevention Checklist
- [ ] Check if platform installs devDependencies (Render doesn't)
- [ ] Move ALL build dependencies to dependencies section
- [ ] Test exact build commands locally
- [ ] Use workspace-aware npm commands
- [ ] Avoid absolute path imports in client code
- [ ] Verify Node version compatibility