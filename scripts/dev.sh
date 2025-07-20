#!/bin/bash

# Development startup script - ensures consistent ports
echo "🚀 Starting Catapult Event Manager Development Environment"

# Kill any existing processes on our ports
echo "📋 Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

# Start backend server
echo "🔧 Starting backend server on port 3001..."
cd packages/server
npm run dev &
BACKEND_PID=$!
cd ../..

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
for i in {1..30}; do
  if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend is ready!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ Backend failed to start"
    kill $BACKEND_PID 2>/dev/null
    exit 1
  fi
  sleep 1
done

# Start frontend with specific port
echo "🎨 Starting frontend on port 5173..."
cd packages/client
VITE_PORT=5173 npm run dev -- --port 5173 --strictPort &
FRONTEND_PID=$!
cd ../..

# Function to cleanup on exit
cleanup() {
  echo "🛑 Shutting down development servers..."
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  exit 0
}

# Trap exit signals
trap cleanup EXIT INT TERM

# Show status
echo "
✨ Development environment is running!
   Backend:  http://localhost:3001
   Frontend: http://localhost:5173
   
   Press Ctrl+C to stop all servers
"

# Keep script running
wait