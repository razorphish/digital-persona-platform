#!/bin/bash

# Stop Local Docker Development Environment

set -e

echo "🛑 Stopping local Docker development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Stop and remove containers
echo -e "${YELLOW}🛑 Stopping containers...${NC}"
docker-compose -f docker-compose.local.yml down

# Optional: Remove volumes (uncomment if you want to reset data)
# echo -e "${YELLOW}🗑️  Removing volumes...${NC}"
# docker-compose -f docker-compose.local.yml down -v

echo -e "${GREEN}✅ Local development environment stopped${NC}"
echo
echo -e "${YELLOW}📋 To remove all data (volumes), run:${NC}"
echo "  docker-compose -f docker-compose.local.yml down -v"
echo
echo -e "${YELLOW}📋 To remove all images, run:${NC}"
echo "  docker-compose -f docker-compose.local.yml down --rmi all"