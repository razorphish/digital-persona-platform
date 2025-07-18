#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🧘 Zen Mode: Full Digital Persona Platform (Backend Only)${NC}"
echo -e "${BLUE}📋 This script will start all backend services in a clean environment${NC}"
echo ""

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success") echo -e "${GREEN}✅ $message${NC}" ;;
        "error") echo -e "${RED}❌ $message${NC}" ;;
        "warning") echo -e "${YELLOW}⚠️  $message${NC}" ;;
        "info") echo -e "${BLUE}ℹ️  $message${NC}" ;;
        "zen") echo -e "${PURPLE}🧘 $message${NC}" ;;
    esac
}

# Check if we're in the right directory
if [ ! -f "requirements.txt" ] || [ ! -f "app/main.py" ]; then
    print_status "error" "Please run this script from the digital-persona-platform directory"
    exit 1
fi

print_status "zen" "Entering zen mode - backend services only"
print_status "info" "No frontend is configured - clean backend environment"

# Check Python environment
if [ ! -d "venv" ]; then
    print_status "info" "Creating fresh virtual environment..."
    python -m venv venv || {
        print_status "error" "Failed to create virtual environment"
        exit 1
    }
fi

# Activate virtual environment
print_status "info" "Activating virtual environment..."
source venv/bin/activate || {
    print_status "error" "Failed to activate virtual environment"
    exit 1
}

# Install dependencies
print_status "info" "Installing Python dependencies..."
pip install --upgrade pip -q
pip install -r requirements.txt -q || {
    print_status "error" "Failed to install Python dependencies"
    exit 1
}

print_status "success" "Environment ready"

# Set up signal handlers
cleanup() {
    print_status "zen" "Exiting zen mode..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$ML_PID" ]; then
        kill $ML_PID 2>/dev/null
    fi
    exit 0
}

trap cleanup INT

# Start services
echo ""
print_status "zen" "Starting backend services in zen mode..."

# Start Python ML Service if available
if [ -d "python-ml-service" ]; then
    print_status "info" "Starting Python ML Service..."
    cd python-ml-service
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt -q
    fi
    if [ -f "main.py" ]; then
        python main.py &
        ML_PID=$!
        print_status "success" "Python ML Service started"
    fi
    cd ..
fi

# Start FastAPI backend
print_status "info" "Starting FastAPI backend..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

echo ""
print_status "zen" "🧘 Zen mode active - backend services running"
print_status "info" "🔧 Backend API: http://localhost:8000"
print_status "info" "📚 API Documentation: http://localhost:8000/docs"
print_status "info" "❌ Frontend: Not configured"
echo ""
print_status "zen" "Press Ctrl+C to exit zen mode"
echo ""

# Wait for services
wait 