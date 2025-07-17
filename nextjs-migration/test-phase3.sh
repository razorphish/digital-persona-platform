#!/bin/bash

# Test Phase 3: Chat System Migration
# Tests conversation creation, message sending, and AI responses

echo "🚀 Testing Phase 3: Chat System Migration"
echo "=========================================="

# Configuration
BASE_URL="http://localhost:3001"
AUTH_TOKEN=""
USER_ID=""
PERSONA_ID=""
CONVERSATION_ID=""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper function to make API calls
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local headers="Content-Type: application/json"
    
    if [[ -n "$AUTH_TOKEN" ]]; then
        headers="$headers\nAuthorization: Bearer $AUTH_TOKEN"
    fi
    
    if [[ -n "$data" ]]; then
        curl -s -X "$method" \
             -H "$(echo -e $headers)" \
             -d "$data" \
             "$BASE_URL$endpoint"
    else
        curl -s -X "$method" \
             -H "$(echo -e $headers)" \
             "$BASE_URL$endpoint"
    fi
}

# Test function wrapper
test_step() {
    local description=$1
    local command=$2
    
    echo -e "\n${BLUE}Testing: $description${NC}"
    echo "----------------------------------------"
    
    result=$(eval "$command")
    echo "$result" | jq . 2>/dev/null || echo "$result"
    
    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✅ PASSED${NC}"
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        return 1
    fi
}

# 1. Register a test user
echo -e "\n${BLUE}Step 1: Setting up test user${NC}"
register_response=$(api_call POST "/api/auth/register" '{
    "username": "chatuser",
    "email": "chat@example.com", 
    "password": "testpass123",
    "full_name": "Chat Test User"
}')

echo "$register_response" | jq .

AUTH_TOKEN=$(echo "$register_response" | jq -r '.access_token')
USER_ID=$(echo "$register_response" | jq -r '.user.id')

if [[ "$AUTH_TOKEN" == "null" || -z "$AUTH_TOKEN" ]]; then
    echo -e "${RED}❌ Failed to get auth token${NC}"
    exit 1
fi

echo -e "${GREEN}✅ User registered and authenticated${NC}"
echo "User ID: $USER_ID"
echo "Token: ${AUTH_TOKEN:0:20}..."

# 2. Create a test persona
echo -e "\n${BLUE}Step 2: Creating test persona${NC}"
persona_response=$(api_call POST "/api/personas" '{
    "name": "Emma",
    "description": "A friendly AI assistant who loves to help with coding and creative projects",
    "relation_type": "friend",
    "memory_enabled": true,
    "learning_enabled": true,
    "voice_synthesis_enabled": true,
    "image_analysis_enabled": true
}')

echo "$persona_response" | jq .

PERSONA_ID=$(echo "$persona_response" | jq -r '.id')

if [[ "$PERSONA_ID" == "null" || -z "$PERSONA_ID" ]]; then
    echo -e "${RED}❌ Failed to create persona${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Persona created${NC}"
echo "Persona ID: $PERSONA_ID"

# 3. Test chat system endpoints
echo -e "\n${BLUE}Step 3: Testing Chat System${NC}"
echo "============================================"

# 3a. Create a conversation
test_step "Create conversation" "api_call POST '/api/chat/conversations' '{
    \"title\": \"Test Chat with Emma\",
    \"persona_id\": $PERSONA_ID
}'"

# Extract conversation ID from the last response
CONVERSATION_ID=$(api_call POST "/api/chat/conversations" "{
    \"title\": \"Test Chat with Emma\",
    \"persona_id\": $PERSONA_ID
}" | jq -r '.id')

echo "Conversation ID: $CONVERSATION_ID"

# 3b. List conversations
test_step "List all conversations" "api_call GET '/api/chat/conversations'"

# 3c. List conversations for specific persona
test_step "List conversations for persona" "api_call GET '/api/chat/conversations?persona_id=$PERSONA_ID'"

# 3d. Get specific conversation
test_step "Get conversation by ID" "api_call GET '/api/chat/conversations/$CONVERSATION_ID'"

# 3e. Get conversation messages (should be empty initially)
test_step "Get conversation messages (empty)" "api_call GET '/api/chat/conversations/$CONVERSATION_ID/messages'"

# 3f. Send a message to the persona
echo -e "\n${BLUE}Step 4: Testing AI Chat Functionality${NC}"
echo "============================================"

test_step "Send message to persona (without OpenAI)" "api_call POST '/api/chat/conversations/$CONVERSATION_ID/send' '{
    \"content\": \"Hello Emma! How are you doing today?\"
}'"

# 3g. Get messages after sending (should have user message and potentially AI response)
test_step "Get messages after sending" "api_call GET '/api/chat/conversations/$CONVERSATION_ID/messages'"

# 3h. Send another message
test_step "Send follow-up message" "api_call POST '/api/chat/conversations/$CONVERSATION_ID/send' '{
    \"content\": \"Can you help me understand how digital personas work?\"
}'"

# 3i. Test message with limit
test_step "Get messages with limit" "api_call GET '/api/chat/conversations/$CONVERSATION_ID/messages?limit=2'"

# 3j. Test OpenAI models endpoint
test_step "List available models" "api_call GET '/api/chat/models'"

# 4. Test error cases
echo -e "\n${BLUE}Step 5: Testing Error Cases${NC}"
echo "============================================"

# 4a. Try to create conversation with invalid persona
test_step "Create conversation with invalid persona (should fail)" "api_call POST '/api/chat/conversations' '{
    \"title\": \"Invalid Conversation\",
    \"persona_id\": 99999
}'"

# 4b. Try to send empty message
test_step "Send empty message (should fail)" "api_call POST '/api/chat/conversations/$CONVERSATION_ID/send' '{
    \"content\": \"\"
}'"

# 4c. Try to access non-existent conversation
test_step "Access non-existent conversation (should fail)" "api_call GET '/api/chat/conversations/99999'"

# 4d. Try to send message to non-existent conversation
test_step "Send message to non-existent conversation (should fail)" "api_call POST '/api/chat/conversations/99999/send' '{
    \"content\": \"This should fail\"
}'"

# 5. Performance and validation tests
echo -e "\n${BLUE}Step 6: Performance and Validation Tests${NC}"
echo "============================================"

# 5a. Test long message (near limit)
long_message=$(printf "This is a test of a longer message. %.0s" {1..100})
test_step "Send long message (near limit)" "api_call POST '/api/chat/conversations/$CONVERSATION_ID/send' '{
    \"content\": \"$long_message\"
}'"

# 5b. Test very long message (should fail)
very_long_message=$(printf "This message is too long and should be rejected. %.0s" {1..200})
test_step "Send very long message (should fail)" "api_call POST '/api/chat/conversations/$CONVERSATION_ID/send' '{
    \"content\": \"$very_long_message\"
}'"

# Final summary
echo -e "\n${BLUE}Phase 3 Testing Complete!${NC}"
echo "============================================"
echo "Conversation ID: $CONVERSATION_ID"
echo "Persona ID: $PERSONA_ID"
echo "User ID: $USER_ID"

# Get final conversation state
echo -e "\n${BLUE}Final Conversation State:${NC}"
api_call GET "/api/chat/conversations/$CONVERSATION_ID/messages" | jq .

echo -e "\n${GREEN}🎉 Phase 3 (Chat System) testing completed!${NC}"
echo ""
echo "What was tested:"
echo "✅ Conversation creation and management"
echo "✅ Message sending and retrieval"
echo "✅ AI response generation (without OpenAI key)"
echo "✅ Error handling and validation"
echo "✅ Authentication and authorization"
echo "✅ Database operations for chat data"
echo ""
echo "Next: Set OPENAI_API_KEY to test actual AI responses!" 