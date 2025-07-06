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

# Check if required packages are installed
print_status "info" "Checking dependencies..."
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
    print('All required packages are installed')
" || {
    print_status "error" "Missing required packages. Please run: pip install -r requirements.txt"
    exit 1
}

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

# Check if port 8000 is available
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    print_status "warning" "Port 8000 is already in use"
    print_status "info" "You can either:"
    print_status "info" "  1. Stop the service using port 8000"
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
print_status "info" "Starting FastAPI server..."
echo ""
print_status "info" "📍 API: http://localhost:8000"
print_status "info" "📚 Docs: http://localhost:8000/docs"
print_status "info" "💚 Health: http://localhost:8000/health"
print_status "info" "🧪 Test: http://localhost:8000/test"
echo ""
print_status "info" "Press Ctrl+C to stop"
echo ""

# Start the server with better error handling
trap 'print_status "info" "Shutting down server..."; exit 0' INT

if [ "$1" = "--production" ]; then
    print_status "warning" "Starting in PRODUCTION mode (no reload)"
    uvicorn app.main:app --host 127.0.0.1 --port 8000
else
    print_status "info" "Starting in DEVELOPMENT mode (with reload)"
    uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
fi
