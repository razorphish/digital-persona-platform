#!/bin/bash

# Docker Stop Script for Digital Persona Platform

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
    echo "  dev   - Stop development environment"
    echo "  prod  - Stop production environment"
    echo "  all   - Stop both environments"
    echo ""
    echo "Options:"
    echo "  --volumes  Remove volumes (⚠️  deletes data)"
    echo "  --images   Remove images"
    echo "  --clean    Remove containers, networks, and dangling images"
    echo "  --help     Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev                      # Stop dev environment"
    echo "  $0 prod --clean             # Stop prod and cleanup"
    echo "  $0 all --volumes --images   # Stop all and remove everything"
}

# Default values
ENVIRONMENT=""
REMOVE_VOLUMES=false
REMOVE_IMAGES=false
CLEAN_UP=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        dev|prod|all)
            ENVIRONMENT="$1"
            shift
            ;;
        --volumes)
            REMOVE_VOLUMES=true
            shift
            ;;
        --images)
            REMOVE_IMAGES=true
            shift
            ;;
        --clean)
            CLEAN_UP=true
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

stop_environment() {
    local env=$1
    local compose_file=""
    
    if [[ "$env" == "dev" ]]; then
        compose_file="docker-compose.dev.yml"
        echo -e "${BLUE}🛑 Stopping Development Environment...${NC}"
    else
        compose_file="docker-compose.yml"
        echo -e "${BLUE}🛑 Stopping Production Environment...${NC}"
    fi

    # Stop and remove containers
    if [[ "$REMOVE_VOLUMES" == true ]]; then
        echo -e "${YELLOW}⚠️  Removing volumes (this will delete data!)${NC}"
        docker-compose -f "$compose_file" down -v
    else
        docker-compose -f "$compose_file" down
    fi

    # Remove images if requested
    if [[ "$REMOVE_IMAGES" == true ]]; then
        echo -e "${YELLOW}🗑️  Removing images...${NC}"
        docker-compose -f "$compose_file" down --rmi all
    fi
}

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running.${NC}"
    exit 1
fi

# Stop environments
if [[ "$ENVIRONMENT" == "all" ]]; then
    stop_environment "dev"
    stop_environment "prod"
elif [[ "$ENVIRONMENT" == "dev" ]]; then
    stop_environment "dev"
else
    stop_environment "prod"
fi

# Cleanup if requested
if [[ "$CLEAN_UP" == true ]]; then
    echo -e "${YELLOW}🧹 Cleaning up Docker system...${NC}"
    docker system prune -f
    echo -e "${GREEN}✅ Cleanup completed${NC}"
fi

echo -e "${GREEN}✅ Services stopped successfully!${NC}"

# Show remaining containers if any
RUNNING_CONTAINERS=$(docker ps -q --filter "name=dpp-")
if [[ -n "$RUNNING_CONTAINERS" ]]; then
    echo ""
    echo -e "${YELLOW}⚠️  Some DPP containers are still running:${NC}"
    docker ps --filter "name=dpp-"
fi 