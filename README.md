# Digital Persona Platform

A modern full-stack AI-powered digital persona platform built with Next.js, tRPC, and Express. Create and manage AI-powered personas with advanced chat capabilities, file management, and social media integration.

## 🏗️ Architecture

| Service               | Status        | Port | Description                                    |
| --------------------- | ------------- | ---- | ---------------------------------------------- |
| **Next.js Frontend**  | ✅ **Active** | 4000 | React SPA with tRPC client, file management UI |
| **tRPC Backend**      | ✅ **Active** | 4001 | Express API server with JWT auth, PostgreSQL   |
| **PostgreSQL**        | ✅ **Active** | 5432 | Primary database for users, personas, files    |
| **Python ML Service** | 🔧 Optional   | 8001 | AI/ML capabilities and processing              |

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** and npm
- **Docker & Docker Compose** (for PostgreSQL)
- **PostgreSQL** (via Docker or local install)

### 1. Clone and Setup

```bash
git clone <repository-url>
cd digital-persona-platform
npm install
```

### 2. Start Database

```bash
# Start PostgreSQL with Docker
docker-compose up postgres -d

# Verify database is running
docker logs dpp-postgres
```

### 3. Environment Configuration

The `.env` file should already be configured with:

```env
# Database
DATABASE_URL=postgresql://dpp_user:dpp_password@localhost:5432/digital_persona

# Authentication
JWT_SECRET=development-jwt-secret

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET=your-bucket-name
```

### 4. Start Development Servers

#### Option A: VS Code (Recommended)

- Press `F5` or use "Debug Full Stack" configuration
- Automatic port cleanup and environment setup
- Both frontend and backend with debugging support

#### Option B: Manual Start

```bash
# Terminal 1: Start Backend
cd apps/server
npm run dev

# Terminal 2: Start Frontend
cd apps/web
npm run dev
```

### 5. Access Applications

- 🌐 **Frontend**: http://localhost:4000
- 🔧 **Backend API**: http://localhost:4001
- 📚 **API Health**: http://localhost:4001/health
- 🗄️ **Database**: PostgreSQL on localhost:5432

## 🎯 Key Features

### ✅ Recently Implemented & Fixed

- **Full-Stack Authentication**: JWT-based auth with proper token handling
- **File Management System**: Upload, view, manage files with stats dashboard
- **SPA Deployment**: Static build generation for S3 + CloudFront deployment
- **Debug Configuration**: VS Code debugging with automatic port cleanup
- **Error Resolution**: Fixed SQL syntax errors, authentication issues, and UI bugs

### 🔧 Core Capabilities

- **User Management**: Registration, login, JWT authentication
- **Digital Personas**: Create and manage AI-powered persona profiles
- **File Upload & Management**: Direct S3 uploads with metadata tracking
- **Real-time Stats**: File counts, sizes, and usage analytics
- **tRPC API**: Type-safe client-server communication
- **Database Integration**: PostgreSQL with Drizzle ORM

## 📁 Project Structure

```
digital-persona-platform/
├── apps/
│   ├── web/                    # Next.js Frontend (SPA)
│   │   ├── src/app/           # App router pages
│   │   ├── src/components/    # React components
│   │   ├── src/contexts/      # Authentication context
│   │   └── src/services/      # API services
│   └── server/                # tRPC Express Backend
│       ├── src/router.ts      # API endpoints
│       ├── src/index.ts       # Server entry point
│       └── src/utils/         # S3 and utilities
├── packages/
│   ├── database/              # Drizzle schema and config
│   └── shared/                # Shared types and utilities
├── .vscode/                   # VS Code debug configurations
├── scripts/                   # Port cleanup and automation scripts
├── docs/                      # Comprehensive documentation
└── terraform/                 # AWS infrastructure
```

## 🔐 Authentication Flow

1. **Register/Login** → Frontend sends credentials to `/api/trpc/auth.register|login`
2. **JWT Token** → Server responds with signed JWT token
3. **Local Storage** → Frontend stores token as `accessToken`
4. **API Requests** → All requests include `Authorization: Bearer <token>` header
5. **Middleware** → Server validates JWT and injects user context

## 🗃️ Database Schema

- **users**: User accounts with email, password hash, timestamps
- **personas**: Digital personas linked to users
- **media_files**: File metadata with S3 keys, upload status
- **conversations & messages**: Chat system (future implementation)
- **social_connections**: Social media integrations (future)

## 📊 File Management

### Upload Process

1. **Request Presigned URL** → Client requests upload permission
2. **Direct S3 Upload** → File uploaded directly to S3
3. **Update Status** → Notify server of successful upload
4. **Database Record** → File metadata stored in PostgreSQL

### File Operations

- ✅ **Upload**: Images, videos, documents
- ✅ **View**: File list with stats, thumbnails, metadata
- ✅ **Delete/Restore**: Soft delete with restore capability
- ✅ **Stats Dashboard**: Total files, sizes, type breakdown

## 🚀 Deployment Options

### SPA Deployment (S3 + CloudFront)

```bash
# Build static export
npm run build:export

# Deploy to S3 (60-80% cost reduction)
./deploy-spa.sh
```

### Full-Stack Docker Deployment

```bash
# Production build
docker-compose -f docker-compose.yml up

# Development with hot reload
docker-compose -f docker-compose.dev.yml up
```

### AWS ECS/Terraform

```bash
cd terraform/environments/main
terraform init && terraform apply
```

## 🛠️ Development Tools

### VS Code Debug Configurations

- **Launch Full Stack**: Both services, no debugging overhead
- **Debug Full Stack**: Frontend + backend debugging
- **Debug Full Stack (Interactive)**: With port cleanup prompts
- **Individual Services**: Backend-only or frontend-only

### Port Cleanup Scripts

```bash
# Automatic cleanup
./scripts/kill-port-conflicts.sh

# Interactive cleanup
./scripts/interactive-port-cleanup.sh
```

### Useful Commands

```bash
# Database operations
cd apps/server
npm run db:push        # Push schema changes
npm run db:studio      # Open database studio

# Frontend operations
cd apps/web
npm run build:export   # Build static SPA
npm run dev           # Development server

# Testing
npm run test          # Run test suite
./test-debug-setup.sh # Test debug configurations
```

## 🔧 Troubleshooting

### Common Issues & Solutions

#### Port Conflicts (EADDRINUSE)

- **Problem**: `Error: listen EADDRINUSE: address already in use :::4001`
- **Solution**: Use VS Code debug configs (auto-cleanup) or run `./scripts/kill-port-conflicts.sh`

#### Authentication Errors

- **Problem**: `UNAUTHORIZED` errors
- **Solution**: Ensure `JWT_SECRET` matches between login/verification (restart server)

#### Database Connection Issues

- **Problem**: `password authentication failed`
- **Solution**: Verify PostgreSQL container is running and `DATABASE_URL` is correct

#### File Upload Failures

- **Problem**: Upload stuck at pending
- **Solution**: Check AWS credentials and S3 bucket permissions

### Debug Information

```bash
# Check server status
curl http://localhost:4001/health

# View logs
docker logs dpp-postgres
pm2 logs (if using PM2)

# Database connectivity
docker exec -it dpp-postgres psql -U dpp_user -d digital_persona
```

## 📚 Documentation

| Document                                                           | Description                     |
| ------------------------------------------------------------------ | ------------------------------- |
| [S3_SPA_DEPLOYMENT.md](./docs/S3_SPA_DEPLOYMENT.md)                | Static deployment guide         |
| [DEBUG_SETUP.md](./DEBUG_SETUP.md)                                 | VS Code debugging configuration |
| [VSCODE_DEBUG_CONFIGURATIONS.md](./VSCODE_DEBUG_CONFIGURATIONS.md) | Complete debug setup            |
| [AUTHENTICATION_SYSTEM.md](./docs/AUTHENTICATION_SYSTEM.md)        | Auth implementation details     |
| [DATABASE.md](./docs/DATABASE.md)                                  | Database schema and operations  |
| [UPLOAD_SYSTEM.md](./docs/UPLOAD_SYSTEM.md)                        | File upload architecture        |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Workflow

1. Use VS Code debug configurations for development
2. Run tests before committing
3. Ensure both frontend and backend work together
4. Update documentation for new features

## 🎯 Roadmap

### ✅ Completed

- [x] Full-stack authentication system
- [x] File management with S3 integration
- [x] SPA deployment configuration
- [x] VS Code debugging setup
- [x] Port conflict resolution
- [x] Error handling and user feedback

### 🚧 In Progress

- [ ] Chat system implementation
- [ ] AI persona interactions
- [ ] Social media integrations
- [ ] Advanced file processing

### 📋 Planned

- [ ] Real-time chat with WebSockets
- [ ] Voice synthesis integration
- [ ] Computer vision capabilities
- [ ] Mobile app development

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**🎉 The platform is fully functional with frontend, backend, authentication, and file management capabilities!**

For immediate development, use VS Code's "Debug Full Stack" configuration for the best experience with automatic port cleanup and integrated debugging.
