#!/bin/bash

# Digital Persona Platform Deployment Script
# Backend-only deployment system

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

echo -e "${BLUE}🚀 Digital Persona Platform - Backend Deployment${NC}"
echo ""

# Default deployment environment
ENVIRONMENT="dev"
DOCKER_COMPOSE_FILE="docker-compose.yml"

# Parse command line arguments
for arg in "$@"; do
    case $arg in
        "dev") 
            ENVIRONMENT="dev"
            DOCKER_COMPOSE_FILE="docker-compose.dev.yml"
            ;;
        "prod"|"production") 
            ENVIRONMENT="production"
            DOCKER_COMPOSE_FILE="docker-compose.yml"
            ;;
        "simple") 
            ENVIRONMENT="simple"
            DOCKER_COMPOSE_FILE="docker-compose.yml"
            ;;
        "--help"|"-h")
            echo "Usage: $0 [dev|prod|simple]"
            echo "  dev: Deploy development environment (default)"
            echo "  prod: Deploy production environment"
            echo "  simple: Deploy simple backend-only environment"
            exit 0
            ;;
        *)
            print_status "warning" "Unknown argument: $arg"
            ;;
    esac
done

print_status "info" "Deployment environment: $ENVIRONMENT"
print_status "info" "Using Docker Compose file: $DOCKER_COMPOSE_FILE"

# Function to check prerequisites
check_prerequisites() {
    print_status "info" "Checking deployment prerequisites..."
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        print_status "error" "Docker is not running. Please start Docker first."
        return 1
    fi
    
    # Check if Docker Compose file exists
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        print_status "error" "Docker Compose file '$DOCKER_COMPOSE_FILE' not found"
        return 1
    fi
    
    # Check if required files exist
    if [ ! -f "requirements.txt" ]; then
        print_status "error" "requirements.txt not found"
        return 1
    fi
    
    if [ ! -f "Dockerfile" ]; then
        print_status "error" "Dockerfile not found"
        return 1
    fi
    
    print_status "success" "Prerequisites check passed"
    return 0
}

# Function to build images
build_images() {
    print_status "info" "Building Docker images..."
    
    # Build backend image
    docker build -t dpp-backend . || {
        print_status "error" "Failed to build backend image"
        return 1
    }
    
    print_status "success" "Docker images built successfully"
    return 0
}

# Function to deploy services
deploy_services() {
    print_status "info" "Deploying backend services..."
    
    # Stop any existing services
    docker-compose -f "$DOCKER_COMPOSE_FILE" down || {
        print_status "warning" "Failed to stop existing services (may not exist)"
    }
    
    # Start services
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d || {
        print_status "error" "Failed to start services"
        return 1
    }
    
    print_status "success" "Services deployed successfully"
    return 0
}

# Function to check service health
check_health() {
    print_status "info" "Checking service health..."
    
    # Wait for services to start
    sleep 10
    
    # Check backend health
    if curl -f http://localhost:8000/health >/dev/null 2>&1; then
        print_status "success" "Backend is healthy"
    else
        print_status "error" "Backend health check failed"
        docker-compose -f "$DOCKER_COMPOSE_FILE" logs backend
        return 1
    fi
    
    return 0
}

# Function to show service status
show_status() {
    print_status "info" "Service Status:"
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps
    
    echo ""
    print_status "info" "Service URLs:"
    print_status "info" "🔧 Backend API: http://localhost:8000"
    print_status "info" "📚 API Documentation: http://localhost:8000/docs"
    print_status "info" "💚 Health Check: http://localhost:8000/health"
}

# Main deployment flow
main() {
    # Check prerequisites
    if ! check_prerequisites; then
        exit 1
    fi
    
    # Build images
    if ! build_images; then
        exit 1
    fi
    
    # Deploy services
    if ! deploy_services; then
        exit 1
    fi
    
    # Check health
    if ! check_health; then
        exit 1
    fi
    
    # Show status
    show_status
    
    print_status "success" "🎉 Deployment completed successfully!"
    print_status "info" "To view logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f"
    print_status "info" "To stop services: docker-compose -f $DOCKER_COMPOSE_FILE down"
}

# Run main deployment
main 