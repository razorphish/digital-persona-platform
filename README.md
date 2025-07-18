# Digital Persona Platform

An AI-powered digital persona platform with advanced capabilities for personality learning, social media integration, and content management. The platform provides a comprehensive backend API for building digital personas.

## 🏗️ Architecture

**Current Configuration: Backend-Only Mode**

| Service           | Status                | Port       | Description                                         |
| ----------------- | --------------------- | ---------- | --------------------------------------------------- |
| FastAPI Backend   | ✅ Active             | 8000       | Main API server with authentication, personas, chat |
| Python ML Service | ✅ Active             | 8001       | Machine learning and AI capabilities                |
| PostgreSQL/SQLite | ✅ Active             | 5432/local | Database for user data and personas                 |
| Redis             | 🔧 Optional           | 6379       | Caching and session management                      |
| **Frontend**      | ❌ **Not Configured** | -          | **No frontend is currently available**              |

## 🚀 Quick Start

### Prerequisites

- Python 3.12+
- Docker & Docker Compose (optional)
- PostgreSQL (optional - SQLite is default)

### Local Development (Recommended)

```bash
# Clone and setup
git clone <repository-url>
cd digital-persona-platform

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the backend services
./start.sh
```

**Services will be available at:**

- 🔧 Backend API: http://localhost:8000
- 📚 API Documentation: http://localhost:8000/docs
- ❌ Frontend: Not configured

### Docker Development

```bash
# Start all services with Docker
docker-compose -f docker-compose.dev.yml up

# Or simple backend-only mode
docker-compose -f docker-compose.simple.yml up
```

## 📖 API Documentation

With the backend running, visit:

- **Interactive API Docs**: http://localhost:8000/docs
- **ReDoc Format**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## 🔧 Development Scripts

| Script                | Purpose                                |
| --------------------- | -------------------------------------- |
| `./start.sh`          | Start backend services locally         |
| `./start-frontend.sh` | ❌ Frontend not configured             |
| `./start-zen-full.sh` | Start all backend services in zen mode |
| `./build.sh`          | Build and deploy to AWS                |
| `./deploy.sh`         | Deploy to production                   |

## 🗂️ Project Structure

```
digital-persona-platform/
├── app/                    # FastAPI backend application
│   ├── routers/           # API route handlers
│   ├── models/            # Database models
│   ├── services/          # Business logic
│   └── main.py           # Application entry point
├── python-ml-service/     # Machine learning service
├── terraform/             # Infrastructure as code
├── scripts/              # Deployment and utility scripts
├── uploads/              # File upload storage
└── docs/                 # Documentation
```

## 🎯 Key Features

### Backend API Features

- **User Authentication**: JWT-based auth with secure registration/login
- **Digital Personas**: Create and manage AI-powered personas
- **Chat System**: Real-time conversations with personas
- **Media Upload**: File upload and S3 integration
- **AI Capabilities**: OpenAI integration, voice synthesis, computer vision
- **Social Media Learning**: Instagram, Twitter integration for personality learning

### Available Endpoints

- `/auth/*` - Authentication and user management
- `/personas/*` - Digital persona CRUD operations
- `/chat/*` - Chat conversations and messages
- `/media/*` - File upload and media management
- `/integrations/*` - Social media integrations
- `/ai/*` - AI capabilities and services

## 🔐 Authentication

The platform uses JWT-based authentication:

```bash
# Register a new user
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Login
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

## 🌍 Environment Configuration

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=sqlite+aiosqlite:///./digital_persona.db

# JWT Configuration
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OpenAI Integration
OPENAI_API_KEY=your-openai-api-key-here

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_DEFAULT_REGION=us-west-1
S3_BUCKET_NAME=your-bucket-name

# Redis (Optional)
REDIS_URL=redis://localhost:6379
```

## 🏭 Production Deployment

The platform includes comprehensive AWS deployment with Terraform:

```bash
# Deploy to production
./deploy.sh

# Or step by step
cd terraform/environments/main
terraform init
terraform plan
terraform apply
```

**Production Features:**

- Auto-scaling ECS containers
- Application Load Balancer
- RDS PostgreSQL database
- S3 for file storage
- CloudWatch monitoring
- Cost optimization

## 🔍 Monitoring & Health

- **Health Check**: http://localhost:8000/health
- **Metrics**: http://localhost:8000/metrics
- **Logs**: Check `logs/` directory or CloudWatch in production

## 📚 Additional Documentation

- [Authentication System](./AUTHENTICATION.md)
- [Chat System](./CHAT_SYSTEM.md)
- [Database Schema](./DATABASE.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Media Upload System](./MEDIA_UPLOAD.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Note**: This platform is currently configured in backend-only mode. To add a frontend, implement your preferred solution (React, Vue, Angular, etc.) and configure it to connect to the backend API at `http://localhost:8000`.
