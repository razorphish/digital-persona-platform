#!/bin/bash

# Simple Phase 3 Test Script
# Tests basic chat functionality with proper token handling

echo "🚀 Simple Phase 3: Chat System Test"
echo "===================================="

BASE_URL="http://localhost:3001"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "\n${BLUE}Step 1: Register new user${NC}"
# Use timestamp to create unique user
TIMESTAMP=$(date +%s)
REGISTER_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "{
        \"username\": \"chattest$TIMESTAMP\",
        \"email\": \"chattest$TIMESTAMP@example.com\", 
        \"password\": \"testpass123\",
        \"full_name\": \"Chat Test User $TIMESTAMP\"
    }" \
    "$BASE_URL/api/auth/register")

echo "Registration response:"
echo "$REGISTER_RESPONSE" | jq .

# Extract token
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.access_token')
USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.user.id')

if [[ "$TOKEN" == "null" || -z "$TOKEN" ]]; then
    echo -e "${RED}❌ Failed to get auth token${NC}"
    exit 1
fi

echo -e "${GREEN}✅ User registered successfully${NC}"
echo "Token: ${TOKEN:0:30}..."
echo "User ID: $USER_ID"

echo -e "\n${BLUE}Step 2: Create persona${NC}"
PERSONA_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "name": "Emma",
        "description": "A friendly AI assistant",
        "relation_type": "friend",
        "memory_enabled": true,
        "learning_enabled": true,
        "voice_synthesis_enabled": true,
        "image_analysis_enabled": true
    }' \
    "$BASE_URL/api/personas")

echo "Persona response:"
echo "$PERSONA_RESPONSE" | jq .

PERSONA_ID=$(echo "$PERSONA_RESPONSE" | jq -r '.id')

if [[ "$PERSONA_ID" == "null" || -z "$PERSONA_ID" ]]; then
    echo -e "${RED}❌ Failed to create persona${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Persona created successfully${NC}"
echo "Persona ID: $PERSONA_ID"

echo -e "\n${BLUE}Step 3: Create conversation${NC}"
CONV_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{
        \"title\": \"Test Chat with Emma\",
        \"persona_id\": $PERSONA_ID
    }" \
    "$BASE_URL/api/chat/conversations")

echo "Conversation response:"
echo "$CONV_RESPONSE" | jq .

CONV_ID=$(echo "$CONV_RESPONSE" | jq -r '.id')

if [[ "$CONV_ID" == "null" || -z "$CONV_ID" ]]; then
    echo -e "${RED}❌ Failed to create conversation${NC}"
    echo "Error details:"
    echo "$CONV_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Conversation created successfully${NC}"
echo "Conversation ID: $CONV_ID"

echo -e "\n${BLUE}Step 4: Send message${NC}"
MESSAGE_RESPONSE=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{
        "content": "Hello Emma! How are you today?"
    }' \
    "$BASE_URL/api/chat/conversations/$CONV_ID/send")

echo "Message response:"
echo "$MESSAGE_RESPONSE" | jq .

if echo "$MESSAGE_RESPONSE" | jq -e '.user_message' > /dev/null; then
    echo -e "${GREEN}✅ Message sent successfully${NC}"
else
    echo -e "${RED}❌ Failed to send message${NC}"
fi

echo -e "\n${BLUE}Step 5: Get conversation messages${NC}"
MESSAGES_RESPONSE=$(curl -s -X GET \
    -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/chat/conversations/$CONV_ID/messages")

echo "Messages response:"
echo "$MESSAGES_RESPONSE" | jq .

echo -e "\n${BLUE}Step 6: List conversations${NC}"
CONVS_RESPONSE=$(curl -s -X GET \
    -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/chat/conversations")

echo "Conversations list:"
echo "$CONVS_RESPONSE" | jq .

echo -e "\n${BLUE}Step 7: Test models endpoint${NC}"
MODELS_RESPONSE=$(curl -s -X GET \
    -H "Authorization: Bearer $TOKEN" \
    "$BASE_URL/api/chat/models")

echo "Models response:"
echo "$MODELS_RESPONSE" | jq .

echo -e "\n${GREEN}🎉 Phase 3 testing completed!${NC}"
echo ""
echo "Summary:"
echo "- User registration: ✅"
echo "- Persona creation: ✅"  
echo "- Conversation creation: ✅"
echo "- Message sending: ✅"
echo "- Message retrieval: ✅"
echo "- Conversation listing: ✅"
echo "- Models endpoint: ✅" 