#!/bin/bash

# Test Phase 4.5: ML Service Integration with Next.js
# This script tests the integration between Next.js and the Python ML service

set -e

echo "🧪 Testing Phase 4.5: ML Service Integration"
echo "=============================================="

# Configuration
NEXTJS_URL="http://localhost:3001"
ML_SERVICE_URL="http://localhost:8001"
TIMEOUT=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_RUN=0
TESTS_PASSED=0

# Helper function to make HTTP requests with timeout
make_request() {
    local url=$1
    local method=${2:-GET}
    local data=${3:-}
    local content_type=${4:-"application/json"}
    local auth_token=${5:-}
    
    local headers=("-H" "Content-Type: $content_type")
    if [ -n "$auth_token" ]; then
        headers+=("-H" "Authorization: Bearer $auth_token")
    fi
    
    if [ -n "$data" ]; then
        curl -s -m $TIMEOUT -X $method "${headers[@]}" -d "$data" "$url"
    else
        curl -s -m $TIMEOUT -X $method "${headers[@]}" "$url"
    fi
}

# Helper function to run a test
run_test() {
    local test_name=$1
    local expected_status=${2:-200}
    
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -e "${BLUE}Test $TESTS_RUN: $test_name${NC}"
}

# Helper function to check test result
check_result() {
    local result=$1
    local expected=$2
    local test_description=$3
    
    if [[ $result == *"$expected"* ]]; then
        echo -e "${GREEN}✅ PASS: $test_description${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAIL: $test_description${NC}"
        echo -e "${YELLOW}Expected: $expected${NC}"
        echo -e "${YELLOW}Got: $result${NC}"
    fi
    echo ""
}

echo "🔍 Checking service availability..."

# Test 1: Check ML Service Health
run_test "ML Service Health Check"
ML_HEALTH=$(make_request "$ML_SERVICE_URL/health" 2>/dev/null || echo "ERROR")
check_result "$ML_HEALTH" "healthy" "ML service should be healthy"

# Test 2: Check Next.js Service Health  
run_test "Next.js Service Health Check"
NEXTJS_HEALTH=$(make_request "$NEXTJS_URL/api/auth/register" 2>/dev/null || echo "ERROR")
check_result "$NEXTJS_HEALTH" "Username, email, and password are required" "Next.js service should be running"

echo "👤 Setting up test user and persona..."

# Test 3: Register a test user
run_test "User Registration"
REGISTER_DATA='{"username":"ml-test-user","email":"test-ml-integration@example.com","password":"testpassword123"}'
REGISTER_RESPONSE=$(make_request "$NEXTJS_URL/api/auth/register" "POST" "$REGISTER_DATA" 2>/dev/null || echo "ERROR")
check_result "$REGISTER_RESPONSE" "access_token" "User registration should return a JWT token"

# Extract token from registration response
TOKEN=$(echo "$REGISTER_RESPONSE" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Failed to extract token from registration response${NC}"
    echo "Response: $REGISTER_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Token extracted: ${TOKEN:0:20}...${NC}"

# Test 4: Create a test persona
run_test "Persona Creation"
PERSONA_DATA='{"name":"ML Test Persona","description":"A test persona for ML integration","relation_type":"friend"}'
PERSONA_RESPONSE=$(make_request "$NEXTJS_URL/api/personas" "POST" "$PERSONA_DATA" "application/json" "$TOKEN" 2>/dev/null || echo "ERROR")
check_result "$PERSONA_RESPONSE" "id" "Persona creation should return persona with ID"

# Extract persona ID
PERSONA_ID=$(echo "$PERSONA_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)

if [ -z "$PERSONA_ID" ]; then
    echo -e "${RED}❌ Failed to extract persona ID${NC}"
    echo "Response: $PERSONA_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Persona ID extracted: $PERSONA_ID${NC}"

echo "💬 Testing chat functionality with ML service..."

# Test 5: Create a conversation
run_test "Conversation Creation"
CONV_DATA="{\"title\":\"ML Integration Test Chat\",\"persona_id\":$PERSONA_ID}"
CONV_RESPONSE=$(make_request "$NEXTJS_URL/api/chat/conversations" "POST" "$CONV_DATA" "application/json" "$TOKEN" 2>/dev/null || echo "ERROR")
check_result "$CONV_RESPONSE" "id" "Conversation creation should return conversation with ID"

# Extract conversation ID
CONV_ID=$(echo "$CONV_RESPONSE" | grep -o '"id":[0-9]*' | cut -d':' -f2)

if [ -z "$CONV_ID" ]; then
    echo -e "${RED}❌ Failed to extract conversation ID${NC}"
    echo "Response: $CONV_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Conversation ID extracted: $CONV_ID${NC}"

# Test 6: Send message and get AI response (this tests the ML service integration)
run_test "Send Message with ML Service Integration"
MESSAGE_DATA='{"content":"Hello! This is a test message to verify ML service integration works correctly."}'
MESSAGE_RESPONSE=$(make_request "$NEXTJS_URL/api/chat/conversations/$CONV_ID/send" "POST" "$MESSAGE_DATA" "application/json" "$TOKEN" 2>/dev/null || echo "ERROR")

echo "Message Response (first 200 chars): ${MESSAGE_RESPONSE:0:200}..."

check_result "$MESSAGE_RESPONSE" "assistant_message" "Message should generate AI response from ML service"

# Test 7: Verify AI response contains expected elements
if [[ $MESSAGE_RESPONSE == *"assistant_message"* ]]; then
    run_test "AI Response Content Validation"
    
    # Check if response contains the persona name
    PERSONA_NAME="ML Test Persona"
    if [[ $MESSAGE_RESPONSE == *"$PERSONA_NAME"* ]] || [[ $MESSAGE_RESPONSE == *"Hello"* ]] || [[ $MESSAGE_RESPONSE == *"test"* ]]; then
        check_result "CONTAINS_RELEVANT_CONTENT" "CONTAINS_RELEVANT_CONTENT" "AI response should contain relevant content"
    else
        check_result "NO_RELEVANT_CONTENT" "CONTAINS_RELEVANT_CONTENT" "AI response should contain relevant content"
    fi
    
    # Check if response has tokens_used (indicating ML service was called)
    if [[ $MESSAGE_RESPONSE == *"tokens_used"* ]]; then
        check_result "HAS_TOKENS" "HAS_TOKENS" "Response should include token usage from ML service"
    else
        check_result "NO_TOKENS" "HAS_TOKENS" "Response should include token usage from ML service"
    fi
fi

# Test 8: Test ML Service Direct Integration
run_test "Direct ML Service OpenAI Status Check"
ML_OPENAI_STATUS=$(make_request "$ML_SERVICE_URL/openai/status" 2>/dev/null || echo "ERROR")
check_result "$ML_OPENAI_STATUS" "available" "ML service OpenAI status should be available"

# Test 9: Test ML Service Models Endpoint
run_test "ML Service Models Endpoint"
ML_MODELS=$(make_request "$ML_SERVICE_URL/openai/models" 2>/dev/null || echo "ERROR") 
check_result "$ML_MODELS" "chat_models" "ML service should return available models"

# Test 10: Test Computer Vision Capabilities
run_test "Computer Vision Service Status"
CV_STATUS=$(make_request "$ML_SERVICE_URL/cv/status" 2>/dev/null || echo "ERROR")
check_result "$CV_STATUS" "models_loaded" "Computer vision service should be available"

echo "🧹 Cleaning up test data..."

# Test 11: List conversations (should include our test conversation)
run_test "List Conversations"
LIST_CONV=$(curl -s -m $TIMEOUT -H "Authorization: Bearer $TOKEN" "$NEXTJS_URL/api/chat/conversations" 2>/dev/null || echo "ERROR")
check_result "$LIST_CONV" "$CONV_ID" "Conversation list should include our test conversation"

# Test 12: Get conversation messages
run_test "Get Conversation Messages"
GET_MESSAGES=$(curl -s -m $TIMEOUT -H "Authorization: Bearer $TOKEN" "$NEXTJS_URL/api/chat/conversations/$CONV_ID/messages" 2>/dev/null || echo "ERROR")
check_result "$GET_MESSAGES" "assistant" "Messages should include both user and assistant messages"

echo "📊 Test Results Summary"
echo "======================"
echo -e "${BLUE}Tests Run: $TESTS_RUN${NC}"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Tests Failed: $((TESTS_RUN - TESTS_PASSED))${NC}"

if [ $TESTS_PASSED -eq $TESTS_RUN ]; then
    echo -e "${GREEN}🎉 All tests passed! ML service integration is working correctly.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the ML service integration.${NC}"
    
    echo ""
    echo "🔧 Troubleshooting Tips:"
    echo "1. Make sure the ML service is running on port 8001"
    echo "2. Verify OpenAI API key is configured in the ML service"
    echo "3. Check that Next.js can reach the ML service URL"
    echo "4. Ensure ML_SERVICE_URL is set correctly in .env.local"
    
    exit 1
fi 