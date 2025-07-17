# JWT Authentication System

This document describes the JWT (JSON Web Token) authentication system implemented in the Digital Persona Platform.

## Overview

The authentication system provides secure user registration, login, and token-based access control for the API endpoints. All persona management operations now require valid authentication.

## Features

- ✅ User registration with email and password
- ✅ Secure password hashing with bcrypt
- ✅ JWT access tokens (30 minutes expiry)
- ✅ JWT refresh tokens (7 days expiry)
- ✅ Protected API endpoints
- ✅ Token verification
- ✅ Password change functionality
- ✅ User profile management

## API Endpoints

### Authentication Endpoints

| Method | Endpoint                | Description            | Auth Required |
| ------ | ----------------------- | ---------------------- | ------------- |
| POST   | `/auth/register`        | Register a new user    | No            |
| POST   | `/auth/login`           | Login user             | No            |
| POST   | `/auth/refresh`         | Refresh access token   | No            |
| GET    | `/auth/me`              | Get current user info  | Yes           |
| POST   | `/auth/change-password` | Change password        | Yes           |
| POST   | `/auth/reset-password`  | Request password reset | No            |
| POST   | `/auth/logout`          | Logout user            | Yes           |
| GET    | `/auth/verify`          | Verify token validity  | Yes           |

### Protected Persona Endpoints

| Method | Endpoint         | Description          | Auth Required |
| ------ | ---------------- | -------------------- | ------------- |
| POST   | `/personas/`     | Create a new persona | Yes           |
| GET    | `/personas/`     | List user's personas | Yes           |
| GET    | `/personas/{id}` | Get specific persona | Yes           |
| PUT    | `/personas/{id}` | Update persona       | Yes           |
| DELETE | `/personas/{id}` | Delete persona       | Yes           |

## Usage Examples

### 1. Register a New User

```bash
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "myuser",
    "password": "securepassword123",
    "full_name": "John Doe"
  }'
```

Response:

```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 2. Login

```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

### 3. Create a Persona (with authentication)

```bash
curl -X POST "http://localhost:8000/personas/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice",
    "description": "A friendly colleague",
    "relationship": "colleague"
  }'
```

### 4. List Personas (with authentication)

```bash
curl -X GET "http://localhost:8000/personas/" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Refresh Token

```bash
curl -X POST "http://localhost:8000/auth/refresh" \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "YOUR_REFRESH_TOKEN"
  }'
```

## Security Features

### Password Security

- Passwords are hashed using bcrypt with salt
- Minimum password requirements (implement in production)
- Secure password change functionality

### Token Security

- Access tokens expire after 30 minutes
- Refresh tokens expire after 7 days
- Tokens are signed with a secret key
- Token verification on every protected request

### API Security

- All persona operations require authentication
- Users can only access their own personas
- CORS configured for secure cross-origin requests

## Environment Variables

Set these environment variables for production:

```bash
# Required for JWT signing
SECRET_KEY=your-super-secret-key-change-this-in-production

# Optional: Database configuration
DATABASE_URL=postgresql://user:password@localhost/dbname

# Optional: Email configuration for password reset
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## Testing

Run the test script to verify the authentication system:

```bash
python test_auth.py
```

This will test:

- User registration
- User login
- Token verification
- Protected endpoint access
- Unauthorized access rejection

## Production Considerations

1. **Database**: Replace in-memory storage with a proper database (PostgreSQL, MySQL, etc.)
2. **Secret Key**: Use a strong, randomly generated secret key
3. **HTTPS**: Always use HTTPS in production
4. **Rate Limiting**: Implement rate limiting for auth endpoints
5. **Email Verification**: Add email verification for new registrations
6. **Password Policy**: Implement strong password requirements
7. **Token Blacklisting**: Implement token blacklisting for logout
8. **Audit Logging**: Log authentication events for security monitoring

## Error Handling

The API returns appropriate HTTP status codes:

- `200`: Success
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `404`: Not Found
- `500`: Internal Server Error

## Client Integration

### JavaScript/TypeScript

```javascript
// Login and store tokens
const login = async (email, password) => {
  const response = await fetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  localStorage.setItem("access_token", data.access_token);
  localStorage.setItem("refresh_token", data.refresh_token);
};

// Make authenticated requests
const createPersona = async (personaData) => {
  const token = localStorage.getItem("access_token");
  const response = await fetch("/personas/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(personaData),
  });
  return response.json();
};
```

### Python

```python
import requests

# Login
response = requests.post('http://localhost:8000/auth/login', json={
    'email': 'user@example.com',
    'password': 'password123'
})
token = response.json()['access_token']

# Make authenticated requests
headers = {'Authorization': f'Bearer {token}'}
response = requests.get('http://localhost:8000/personas/', headers=headers)
personas = response.json()
```
