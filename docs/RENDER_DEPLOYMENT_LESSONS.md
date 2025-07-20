# Render Deployment - Lessons Learned

## Issue Summary
Failed to deploy npm workspace monorepo to Render due to multiple build configuration issues.

## Root Causes
1. **TypeScript type definitions in devDependencies** - Render doesn't install devDependencies in production
2. **npm ci strictness** - Package-lock.json was out of sync
3. **Workspace complexity** - Build commands didn't properly handle monorepo structure
4. **Shell script execution** - Initial attempt with .sh scripts failed

## Solution Steps

### 1. Type Dependencies Fix
```json
// Move from devDependencies to dependencies:
"dependencies": {
  "@types/node": "^24.0.15",
  "@types/express": "^5.0.3",
  "@types/cors": "^2.8.19"
}
```

### 2. Build Command Simplification
```yaml
# render.yaml
buildCommand: npm install --workspaces --include-workspace-root && npm run build:server
```

### 3. Proper Build Scripts
```json
// package.json
"build:shared": "npm run build --workspace=@catapult-event-manager/shared",
"build:server": "npm run build:shared && npm run build --workspace=@catapult-event-manager/server"
```

### 4. TypeScript Configuration
```json
// Remove explicit types array, add typeRoots
{
  "compilerOptions": {
    // Remove: "types": ["node"],
    "typeRoots": ["./node_modules/@types"]
  }
}
```

## Key Lessons

1. **Always put build-time type definitions in dependencies for production builds**
2. **Use npm install instead of npm ci for better compatibility**
3. **Avoid shell scripts - use npm scripts directly in render.yaml**
4. **Test with exact production commands locally**
5. **Monorepo builds need explicit dependency order**

## Final Working Configuration

### render.yaml
```yaml
services:
  - type: web
    name: catapult-event-manager-server
    buildCommand: npm install --workspaces --include-workspace-root && npm run build:server
    startCommand: node packages/server/dist/index.js
    envVars:
      - key: NODE_VERSION
        value: 20.11.1
```

## Debug Process
1. Started with shell scripts → Failed with execution errors
2. Simplified to direct npm commands → Failed with npm ci sync
3. Changed to npm install → Failed with TypeScript errors
4. Moved types to dependencies → Success!

## Time to Resolution
~1 hour with multiple deployment attempts

## Prevention
- Always check if platform installs devDependencies
- Test exact build commands locally
- Keep type definitions in dependencies for TypeScript projects
- Use simple, direct commands in deployment configs