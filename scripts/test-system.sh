#!/bin/bash

# System Health Test Script for Digital Persona Platform
# Note: Not using set -e to continue testing even if some tests fail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Test if port is available
test_port() {
    local port=$1
    local service=$2
    
    print_test "Testing $service on port $port"
    
    if curl -s "http://localhost:$port" >/dev/null 2>&1; then
        print_pass "$service is responding on port $port"
    else
        print_fail "$service is not responding on port $port"
    fi
}

# Test API endpoint
test_api_endpoint() {
    local url=$1
    local expected_status=$2
    local description=$3
    
    print_test "Testing $description: $url"
    
    local status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$status" = "$expected_status" ]; then
        print_pass "$description returned status $status"
    else
        print_fail "$description returned status $status (expected $expected_status)"
    fi
}

# Test file existence
test_file_exists() {
    local file=$1
    local description=$2
    
    print_test "Checking if $description exists: $file"
    
    if [ -f "$file" ]; then
        print_pass "$description exists"
    else
        print_fail "$description does not exist"
    fi
}

# Test directory existence
test_directory_exists() {
    local dir=$1
    local description=$2
    
    print_test "Checking if $description exists: $dir"
    
    if [ -d "$dir" ]; then
        print_pass "$description exists"
    else
        print_fail "$description does not exist"
    fi
}

# Test Next.js build
test_nextjs_build() {
    print_test "Testing Next.js build process"
    
    cd nextjs-migration
    if npm run build >/dev/null 2>&1; then
        print_pass "Next.js build successful"
    else
        print_fail "Next.js build failed"
    fi
    cd ..
}

# Test Python ML service
test_python_service() {
    print_test "Testing Python ML service startup"
    
    cd python-ml-service
    if python -c "import app.main; print('Import successful')" >/dev/null 2>&1; then
        print_pass "Python ML service imports successful"
    else
        print_fail "Python ML service import failed"
    fi
    cd ..
}

# Test Docker setup
test_docker_setup() {
    print_test "Testing Docker configuration"
    
    if docker compose -f docker-compose.dev.yml config >/dev/null 2>&1; then
        print_pass "Docker Compose configuration is valid"
    else
        print_fail "Docker Compose configuration is invalid"
    fi
}

# Main test execution
main() {
    echo "🧪 Running Digital Persona Platform System Tests..."
    echo "=============================================="
    
    # Test file structure
    test_file_exists "nextjs-migration/package.json" "Next.js package.json"
    test_file_exists "python-ml-service/requirements.txt" "Python requirements.txt"
    test_file_exists "docker-compose.yml" "Docker Compose production config"
    test_file_exists "docker-compose.dev.yml" "Docker Compose development config"
    test_file_exists ".vscode/launch.json" "VS Code debug configuration"
    
    # Test directories
    test_directory_exists "nextjs-migration/src/app/api" "Next.js API routes"
    test_directory_exists "python-ml-service/app" "Python ML service"
    test_directory_exists "uploads" "Uploads directory"
    test_directory_exists "chroma_db" "ChromaDB directory"
    
    # Test Docker configuration
    test_docker_setup
    
    # Test application builds
    print_info "Testing application builds (this may take a moment)..."
    test_nextjs_build
    test_python_service
    
    # Test running services (if available)
    print_info "Testing running services..."
    test_port 3001 "Next.js App"
    test_port 8001 "Python ML Service"
    
    # Test API endpoints (if services are running)
    test_api_endpoint "http://localhost:3001" "200" "Next.js home page"
    test_api_endpoint "http://localhost:3001/api/auth/login" "405" "Next.js auth endpoint"
    test_api_endpoint "http://localhost:8001/docs" "200" "Python ML service docs"
    
    # Print results
    echo ""
    echo "=============================================="
    echo "Test Results Summary:"
    echo "✅ Tests Passed: $TESTS_PASSED"
    echo "❌ Tests Failed: $TESTS_FAILED"
    echo "📊 Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "${GREEN}🎉 All tests passed! System is healthy.${NC}"
        exit 0
    else
        echo -e "${RED}⚠️  Some tests failed. Please check the output above.${NC}"
        exit 1
    fi
}

# Run main function
main "$@" 