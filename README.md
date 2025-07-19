# Catapult Event Manager

A monorepo for the Catapult Event Manager application with React/Vite frontend, Express backend, and shared TypeScript types.

## Project Structure

```
.
├── packages/
│   ├── client/       # React/Vite frontend application
│   ├── server/       # Express backend API
│   └── shared/       # Shared TypeScript types and utilities
├── package.json      # Root package.json with workspaces
└── tsconfig.json     # Root TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)

### Installation

Install all dependencies:

```bash
npm install
```

### Development

Run all packages in development mode:

```bash
npm run dev
```

Or run individual packages:

```bash
# Frontend
cd packages/client && npm run dev

# Backend
cd packages/server && npm run dev
```

### Building

Build all packages:

```bash
npm run build
```

### Scripts

- `npm run dev` - Run all packages in development mode
- `npm run build` - Build all packages
- `npm run lint` - Lint all packages
- `npm run typecheck` - Type check all packages
- `npm run test` - Run tests in all packages

## Package Details

### Client (@catapult-event-manager/client)

- React 19 with TypeScript
- Vite for fast development and building
- Port: 5173 (default Vite port)

### Server (@catapult-event-manager/server)

- Express with TypeScript
- Port: 3001 (configurable via PORT env variable)
- API endpoints for event management

### Shared (@catapult-event-manager/shared)

- Shared TypeScript types and interfaces
- API constants and endpoints
- Utility functions

## Environment Variables

Create a `.env` file in the server package:

```
PORT=3001
# Add other environment variables as needed
```

## Deployment

This project is configured to deploy to Render with:
- Frontend as a static site
- Backend as a web service

CI/CD configuration will be added in the next phase.