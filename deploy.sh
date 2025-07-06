#!/bin/bash

# Digital Persona Platform Production Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

echo -e "${BLUE}🚀 Digital Persona Platform Production Deployment${NC}"
echo "=================================================="

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    print_status "error" "Docker is not installed"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    print_status "error" "Docker Compose is not installed"
    exit 1
fi

print_status "success" "Docker and Docker Compose found"

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_status "warning" ".env file not found"
    print_status "info" "Creating .env from template..."
    cp env.production.example .env
    print_status "warning" "Please update .env with your production values before continuing"
    print_status "info" "Run: nano .env"
    read -p "Press Enter after updating .env file..."
fi

# Validate environment variables
print_status "info" "Validating environment variables..."
source .env

required_vars=("SECRET_KEY" "DATABASE_URL" "REDIS_URL")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        print_status "error" "Required environment variable $var is not set"
        exit 1
    fi
done

print_status "success" "Environment variables validated"

# Create necessary directories
print_status "info" "Creating necessary directories..."
mkdir -p logs nginx/ssl uploads chroma_db monitoring/grafana/dashboards monitoring/grafana/datasources

# Set proper permissions
chmod 755 logs nginx uploads chroma_db monitoring

# Build and start services
print_status "info" "Building Docker images..."
docker-compose build

print_status "info" "Starting services..."
docker-compose up -d

# Wait for services to be ready
print_status "info" "Waiting for services to be ready..."
sleep 30

# Check service health
print_status "info" "Checking service health..."

# Check backend
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    print_status "success" "Backend is healthy"
else
    print_status "error" "Backend health check failed"
    docker-compose logs backend
    exit 1
fi

# Check frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_status "success" "Frontend is healthy"
else
    print_status "error" "Frontend health check failed"
    docker-compose logs frontend
    exit 1
fi

# Check database
if docker-compose exec -T postgres pg_isready -U dpp_user -d digital_persona > /dev/null 2>&1; then
    print_status "success" "Database is healthy"
else
    print_status "error" "Database health check failed"
    docker-compose logs postgres
    exit 1
fi

# Run database migrations
print_status "info" "Running database migrations..."
docker-compose exec -T backend alembic upgrade head

# Create admin user (optional)
read -p "Do you want to create an admin user? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "info" "Creating admin user..."
    # You can add admin user creation logic here
    print_status "info" "Admin user creation not implemented yet"
fi

# Show service status
print_status "info" "Service Status:"
docker-compose ps

# Show access URLs
echo ""
print_status "info" "🌐 Access URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo "   Health Check: http://localhost:8000/health"
echo "   Grafana: http://localhost:3001 (admin/admin)"
echo "   Prometheus: http://localhost:9090"

echo ""
print_status "success" "🎉 Deployment completed successfully!"
print_status "info" "Use 'docker-compose logs -f' to monitor logs"
print_status "info" "Use 'docker-compose down' to stop services" 