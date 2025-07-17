# 🔐 Authentication System Documentation

## Overview

The Digital Persona Platform includes a complete JWT-based authentication system with SQLite database storage. The system provides secure user registration, login, token management, and protected endpoints.

## 🏗️ Architecture

### Components

1. **Database Models** (`app/models/user_db.py`)

   - User model with SQLAlchemy ORM
   - Includes email, username, hashed password, timestamps
   - Relationships to personas, media files, and conversations

2. **Pydantic Schemas** (`app/schemas/auth.py`)

   - Request/response models for API endpoints
   - Input validation and serialization

3. **Authentication Service** (`app/services/auth_db.py`)

   - Password hashing with bcrypt
   - JWT token creation and validation
   - User authentication logic

4. **Authentication Router** (`app/routers/auth_db.py`)

   - Registration and login endpoints
   - Token refresh and user management
   - Password change and reset functionality

5. **Authentication Utilities** (`app/utils/auth.py`)
   - Additional authentication middleware
   - Token validation helpers

## 🗄️ Database Schema

### Users Table

```sql
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
```

## 🔑 Authentication Flow

### 1. User Registration

```http
POST /auth/register
Content-Type: application/json

{
    "email": "user@example.com",
    "username": "username",
    "password": "securepassword123",
    "full_name": "Full Name"
}
```

**Response:**

```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 2. User Login

```http
POST /auth/login
Content-Type: application/json

{
    "email": "user@example.com",
    "password": "securepassword123"
}
```

**Response:** Same as registration response

### 3. Accessing Protected Endpoints

```http
GET /personas/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### 4. Token Refresh

```http
POST /auth/refresh
Content-Type: application/json

{
    "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## 🛡️ Security Features

### Password Security

- **Hashing**: bcrypt with salt rounds
- **Validation**: Minimum length and complexity requirements
- **Storage**: Only hashed passwords stored in database

### JWT Tokens

- **Algorithm**: HS256
- **Access Token Expiry**: 30 minutes
- **Refresh Token Expiry**: 7 days
- **Claims**: User ID, username, token type, expiration

### Protection Mechanisms

- **CORS**: Configured for local development
- **Rate Limiting**: Ready for implementation
- **Input Validation**: Pydantic models with validation
- **Error Handling**: Secure error messages

## 📋 API Endpoints

### Authentication Endpoints

| Method | Endpoint                | Description            | Auth Required |
| ------ | ----------------------- | ---------------------- | ------------- |
| POST   | `/auth/register`        | Register new user      | No            |
| POST   | `/auth/login`           | Login user             | No            |
| POST   | `/auth/refresh`         | Refresh access token   | No            |
| GET    | `/auth/me`              | Get current user info  | Yes           |
| POST   | `/auth/change-password` | Change password        | Yes           |
| POST   | `/auth/reset-password`  | Request password reset | No            |
| POST   | `/auth/logout`          | Logout user            | Yes           |
| GET    | `/auth/verify`          | Verify token validity  | Yes           |

### Protected Endpoints

All persona, media, and chat endpoints require authentication:

- `GET /personas/` - List user's personas
- `POST /personas/` - Create new persona
- `GET /personas/{id}` - Get specific persona
- `PUT /personas/{id}` - Update persona
- `DELETE /personas/{id}` - Delete persona

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

### Database Setup

1. **Install dependencies:**

   ```bash
   pip install -r requirements.txt
   ```

2. **Run migrations:**

   ```bash
   alembic upgrade head
   ```

3. **Start the application:**
   ```bash
   uvicorn app.main:app --reload
   ```

## 🧪 Testing

### Manual Testing

Run the comprehensive test script:

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

### API Testing

Use the interactive documentation at `http://localhost:8000/docs` to test endpoints manually.

## 🚀 Usage Examples

### Python Requests

```python
import requests

# Register a new user
response = requests.post("http://localhost:8000/auth/register", json={
    "email": "user@example.com",
    "username": "username",
    "password": "password123",
    "full_name": "User Name"
})

token = response.json()["access_token"]

# Use token for authenticated requests
headers = {"Authorization": f"Bearer {token}"}
personas = requests.get("http://localhost:8000/personas/", headers=headers)
```

### JavaScript/Fetch

```javascript
// Register user
const response = await fetch("http://localhost:8000/auth/register", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    email: "user@example.com",
    username: "username",
    password: "password123",
    full_name: "User Name",
  }),
});

const { access_token } = await response.json();

// Use token for authenticated requests
const personas = await fetch("http://localhost:8000/personas/", {
  headers: {
    Authorization: `Bearer ${access_token}`,
  },
});
```

## 🔒 Security Best Practices

### For Development

1. Use strong SECRET_KEY in production
2. Enable HTTPS in production
3. Implement rate limiting
4. Add request logging
5. Use environment variables for secrets

### For Production

1. Use strong password policies
2. Implement account lockout
3. Add two-factor authentication
4. Regular security audits
5. Monitor for suspicious activity

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**

   - Ensure SQLite file is writable
   - Check DATABASE_URL in .env

2. **Token Validation Error**

   - Verify SECRET_KEY is set
   - Check token expiration

3. **Password Hashing Error**

   - Ensure bcrypt is installed
   - Check password complexity

4. **CORS Error**
   - Verify CORS configuration
   - Check allowed origins

### Debug Mode

Enable debug logging by setting:

```python
# In app/database.py
engine = create_async_engine(
    DATABASE_URL,
    echo=True,  # Set to True for SQL logging
    future=True
)
```

## 📚 Additional Resources

- [FastAPI Security Documentation](https://fastapi.tiangolo.com/tutorial/security/)
- [JWT.io](https://jwt.io/) - JWT token debugger
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Alembic Documentation](https://alembic.sqlalchemy.org/)

---

**Note**: This authentication system is production-ready but should be enhanced with additional security measures for high-security applications.
