#!/bin/bash

# Digital Persona Platform - Zen Mode Launcher
# This script launches the application in fullscreen mode without browser UI

echo "🚀 Launching Digital Persona Platform in Zen Mode..."

# Kill any existing React development server
echo "🔄 Stopping any existing development servers..."
pkill -f "react-scripts start" 2>/dev/null || true

# Start the React development server in the background
echo "⚡ Starting React development server..."
BROWSER=none npm start &
REACT_PID=$!

# Wait for the server to be ready
echo "⏳ Waiting for server to be ready..."
sleep 5

# Check if the server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Failed to start development server"
    exit 1
fi

echo "✅ Development server is running on http://localhost:3000"

# Launch Chrome in Zen mode
echo "🌐 Launching Chrome in Zen mode..."

# Detect the operating system
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "🍎 Detected macOS"
    
    # Check if Chrome is installed
    if [ -d "/Applications/Google Chrome.app" ]; then
        echo "🔍 Launching Chrome in app mode (Zen mode)..."
        open -a "Google Chrome" --args --start-maximized --app=http://localhost:3000
    elif [ -d "/Applications/Chromium.app" ]; then
        echo "🔍 Launching Chromium in app mode (Zen mode)..."
        open -a "Chromium" --args --start-maximized --app=http://localhost:3000
    else
        echo "⚠️  Chrome not found, launching in default browser..."
        open http://localhost:3000
    fi
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "🐧 Detected Linux"
    
    # Try different Chrome installations
    if command -v google-chrome &> /dev/null; then
        echo "🔍 Launching Chrome in app mode (Zen mode)..."
        google-chrome --start-maximized --app=http://localhost:3000 &
    elif command -v chromium-browser &> /dev/null; then
        echo "🔍 Launching Chromium in app mode (Zen mode)..."
        chromium-browser --start-maximized --app=http://localhost:3000 &
    elif command -v firefox &> /dev/null; then
        echo "🦊 Launching Firefox in fullscreen mode..."
        firefox --kiosk http://localhost:3000 &
    else
        echo "⚠️  No supported browser found, opening in default browser..."
        xdg-open http://localhost:3000 &
    fi
else
    # Windows or other
    echo "🪟 Detected Windows or other OS"
    echo "🌐 Opening in default browser..."
    if command -v start &> /dev/null; then
        start http://localhost:3000
    else
        echo "⚠️  Please manually open http://localhost:3000 in your browser"
    fi
fi

echo ""
echo "🎉 Digital Persona Platform is now running in Zen mode!"
echo "📍 URL: http://localhost:3000"
echo "🔄 To stop the server, press Ctrl+C"
echo ""

# Wait for the React process
wait $REACT_PID 