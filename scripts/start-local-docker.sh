#!/bin/bash

# Start Local Docker Development Environment
# This script starts all services needed for local development

set -e

echo "🚀 Starting local Docker development environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Check if docker-compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo -e "${RED}❌ docker-compose not found. Please install docker-compose.${NC}"
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}📝 Creating .env file from template...${NC}"
    cp env.local.docker.example .env
    echo -e "${GREEN}✅ .env file created. You can customize it if needed.${NC}"
fi

# Stop any existing containers
echo -e "${YELLOW}🛑 Stopping any existing containers...${NC}"
docker-compose -f docker-compose.local.yml down

# Build and start services
echo -e "${BLUE}🔨 Building and starting services...${NC}"
docker-compose -f docker-compose.local.yml up --build -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 10

# Check service health
echo -e "${BLUE}🔍 Checking service health...${NC}"

# Check PostgreSQL
if docker-compose -f docker-compose.local.yml exec -T postgres pg_isready -U dpp_admin -d digital_persona > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
else
    echo -e "${RED}❌ PostgreSQL is not ready${NC}"
fi

# Check MinIO
if curl -f http://localhost:9000/minio/health/live > /dev/null 2>&1; then
    echo -e "${GREEN}✅ MinIO is ready${NC}"
else
    echo -e "${YELLOW}⚠️  MinIO may still be starting up${NC}"
fi

# Check Redis
if docker-compose -f docker-compose.local.yml exec -T redis redis-cli ping | grep -q PONG; then
    echo -e "${GREEN}✅ Redis is ready${NC}"
else
    echo -e "${RED}❌ Redis is not ready${NC}"
fi

echo
echo -e "${GREEN}🎉 Local development environment is running!${NC}"
echo
echo -e "${YELLOW}📋 Service URLs:${NC}"
echo "  Frontend:     http://localhost:3000"
echo "  Backend API:  http://localhost:3001"
echo "  MinIO Console: http://localhost:9001 (minioadmin / minioadmin123)"
echo "  PostgreSQL:   localhost:5432 (dpp_admin / local_dev_password)"
echo "  Redis:        localhost:6379"
echo
echo -e "${YELLOW}📋 Useful commands:${NC}"
echo "  View logs:           docker-compose -f docker-compose.local.yml logs -f"
echo "  Stop services:       docker-compose -f docker-compose.local.yml down"
echo "  Restart service:     docker-compose -f docker-compose.local.yml restart <service-name>"
echo "  Execute in container: docker-compose -f docker-compose.local.yml exec <service-name> <command>"
echo
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "  1. Run database migrations: npm run migrate"
echo "  2. Access the frontend at http://localhost:3000"
echo "  3. Check logs if needed: docker-compose -f docker-compose.local.yml logs -f"