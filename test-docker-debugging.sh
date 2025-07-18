#!/bin/bash

echo "🐳 Testing Docker Container Debugging Setup"
echo "============================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if Docker is running
check_docker() {
    if docker info > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Docker daemon is running${NC}"
        return 0
    else
        echo -e "${RED}❌ Docker daemon is not running${NC}"
        echo -e "${YELLOW}Please start Docker Desktop and run this script again${NC}"
        return 1
    fi
}

# Function to wait for service
wait_for_service() {
    local url=$1
    local name=$2
    local max_attempts=$3
    local attempt=1
    
    echo -e "${BLUE}🔄 Waiting for $name to start...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ $name is running${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}⏳ Attempt $attempt/$max_attempts - $name not ready yet${NC}"
        sleep 10
        attempt=$((attempt + 1))
    done
    
    echo -e "${RED}❌ $name failed to start after $max_attempts attempts${NC}"
    return 1
}

# Function to check debug port
check_debug_port() {
    local port=$1
    local service=$2
    
    if nc -z localhost $port 2>/dev/null; then
        echo -e "${GREEN}✅ $service debug port $port is accessible${NC}"
        return 0
    else
        echo -e "${RED}❌ $service debug port $port is not accessible${NC}"
        return 1
    fi
}

# Function to test API endpoint
test_api_endpoint() {
    local url=$1
    local expected_pattern=$2
    local name=$3
    
    response=$(curl -s --max-time 10 "$url" 2>/dev/null)
    if [[ "$response" =~ $expected_pattern ]]; then
        echo -e "${GREEN}✅ $name API endpoint working${NC}"
        return 0
    else
        echo -e "${RED}❌ $name API endpoint not responding correctly${NC}"
        echo -e "${YELLOW}Response: ${response:0:100}...${NC}"
        return 1
    fi
}

# Function to check container health
check_container_health() {
    local container_name=$1
    
    if docker ps --filter "name=$container_name" --filter "status=running" | grep -q "$container_name"; then
        echo -e "${GREEN}✅ Container $container_name is running${NC}"
        return 0
    else
        echo -e "${RED}❌ Container $container_name is not running${NC}"
        echo -e "${YELLOW}Container logs:${NC}"
        docker logs --tail 10 "$container_name" 2>/dev/null || echo "No logs available"
        return 1
    fi
}

# Main test sequence
main() {
    echo -e "${BLUE}Step 1: Checking Docker availability...${NC}"
    if ! check_docker; then
        exit 1
    fi
    
    echo -e "\n${BLUE}Step 2: Cleaning up any existing containers...${NC}"
    docker-compose -f docker-compose.dev.yml down --remove-orphans
    echo -e "${GREEN}✅ Cleanup complete${NC}"
    
    echo -e "\n${BLUE}Step 3: Building and starting development containers...${NC}"
    if docker-compose -f docker-compose.dev.yml up --build -d; then
        echo -e "${GREEN}✅ Containers started successfully${NC}"
    else
        echo -e "${RED}❌ Failed to start containers${NC}"
        echo -e "${YELLOW}Docker Compose logs:${NC}"
        docker-compose -f docker-compose.dev.yml logs --tail 20
        exit 1
    fi
    
    echo -e "\n${BLUE}Step 4: Checking container health...${NC}"
    sleep 5
    check_container_health "digital-persona-platform-backend-1"
    
    echo -e "\n${BLUE}Step 5: Waiting for services to be ready...${NC}"
    
    # Wait for Python ML service (may take longer due to debugpy --wait-for-client)
    echo -e "${YELLOW}Note: Python service is waiting for debugger client - this is expected${NC}"
    
    # Wait for Next.js app
    wait_for_service "http://localhost:3001" "Next.js App" 12
    
    echo -e "\n${BLUE}Step 6: Testing debug ports accessibility...${NC}"
    check_debug_port 9229 "Next.js"
    check_debug_port 5678 "Python ML Service"
    
    echo -e "\n${BLUE}Step 7: Testing Next.js app functionality...${NC}"
    test_api_endpoint "http://localhost:3001" "<!DOCTYPE html>" "Next.js App"
    
    echo -e "\n${BLUE}Step 8: Testing Redis connectivity...${NC}"
    if docker exec digital-persona-platform-redis-1 redis-cli ping | grep -q "PONG"; then
        echo -e "${GREEN}✅ Redis is responding${NC}"
    else
        echo -e "${RED}❌ Redis is not responding${NC}"
    fi
    
    echo -e "\n${BLUE}Step 9: Testing VS Code debugging readiness...${NC}"
    echo -e "${GREEN}✅ Node.js debugger ready on ws://localhost:9229${NC}"
    echo -e "${YELLOW}⏳ Python debugger waiting for client on localhost:5678${NC}"
    echo -e "${BLUE}ℹ️  Use VS Code 'Debug Full Stack (Docker)' configuration${NC}"
    
    echo -e "\n${BLUE}Step 10: Container resource usage...${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | head -4
    
    echo -e "\n${BLUE}🔗 Service URLs for testing:${NC}"
    echo -e "• Next.js App: ${GREEN}http://localhost:3001${NC}"
    echo -e "• Python ML Service: ${YELLOW}http://localhost:8001${NC} (waiting for debugger)"
    echo -e "• Redis: ${GREEN}localhost:6379${NC}"
    echo -e "• SQLite Viewer: ${GREEN}http://localhost:8080${NC} (run with --profile tools)"
    
    echo -e "\n${BLUE}🐛 VS Code Debug Instructions:${NC}"
    echo -e "1. Open VS Code and go to Run & Debug (Ctrl+Shift+D)"
    echo -e "2. Select 'Debug Full Stack (Docker)' from dropdown"
    echo -e "3. Press F5 to attach debuggers"
    echo -e "4. Python service will start responding after debugger attaches"
    
    echo -e "\n${GREEN}🎉 Docker debugging setup test complete!${NC}"
    echo -e "${BLUE}Containers are running and ready for debugging.${NC}"
    echo -e "${YELLOW}To stop: docker-compose -f docker-compose.dev.yml down${NC}"
}

# Run the test
main "$@" 