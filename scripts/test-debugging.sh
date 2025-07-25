#!/bin/bash

echo "🔧 Testing Local Debugging Setup for Digital Persona Platform"
echo "============================================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check service
check_service() {
    local url=$1
    local name=$2
    
    if curl -s --max-time 5 "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $name is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $name is not responding${NC}"
        return 1
    fi
}

echo -e "${BLUE}📡 Checking running services...${NC}"

# Check Next.js app
check_service "http://localhost:3000" "Next.js App (port 3000)"

# Check Python ML service
check_service "http://localhost:8001/health" "Python ML Service (port 8001)"

# Check Python ML service docs
check_service "http://localhost:8001/docs" "Python ML Service Documentation"

echo ""
echo -e "${BLUE}🔍 Checking debug ports...${NC}"

# Check for Node.js debug port
if lsof -i :9229 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Node.js debug port 9229 is available${NC}"
else
    echo -e "${YELLOW}⚠️  Node.js debug port 9229 is not in use (use Debug configurations to start)${NC}"
fi

# Check for Python debug port
if lsof -i :5678 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Python debug port 5678 is available${NC}"
else
    echo -e "${YELLOW}⚠️  Python debug port 5678 is not in use (use Debug configurations to start)${NC}"
fi

echo ""
echo -e "${BLUE}🐛 Available VS Code Debug Configurations:${NC}"
echo "1. Debug Next.js App - Launch Next.js with debugging on port 9229"
echo "2. Debug Next.js App (Alternative Port) - Launch Next.js with debugging on port 9230"
echo "3. Debug FastAPI with Uvicorn - Launch Python service with standard debugging"
echo "4. Debug FastAPI with Debugpy - Launch Python service with debugpy for remote debugging"
echo "5. Attach to Python ML Service - Attach to running Python service"
echo "6. Debug Full Stack - Launch both services together"
echo "7. Debug Full Stack (Alternative) - Launch both services with alternative ports"

echo ""
echo -e "${BLUE}🚀 Testing API endpoints...${NC}"

# Test Next.js API route
if curl -s --max-time 5 "http://localhost:3000/api/debug/users" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Next.js API routes accessible${NC}"
else
    echo -e "${YELLOW}⚠️  Next.js API routes may not be fully loaded yet${NC}"
fi

# Test Python ML service endpoint
if curl -s --max-time 5 "http://localhost:8001/health" | grep -q "healthy" 2>/dev/null; then
    echo -e "${GREEN}✅ Python ML service health check passed${NC}"
else
    echo -e "${YELLOW}⚠️  Python ML service health check needs verification${NC}"
fi

echo ""
echo -e "${BLUE}📋 Quick Start for Debugging:${NC}"
echo "1. Open VS Code in this workspace"
echo "2. Go to Run and Debug (Ctrl+Shift+D / Cmd+Shift+D)"
echo "3. Select a debug configuration from the dropdown"
echo "4. Press F5 or click the green play button"
echo "5. Set breakpoints in your code"
echo "6. Trigger the code paths to hit breakpoints"

echo ""
echo -e "${BLUE}🔗 Service URLs:${NC}"
echo "• Next.js App (Local): http://localhost:3000"
echo "• Next.js App (Docker): http://localhost:3001"
echo "• Python ML Service: http://localhost:8001"
echo "• ML Service Docs: http://localhost:8001/docs"
echo "• ML Service Health: http://localhost:8001/health"

echo ""
echo -e "${GREEN}🎉 Local debugging setup test complete!${NC}" 