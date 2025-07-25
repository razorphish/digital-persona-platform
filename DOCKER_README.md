# Docker Setup - Digital Persona Platform

This document describes how to run the Digital Persona Platform using Docker with the new full-stack architecture (Node.js/tRPC backend + Next.js frontend).

## 🏗️ Architecture

### Services

- **Frontend**: Next.js application running on port 4000
- **Backend**: Node.js tRPC server running on port 4001
- **Redis**: Caching and session storage (development)
- **PostgreSQL**: Optional database (can switch from SQLite)

### Port Configuration (Docker-friendly 4xxx series)

- **4000**: Frontend (Next.js)
- **4001**: Backend (tRPC API)
- **6379**: Redis (when enabled)
- **5432**: PostgreSQL (when enabled)

## 🚀 Quick Start

### Development Environment

```bash
# Start development environment with hot reload
./docker-start.sh dev

# Or with rebuild
./docker-start.sh dev --build

# Start and show logs
./docker-start.sh dev --logs
```

### Production Environment

```bash
# Start production environment
./docker-start.sh prod

# With rebuild and logs
./docker-start.sh prod --build --logs
```

### Stopping Services

```bash
# Stop development environment
./docker-stop.sh dev

# Stop production environment
./docker-stop.sh prod

# Stop everything and cleanup
./docker-stop.sh all --clean
```

## 📋 Manual Docker Commands

### Development

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop development environment
docker-compose -f docker-compose.dev.yml down
```

### Production

```bash
# Build and start production environment
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop production environment
docker-compose down
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)

```bash
NODE_ENV=development
PORT=4001
DATABASE_URL=sqlite://./data/dev.db
JWT_SECRET=your-jwt-secret-here
CORS_ORIGIN=http://localhost:4000
```

#### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:4001
NEXT_PUBLIC_APP_ENV=development
BETTER_AUTH_SECRET=your-auth-secret-here
BETTER_AUTH_URL=http://localhost:4000
```

### Database Options

#### SQLite (Default)

- File-based database
- Good for development and small deployments
- Data persisted in Docker volume `backend_data`

#### PostgreSQL (Optional)

Uncomment the postgres service in docker-compose files and update DATABASE_URL:

```bash
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/digital_persona
```

## 📁 File Structure

```
digital-persona-platform/
├── apps/
│   ├── server/
│   │   ├── Dockerfile              # Backend container
│   │   ├── src/
│   │   └── package.json
│   └── web/
│       ├── Dockerfile              # Frontend container
│       ├── src/
│       └── package.json
├── packages/
│   ├── database/                   # Shared database package
│   └── shared/                     # Shared types/schemas
├── docker-compose.yml              # Production setup
├── docker-compose.dev.yml          # Development setup
├── docker-start.sh                 # Start script
├── docker-stop.sh                  # Stop script
└── .dockerignore                   # Docker ignore patterns
```

## 🛠️ Development Workflow

### Code Changes

- **Frontend**: Changes auto-reload thanks to Next.js hot reload
- **Backend**: Changes auto-reload thanks to tsx watch mode
- **Database**: Schema changes require rebuilding shared packages

### Debugging

#### View Container Logs

```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f backend
docker-compose -f docker-compose.dev.yml logs -f frontend
```

#### Execute Commands in Container

```bash
# Backend container
docker-compose -f docker-compose.dev.yml exec backend sh

# Frontend container
docker-compose -f docker-compose.dev.yml exec frontend sh
```

#### Database Access

```bash
# SQLite (in backend container)
docker-compose -f docker-compose.dev.yml exec backend sqlite3 data/dev.db

# PostgreSQL (if enabled)
docker-compose -f docker-compose.dev.yml exec postgres psql -U postgres -d digital_persona
```

## 🚨 Troubleshooting

### Common Issues

#### Port Conflicts

If ports 4000 or 4001 are in use:

```bash
# Check what's using the ports
lsof -i :4000
lsof -i :4001

# Kill processes if needed
pkill -f "node.*4000"
pkill -f "node.*4001"
```

#### Build Failures

```bash
# Clean rebuild
./docker-stop.sh all --clean
./docker-start.sh dev --build
```

#### Permission Issues

```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

#### Database Issues

```bash
# Reset database (⚠️ deletes data)
./docker-stop.sh dev --volumes
./docker-start.sh dev --build
```

### Health Checks

#### Service Status

```bash
# Check service health
curl http://localhost:4001/health
curl http://localhost:4000

# Container status
docker ps --filter "name=dpp-"
```

#### Network Connectivity

```bash
# Test backend from frontend container
docker-compose -f docker-compose.dev.yml exec frontend curl http://backend:4001/health

# Test from host
curl http://localhost:4001/api/trpc/hello
```

## 📊 Monitoring

### Resource Usage

```bash
# Container resource usage
docker stats --filter "name=dpp-"

# Disk usage
docker system df
```

### Logs

```bash
# Real-time logs
docker-compose -f docker-compose.dev.yml logs -f --tail=100

# Log files (if volume mounted)
docker-compose -f docker-compose.dev.yml exec backend ls -la /app/logs/
```

## 🔄 Updates and Maintenance

### Updating Dependencies

```bash
# Stop services
./docker-stop.sh dev

# Update package.json files
# Then rebuild
./docker-start.sh dev --build
```

### Backup Database

```bash
# SQLite backup
docker-compose -f docker-compose.dev.yml exec backend cp data/dev.db data/backup-$(date +%Y%m%d).db

# PostgreSQL backup (if using)
docker-compose -f docker-compose.dev.yml exec postgres pg_dump -U postgres digital_persona > backup.sql
```

### Clean System

```bash
# Remove unused Docker resources
docker system prune -a --volumes

# Complete reset (⚠️ removes everything)
./docker-stop.sh all --volumes --images --clean
```

## 🔒 Security Notes

### Production Deployment

- Change default secrets in environment variables
- Use proper TLS certificates
- Set up proper firewall rules
- Use container orchestration (Kubernetes, Docker Swarm)
- Implement proper monitoring and logging

### Development Security

- Don't commit .env files
- Use strong secrets even in development
- Regularly update base images
- Scan images for vulnerabilities

## 📚 Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Documentation](https://nextjs.org/docs/deployment#docker-image)
- [Node.js Docker Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
- [tRPC Documentation](https://trpc.io/docs)
