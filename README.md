# 🤖 Digital Persona Platform

A comprehensive FastAPI-based platform for creating and interacting with digital personas, featuring JWT authentication, SQLite database, media uploads, and OpenAI-powered chat.

## ✨ Features

- 🔐 **Complete JWT Authentication System**

  - User registration and login
  - Password hashing with bcrypt
  - Token refresh mechanism
  - Protected endpoints with user scoping

- 🗄️ **SQLite Database with SQLAlchemy**

  - Async database operations
  - Alembic migrations
  - User and persona management
  - Media file storage

- 👤 **Digital Persona Management**

  - Create, read, update, delete personas
  - User-specific persona ownership
  - Relationship type categorization
  - Rich persona descriptions

- 📁 **Media Upload System**

  - Support for images, videos, and audio
  - File validation and security
  - User-scoped media management
  - Secure file storage

- 💬 **OpenAI-Powered Chat**
  - Conversational AI with personas
  - Context-aware responses
  - Conversation history
  - Relationship-based interactions

## 🚀 Quick Start

### Prerequisites

- Python 3.13+
- pip (Python package manager)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/razorphish/digital-persona-platform.git
   cd digital-persona-platform
   ```

2. **Create and activate virtual environment:**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run database migrations:**

   ```bash
   alembic upgrade head
   ```

6. **Start the application:**

   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

7. **Access the API:**
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health
   - Root Endpoint: http://localhost:8000/

## 🔐 Authentication

### Register a New User

```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "username",
    "password": "securepassword123",
    "full_name": "User Name"
  }'
```

### Login

```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

### Use Authentication Token

```bash
curl -X GET "http://localhost:8000/personas/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📋 API Endpoints

### Authentication

- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user info
- `POST /auth/change-password` - Change password
- `POST /auth/logout` - Logout user

### Personas (Protected)

- `GET /personas/` - List user's personas
- `POST /personas/` - Create new persona
- `GET /personas/{id}` - Get specific persona
- `PUT /personas/{id}` - Update persona
- `DELETE /personas/{id}` - Delete persona

### Media (Protected)

- `POST /media/upload` - Upload media file
- `GET /media/` - List user's media files
- `GET /media/{id}` - Get specific media file
- `DELETE /media/{id}` - Delete media file

### Chat (Protected)

- `POST /chat/conversations` - Create conversation
- `GET /chat/conversations` - List conversations
- `POST /chat/conversations/{id}/messages` - Send message
- `GET /chat/conversations/{id}/messages` - Get messages

## 🧪 Testing

### Run Comprehensive Tests

```bash
python test_auth_sqlite.py
```

This will test:

- ✅ Health check
- ✅ User registration
- ✅ User login
- ✅ Token validation
- ✅ Protected endpoint access
- ✅ Unauthorized access blocking
- ✅ Invalid token rejection

### Manual Testing

Use the interactive API documentation at `http://localhost:8000/docs` to test endpoints manually.

## 🗄️ Database

### SQLite Configuration

The application uses SQLite for simplicity and portability:

- **Database File**: `digital_persona.db`
- **Migrations**: Alembic with automatic schema generation
- **Async Operations**: SQLAlchemy 2.0 with aiosqlite

### Schema

```sql
-- Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(64) UNIQUE NOT NULL,
    full_name VARCHAR(128),
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Personas table
CREATE TABLE personas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    relation_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
);
```

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=sqlite+aiosqlite:///./digital_persona.db

# Security
SECRET_KEY=your-secret-key-change-in-production

# Optional: OpenAI for chat features
OPENAI_API_KEY=your-openai-api-key
```

### Development vs Production

- **Development**: SQLite with debug logging
- **Production**: Consider PostgreSQL with proper security measures

## 📁 Project Structure

```
digital-persona-platform/
├── app/
│   ├── models/          # SQLAlchemy models
│   ├── schemas/         # Pydantic schemas
│   ├── routers/         # API endpoints
│   ├── services/        # Business logic
│   ├── crud/           # Database operations
│   ├── utils/          # Utilities
│   ├── database.py     # Database configuration
│   └── main.py         # FastAPI application
├── alembic/            # Database migrations
├── uploads/            # Media file storage
├── tests/              # Test files
├── requirements.txt    # Python dependencies
└── README.md          # This file
```

## 🛡️ Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: HS256 algorithm with expiration
- **Input Validation**: Pydantic models with validation
- **CORS Protection**: Configured for development
- **User Scoping**: All data is user-specific
- **File Upload Security**: Type and size validation

## 🚀 Deployment

### Local Development

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Production Considerations

1. **Database**: Use PostgreSQL for production
2. **Security**: Set strong SECRET_KEY
3. **HTTPS**: Enable SSL/TLS
4. **Rate Limiting**: Implement request throttling
5. **Logging**: Configure proper logging
6. **Monitoring**: Add health checks and metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Documentation**: Check the `/docs` endpoint
- **Issues**: Create an issue on GitHub
- **Testing**: Run `python test_auth_sqlite.py`

---

**Built with ❤️ using FastAPI, SQLAlchemy, and SQLite**
