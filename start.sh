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

# Check if we're in the right directory
if [ ! -f "app/main.py" ]; then
    print_status "error" "Please run this script from the digital-persona-platform directory"
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    print_status "error" "Frontend directory not found"
    exit 1
fi

# Check virtual environment
if [ ! -d "venv" ]; then
    print_status "error" "Virtual environment not found. Please run setup first."
    print_status "info" "Run: python -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Activate virtual environment
source venv/bin/activate
print_status "success" "Virtual environment activated"

# Check Python version
PYTHON_VERSION=$(python --version 2>&1)
print_status "info" "Python: $PYTHON_VERSION"

# Check Node.js version
if ! command -v node &> /dev/null; then
    print_status "error" "Node.js is not installed"
    print_status "info" "Please install Node.js 16+ to run the frontend"
    exit 1
fi

NODE_VERSION=$(node --version)
print_status "info" "Node.js: $NODE_VERSION"

# Check if required packages are installed
print_status "info" "Checking Python dependencies..."
python -c "
import sys
required_packages = ['fastapi', 'uvicorn', 'pydantic', 'sqlalchemy']
missing_packages = []

for package in required_packages:
    try:
        __import__(package)
    except ImportError:
        missing_packages.append(package)

if missing_packages:
    print(f'Missing packages: {missing_packages}')
    sys.exit(1)
else:
    print('All required Python packages are installed')
" || {
    print_status "error" "Missing required Python packages. Please run: pip install -r requirements.txt"
    exit 1
}

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

# Show package versions
python -c "
import fastapi, pydantic
print(f'⚡ FastAPI: {fastapi.__version__}')
print(f'📦 Pydantic: {pydantic.VERSION}')
"

# Check for .env file
if [ ! -f ".env" ]; then
    print_status "warning" ".env file not found"
    print_status "info" "Creating basic .env file..."
    cat > .env << EOF
# Database
DATABASE_URL=sqlite+aiosqlite:///./digital_persona.db

# JWT
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OpenAI (optional)
OPENAI_API_KEY=your-openai-api-key-here

# Redis (optional)
REDIS_URL=redis://localhost:6379

# AWS S3 (optional)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_DEFAULT_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
EOF
    print_status "success" ".env file created with default values"
    print_status "warning" "Please update .env with your actual configuration"
fi

# Check if ports are available
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_status "warning" "Port 8000 (backend) is already in use"
    print_status "info" "You can either:"
    print_status "info" "  1. Stop the service using port 8000"
    print_status "info" "  2. Use a different port by modifying this script"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_status "warning" "Port 3000 (frontend) is already in use"
    print_status "info" "You can either:"
    print_status "info" "  1. Stop the service using port 3000"
    print_status "info" "  2. Use a different port by modifying this script"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check database file
if [ ! -f "digital_persona.db" ]; then
    print_status "info" "Database file not found. It will be created on first run."
fi

echo ""
print_status "info" "Starting Digital Persona Platform..."
echo ""
print_status "info" "🔧 Backend API: http://localhost:8000"
print_status "info" "📚 API Docs: http://localhost:8000/docs"
print_status "info" "💚 Health: http://localhost:8000/health"
print_status "info" "🌐 Frontend: http://localhost:3000"
echo ""
print_status "info" "Press Ctrl+C to stop both servers"
echo ""

# Function to cleanup background processes
cleanup() {
    print_status "info" "Shutting down servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    exit 0
}

# Set up signal handlers
trap cleanup INT TERM

# Start backend server
print_status "info" "Starting backend server..."
if [ "$1" = "--production" ]; then
    print_status "warning" "Starting backend in PRODUCTION mode (no reload)"
    uvicorn app.main:app --host 127.0.0.1 --port 8000 &
else
    print_status "info" "Starting backend in DEVELOPMENT mode (with reload)"
    uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 &
fi
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend server
print_status "info" "Starting frontend server..."
cd frontend
# Fix for Node.js 17+ OpenSSL issue (apply for all versions to be safe)
print_status "info" "Applying OpenSSL legacy provider fix"
export NODE_OPTIONS="--openssl-legacy-provider"
npm start &
FRONTEND_PID=$!
cd ..

# Wait for both processes
wait
