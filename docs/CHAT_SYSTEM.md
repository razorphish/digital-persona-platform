# OpenAI-Powered Chat System

The Digital Persona Platform now includes a sophisticated chat system powered by OpenAI's GPT models, allowing users to have natural conversations with their digital personas.

## Features

### 🤖 AI-Powered Conversations

- **Persona-Based Responses**: Each persona responds according to their defined characteristics and relationship type
- **Context Awareness**: Conversations maintain context and history for more natural interactions
- **Relationship-Specific Behavior**: Different personas behave according to their relationship type (parent, friend, colleague, etc.)

### 💬 Conversation Management

- **Multiple Conversations**: Users can have multiple conversations with different personas
- **Conversation History**: Full message history is preserved and used for context
- **Conversation Organization**: Conversations can be titled, updated, and organized

### 📊 Analytics & Monitoring

- **Token Usage Tracking**: Monitor OpenAI API usage and costs
- **Response Time Metrics**: Track AI response performance
- **Usage Statistics**: Comprehensive chat analytics

### 🔒 Security & Privacy

- **User-Scoped Data**: All conversations are private to the user who created them
- **Authentication Required**: All chat endpoints require valid JWT authentication
- **Data Validation**: Input validation and sanitization

## API Endpoints

### Conversations

#### Create Conversation

```http
POST /chat/conversations
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "First Chat with Alex",
  "persona_id": 1
}
```

#### List Conversations

```http
GET /chat/conversations
Authorization: Bearer <token>

# Optional: Filter by persona
GET /chat/conversations?persona_id=1
```

#### Get Conversation

```http
GET /chat/conversations/{conversation_id}
Authorization: Bearer <token>
```

#### Update Conversation

```http
PUT /chat/conversations/{conversation_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Updated Chat Title",
  "persona_id": 1
}
```

#### Delete Conversation

```http
DELETE /chat/conversations/{conversation_id}
Authorization: Bearer <token>
```

### Messages

#### Send Message

```http
POST /chat/conversations/{conversation_id}/send
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Hi Alex! How are you doing today?"
}
```

**Response includes both user message and AI response:**

```json
{
  "conversation": {
    "id": 1,
    "title": "First Chat with Alex",
    "persona_id": 1,
    "user_id": 1,
    "is_active": true,
    "created_at": "2024-01-01T12:00:00",
    "updated_at": "2024-01-01T12:05:00"
  },
  "user_message": {
    "id": 1,
    "conversation_id": 1,
    "role": "user",
    "content": "Hi Alex! How are you doing today?",
    "created_at": "2024-01-01T12:05:00"
  },
  "assistant_message": {
    "id": 2,
    "conversation_id": 1,
    "role": "assistant",
    "content": "Hey there! I'm doing great, thanks for asking! How about you?",
    "tokens_used": 25,
    "model_used": "gpt-3.5-turbo",
    "response_time_ms": 1200,
    "created_at": "2024-01-01T12:05:01"
  }
}
```

#### Get Conversation Messages

```http
GET /chat/conversations/{conversation_id}/messages
Authorization: Bearer <token>

# Optional: Limit number of messages
GET /chat/conversations/{conversation_id}/messages?limit=50
```

#### Delete Message

```http
DELETE /chat/messages/{message_id}
Authorization: Bearer <token>
```

### Analytics

#### Get Chat Statistics

```http
GET /chat/stats
Authorization: Bearer <token>
```

**Response:**

```json
{
  "total_conversations": 5,
  "total_messages": 150,
  "total_tokens": 5000,
  "estimated_cost_usd": 0.01
}
```

#### Health Check

```http
GET /chat/health
```

**Response:**

```json
{
  "status": "healthy",
  "openai_api": "connected"
}
```

## Persona Behavior

### Relationship Types

The chat system tailors persona responses based on the relationship type:

#### Parent

- Caring and nurturing
- Gives advice when asked
- Shows concern for user's well-being
- Supportive and protective

#### Spouse

- Loving and romantic
- Understanding and supportive
- Shares in joys and concerns
- Intimate and personal

#### Child

- Curious and energetic
- Asks questions
- Shows enthusiasm for learning
- Playful and innocent

#### Sibling

- Friendly and supportive
- Shares experiences
- Offers brotherly/sisterly advice
- Casual and familiar

#### Friend

- Supportive and fun
- Offers companionship
- Casual conversation style
- Trustworthy and reliable

#### Colleague

- Professional and helpful
- Focuses on work topics
- Collaborative approach
- Respectful and formal

#### Other

- Supportive and engaging
- Based on persona description
- Flexible behavior patterns

## Configuration

### Environment Variables

```bash
# Required for OpenAI integration
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Customize OpenAI settings
OPENAI_MODEL=gpt-3.5-turbo  # Default model
OPENAI_MAX_TOKENS=1000      # Max response length
OPENAI_TEMPERATURE=0.7      # Response creativity (0.0-1.0)
```

### OpenAI Service Configuration

The OpenAI service can be customized in `app/services/openai_service.py`:

```python
class OpenAIService:
    def __init__(self):
        self.default_model = "gpt-3.5-turbo"
        self.max_tokens = 1000
        self.temperature = 0.7
```

## Database Schema

### Conversations Table

```sql
CREATE TABLE conversations (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    persona_id INTEGER NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Chat Messages Table

```sql
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,  -- 'user' or 'assistant'
    content TEXT NOT NULL,
    tokens_used INTEGER,
    model_used VARCHAR(50),
    response_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Usage Examples

### Python Client Example

```python
import requests

# Authentication
auth_response = requests.post("http://localhost:8000/auth/login", json={
    "username": "user@example.com",
    "password": "password123"
})
token = auth_response.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Create a conversation
conv_response = requests.post("http://localhost:8000/chat/conversations", json={
    "title": "Chat with My Friend Alex",
    "persona_id": 1
}, headers=headers)
conversation_id = conv_response.json()["id"]

# Send a message
chat_response = requests.post(f"http://localhost:8000/chat/conversations/{conversation_id}/send", json={
    "content": "Hi Alex! How are you doing today?"
}, headers=headers)

# Get the AI response
ai_message = chat_response.json()["assistant_message"]["content"]
print(f"AI Response: {ai_message}")
```

### JavaScript/Node.js Example

```javascript
const axios = require("axios");

// Authentication
const authResponse = await axios.post("http://localhost:8000/auth/login", {
  username: "user@example.com",
  password: "password123",
});
const token = authResponse.data.access_token;

// Create conversation
const convResponse = await axios.post(
  "http://localhost:8000/chat/conversations",
  {
    title: "Chat with My Friend Alex",
    persona_id: 1,
  },
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);
const conversationId = convResponse.data.id;

// Send message
const chatResponse = await axios.post(
  `http://localhost:8000/chat/conversations/${conversationId}/send`,
  {
    content: "Hi Alex! How are you doing today?",
  },
  {
    headers: { Authorization: `Bearer ${token}` },
  }
);

// Get AI response
const aiMessage = chatResponse.data.assistant_message.content;
console.log(`AI Response: ${aiMessage}`);
```

## Testing

### Run the Test Script

```bash
# Set OpenAI API key (optional)
export OPENAI_API_KEY="your_api_key_here"

# Run the test script
python test_chat.py
```

### Manual Testing

1. **Start the server:**

   ```bash
   python -m app.main
   ```

2. **Register a user and create a persona**

3. **Test chat endpoints:**

   ```bash
   # Create conversation
   curl -X POST "http://localhost:8000/chat/conversations" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"title": "Test Chat", "persona_id": 1}'

   # Send message
   curl -X POST "http://localhost:8000/chat/conversations/1/send" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"content": "Hello!"}'
   ```

## Error Handling

### Common Errors

#### OpenAI API Errors

- **401 Unauthorized**: Invalid API key
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: OpenAI service unavailable

#### Application Errors

- **404 Not Found**: Conversation or persona not found
- **403 Forbidden**: User doesn't own the conversation
- **422 Validation Error**: Invalid input data

### Error Response Format

```json
{
  "detail": "Error message description"
}
```

## Performance Considerations

### Token Management

- Monitor token usage to control costs
- Consider implementing token limits per user
- Use conversation history limits to manage context length

### Response Time

- Average response time: 1-3 seconds
- Depends on OpenAI API performance
- Consider implementing request queuing for high load

### Database Optimization

- Index on `conversation_id` and `created_at` for messages
- Consider archiving old conversations
- Implement pagination for large message histories

## Security Best Practices

### API Key Management

- Store OpenAI API key securely
- Use environment variables
- Rotate keys regularly
- Monitor API usage for anomalies

### Data Privacy

- All conversations are user-scoped
- Implement data retention policies
- Consider encryption for sensitive conversations
- Regular security audits

### Rate Limiting

- Implement rate limiting per user
- Monitor for abuse patterns
- Set reasonable limits for API calls

## Production Deployment

### Environment Setup

```bash
# Production environment variables
export OPENAI_API_KEY="your_production_key"
export DATABASE_URL="postgresql://user:pass@host:port/db"
export SECRET_KEY="your_secret_key"
```

### Monitoring

- Monitor OpenAI API usage and costs
- Track response times and error rates
- Set up alerts for service disruptions
- Log conversation analytics

### Scaling Considerations

- Database connection pooling
- Redis for caching conversation context
- Load balancing for multiple instances
- CDN for static assets

## Troubleshooting

### OpenAI API Issues

1. **Check API key validity**
2. **Verify account has sufficient credits**
3. **Check rate limits**
4. **Monitor OpenAI service status**

### Database Issues

1. **Verify database connection**
2. **Check table structure**
3. **Monitor query performance**
4. **Review error logs**

### Application Issues

1. **Check server logs**
2. **Verify environment variables**
3. **Test individual endpoints**
4. **Review authentication flow**

## Support

For issues and questions:

1. Check the logs for error details
2. Verify configuration settings
3. Test with the provided test script
4. Review this documentation

The chat system provides a powerful foundation for AI-powered conversations with digital personas, combining the flexibility of OpenAI's language models with the structured persona management of the platform.
