#!/bin/bash

# Digital Persona Platform - Full Zen Mode Launcher
# This script launches both backend and frontend in Zen mode

echo "🚀 Digital Persona Platform - Full Zen Mode Launcher"
echo "=================================================="

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down Digital Persona Platform..."
    pkill -f "uvicorn main:app" 2>/dev/null || true
    pkill -f "react-scripts start" 2>/dev/null || true
    echo "✅ Cleanup complete"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if we're in the right directory
if [ ! -f "app/main.py" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Kill any existing processes
echo "🔄 Stopping any existing servers..."
pkill -f "uvicorn main:app" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true

# Start backend server
echo "⚡ Starting backend server..."
cd app
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Wait for backend to be ready
echo "⏳ Waiting for backend server..."
sleep 3

# Check if backend is running
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "❌ Backend server failed to start"
    exit 1
fi

echo "✅ Backend server is running on http://localhost:8000"

# Start frontend in Zen mode
echo "🌐 Starting frontend in Zen mode..."
cd frontend
./start-zen.sh &
FRONTEND_PID=$!
cd ..

echo ""
echo "🎉 Digital Persona Platform is now running in full Zen mode!"
echo "📍 Backend: http://localhost:8000"
echo "📍 Frontend: http://localhost:3000"
echo "🔄 To stop all servers, press Ctrl+C"
echo ""

# Wait for processes
wait $BACKEND_PID $FRONTEND_PID 