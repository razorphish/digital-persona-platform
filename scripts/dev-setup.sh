#!/bin/bash

# Development Setup Script for Digital Persona Platform
set -e

echo "🚀 Setting up Digital Persona Platform for development..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed and running
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    print_success "Docker is available and running"
}

# Check if Docker Compose is available
check_docker_compose() {
    if docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    elif docker-compose --version &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        print_error "Docker Compose is not available. Please install Docker Compose."
        exit 1
    fi
    
    print_success "Docker Compose is available"
}

# Create environment file if it doesn't exist
setup_env() {
    if [ ! -f .env ]; then
        print_status "Creating .env file from template..."
        cp .env.example .env 2>/dev/null || {
            cat > .env << 'EOF'
# Next.js Configuration
NODE_ENV=development
NEXTAUTH_SECRET=your-secret-key-here-change-in-production

# Database
DATABASE_URL=sqlite:///app/digital_persona.db

# OpenAI API
OPENAI_API_KEY=your-openai-api-key-here

# AWS Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-west-1
S3_BUCKET_NAME=your-s3-bucket-name

# Redis
REDIS_URL=redis://redis:6379

# ML Service
ML_SERVICE_URL=http://python-ml-service:8001
EOF
        }
        print_warning "Please update the .env file with your actual API keys and configuration"
    else
        print_success ".env file already exists"
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    mkdir -p uploads
    mkdir -p chroma_db
    mkdir -p logs
    print_success "Directories created"
}

# Install Node.js dependencies
install_node_deps() {
    print_status "Installing Next.js dependencies..."
    cd nextjs-migration
    if [ -f package-lock.json ]; then
        npm ci
    else
        npm install
    fi
    cd ..
    print_success "Next.js dependencies installed"
}

# Install Python dependencies for ML service
install_python_deps() {
    print_status "Installing Python ML service dependencies..."
    cd python-ml-service
    if [ -f requirements.txt ]; then
        pip install -r requirements.txt
    fi
    cd ..
    print_success "Python dependencies installed"
}

# Build Docker images
build_docker_images() {
    print_status "Building Docker images..."
    $COMPOSE_CMD -f docker-compose.dev.yml build
    print_success "Docker images built successfully"
}

# Start services
start_services() {
    print_status "Starting development services..."
    $COMPOSE_CMD -f docker-compose.dev.yml up -d
    print_success "Services started successfully"
}

# Show service status
show_status() {
    echo ""
    print_status "Service Status:"
    $COMPOSE_CMD -f docker-compose.dev.yml ps
    
    echo ""
    print_status "Available Services:"
    echo "🌐 Next.js App: http://localhost:3001"
    echo "🤖 Python ML Service: http://localhost:8001"
    echo "📊 Redis: localhost:6379"
    echo "🔍 SQLite Web (optional): http://localhost:8080"
    
    echo ""
    print_status "Debugging Ports:"
    echo "🐛 Next.js Debug: Port 9229"
    echo "🐍 Python Debug: Port 5678"
    
    echo ""
    print_status "Useful Commands:"
    echo "📋 View logs: $COMPOSE_CMD -f docker-compose.dev.yml logs -f"
    echo "🔄 Restart services: $COMPOSE_CMD -f docker-compose.dev.yml restart"
    echo "🛑 Stop services: $COMPOSE_CMD -f docker-compose.dev.yml down"
    echo "🧹 Clean up: $COMPOSE_CMD -f docker-compose.dev.yml down -v"
}

# Main execution
main() {
    echo "🔧 Starting development setup..."
    
    check_docker
    check_docker_compose
    setup_env
    create_directories
    
    # Ask user if they want to install dependencies locally
    read -p "Install dependencies locally? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        install_node_deps
        install_python_deps
    fi
    
    build_docker_images
    start_services
    
    # Wait for services to start
    print_status "Waiting for services to start..."
    sleep 10
    
    show_status
    
    print_success "Development environment is ready! 🎉"
}

# Run main function
main "$@" 