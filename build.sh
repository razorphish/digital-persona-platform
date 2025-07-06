#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔨 Digital Persona Platform Build Script${NC}"

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

# Parse arguments
BUILD_TYPE="frontend"
SERVE_BUILD=0
DOCKER_BUILD=0

for arg in "$@"; do
  case $arg in
    "frontend") BUILD_TYPE="frontend" ;;
    "backend") BUILD_TYPE="backend" ;;
    "docker") BUILD_TYPE="docker" ;;
    "serve") SERVE_BUILD=1 ;;
    "all") BUILD_TYPE="all" ;;
    *) print_status "warning" "Unknown argument: $arg" ;;
  esac
done

print_status "info" "Build type: $BUILD_TYPE"

case $BUILD_TYPE in
    "frontend")
        print_status "info" "Building frontend..."
        cd frontend
        
        # Check if node_modules exists
        if [ ! -d "node_modules" ]; then
            print_status "warning" "Frontend dependencies not installed"
            print_status "info" "Installing frontend dependencies..."
            npm install || {
                print_status "error" "Failed to install frontend dependencies"
                exit 1
            }
        fi
        
        # Build with OpenSSL legacy provider
        export NODE_OPTIONS="--openssl-legacy-provider"
        npm run build || {
            print_status "error" "Frontend build failed"
            exit 1
        }
        
        print_status "success" "Frontend build completed successfully!"
        print_status "info" "Build output: frontend/build/"
        
        cd ..
        ;;
        
    "backend")
        print_status "info" "Building backend..."
        
        # Check virtual environment
        if [ ! -d "venv" ]; then
            print_status "error" "Virtual environment not found. Please run setup first."
            exit 1
        fi
        
        # Activate virtual environment
        source venv/bin/activate
        
        # Check dependencies
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
        
        print_status "success" "Backend dependencies verified!"
        print_status "info" "Backend is ready to run with: uvicorn app.main:app --reload"
        ;;
        
    "docker")
        print_status "info" "Building Docker images..."
        
        # Check if Docker is running
        if ! docker info >/dev/null 2>&1; then
            print_status "error" "Docker is not running. Please start Docker first."
            exit 1
        fi
        
        # Build backend
        print_status "info" "Building backend Docker image..."
        docker build -t dpp-backend . || {
            print_status "error" "Backend Docker build failed"
            exit 1
        }
        
        # Build frontend
        print_status "info" "Building frontend Docker image..."
        docker build -t dpp-frontend ./frontend || {
            print_status "error" "Frontend Docker build failed"
            exit 1
        }
        
        print_status "success" "Docker images built successfully!"
        print_status "info" "Backend image: dpp-backend"
        print_status "info" "Frontend image: dpp-frontend"
        ;;
        
    "all")
        print_status "info" "Building everything..."
        
        # Build frontend
        cd frontend
        export NODE_OPTIONS="--openssl-legacy-provider"
        npm run build || {
            print_status "error" "Frontend build failed"
            exit 1
        }
        cd ..
        
        # Check backend
        source venv/bin/activate
        python -c "import fastapi, uvicorn, pydantic, sqlalchemy" || {
            print_status "error" "Backend dependencies missing"
            exit 1
        }
        
        print_status "success" "All builds completed successfully!"
        ;;
esac

# Serve build if requested
if [ $SERVE_BUILD -eq 1 ] && [ "$BUILD_TYPE" = "frontend" ] || [ "$BUILD_TYPE" = "all" ]; then
    print_status "info" "Serving frontend build on http://localhost:3001..."
    cd frontend
    npx serve -s build -l 3001 &
    SERVE_PID=$!
    cd ..
    
    print_status "success" "Frontend served at http://localhost:3001"
    print_status "info" "Press Ctrl+C to stop the server"
    
    # Wait for user to stop
    trap "kill $SERVE_PID 2>/dev/null; exit 0" INT TERM
    wait
fi

print_status "success" "Build process completed!" 