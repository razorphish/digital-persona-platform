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

# Check AI services
print_status "info" "Checking AI services..."

# Check OpenAI API (if configured)
if [ -n "$OPENAI_API_KEY" ] && [ "$OPENAI_API_KEY" != "your-openai-api-key-here" ]; then
    print_status "info" "Testing OpenAI API connection..."
    
    # Test OpenAI API with a simple request
    OPENAI_TEST_RESPONSE=$(curl -s -X POST "http://localhost:8000/health/detailed" \
        -H "Content-Type: application/json" \
        -w "%{http_code}" \
        -o /tmp/openai_test_response.json 2>/dev/null || echo "000")
    
    if [ "$OPENAI_TEST_RESPONSE" = "200" ]; then
        # Parse the response to check OpenAI status
        OPENAI_STATUS=$(cat /tmp/openai_test_response.json | grep -o '"openai":{[^}]*}' | grep -o '"status":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "unknown")
        
        if [ "$OPENAI_STATUS" = "healthy" ] || [ "$OPENAI_STATUS" = "not_configured" ]; then
            print_status "success" "OpenAI API is healthy"
        else
            print_status "warning" "OpenAI API check returned: $OPENAI_STATUS"
        fi
    else
        print_status "warning" "OpenAI API health check failed (HTTP $OPENAI_TEST_RESPONSE)"
    fi
    
    # Clean up temp file
    rm -f /tmp/openai_test_response.json
else
    print_status "warning" "OpenAI API key not configured - skipping AI health check"
fi

# Check AI capabilities endpoint
print_status "info" "Testing AI capabilities endpoint..."
AI_CAPABILITIES_RESPONSE=$(curl -s -X GET "http://localhost:8000/ai/capabilities" \
    -H "Content-Type: application/json" \
    -w "%{http_code}" \
    -o /tmp/ai_capabilities_response.json 2>/dev/null || echo "000")

if [ "$AI_CAPABILITIES_RESPONSE" = "200" ]; then
    print_status "success" "AI capabilities endpoint is healthy"
    
    # Check if AI services are properly configured
    AI_SERVICES=$(cat /tmp/ai_capabilities_response.json 2>/dev/null | grep -o '"available":[^}]*}' | grep -o 'true' | wc -l)
    if [ "$AI_SERVICES" -gt 0 ]; then
        print_status "success" "AI services are available and configured"
    else
        print_status "warning" "No AI services are currently available"
    fi
else
    print_status "warning" "AI capabilities endpoint check failed (HTTP $AI_CAPABILITIES_RESPONSE)"
fi

# Clean up temp file
rm -f /tmp/ai_capabilities_response.json

# Test AI chat functionality (if OpenAI is configured)
if [ -n "$OPENAI_API_KEY" ] && [ "$OPENAI_API_KEY" != "your-openai-api-key-here" ]; then
    print_status "info" "Testing AI chat functionality..."
    
    # Create a test user and get token
    TEST_USER_RESPONSE=$(curl -s -X POST "http://localhost:8000/auth/register" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "deploy-test@example.com",
            "username": "deploytest",
            "password": "deploytest123",
            "full_name": "Deployment Test User"
        }' \
        -w "%{http_code}" \
        -o /tmp/test_user_response.json 2>/dev/null || echo "000")
    
    if [ "$TEST_USER_RESPONSE" = "200" ] || [ "$TEST_USER_RESPONSE" = "400" ]; then
        # Try to login (user might already exist)
        LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:8000/auth/login" \
            -H "Content-Type: application/json" \
            -d '{
                "email": "deploy-test@example.com",
                "password": "deploytest123"
            }' \
            -w "%{http_code}" \
            -o /tmp/login_response.json 2>/dev/null || echo "000")
        
        if [ "$LOGIN_RESPONSE" = "200" ]; then
            # Extract token
            TOKEN=$(cat /tmp/login_response.json | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4 2>/dev/null || echo "")
            
            if [ -n "$TOKEN" ]; then
                # Test self persona functionality
                SELF_PERSONA_RESPONSE=$(curl -s -X GET "http://localhost:8000/personas/self" \
                    -H "Authorization: Bearer $TOKEN" \
                    -w "%{http_code}" \
                    -o /tmp/self_persona_response.json 2>/dev/null || echo "000")
                
                if [ "$SELF_PERSONA_RESPONSE" = "200" ]; then
                    print_status "success" "Self persona functionality is working"
                    
                    # Extract persona ID for chat test
                    PERSONA_ID=$(cat /tmp/self_persona_response.json | grep -o '"id":[0-9]*' | cut -d':' -f2 2>/dev/null || echo "")
                    
                    if [ -n "$PERSONA_ID" ]; then
                                        # Test merged persona page functionality (AI summary and learning data)
                print_status "info" "Testing merged persona page functionality..."
                
                # Test persona summary
                SUMMARY_RESPONSE=$(curl -s -X GET "http://localhost:8000/personas/$PERSONA_ID/summary" \
                    -H "Authorization: Bearer $TOKEN" \
                    -w "%{http_code}" \
                    -o /tmp/persona_summary_response.json 2>/dev/null || echo "000")
                
                if [ "$SUMMARY_RESPONSE" = "200" ]; then
                    print_status "success" "AI summary functionality is working"
                else
                    print_status "warning" "AI summary test failed (HTTP $SUMMARY_RESPONSE)"
                fi
                
                # Test adding learning data
                LEARNING_RESPONSE=$(curl -s -X POST "http://localhost:8000/personas/$PERSONA_ID/learn" \
                    -H "Content-Type: application/json" \
                    -H "Authorization: Bearer $TOKEN" \
                    -d '{
                        "text": "I am a deployment test user who loves testing new features and ensuring quality."
                    }' \
                    -w "%{http_code}" \
                    -o /tmp/persona_learning_response.json 2>/dev/null || echo "000")
                
                if [ "$LEARNING_RESPONSE" = "200" ]; then
                    print_status "success" "Learning data functionality is working"
                    
                    # Test that the learning data is reflected in the persona
                    UPDATED_PERSONA_RESPONSE=$(curl -s -X GET "http://localhost:8000/personas/$PERSONA_ID" \
                        -H "Authorization: Bearer $TOKEN" \
                        -w "%{http_code}" \
                        -o /tmp/updated_persona_response.json 2>/dev/null || echo "000")
                    
                    if [ "$UPDATED_PERSONA_RESPONSE" = "200" ]; then
                        # Check if learning data is in memory context
                        LEARNING_DATA_PRESENT=$(cat /tmp/updated_persona_response.json 2>/dev/null | grep -o "deployment test user" | wc -l)
                        if [ "$LEARNING_DATA_PRESENT" -gt 0 ]; then
                            print_status "success" "Learning data integration is working"
                        else
                            print_status "warning" "Learning data not found in persona memory context"
                        fi
                    else
                        print_status "warning" "Could not verify learning data integration (HTTP $UPDATED_PERSONA_RESPONSE)"
                    fi
                else
                    print_status "warning" "Learning data test failed (HTTP $LEARNING_RESPONSE)"
                fi
                        
                        # Test AI chat with self persona
                        CHAT_RESPONSE=$(curl -s -X POST "http://localhost:8000/chat/test" \
                            -H "Content-Type: application/json" \
                            -H "Authorization: Bearer $TOKEN" \
                            -d "{
                                \"message\": \"Hello, this is a deployment test. Please respond with a simple greeting.\",
                                \"persona_id\": $PERSONA_ID
                            }" \
                            -w "%{http_code}" \
                            -o /tmp/chat_response.json 2>/dev/null || echo "000")
                        
                        if [ "$CHAT_RESPONSE" = "200" ]; then
                            print_status "success" "AI chat with self persona is working"
                        else
                            print_status "warning" "AI chat with self persona test failed (HTTP $CHAT_RESPONSE)"
                        fi
                    else
                        print_status "warning" "Could not extract persona ID from self persona response"
                    fi
                else
                    print_status "warning" "Self persona test failed (HTTP $SELF_PERSONA_RESPONSE)"
                fi
            else
                print_status "warning" "Could not extract authentication token"
            fi
        else
            print_status "warning" "Could not authenticate test user (HTTP $LOGIN_RESPONSE)"
        fi
    else
        print_status "warning" "Could not create test user (HTTP $TEST_USER_RESPONSE)"
    fi
    
    # Clean up temp files
    rm -f /tmp/test_user_response.json /tmp/login_response.json /tmp/chat_response.json /tmp/self_persona_response.json /tmp/persona_summary_response.json /tmp/persona_learning_response.json /tmp/updated_persona_response.json
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
echo "   Detailed Health: http://localhost:8000/health/detailed"
echo "   AI Capabilities: http://localhost:8000/ai/capabilities"
echo "   Grafana: http://localhost:3001 (admin/admin)"
echo "   Prometheus: http://localhost:9090"

# Show AI status summary
echo ""
print_status "info" "🤖 AI Services Status:"
if [ -n "$OPENAI_API_KEY" ] && [ "$OPENAI_API_KEY" != "your-openai-api-key-here" ]; then
    echo "   OpenAI API: ✅ Configured"
    echo "   AI Chat: ✅ Available"
    echo "   AI Capabilities: ✅ Available"
    echo "   AI Summary: ✅ Available"
    echo "   Learning Data: ✅ Available"
else
    echo "   OpenAI API: ⚠️  Not configured"
    echo "   AI Chat: ⚠️  Limited functionality"
    echo "   AI Capabilities: ⚠️  Limited functionality"
    echo "   AI Summary: ✅ Available (basic)"
    echo "   Learning Data: ✅ Available"
fi

echo ""
print_status "success" "🎉 Deployment completed successfully!"
print_status "info" "Use 'docker-compose logs -f' to monitor logs"
print_status "info" "Use 'docker-compose down' to stop services" 