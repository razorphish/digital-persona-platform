#!/bin/bash

# Run database migrations for local Docker environment

set -e

echo "🗄️ Running database migrations for local Docker environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PostgreSQL container is running
if ! docker-compose -f docker-compose.local.yml ps postgres | grep -q "Up"; then
    echo -e "${RED}❌ PostgreSQL container is not running. Please start it first with:${NC}"
    echo "  ./scripts/start-local-docker.sh"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL container is running${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Please run this script from the project root directory${NC}"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Run migrations using the Docker PostgreSQL database
echo -e "${YELLOW}🗄️ Running database migrations...${NC}"

# Set up environment for migration
export DATABASE_URL="postgresql://dpp_admin:local_dev_password@localhost:5432/digital_persona"

# Navigate to server directory and run migrations
cd apps/server

echo "Running Drizzle migrations..."
npm run migrate

cd ../..

echo -e "${GREEN}✅ Database migrations completed successfully!${NC}"
echo
echo -e "${YELLOW}📋 Your local database is now ready with the latest schema${NC}"