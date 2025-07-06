#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌐 Starting Digital Persona Platform Frontend...${NC}"

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success") echo -e "${GREEN}✅ $message${NC}" ;;
        "error") echo -e "${RED}❌ $message${NC}" ;;
        "warning") echo -e "${YELLOW}⚠️  $message${NC}" ;;
        "info") echo -e "${BLUE}ℹ️  $message${NC}" ;;
    esac
}

# Check if we're in the right directory
if [ ! -d "frontend" ]; then
    print_status "error" "Please run this script from the digital-persona-platform directory"
    exit 1
fi

# Check Node.js version
if ! command -v node &> /dev/null; then
    print_status "error" "Node.js is not installed"
    print_status "info" "Please install Node.js 16+ to run the frontend"
    exit 1
fi

NODE_VERSION=$(node --version)
print_status "info" "Node.js: $NODE_VERSION"

# Check frontend dependencies
print_status "info" "Checking frontend dependencies..."
if [ ! -d "frontend/node_modules" ]; then
    print_status "warning" "Frontend dependencies not installed"
    print_status "info" "Installing frontend dependencies..."
    cd frontend
    npm install || {
        print_status "error" "Failed to install frontend dependencies"
        exit 1
    }
    cd ..
    print_status "success" "Frontend dependencies installed"
else
    print_status "success" "Frontend dependencies found"
fi

# Check if port 3000 is available
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_status "warning" "Port 3000 is already in use"
    print_status "info" "You can either:"
    print_status "info" "  1. Stop the service using port 3000"
    print_status "info" "  2. Use a different port by modifying this script"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
print_status "info" "Starting React development server..."
echo ""
print_status "info" "🌐 Frontend: http://localhost:3000"
print_status "info" "🔧 Backend API: http://localhost:8000 (if running)"
echo ""
print_status "info" "Press Ctrl+C to stop"
echo ""

# Set up signal handlers
trap 'print_status "info" "Shutting down frontend server..."; exit 0' INT

# Start the frontend server
cd frontend
npm start 