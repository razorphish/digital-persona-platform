# 🤖 Digital Persona Platform

A comprehensive AI-powered platform for creating, managing, and interacting with digital personas. Built with FastAPI, React, and modern AI technologies.

## 🚀 Features

- **AI-Powered Personas**: Create and manage intelligent digital personas
- **Natural Language Chat**: Engage in conversations with your personas
- **Memory & Learning**: Personas learn and remember from interactions
- **Voice Synthesis**: Text-to-speech capabilities for personas
- **Image Analysis**: AI-powered image understanding and analysis
- **File Upload & Management**: Secure file handling with S3 support
- **Real-time Chat**: WebSocket-based real-time messaging
- **User Authentication**: JWT-based secure authentication
- **Production Ready**: Docker, monitoring, and security features

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React)       │◄──►│   (FastAPI)     │◄──►│   (PostgreSQL)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   Redis Cache   │              │
         │              └─────────────────┘              │
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   OpenAI API    │              │
         │              └─────────────────┘              │
         │                       │                       │
         │              ┌─────────────────┐              │
         │              │   AWS S3        │              │
         │              └─────────────────┘              │
         │                       │                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │    │   Prometheus    │    │   Grafana       │
│   (Load Bal.)   │    │   (Monitoring)  │    │   (Dashboard)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Quick Start (Development)

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL (optional, SQLite for development)
- Redis (optional)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/digital-persona-platform.git
   cd digital-persona-platform
   ```

2. **Set up Python environment**

   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Set up frontend**

   ```bash
   cd frontend
   npm install
   cd ..
   ```

4. **Configure environment**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run the application**
   ```bash
   ./start.sh
   ```

### Test Users

Use these credentials for testing:

- **Email**: `test@example.com`
- **Password**: `testpassword123`

## 🚀 Production Deployment

### Docker Deployment (Recommended)

1. **Prepare environment**

   ```bash
   cp env.production.example .env
   # Edit .env with your production values
   ```

2. **Deploy with Docker Compose**
   ```bash
   ./deploy.sh
   ```

### Manual Deployment

1. **Set up PostgreSQL**

   ```sql
   CREATE DATABASE digital_persona;
   CREATE USER dpp_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE digital_persona TO dpp_user;
   ```

2. **Set up Redis**

   ```bash
   # Install Redis
   sudo apt-get install redis-server
   # Configure with password
   ```

3. **Configure environment variables**

   ```bash
   export DATABASE_URL="postgresql://dpp_user:password@localhost:5432/digital_persona"
   export REDIS_URL="redis://:password@localhost:6379"
   export SECRET_KEY="your-super-secure-secret-key"
   ```

4. **Run database migrations**

   ```bash
   alembic upgrade head
   ```

5. **Start services**

   ```bash
   # Backend
   uvicorn app.main:app --host 0.0.0.0 --port 8000

   # Frontend
   cd frontend && npm start
   ```

## 🔧 Configuration

### Environment Variables

| Variable                | Description                | Default                          |
| ----------------------- | -------------------------- | -------------------------------- |
| `DATABASE_URL`          | Database connection string | `sqlite:///./digital_persona.db` |
| `SECRET_KEY`            | JWT secret key             | `your-secret-key-here`           |
| `OPENAI_API_KEY`        | OpenAI API key             | `None`                           |
| `REDIS_URL`             | Redis connection string    | `redis://localhost:6379`         |
| `AWS_ACCESS_KEY_ID`     | AWS access key             | `None`                           |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key             | `None`                           |
| `S3_BUCKET_NAME`        | S3 bucket name             | `None`                           |
| `LOG_LEVEL`             | Logging level              | `INFO`                           |
| `ENVIRONMENT`           | Environment mode           | `development`                    |

### Security Features

- **Rate Limiting**: Configurable rate limits per endpoint
- **CORS Protection**: Cross-origin resource sharing controls
- **Security Headers**: XSS, CSRF, and other security headers
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Protection**: Parameterized queries

## 📊 Monitoring & Observability

### Health Checks

- **Basic Health**: `GET /health`
- **Detailed Health**: `GET /health/detailed`
- **Readiness**: `GET /health/ready`
- **Liveness**: `GET /health/live`

### Metrics & Monitoring

- **Prometheus**: Metrics collection at `/metrics`
- **Grafana**: Dashboard at `http://localhost:3001`
- **Application Logs**: Structured logging with correlation IDs
- **Performance Monitoring**: Request timing and error tracking

### Access URLs (Production)

- **Frontend**: `http://your-domain.com`
- **API**: `http://your-domain.com/api`
- **API Docs**: `http://your-domain.com/docs`
- **Grafana**: `http://your-domain.com:3001`
- **Prometheus**: `http://your-domain.com:9090`

## 🔌 API Endpoints

### Authentication

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Get current user
- `POST /auth/refresh` - Refresh token

### Personas

- `GET /personas/` - List personas
- `POST /personas/` - Create persona
- `GET /personas/{id}` - Get persona
- `PUT /personas/{id}` - Update persona
- `DELETE /personas/{id}` - Delete persona

### Chat

- `GET /chat/conversations` - List conversations
- `POST /chat/conversations` - Create conversation
- `GET /chat/conversations/{id}/messages` - Get messages
- `POST /chat/conversations/{id}/messages` - Send message

### Media

- `POST /upload/` - Upload file
- `GET /media/{id}` - Get media file
- `DELETE /media/{id}` - Delete media file

## 🧪 Testing

### Run Tests

```bash
# Backend tests
python -m pytest tests/

# Frontend tests
cd frontend && npm test

# Integration tests
python test_auth.py
python test_chat.py
```

### Test Coverage

```bash
# Backend coverage
coverage run -m pytest tests/
coverage report

# Frontend coverage
cd frontend && npm run test:coverage
```

## 🔒 Security Considerations

### Production Checklist

- [ ] Change default SECRET_KEY
- [ ] Configure HTTPS with valid SSL certificates
- [ ] Set up proper CORS origins
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerting
- [ ] Regular security updates
- [ ] Database backups
- [ ] Log rotation and retention
- [ ] Environment variable security

### Security Headers

The application includes comprehensive security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy: default-src 'self'`

## 📈 Performance Optimization

### Database Optimization

- Indexed queries for common operations
- Connection pooling
- Query optimization
- Regular maintenance

### Caching Strategy

- Redis for session storage
- Response caching for static content
- Database query caching
- CDN for static assets

### Load Balancing

- Nginx reverse proxy
- Health checks
- Rate limiting
- SSL termination

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Wiki](https://github.com/your-username/digital-persona-platform/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-username/digital-persona-platform/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/digital-persona-platform/discussions)

## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history.

---

**Built with ❤️ using FastAPI, SQLAlchemy, and SQLite**
