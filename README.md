# 🤖 Digital Persona Platform

**✅ Working Setup with JWT Authentication**

## Quick Start

1. **Start the server:**

   ```bash
   ./start.sh
   ```

2. **Test the API:**

   - 🌐 API: http://localhost:8000
   - 📚 Docs: http://localhost:8000/docs
   - 💚 Health: http://localhost:8000/health
   - 🧪 Test: http://localhost:8000/test

3. **Open in Cursor:**
   ```bash
   cursor .
   ```

## Features Working

✅ FastAPI web framework  
✅ Pydantic V1 data validation  
✅ JWT Authentication system  
✅ SQLAlchemy 2.0 + PostgreSQL database  
✅ Alembic database migrations  
✅ Protected persona management API  
✅ Media file upload (images & videos)  
✅ File validation & security  
✅ OpenAI-powered chat with personas  
✅ Conversation management & history  
✅ Interactive documentation  
✅ CORS support  
✅ Python 3.13 compatible  
✅ Cursor AI integration

## API Endpoints

### Authentication (No auth required)

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token

### Protected Endpoints (Auth required)

- `POST /personas/` - Create persona
- `GET /personas/` - List user's personas
- `GET /personas/{id}` - Get specific persona
- `PUT /personas/{id}` - Update persona
- `DELETE /personas/{id}` - Delete persona
- `GET /auth/me` - Get current user info
- `POST /auth/change-password` - Change password

### Media Upload Endpoints (Auth required)

- `POST /media/upload/{persona_id}` - Upload image/video for persona
- `GET /media/files` - List user's media files
- `GET /media/files/{id}` - Get media file info
- `GET /media/download/{id}` - Download media file
- `PUT /media/files/{id}` - Update media file description
- `DELETE /media/files/{id}` - Delete media file
- `GET /media/stats` - Get media statistics

### Chat System Endpoints (Auth required)

- `POST /chat/conversations` - Create conversation with persona
- `GET /chat/conversations` - List user's conversations
- `GET /chat/conversations/{id}` - Get conversation details
- `PUT /chat/conversations/{id}` - Update conversation
- `DELETE /chat/conversations/{id}` - Delete conversation
- `POST /chat/conversations/{id}/send` - Send message to persona
- `GET /chat/conversations/{id}/messages` - Get conversation messages
- `DELETE /chat/messages/{id}` - Delete message
- `GET /chat/stats` - Get chat statistics
- `GET /chat/health` - Check OpenAI API health

## Next Steps with AI

Press `Ctrl+K` in Cursor and try:

1. **Add Database:**

   ```
   "Add JWT token authentication with user registration and login"
   ```

2. **Add Database:**

   ```
   "Replace in-memory storage with SQLAlchemy and PostgreSQL"
   ```

3. **Add File Upload:**

   ```
   "Create endpoints for uploading images with validation and S3 storage"
   ```

4. **Add AI Chat:**

   ```
   "Integrate OpenAI for conversations with personas"
   ```

5. **Test Chat System:**
   ```
   "Test the OpenAI-powered chat functionality"
   ```

## Testing

### Chat System Testing

Test the OpenAI-powered chat system:

```bash
# Set OpenAI API key (optional)
export OPENAI_API_KEY="your_api_key_here"

# Run the test script
python test_chat.py
```

### Media Upload Testing

Test the complete media upload system:

```bash
python test_media_upload.py
```

### Database Integration Testing

Test the complete database integration:

```bash
python test_database.py
```

### Authentication Testing

Test the complete JWT authentication system:

```bash
python test_auth.py
```

### Manual Testing

Since TestClient has compatibility issues, use manual testing:

```bash
python manual_test.py
```

## Commands

```bash
./start.sh              # Start server
python test_chat.py     # Test chat system
python test_media_upload.py # Test media upload system
python test_database.py # Test database integration
python test_auth.py     # Test authentication system
python manual_test.py   # Run manual tests
black app/              # Format code
cursor .                # Open in Cursor
```

## Documentation

- [Chat System](CHAT_SYSTEM.md) - OpenAI-powered chat with personas guide
- [Media Upload System](MEDIA_UPLOAD.md) - File upload and management guide
- [Database Integration](DATABASE.md) - SQLAlchemy + PostgreSQL setup guide
- [Authentication System](AUTHENTICATION.md) - Complete JWT authentication guide
- [API Documentation](http://localhost:8000/docs) - Interactive API docs

**Ready for AI-assisted development!** 🚀
