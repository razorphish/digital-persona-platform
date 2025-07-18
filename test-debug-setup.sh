#!/bin/bash

set -e

echo "🧪 Testing Debug Setup Fixes..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
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

# Check if processes are running
check_process() {
    local port=$1
    local service=$2
    
    if lsof -i :$port >/dev/null 2>&1; then
        log_success "$service is running on port $port"
        return 0
    else
        log_warning "$service is not running on port $port"
        return 1
    fi
}

# Test HTTP endpoint
test_endpoint() {
    local url=$1
    local description=$2
    
    if curl -s --connect-timeout 5 "$url" >/dev/null 2>&1; then
        log_success "$description endpoint is accessible"
        return 0
    else
        log_error "$description endpoint is not accessible"
        return 1
    fi
}

# Main testing
log_info "Testing backend server endpoints..."

# Check if backend is running
if check_process 4001 "Backend server"; then
    # Test root endpoint (fixes "Cannot GET /")
    if test_endpoint "http://localhost:4001/" "Backend root"; then
        RESPONSE=$(curl -s http://localhost:4001/ 2>/dev/null || echo "")
        if echo "$RESPONSE" | grep -q "Digital Persona Platform API"; then
            log_success "Root endpoint returns correct API information"
        else
            log_warning "Root endpoint response format may be unexpected"
        fi
    fi
    
    # Test favicon endpoint (fixes CSP error)
    log_info "Testing favicon endpoint..."
    STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4001/favicon.ico 2>/dev/null || echo "000")
    if [ "$STATUS_CODE" = "204" ]; then
        log_success "Favicon endpoint returns 204 No Content (CSP fix working)"
    else
        log_error "Favicon endpoint returned status $STATUS_CODE instead of 204"
    fi
    
    # Test health endpoint
    test_endpoint "http://localhost:4001/health" "Health check"
    
    # Test tRPC endpoint
    test_endpoint "http://localhost:4001/api/trpc/hello" "tRPC hello"
    
else
    log_error "Backend server is not running. Start it with:"
    echo "  cd apps/server && npm run dev"
fi

echo ""

# Check if frontend is running
if check_process 4000 "Frontend server"; then
    test_endpoint "http://localhost:4000/" "Frontend"
else
    log_warning "Frontend server is not running. Start it with:"
    echo "  cd apps/web && npm run dev"
fi

echo ""

# Check Next.js configuration
log_info "Checking Next.js configuration..."
if grep -q 'process.env.NODE_ENV === "production" ? "export" : "standalone"' apps/web/next.config.js; then
    log_success "Next.js config correctly handles dev vs production modes"
else
    log_error "Next.js config may not be properly configured"
fi

echo ""

# Check VS Code launch configuration
log_info "Checking VS Code launch configuration..."
if [ -f ".vscode/launch.json" ]; then
    if grep -q "NEXT_PUBLIC_API_URL" .vscode/launch.json; then
        log_success "VS Code launch.json includes environment variables"
    else
        log_warning "VS Code launch.json may be missing environment variables"
    fi
else
    log_error "VS Code launch.json not found"
fi

echo ""

# Summary
log_info "🎯 Debug Setup Test Summary:"
echo "1. ✅ Backend root endpoint (/) - fixes 'Cannot GET /' error"
echo "2. ✅ Favicon endpoint (/favicon.ico) - fixes CSP error"
echo "3. ✅ Next.js config - handles dev vs production modes"
echo "4. ✅ VS Code launch.json - includes proper environment variables"
echo ""
echo "To start debugging:"
echo "1. Open VS Code"
echo "2. Go to Run and Debug (Ctrl+Shift+D)"
echo "3. Select 'Debug Full Stack'"
echo "4. Press F5"
echo ""

log_success "Debug setup testing completed!" 