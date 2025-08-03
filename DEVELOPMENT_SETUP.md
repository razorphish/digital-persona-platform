# Digital Persona Platform - Development Setup Guide

## Overview

This guide provides comprehensive instructions for setting up the Digital Persona Platform development environment after the major codebase cleanup and optimization completed in Phase 5.5.

## Project Structure

```
digital-persona-platform/
├── apps/
│   ├── web/                   # Next.js frontend application (SPA)
│   │   ├── src/app/          # App router pages
│   │   ├── src/components/   # React components & AuthGuard
│   │   └── src/contexts/     # Authentication context
│   └── server/               # tRPC Express backend
│       ├── src/router.ts     # API endpoints
│       ├── src/index.ts      # Server entry point
│       └── src/utils/        # S3 and utilities
├── packages/
│   ├── database/             # Drizzle schema and database config
│   └── shared/               # Shared types and utilities
├── python-ml-service/        # Optional AI/ML capabilities
├── scripts/                  # Development tools and AWS environment cleanup
├── docs/                     # Comprehensive documentation
├── .vscode/                  # VS Code debug configurations
├── docker-compose*.yml       # Docker configurations
├── docker-start.sh          # Docker startup script
└── terraform/                # AWS infrastructure
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

**Start Backend (tRPC API):**

```bash
cd apps/server
npm install
npm run dev
```

**Start Frontend (Next.js):**

```bash
cd apps/web
npm install
npm run dev
```

**Optional: Start Python ML Service:**

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

| Service           | URL                          | Description           |
| ----------------- | ---------------------------- | --------------------- |
| Next.js Frontend  | http://localhost:4000        | Main application      |
| tRPC Backend      | http://localhost:4001        | API server            |
| Backend Health    | http://localhost:4001/health | Health check          |
| PostgreSQL        | localhost:5432               | Primary database      |
| Python ML Service | http://localhost:8001        | Optional ML API       |
| ML Service Docs   | http://localhost:8001/docs   | Optional FastAPI docs |

## Debugging

### VS Code Debugging

The project includes comprehensive VS Code debugging configurations:

1. **Debug Next.js App**: Local Next.js debugging
2. **Debug Next.js App (Docker)**: Debug Next.js in Docker container
3. **Debug Python ML Service**: Local Python debugging
4. **Debug Python ML Service (Docker)**: Debug Python in Docker container
5. **Debug Full Stack**: Debug both services simultaneously
6. **Debug Full Stack (Docker)**: Full containerized environment with debugging

**Debugging Ports:**

- Next.js: 9229
- Python ML Service: 5678

### Manual Debugging

**Next.js with debugging:**

```bash
cd frontend
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
cd frontend
npm run build
```

**Test Python Service:**

```bash
cd python-ml-service
python -c "import app.main; print('✅ Import successful')"
```

**Test API Endpoints:**

```bash
# Frontend
curl http://localhost:4000

# Backend API Health
curl http://localhost:4001/health

# Backend tRPC API
curl http://localhost:4001/api/trpc/auth.me

# Optional: Python ML Service
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
- **Language**: TypeScript with React 18
- **Styling**: Tailwind CSS for modern UI
- **API Client**: tRPC for type-safe API calls
- **Authentication**: JWT-based with automatic redirects
- **Performance**: SPA build, lazy loading, React optimizations

### Backend (tRPC/Express)

- **Framework**: Express.js with tRPC for type-safe APIs
- **Language**: TypeScript with Node.js
- **Database**: Drizzle ORM with PostgreSQL
- **Authentication**: JWT with Better Auth integration
- **File Handling**: S3 integration for media uploads
- **Performance**: Connection pooling, async operations

### Database

- **Primary**: PostgreSQL for production
- **ORM**: Drizzle ORM for type-safe database operations
- **Migrations**: Drizzle Kit for schema management
- **Optional**: Python ML service for AI/ML capabilities

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
lsof -ti:4000 | xargs kill -9  # Frontend
lsof -ti:4001 | xargs kill -9  # Backend
lsof -ti:8001 | xargs kill -9  # Optional Python ML service
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
# For backend
cd apps/server
npm ci

# For frontend
cd apps/web
npm ci

# For Python service (optional)
cd python-ml-service
pip install -r requirements.txt
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
docker compose -f docker-compose.dev.yml logs -f frontend
docker compose -f docker-compose.dev.yml logs -f python-ml-service

# System logs
tail -f logs/*.log
```

### Health Checks

```bash
# Quick health check
curl http://localhost:4000 && curl http://localhost:4001/health

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
