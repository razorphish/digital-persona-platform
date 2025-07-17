# Digital Persona Platform - Development Setup Guide

## Overview

This guide provides comprehensive instructions for setting up the Digital Persona Platform development environment after the major codebase cleanup and optimization completed in Phase 5.5.

## Project Structure

```
digital-persona-platform/
├── nextjs-migration/          # Main Next.js application with API routes
├── python-ml-service/         # Specialized Python ML service
├── scripts/                   # Development and utility scripts
├── docs/                      # Documentation files
├── uploads/                   # File upload directory
├── chroma_db/                 # Vector database storage
├── .vscode/                   # VS Code debugging configuration
├── docker-compose.yml         # Production Docker setup
├── docker-compose.dev.yml     # Development Docker setup
└── README.md                  # Main project documentation
```

## Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Run the automated development setup script
./scripts/dev-setup.sh
```

This script will:

- Check Docker availability
- Set up environment variables
- Create necessary directories
- Build Docker images
- Start all services
- Show service status and useful commands

### Option 2: Manual Setup

#### Prerequisites

- **Docker & Docker Compose**: Latest version
- **Node.js**: v18+ (for local development)
- **Python**: 3.8+ (for ML service development)
- **Git**: Latest version

#### 1. Environment Configuration

Create a `.env` file in the project root:

```bash
# Next.js Configuration
NODE_ENV=development
NEXTAUTH_SECRET=your-secret-key-here-change-in-production

# Database
DATABASE_URL=sqlite:///app/digital_persona.db

# OpenAI API
OPENAI_API_KEY=your-openai-api-key-here

# AWS Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-west-1
S3_BUCKET_NAME=your-s3-bucket-name

# Redis
REDIS_URL=redis://redis:6379

# ML Service
ML_SERVICE_URL=http://python-ml-service:8001
```

#### 2. Directory Setup

```bash
# Create necessary directories
mkdir -p uploads chroma_db logs
```

#### 3. Local Development (without Docker)

**Start Next.js Application:**

```bash
cd nextjs-migration
npm install
npm run dev
```

**Start Python ML Service:**

```bash
cd python-ml-service
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

#### 4. Docker Development

**Development Environment:**

```bash
# Build and start development environment
docker compose -f docker-compose.dev.yml up --build

# Run in background
docker compose -f docker-compose.dev.yml up -d

# View logs
docker compose -f docker-compose.dev.yml logs -f

# Stop services
docker compose -f docker-compose.dev.yml down
```

**Production Environment:**

```bash
# Build and start production environment
docker compose up --build

# Run in background
docker compose up -d
```

## Service URLs

| Service           | URL                        | Description           |
| ----------------- | -------------------------- | --------------------- |
| Next.js App       | http://localhost:3001      | Main application      |
| Python ML Service | http://localhost:8001      | ML API service        |
| ML Service Docs   | http://localhost:8001/docs | FastAPI documentation |
| Redis             | localhost:6379             | Cache service         |
| SQLite Web (dev)  | http://localhost:8080      | Database viewer       |

## Debugging

### VS Code Debugging

The project includes comprehensive VS Code debugging configurations:

1. **Debug Next.js App**: Local Next.js debugging
2. **Debug Next.js App (Docker)**: Debug Next.js in Docker container
3. **Debug Python ML Service**: Local Python debugging
4. **Debug Python ML Service (Docker)**: Debug Python in Docker container
5. **Debug Full Stack**: Debug both services simultaneously

**Debugging Ports:**

- Next.js: 9229
- Python ML Service: 5678

### Manual Debugging

**Next.js with debugging:**

```bash
cd nextjs-migration
NODE_OPTIONS='--inspect=0.0.0.0:9229' npm run dev
```

**Python with debugging:**

```bash
cd python-ml-service
pip install debugpy
python -m debugpy --listen 0.0.0.0:5678 --wait-for-client -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

## Testing

### System Health Test

```bash
# Run comprehensive system health tests
./scripts/test-system.sh
```

### Manual Testing

**Test Next.js Build:**

```bash
cd nextjs-migration
npm run build
```

**Test Python Service:**

```bash
cd python-ml-service
python -c "import app.main; print('✅ Import successful')"
```

**Test API Endpoints:**

```bash
# Next.js API
curl http://localhost:3001/api/auth/login

# Python ML Service
curl http://localhost:8001/health
curl http://localhost:8001/docs
```

## Performance Features

The application includes advanced performance optimizations:

### React Performance

- **React.memo()** for component optimization
- **useCallback()** for event handler memoization
- **useMemo()** for expensive computations
- **Virtual scrolling** for large lists
- **Lazy loading** for images and components

### API Optimization

- **Intelligent caching** with stale-while-revalidate
- **Background refetching** on window focus
- **Optimistic updates** for better UX
- **Error recovery** with cached fallbacks

### Bundle Optimization

- **Code splitting** at route and component level
- **Tree shaking** for unused code elimination
- **Image optimization** with WebP format
- **Standalone output** for production builds

## Architecture

### Frontend (Next.js)

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with glassmorphism design
- **State Management**: React hooks and context
- **Real-time**: Native WebSocket implementation
- **Performance**: React.memo(), virtual scrolling, lazy loading

### Backend (Python ML Service)

- **Framework**: FastAPI with async support
- **AI/ML**: OpenAI integration, ChromaDB vector storage
- **File Handling**: S3 integration for media uploads
- **Performance**: Async processing, caching layers

### Database

- **Development**: SQLite for simplicity
- **Production**: Configurable (SQLite/PostgreSQL)
- **Caching**: Redis for session and API caching
- **Vector Storage**: ChromaDB for AI embeddings

## Deployment

### Development Deployment

```bash
# Quick development start
docker compose -f docker-compose.dev.yml up -d

# With database viewer
docker compose -f docker-compose.dev.yml --profile tools up -d
```

### Production Deployment

```bash
# Production with Nginx
docker compose --profile production up -d

# Basic production
docker compose up -d
```

### Environment-Specific Configurations

The project supports multiple environments:

- **Development**: Hot reload, debugging ports, verbose logging
- **Staging**: Production-like with debug capabilities
- **Production**: Optimized builds, security hardening, monitoring

## Troubleshooting

### Common Issues

**Port Already in Use:**

```bash
# Kill processes on specific ports
lsof -ti:3001 | xargs kill -9
lsof -ti:8001 | xargs kill -9
```

**Docker Build Issues:**

```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker compose build --no-cache
```

**Module Import Errors:**

```bash
# For Python service
cd python-ml-service
pip install -r requirements.txt

# For Next.js
cd nextjs-migration
npm ci
```

### Debug Checklist

- [ ] Environment variables set correctly
- [ ] All required ports available
- [ ] Docker daemon running
- [ ] API keys configured
- [ ] Directories created (uploads, chroma_db)
- [ ] Dependencies installed

## Monitoring and Logs

### View Logs

```bash
# All services
docker compose -f docker-compose.dev.yml logs -f

# Specific service
docker compose -f docker-compose.dev.yml logs -f nextjs-app
docker compose -f docker-compose.dev.yml logs -f python-ml-service

# System logs
tail -f logs/*.log
```

### Health Checks

```bash
# Quick health check
curl http://localhost:3001 && curl http://localhost:8001/health

# Detailed system test
./scripts/test-system.sh
```

## Development Workflow

### Recommended Workflow

1. **Start Development Environment:**

   ```bash
   ./scripts/dev-setup.sh
   ```

2. **Make Code Changes:**

   - Next.js: Hot reload automatically applies changes
   - Python: Service auto-reloads on file changes

3. **Debug When Needed:**

   - Use VS Code debug configurations
   - Attach to running Docker containers

4. **Test Changes:**

   ```bash
   ./scripts/test-system.sh
   ```

5. **Commit and Deploy:**
   ```bash
   git add .
   git commit -m "Your changes"
   git push
   ```

### Best Practices

- **Use environment-specific configs** for different deployment targets
- **Test both local and Docker environments** before committing
- **Monitor performance metrics** during development
- **Use debugging tools** for complex issues
- **Keep dependencies updated** regularly

## Security Considerations

- **Never commit** `.env` files with real credentials
- **Use strong secrets** in production environments
- **Regularly update** dependencies for security patches
- **Monitor** for vulnerabilities in Docker images
- **Implement** proper authentication and authorization

## Contributing

1. **Create feature branches** from `dev01`
2. **Test thoroughly** using provided scripts
3. **Update documentation** as needed
4. **Submit pull requests** with clear descriptions
5. **Ensure CI/CD passes** before merging

---

## Support

For issues or questions:

1. **Check this documentation** first
2. **Run system health tests**: `./scripts/test-system.sh`
3. **Check logs** for error details
4. **Review performance metrics** if applicable
5. **Create detailed issue reports** with reproduction steps

**Happy developing! 🚀**
