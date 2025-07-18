#!/bin/bash

# Digital Persona Platform Build Script
# Backend-only build system

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo -e "${BLUE}🏗️ Digital Persona Platform - Backend Build System${NC}"
echo ""

# Default build type
BUILD_TYPE="backend"
SERVE_BUILD=0

# Parse command line arguments
for arg in "$@"; do
    case $arg in
        "backend") BUILD_TYPE="backend" ;;
        "--serve") SERVE_BUILD=1 ;;
        "--help"|"-h")
            echo "Usage: $0 [backend] [--serve]"
            echo "  backend: Build backend only (default)"
            echo "  --serve: Serve the build after completion"
            exit 0
            ;;
        *)
            print_status "warning" "Unknown argument: $arg"
            ;;
    esac
done

print_status "info" "Build type: $BUILD_TYPE"

# Function to build backend
build_backend() {
    print_status "info" "Building backend..."
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        print_status "info" "Creating virtual environment..."
        python -m venv venv || {
            print_status "error" "Failed to create virtual environment"
            return 1
        }
    fi
    
    # Activate virtual environment
    source venv/bin/activate || {
        print_status "error" "Failed to activate virtual environment"
        return 1
    }
    
    # Install dependencies
    print_status "info" "Installing backend dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt || {
        print_status "error" "Failed to install backend dependencies"
        return 1
    }
    
    # Run tests (if available)
    if [ -d "tests" ]; then
        print_status "info" "Running backend tests..."
        pytest tests/ -v || {
            print_status "warning" "Some tests failed, but continuing build"
        }
    fi
    
    print_status "success" "Backend build completed successfully!"
    return 0
}

# Function to build Docker images
build_docker() {
    print_status "info" "Building Docker images..."
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        print_status "error" "Docker is not running. Please start Docker and try again."
        return 1
    fi
    
    # Build backend Docker image
    print_status "info" "Building backend Docker image..."
    docker build -t dpp-backend . || {
        print_status "error" "Backend Docker build failed"
        return 1
    }
    
    print_status "success" "Docker images built successfully!"
    print_status "info" "Backend image: dpp-backend"
    return 0
}

# Execute builds based on type
case $BUILD_TYPE in
    "backend")
        if ! build_backend; then
            print_status "error" "Backend build failed"
            exit 1
        fi
        ;;
    *)
        print_status "error" "Unknown build type: $BUILD_TYPE"
        exit 1
        ;;
esac

# Build Docker images
if ! build_docker; then
    print_status "error" "Docker build failed"
    exit 1
fi

# Serve build if requested
if [ $SERVE_BUILD -eq 1 ]; then
    print_status "info" "Starting backend service..."
    
    source venv/bin/activate
    print_status "info" "Backend API: http://localhost:8000"
    print_status "info" "API Documentation: http://localhost:8000/docs"
    print_status "info" "Press Ctrl+C to stop"
    
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
fi

print_status "success" "🎉 Build completed successfully!"
print_status "info" "Backend API available at: http://localhost:8000"
print_status "info" "API Documentation: http://localhost:8000/docs" 