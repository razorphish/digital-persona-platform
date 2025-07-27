# Digital Persona Platform

<!-- CI/CD Pipeline Status - Updated after comprehensive fixes -->

**🚀 CI/CD Pipeline Status: FULLY OPERATIONAL** ✅  
_Last validated: January 18, 2025 - FINAL VALIDATION_

A modern full-stack AI-powered digital persona platform built with Next.js, tRPC, and Express. Create and manage AI-powered personas with advanced chat capabilities, file management, social media integration, and enterprise-grade authentication.

## 🏗️ Architecture

| Service               | Status        | Port | Description                                    |
| --------------------- | ------------- | ---- | ---------------------------------------------- |
| **Next.js Frontend**  | ✅ **Active** | 4000 | React SPA with tRPC client, file management UI |
| **tRPC Backend**      | ✅ **Active** | 4001 | Express API server with JWT auth, PostgreSQL   |
| **PostgreSQL**        | ✅ **Active** | 5432 | Primary database for users, personas, files    |
| **Python ML Service** | 🔧 Optional   | 8001 | AI/ML capabilities and processing              |

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended for full stack)
- **Node.js 18+** and npm (for local development)
- **PostgreSQL** (via Docker or local install)

## 🐳 Docker Setup (Recommended)

### Full Application with Docker

Run the entire platform in containers with a single command:

```bash
# Development environment with hot reload
./docker-start.sh dev

# Production environment
./docker-start.sh prod

# Development with rebuild and logs
./docker-start.sh dev --build --logs

# Stop all services
./docker-stop.sh dev
```

**Docker Access Points:**

- 🌐 **Frontend**: http://localhost:3100
- 🔧 **Backend API**: http://localhost:3101
- 📚 **API Health**: http://localhost:3101/health

### Docker Services

```bash
# Check service status
docker-compose -f docker-compose.dev.yml ps

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Individual service logs
docker logs dpp-frontend-dev
docker logs dpp-backend-dev
```

## 💻 Local Development Setup

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

### ✅ Recently Implemented & Enhanced

- **🔐 Enterprise Authentication System**:
  - JWT-based auth with automatic token validation
  - Periodic token refresh and cross-tab synchronization
  - Protected routes with automatic redirect to login
  - Industry-standard security practices
- **🛡️ Protected Pages**: Dashboard, File Management, Chat, Social, Analytics, Personas
- **📁 Advanced File Management**: Upload, view, manage files with comprehensive stats
- **🏗️ Full Docker Support**: Complete containerized development and production setup
- **🎯 SPA Deployment**: Static build generation for S3 + CloudFront deployment
- **🐛 Debug Configuration**: VS Code debugging with automatic port cleanup
- **🔧 Error Resolution**: Fixed authentication race conditions and UI bugs

### 🔧 Core Capabilities

- **👤 User Management**: Registration, login, JWT authentication with automatic redirects
- **🤖 Digital Personas**: Create and manage AI-powered persona profiles (coming soon)
- **📤 File Upload & Management**: Direct S3 uploads with metadata tracking
- **📊 Real-time Stats**: File counts, sizes, and usage analytics
- **🔗 tRPC API**: Type-safe client-server communication
- **🗄️ Database Integration**: PostgreSQL with Drizzle ORM
- **🎨 Social Media Integration**: Connect and analyze social media presence (coming soon)
- **📈 Analytics & Insights**: Personality analysis and behavior tracking (coming soon)

## 🛡️ Authentication & Security

### Authentication Flow

1. **Register/Login** → Frontend sends credentials to `/api/trpc/auth.register|login`
2. **JWT Token** → Server responds with signed JWT token
3. **Secure Storage** → Frontend stores token securely in localStorage
4. **Auto-Protection** → AuthGuard and AuthMiddleware protect all routes
5. **Token Validation** → Automatic expiration checks and cross-tab sync
6. **Automatic Redirects** → Invalid/expired tokens redirect to login

### Protected Routes

All authenticated pages automatically redirect to login when:

- Token is missing, expired, or corrupted
- User is not authenticated
- Cross-tab logout occurs

**Protected Pages:**

- `/dashboard` - Main dashboard with overview
- `/files` - File management and analytics
- `/chat` - AI conversation interface (coming soon)
- `/social` - Social media integration (coming soon)
- `/analytics` - Personality insights (coming soon)
- `/personas` - Digital persona management (coming soon)

**Public Routes:**

- `/` - Landing page
- `/auth/login` - Login page
- `/auth/register` - Registration page
- `/test` - API testing page

## 📁 Project Structure

```
digital-persona-platform/
├── apps/
│   ├── web/                    # Next.js Frontend (SPA)
│   │   ├── src/app/           # App router pages
│   │   ├── src/components/    # React components & AuthGuard
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
├── scripts/                   # Development tools and AWS environment cleanup
├── docs/                      # Comprehensive documentation
├── docker-compose*.yml        # Docker configurations
├── docker-start.sh           # Docker startup script
└── terraform/                 # AWS infrastructure
```

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

### File Statistics

- Real-time file counts and sizes
- Upload status tracking
- Media type categorization (images, videos, documents)
- User-specific file analytics

## 🔧 Development Tools

### Port Conflict Resolution

Automatic port cleanup for smooth development:

```bash
# Automatic cleanup (recommended)
./scripts/kill-port-conflicts.sh

# Interactive cleanup
./scripts/interactive-port-cleanup.sh
```

### Environment Cleanup

Dynamic AWS environment cleanup for sub-environments (qa10, dev01, staging33, etc.):

#### Local Script Usage

```bash
# Clean up specific environment (with confirmation)
./scripts/dynamic-cleanup-environment.sh qa10

# Force cleanup (skip confirmation - for CI/CD)
FORCE_CLEANUP=true ./scripts/dynamic-cleanup-environment.sh qa10

# Examples for different environments
./scripts/dynamic-cleanup-environment.sh dev05   # Clean dev05
./scripts/dynamic-cleanup-environment.sh qa03    # Clean qa03
./scripts/dynamic-cleanup-environment.sh staging01  # Clean staging01
```

#### GitHub Actions Workflow

Use the automated cleanup workflow via GitHub Actions:

```bash
# Trigger via GitHub CLI (dry run first)
gh workflow run cleanup-subenv.yml \
  --field environment=qa10 \
  --field force_cleanup=true \
  --field dry_run=true

# Actual cleanup (removes resources)
gh workflow run cleanup-subenv.yml \
  --field environment=qa10 \
  --field force_cleanup=true \
  --field dry_run=false
```

Or via GitHub web interface:

1. Go to **Actions** → **Cleanup Sub-Environment**
2. Set parameters:
   - `environment`: Target environment (e.g., `qa10`)
   - `force_cleanup`: `true` (required for execution)
   - `dry_run`: `true` for testing, `false` for actual cleanup

#### What Gets Cleaned Up

The cleanup process removes **ALL** resources for the specified environment:

- 🗑️ **AWS Infrastructure**: VPC, subnets, security groups, internet gateways
- 🗑️ **Serverless Resources**: Lambda functions, API Gateway, CloudWatch logs
- 🗑️ **Storage**: S3 buckets (with versioned object cleanup), RDS clusters
- 🗑️ **AI/ML Services**: AWS Batch compute environments, job queues, SQS queues, ECR repositories
- 🗑️ **Networking**: Route53 DNS records, RDS Proxy endpoints
- 🗑️ **Security**: IAM roles, policies, instance profiles, Secrets Manager secrets

#### Safety Features

- ✅ **Environment Isolation**: Only targets resources matching `MAIN_ENV-TARGET_ENV-dpp*` pattern
- ✅ **Explicit Confirmation**: Requires typing `DELETE qa10` to confirm (local script)
- ✅ **Parameter Validation**: Script fails if no environment specified
- ✅ **Dynamic Queries**: Uses AWS `starts_with()` filters, no hard-coded resource names
- ✅ **Comprehensive Verification**: Checks remaining resources after cleanup
- ✅ **Timeout Protection**: Prevents hanging with 10-15 minute timeouts

### Useful Commands

```bash
# Docker operations
./docker-start.sh dev --build      # Start development with rebuild
./docker-stop.sh dev               # Stop development environment

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

- **Problem**: Redirecting to login after successful authentication
- **Solution**: Check console for token validation errors, ensure JWT payload has required fields

#### Database Connection Issues

- **Problem**: `password authentication failed`
- **Solution**: Verify PostgreSQL container is running and `DATABASE_URL` is correct

#### AWS Environment Issues

- **Problem**: Sub-environment resources left over after branch deletion
- **Solution**: Use cleanup scripts to remove orphaned AWS resources:

  ```bash
  # Check what would be deleted first
  gh workflow run cleanup-subenv.yml --field environment=qa05 --field dry_run=true --field force_cleanup=true

  # Clean up the environment
  ./scripts/dynamic-cleanup-environment.sh qa05
  ```

#### Docker Issues

- **Problem**: Container startup failures
- **Solution**:

  ```bash
  # Rebuild containers
  ./docker-start.sh dev --build

  # Check logs
  docker-compose -f docker-compose.dev.yml logs
  ```

#### File Upload Failures

- **Problem**: Upload stuck at pending
- **Solution**: Check AWS credentials and S3 bucket permissions

### Debug Information

```bash
# Check server status
curl http://localhost:4001/health

# View logs
docker logs dpp-postgres
docker logs dpp-backend-dev
docker logs dpp-frontend-dev

# Database connectivity
docker exec -it dpp-postgres psql -U dpp_user -d digital_persona
```

## 📚 Documentation

| Document                                                           | Description                      |
| ------------------------------------------------------------------ | -------------------------------- |
| [DOCKER_README.md](./DOCKER_README.md)                             | Comprehensive Docker setup guide |
| [DOCKER_SETUP_COMPLETE.md](./DOCKER_SETUP_COMPLETE.md)             | Docker configuration details     |
| [DEBUG_SETUP.md](./DEBUG_SETUP.md)                                 | VS Code debugging configuration  |
| [VSCODE_DEBUG_CONFIGURATIONS.md](./VSCODE_DEBUG_CONFIGURATIONS.md) | Complete debug setup             |
| [AUTHENTICATION_SYSTEM.md](./docs/AUTHENTICATION_SYSTEM.md)        | Auth implementation details      |
| [DATABASE.md](./docs/DATABASE.md)                                  | Database schema and operations   |
| [UPLOAD_SYSTEM.md](./docs/UPLOAD_SYSTEM.md)                        | File upload architecture         |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Workflow

1. Use Docker for consistent development environment: `./docker-start.sh dev`
2. Or use VS Code debug configurations for integrated development
3. Run tests before committing
4. Ensure both frontend and backend work together
5. Update documentation for new features

## 🎯 Roadmap

### ✅ Completed

- [x] Enterprise-grade authentication system with auto-redirects
- [x] Protected route implementation with AuthGuard
- [x] Full Docker containerization for development and production
- [x] Advanced file management with S3 integration
- [x] SPA deployment configuration
- [x] VS Code debugging setup with automatic port cleanup
- [x] Comprehensive error handling and user feedback

### 🚧 In Progress

- [ ] Chat system implementation with AI personas
- [ ] Social media integration and analysis
- [ ] Advanced analytics and personality insights
- [ ] Real-time persona interactions

### 📋 Planned

- [ ] Voice synthesis integration
- [ ] Computer vision capabilities
- [ ] Mobile app development
- [ ] Advanced AI learning capabilities

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🎉 Getting Started

**For immediate development:**

1. **Docker (Recommended)**: `./docker-start.sh dev --logs`
2. **VS Code**: Use "Debug Full Stack" configuration
3. **Manual**: Follow the Local Development Setup above

The platform includes **enterprise-grade authentication**, **full containerization**, and **comprehensive file management** - ready for both development and production deployment!

**🔗 Quick Access:**

- **Docker Frontend**: http://localhost:3100
- **Docker Backend**: http://localhost:3101
- **Local Frontend**: http://localhost:4000
- **Local Backend**: http://localhost:4001
