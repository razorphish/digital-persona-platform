#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Digital Persona Platform...${NC}"

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

# Function to check if a port is in use
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_status "warning" "$service port $port is already in use"
        return 1
    fi
    return 0
}

# Check if we're in the right directory
if [ ! -f "requirements.txt" ] || [ ! -f "docker-compose.yml" ]; then
    print_status "error" "Please run this script from the digital-persona-platform directory"
    exit 1
fi

# Check environment variables
if [ ! -f ".env" ]; then
    print_status "warning" "No .env file found. Using environment defaults."
    print_status "info" "Create a .env file for custom configuration"
fi

print_status "info" "Environment: Backend-only mode (no frontend configured)"

# Check Python environment
if [ ! -d "venv" ]; then
    print_status "warning" "Python virtual environment not found"
    print_status "info" "Creating virtual environment..."
    python -m venv venv || {
        print_status "error" "Failed to create virtual environment"
        exit 1
    }
    print_status "success" "Virtual environment created"
fi

# Activate virtual environment and install dependencies
print_status "info" "Activating virtual environment..."
source venv/bin/activate || {
    print_status "error" "Failed to activate virtual environment"
    exit 1
}

print_status "info" "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt || {
    print_status "error" "Failed to install Python dependencies"
    exit 1
}

print_status "success" "Python environment ready"

# Check ports
print_status "info" "Checking port availability..."
check_port 8000 "Backend API"
BACKEND_PORT_OK=$?

if [ $BACKEND_PORT_OK -ne 0 ]; then
    print_status "info" "Some ports are in use. Services may conflict."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
print_status "success" "All checks passed!"
echo ""

# Print service information
print_status "info" "Service Information:"
print_status "info" "🔧 Backend API: http://localhost:8000"
print_status "info" "📚 API Documentation: http://localhost:8000/docs"
print_status "info" "❌ Frontend: Not configured"
echo ""

# Set up signal handlers
cleanup() {
    print_status "info" "Shutting down services..."
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
print_status "info" "Starting backend services..."

# Start Python ML Service if available
if [ -d "python-ml-service" ]; then
    print_status "info" "Starting Python ML Service..."
    cd python-ml-service
    if [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
    fi
    if [ -f "main.py" ]; then
        python main.py &
        ML_PID=$!
        print_status "success" "Python ML Service started (PID: $ML_PID)"
    fi
    cd ..
fi

# Start FastAPI backend
print_status "info" "Starting FastAPI backend..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
print_status "success" "FastAPI backend started (PID: $BACKEND_PID)"

echo ""
print_status "success" "🎉 Digital Persona Platform backend is running!"
print_status "info" "Press Ctrl+C to stop all services"
echo ""

# Wait for services
wait
