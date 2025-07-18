#!/bin/bash

# Docker Start Script for Digital Persona Platform
# Provides options for development and production environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_usage() {
    echo "Usage: $0 [dev|prod] [options]"
    echo ""
    echo "Environments:"
    echo "  dev   - Start development environment with hot reload"
    echo "  prod  - Start production environment"
    echo ""
    echo "Options:"
    echo "  --build    Force rebuild images"
    echo "  --pull     Pull latest base images"
    echo "  --logs     Show logs after starting"
    echo "  --help     Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev --build              # Start dev with rebuild"
    echo "  $0 prod --logs              # Start prod and show logs"
    echo "  $0 dev --pull --build       # Pull, rebuild, and start dev"
}

# Default values
ENVIRONMENT=""
BUILD_FLAG=""
PULL_FLAG=""
SHOW_LOGS=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        dev|prod)
            ENVIRONMENT="$1"
            shift
            ;;
        --build)
            BUILD_FLAG="--build"
            shift
            ;;
        --pull)
            PULL_FLAG="--pull"
            shift
            ;;
        --logs)
            SHOW_LOGS=true
            shift
            ;;
        --help)
            print_usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            print_usage
            exit 1
            ;;
    esac
done

# Check if environment is specified
if [[ -z "$ENVIRONMENT" ]]; then
    echo -e "${RED}Error: Environment not specified${NC}"
    print_usage
    exit 1
fi

# Set compose file based on environment
if [[ "$ENVIRONMENT" == "dev" ]]; then
    COMPOSE_FILE="docker-compose.dev.yml"
    echo -e "${BLUE}🚀 Starting Digital Persona Platform - Development Environment${NC}"
else
    COMPOSE_FILE="docker-compose.yml"
    echo -e "${BLUE}🚀 Starting Digital Persona Platform - Production Environment${NC}"
fi

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Pull images if requested
if [[ -n "$PULL_FLAG" ]]; then
    echo -e "${YELLOW}📥 Pulling latest base images...${NC}"
    docker-compose -f "$COMPOSE_FILE" pull
fi

# Start services
echo -e "${YELLOW}🔧 Starting services...${NC}"
docker-compose -f "$COMPOSE_FILE" up -d $BUILD_FLAG $PULL_FLAG

# Wait a moment for services to start
sleep 3

# Show status
echo -e "${GREEN}✅ Services started successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Service Status:${NC}"
docker-compose -f "$COMPOSE_FILE" ps

echo ""
echo -e "${BLUE}🌐 Application URLs:${NC}"
echo -e "  Frontend: ${GREEN}http://localhost:3100${NC}"
echo -e "  Backend:  ${GREEN}http://localhost:3101${NC}"
echo -e "  Health:   ${GREEN}http://localhost:3101/health${NC}"

if [[ "$ENVIRONMENT" == "dev" ]]; then
    echo -e "  Test:     ${GREEN}http://localhost:3100/test${NC}"
    echo ""
    echo -e "${YELLOW}💡 Development Tips:${NC}"
    echo -e "  - Code changes will auto-reload"
    echo -e "  - Check logs: ${BLUE}docker-compose -f $COMPOSE_FILE logs -f${NC}"
    echo -e "  - Stop services: ${BLUE}docker-compose -f $COMPOSE_FILE down${NC}"
fi

# Show logs if requested
if [[ "$SHOW_LOGS" == true ]]; then
    echo ""
    echo -e "${BLUE}📝 Service Logs:${NC}"
    docker-compose -f "$COMPOSE_FILE" logs -f
fi 