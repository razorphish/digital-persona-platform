#!/bin/bash

# Test Debug Stack Setup
# Verifies that the database, backend, and frontend can start successfully

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

echo -e "${BLUE}🧪 Testing Debug Stack Setup${NC}"
echo "================================"

# Test 1: Check if Docker is running
log_info "Checking Docker daemon..."
if docker info >/dev/null 2>&1; then
    log_success "Docker daemon is running"
else
    log_error "Docker daemon is not running. Please start Docker Desktop."
    exit 1
fi

# Test 2: Start PostgreSQL
log_info "Starting PostgreSQL database..."
docker-compose -f docker-compose.dev.yml up postgres -d >/dev/null 2>&1
sleep 3

if lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null 2>&1; then
    log_success "PostgreSQL is running on port 5432"
else
    log_error "PostgreSQL failed to start"
    exit 1
fi

# Test 3: Test Backend
log_info "Testing backend startup..."
cd apps/server
timeout 30 npm run dev >/dev/null 2>&1 &
BACKEND_PID=$!
cd ../..
sleep 8

if curl -s http://localhost:4001/health >/dev/null 2>&1; then
    log_success "Backend is responding on port 4001"
    kill $BACKEND_PID 2>/dev/null || true
else
    log_error "Backend failed to start or respond"
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# Test 4: Test Frontend
log_info "Testing frontend startup..."
cd apps/web
timeout 20 npm run dev >/dev/null 2>&1 &
FRONTEND_PID=$!
cd ../..
sleep 10

if curl -s http://localhost:4000 >/dev/null 2>&1; then
    log_success "Frontend is responding on port 4000"
    kill $FRONTEND_PID 2>/dev/null || true
else
    log_error "Frontend failed to start or respond"
    kill $FRONTEND_PID 2>/dev/null || true
    exit 1
fi

# Cleanup
log_info "Cleaning up test processes..."
pkill -f "npm run dev" 2>/dev/null || true
sleep 2

echo ""
echo -e "${GREEN}🎉 All tests passed! Debug Full Stack should work correctly.${NC}"
echo ""
echo -e "${BLUE}📝 To use:${NC}"
echo "1. Press F5 in VS Code"
echo "2. Select 'Debug Full Stack'"
echo "3. Access frontend: http://localhost:4000"
echo "4. Access backend: http://localhost:4001"
echo "" 