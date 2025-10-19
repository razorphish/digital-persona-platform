# Digital Persona Platform

**🚀 Modern Social Media Platform** ✅  
_Built with Next.js 14, tRPC, and AWS Serverless_

A modern full-stack social media platform for creating and managing digital personas. Features include real-time feeds, file uploads, creator monetization, and enterprise-grade authentication with auto-scaling serverless infrastructure.

## 🏗️ Architecture

| Service               | Status        | Port | Description                                      |
| --------------------- | ------------- | ---- | ------------------------------------------------ |
| **Next.js Frontend**  | ✅ **Active** | 3000 | React SPA with feed, personas, creator dashboard |
| **Node.js Backend**   | ✅ **Active** | 4001 | tRPC API server with JWT auth, Drizzle ORM       |
| **PostgreSQL**        | ✅ **Active** | 5432 | Primary database with optimized feed indexes     |
| **Python ML Service** | 🔧 Optional   | 8001 | AI/ML capabilities and computer vision           |

## 🚀 Quick Start

### Prerequisites

- **Docker** (for PostgreSQL database)
- **Node.js 18+** and npm
- **AWS CLI** (for production deployment)

## 💻 Local Development

### 1. Start Database

```bash
# Start PostgreSQL with Docker
docker-compose up postgres -d

# Verify database is running
docker ps
```

### 2. Install Dependencies

```bash
# Install all packages
npm install
```

### 3. Start Development Servers

```bash
# Terminal 1: Backend
cd apps/server && npm run dev

# Terminal 2: Frontend  
cd apps/web && npm run dev
```

### 4. Access Applications

- 🌐 **Frontend**: http://localhost:3000
- 🔧 **Backend**: http://localhost:4001/health
- 🗄️ **Database**: PostgreSQL on localhost:5432

## 🚀 Serverless Deployment

Deploy the full stack to AWS with SSL certificates and custom domains using the integrated deployment script.

### Quick Deployment

```bash
# Deploy to any environment with SSL
./scripts/deploy-serverless.sh -e dev -s dev01    # → https://dev01.hibiji.com
./scripts/deploy-serverless.sh -e dev -s qa02     # → https://qa02.hibiji.com
./scripts/deploy-serverless.sh -e dev -s staging  # → https://staging.hibiji.com
```

### Deployment Options

```bash
# Full deployment (build + infrastructure + SSL)
./scripts/deploy-serverless.sh -e dev -s dev01

# Skip build, deploy infrastructure only
./scripts/deploy-serverless.sh -b -e dev -s dev01

# Skip infrastructure, deploy code only
./scripts/deploy-serverless.sh -i -e dev -s dev01

# Dry run (preview changes)
./scripts/deploy-serverless.sh -d -e dev -s dev01

# Help
./scripts/deploy-serverless.sh -h
```

### What Gets Deployed

**🏗️ Infrastructure (Terraform):**

- ✅ **SSL Certificates**: Automatic ACM certificates in us-east-1
- ✅ **CloudFront CDN**: Custom domain with SSL attachment
- ✅ **S3 Static Website**: Frontend hosting with custom domain
- ✅ **Lambda Functions**: Backend API with VPC integration
- ✅ **API Gateway**: HTTP API with CORS and custom domain
- ✅ **RDS Aurora**: PostgreSQL database with proxy
- ✅ **Route53 DNS**: Automatic DNS records and validation

**🚀 Applications:**

- ✅ **Frontend**: Next.js SPA built and deployed to S3
- ✅ **Backend**: Node.js Lambda with production optimizations
- ✅ **Database**: Automatic migrations and connection pooling

**🔒 Security & SSL:**

- ✅ **Custom Domain**: `{sub-environment}.hibiji.com`
- ✅ **SSL Certificate**: Valid HTTPS with automatic renewal
- ✅ **DNS Validation**: Automatic Route53 certificate validation
- ✅ **Security Headers**: CloudFront security optimizations

### Deployment Output

```bash
==========================================
🎉 DEPLOYMENT SUMMARY
==========================================

Environment: dev/dev01
🌐 Custom Domain (SSL): https://dev01.hibiji.com
🔒 SSL Certificate Status: ISSUED
🔗 API URL: https://dev01-api.hibiji.com/v1
📡 CloudFront URL: https://d6qpaqu5yyo7w.cloudfront.net
📦 S3 Bucket: dev-dev01-dpp-website
⚡ Lambda Function: dev-dev01-dpp-api

🔍 Verifying SSL deployment...
✅ SSL certificate is working!
```

### Environment Management

**Create unlimited environments:**

```bash
# Development environments
./scripts/deploy-serverless.sh -e dev -s dev01
./scripts/deploy-serverless.sh -e dev -s dev02
./scripts/deploy-serverless.sh -e dev -s dev03

# QA environments
./scripts/deploy-serverless.sh -e dev -s qa01
./scripts/deploy-serverless.sh -e dev -s qa02

# Special environments
./scripts/deploy-serverless.sh -e dev -s hotfix
./scripts/deploy-serverless.sh -e dev -s demo
./scripts/deploy-serverless.sh -e dev -s preview
```

**Environment cleanup:**

```bash
# Clean up specific environment (including SSL)
./scripts/dynamic-cleanup-environment.sh dev dev01

# Interactive SSL certificate cleanup
./scripts/cleanup-ssl-certificates.sh
```

### Prerequisites for Deployment

1. **AWS CLI configured** with appropriate permissions
2. **Terraform installed** (v1.0+)
3. **Node.js 18+** for build process
4. **Domain hosted in Route53** (hibiji.com configured)

### Deployment Architecture

| Component      | Technology                       | Purpose                          |
| -------------- | -------------------------------- | -------------------------------- |
| **Frontend**   | S3 + CloudFront                  | Static website hosting with CDN  |
| **Backend**    | Lambda + API Gateway             | Serverless API with auto-scaling |
| **Database**   | Aurora Serverless v2 + RDS Proxy | Auto-scaling PostgreSQL          |
| **SSL**        | ACM + Route53                    | Automatic certificate management |
| **DNS**        | Route53                          | Custom domain routing            |
| **Monitoring** | CloudWatch                       | Logs and metrics                 |

**🎯 Benefits:**

- 🔒 **Production SSL** - Valid HTTPS certificates
- 💰 **Cost Optimized** - Serverless auto-scaling
- 🚀 **Fast Deployment** - Single command deployment
- 🧹 **Easy Cleanup** - Environment-specific cleanup
- 📈 **Unlimited Environments** - Dynamic sub-environment support

## 💰 Cost-Optimized AWS Deployment

Deploy personal development environments and cost-optimized test environments with aggressive savings (70-90% cost reduction vs production).

### 🏗️ Environment Types

| Environment | Monthly Cost | Use Case             | Auto-Pause | Capacity             |
| ----------- | ------------ | -------------------- | ---------- | -------------------- |
| **local**   | ~$10-30      | Personal AWS sandbox | 5 min      | Minimal (0.5-1 ACU)  |
| **dev**     | ~$50-100     | Team development     | 5 min      | Standard (0.5-2 ACU) |
| **qa**      | ~$75-150     | QA testing           | 10 min     | Testing (0.5-4 ACU)  |

### 🚀 Quick Cost-Optimized Deployment

```bash
# Deploy your personal local environment
./scripts/deploy-cost-optimized.sh local mars    # → https://mars.hibiji.com (~$10-30/month)

# Deploy cost-optimized dev environment
./scripts/deploy-cost-optimized.sh dev dev01     # → https://dev01.hibiji.com (~$50-100/month)

# Deploy QA environment with higher capacity
./scripts/deploy-cost-optimized.sh qa qa03       # → https://qa03.hibiji.com (~$75-150/month)
```

### 💡 Cost Optimization Features

**🏗️ Infrastructure Optimizations:**

- ✅ **Aurora Auto-Pause**: Database shuts down after 5-10 minutes of inactivity
- ✅ **Minimal Lambda Memory**: 256-512MB vs 1024MB+ in production
- ✅ **Spot Instances**: 50-70% savings on AWS Batch ML workloads
- ✅ **Aggressive S3 Lifecycle**: Auto-cleanup of old files (7-365 days)
- ✅ **Reduced Log Retention**: 7-30 days vs 90+ days in production
- ✅ **Single AZ**: No multi-AZ redundancy for test environments

**💰 Cost Monitoring:**

- ✅ **AWS Budgets**: Automatic budget alerts per environment
- ✅ **Email Notifications**: 80% usage warning, 100% forecast alert
- ✅ **Resource Tagging**: `CostOptimized=true` for easy tracking

### 📋 Deployment Options

```bash
# Plan deployment (preview changes)
./scripts/deploy-cost-optimized.sh local mars --plan

# Deploy with custom budget
./scripts/deploy-cost-optimized.sh dev dev01 --budget 75

# Deploy with faster auto-pause
./scripts/deploy-cost-optimized.sh local mars --pause-delay 300

# Force deployment (skip confirmations)
./scripts/deploy-cost-optimized.sh qa qa03 --force

# Destroy environment
./scripts/deploy-cost-optimized.sh local mars --destroy
```

### 🧹 Automated Cleanup

Cost-optimized environments include automated cleanup to prevent cost overruns:

```bash
# Clean all cost-optimized environments
./scripts/cleanup-cost-optimized.sh all

# Clean specific environment (dry run)
./scripts/cleanup-cost-optimized.sh local --dry-run

# Aggressive cleanup (7-day retention)
./scripts/cleanup-cost-optimized.sh dev --aggressive

# Clean only CloudWatch logs
./scripts/cleanup-cost-optimized.sh qa --logs-only
```

**🗂️ What Gets Cleaned:**

- 📝 **CloudWatch Logs**: Old log streams and groups
- 🗂️ **S3 Objects**: Files past lifecycle policy
- 📸 **RDS Snapshots**: Manual snapshots older than 7 days
- ⚡ **Lambda Versions**: Keep only latest 5 versions
- 📊 **Batch Jobs**: Cancel queued/pending jobs

### 🎯 Personal Local Environment (`local-mars-###`)

Perfect for individual developers who want their own AWS sandbox:

```bash
# Deploy your personal environment
./scripts/deploy-cost-optimized.sh local mars

# Resources created:
# - local-mars-dpp-uploads (S3 bucket)
# - local-mars-dpp-cluster (Aurora database)
# - local-mars-dpp-api (Lambda function)
# - https://mars.hibiji.com (your personal domain)
# - https://mars-api.hibiji.com (your API)
```

**📊 Personal Environment Benefits:**

- 🔐 **Isolated**: Your own AWS resources, no conflicts
- 💰 **Cheap**: ~$10-30/month with auto-pause
- 🚀 **Fast**: Single-command deployment
- 🧹 **Clean**: Automatic lifecycle management
- 🔗 **Professional**: Real HTTPS domain

### 💳 Cost Breakdown

**Local Environment (~$10-30/month):**

- Aurora Serverless v2: ~$5-15 (auto-pause after 5 min)
- Lambda: ~$1-3 (256MB memory)
- S3: ~$2-5 (aggressive lifecycle)
- CloudWatch: ~$1-2 (7-day retention)
- Other AWS services: ~$1-5

**Dev/QA Environment (~$50-150/month):**

- Aurora Serverless v2: ~$20-60 (auto-pause, higher capacity)
- Lambda: ~$5-15 (512MB memory)
- S3: ~$5-15 (moderate lifecycle)
- CloudWatch: ~$5-10 (14-30 day retention)
- AWS Batch: ~$10-30 (spot instances)
- Other AWS services: ~$5-20

### 🔧 Local Development Integration

After deploying your cost-optimized environment, update your local `.env`:

```env
# Point to your personal AWS environment
DATABASE_URL=postgresql://user:pass@local-mars-dpp-cluster.cluster-xxx.rds.amazonaws.com:5432/digital_persona
S3_BUCKET=local-mars-dpp-uploads
AWS_REGION=us-west-1

# Use your AWS credentials
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key

# Local development still on localhost
NEXT_PUBLIC_API_URL=http://localhost:4001
```

### 📈 Cost Comparison

| Configuration              | Monthly Cost | Auto-Pause | Use Case               |
| -------------------------- | ------------ | ---------- | ---------------------- |
| **Production**             | ~$300-500    | ❌ Never   | Always-on, multi-AZ    |
| **Staging**                | ~$200-300    | ❌ Never   | Pre-production testing |
| **Dev (Cost-Optimized)**   | ~$50-100     | ✅ 5 min   | Team development       |
| **QA (Cost-Optimized)**    | ~$75-150     | ✅ 10 min  | Testing & validation   |
| **Local (Cost-Optimized)** | ~$10-30      | ✅ 5 min   | Personal sandbox       |

**💰 Savings: 70-90% cost reduction for development environments!**

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
- For containerized debugging: Use "Debug Full Stack (Docker)" configuration
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

### ✅ Current Features

- **📱 Social Media Platform**:
  - Personalized feed with optimized performance 
  - Digital persona creation and management
  - Creator dashboard with monetization tools
  - User safety controls and content moderation
- **🔐 Authentication & Security**:
  - JWT-based authentication with automatic token validation
  - Protected routes with middleware
  - Industry-standard security practices
- **📁 File Management**: 
  - Direct S3 uploads with presigned URLs
  - Media processing and optimization
  - File analytics and management
- **💰 Creator Economy**:
  - Subscription management with Stripe integration
  - Earnings tracking and payout management
  - Performance analytics and insights
- **🏗️ Production-Ready Infrastructure**:
  - Serverless AWS deployment (Lambda + RDS)
  - Optimized database with performance indexes
  - SSL certificates and custom domains
  - Auto-scaling with cost optimization

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
│   ├── web/                    # Next.js Frontend
│   │   ├── src/app/           # App router pages (feed, personas, auth)
│   │   ├── src/components/    # React components (feed, creator, auth)
│   │   ├── src/contexts/      # Authentication & state management
│   │   └── src/lib/          # tRPC client & utilities
│   └── server/                # Node.js tRPC Backend
│       ├── src/services/      # Feed algorithm, analytics, moderation
│       ├── src/routers/       # tRPC API endpoints
│       └── src/utils/         # S3, database utilities
├── packages/
│   ├── database/              # Drizzle ORM schema & migrations
│   └── shared/                # Shared types between frontend/backend
├── terraform/                 # AWS infrastructure (Lambda, RDS, S3)
├── scripts/                   # Deployment & environment management
└── python-ml-service/         # Optional ML service for AI features
```

## 🗃️ Database Schema

- **users**: User accounts with email, password hash, creator status
- **personas**: Digital personas with categories, public/private status
- **feed_items**: Personalized feed with algorithm scoring (optimized indexes)
- **subscriptions**: Creator monetization and user subscriptions
- **media_files**: File metadata with S3 keys and upload status
- **social_connections**: Social media integrations and analytics

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

## 🗄️ Database Migration System

### Migration Overview

The platform uses **Drizzle ORM** for production-safe database migrations with automatic deployment integration.

### 🚀 Quick Migration Commands

```bash
# 1. Modify schema
# Edit: packages/database/src/schema.ts

# 2. Generate migration
cd packages/database
npx drizzle-kit generate:pg --config=drizzle.config.ts

# 3. Deploy migration (automatic)
git add . && git commit -m "feat: add new table"
git push origin dev01
# ↳ Triggers deployment → Lambda migration → Complete

# 4. Manual migration (if needed)
aws lambda invoke --function-name dev-dev01-dpp-api \
  --cli-binary-format raw-in-base64-out \
  --payload '{"version":"2.0","routeKey":"POST /drizzle-migrate","rawPath":"/drizzle-migrate","headers":{"content-type":"application/json"},"requestContext":{"http":{"method":"POST","path":"/drizzle-migrate"}},"body":"{}","isBase64Encoded":false}' \
  --region us-west-1 migration-result.json && cat migration-result.json | jq
```

### 📋 Migration Workflow

| Step                 | Action                    | Command                                   | Result                           |
| -------------------- | ------------------------- | ----------------------------------------- | -------------------------------- |
| **1. Schema Change** | Edit schema.ts            | `vim packages/database/src/schema.ts`     | Modified schema                  |
| **2. Generate**      | Create migration file     | `npx drizzle-kit generate:pg`             | `0005_new_migration.sql`         |
| **3. Review**        | Check generated SQL       | `cat packages/database/drizzle/0005*.sql` | Verify changes                   |
| **4. Deploy**        | Push to trigger migration | `git push origin dev01`                   | Automatic deployment + migration |
| **5. Verify**        | Check migration result    | Monitor workflow logs                     | ✅ Migration complete            |

### 🔧 Migration Files Location

```
packages/database/drizzle/           ← Migration files
├── 0000_pink_shockwave.sql        ← Initial schema
├── 0001_curvy_brood.sql            ← Schema updates
├── 0002_equal_moonstone.sql        ← More updates
├── 0003_magical_namora.sql         ← Social tables
├── 0004_clean_mad_thinker.sql      ← Latest changes
├── 0005_your_new_migration.sql     ← Your next migration
└── meta/                           ← Migration metadata
    ├── _journal.json               ← Migration history
    └── 000X_snapshot.json          ← Schema snapshots
```

### 🎯 Deployment Integration

**Automatic Migration (Recommended):**

- Every `git push` to dev01/main triggers deployment workflow
- Workflow automatically runs migrations via Lambda
- Production-safe with transaction rollback
- No manual intervention required

**Migration Endpoints:**

- ✅ **`/drizzle-migrate`** - Drizzle incremental migrations (enabled)
- 🔄 **`/migrate`** - Custom SQL migrations (disabled, legacy)

### 🛡️ Migration Safety

**Production Safeguards:**

- ✅ **Incremental migrations** - Only applies new changes
- ✅ **Transaction safety** - Rollback on errors
- ✅ **Schema tracking** - Prevents duplicate migrations
- ✅ **Non-destructive** - Won't drop existing data
- ✅ **Lambda-based** - Consistent with production infrastructure

### 📊 Common Migration Examples

#### Adding a New Table

```typescript
// packages/database/src/schema.ts
export const newTable = pgTable("new_table", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

#### Adding a New Column

```typescript
// packages/database/src/schema.ts
export const users = pgTable("users", {
  // ... existing columns ...
  newField: text("new_field"), // Add this line
});
```

#### Adding Foreign Key Relationship

```typescript
// packages/database/src/schema.ts
export const childTable = pgTable("child_table", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentId: uuid("parent_id").references(() => parentTable.id),
});
```

### 🔧 Advanced Migration Commands

```bash
# Check current migration status
cd packages/database
npx drizzle-kit up:pg --config=drizzle.config.ts

# Introspect existing database
npx drizzle-kit introspect:pg --config=drizzle.config.ts

# Generate migration with custom name
npx drizzle-kit generate:pg --config=drizzle.config.ts --name=add_user_preferences

# View migration diff
git diff packages/database/drizzle/

# Rollback (manual process - review and create reverse migration)
# Note: Drizzle doesn't support automatic rollbacks
# Create a new migration that reverses the changes
```

### 🚨 Troubleshooting Migrations

#### Migration Failed During Deployment

```bash
# Check Lambda logs
aws logs tail /aws/lambda/dev-dev01-dpp-api --since 10m

# Check migration result
aws lambda invoke --function-name dev-dev01-dpp-api \
  --payload '{"routeKey":"POST /drizzle-migrate",...}' result.json
cat result.json | jq
```

#### Schema Drift Detection

```bash
# If database state doesn't match migrations
cd packages/database
npx drizzle-kit push:pg --config=drizzle.config.ts
```

#### Manual Database Access

```bash
# Connect to dev database (if needed)
psql "postgresql://user:pass@dev-dev01-dpp-rds-proxy.proxy-xxx.us-west-1.rds.amazonaws.com:5432/digital_persona"
```

### Useful Commands

```bash
# Docker operations
./docker-start.sh dev --build      # Start development with rebuild
./docker-stop.sh dev               # Stop development environment

# Database operations (Legacy - use migration system above)
cd apps/server
npm run db:push        # Push schema changes (local only)
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

| Document                                                                       | Description                         |
| ------------------------------------------------------------------------------ | ----------------------------------- |
| [DOCKER_README.md](./DOCKER_README.md)                                         | Comprehensive Docker setup guide    |
| [DOCKER_SETUP_COMPLETE.md](./DOCKER_SETUP_COMPLETE.md)                         | Docker configuration details        |
| [DEBUG_SETUP.md](./DEBUG_SETUP.md)                                             | VS Code debugging configuration     |
| [VSCODE_DEBUG_CONFIGURATIONS.md](./VSCODE_DEBUG_CONFIGURATIONS.md)             | Complete debug setup                |
| [AUTHENTICATION_SYSTEM.md](./docs/AUTHENTICATION_SYSTEM.md)                    | Auth implementation details         |
| [DATABASE.md](./docs/DATABASE.md)                                              | Database schema and operations      |
| [UPLOAD_SYSTEM.md](./docs/UPLOAD_SYSTEM.md)                                    | File upload architecture            |
| [DEPLOY_SERVERLESS_SSL_INTEGRATION.md](./DEPLOY_SERVERLESS_SSL_INTEGRATION.md) | SSL deployment integration guide    |
| [SUB_ENVIRONMENT_SSL_SUPPORT.md](./SUB_ENVIRONMENT_SSL_SUPPORT.md)             | Dynamic sub-environment SSL support |
| [SSL_CLEANUP_CHANGES.md](./SSL_CLEANUP_CHANGES.md)                             | SSL lifecycle management guide      |

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
- [x] **Serverless deployment with SSL certificates**
- [x] **Dynamic sub-environment support with custom domains**
- [x] **Production-ready HTTPS with automatic certificate management**
- [x] **AWS infrastructure automation (Terraform + Lambda + CloudFront)**

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

## 🚀 Production Readiness Status

### ✅ SSL Certificate Management - IMPLEMENTED

**Current Status**: ✅ **Production-ready SSL with custom domains**  
**Implementation**: Dynamic SSL certificates for unlimited sub-environments

**📋 Completed Features:**

- ✅ **Dynamic SSL Certificates** - Automatic ACM certificates for any sub-environment
  - `{sub-environment}.hibiji.com` → Environment websites (dev01.hibiji.com, qa02.hibiji.com)
  - `{sub-environment}-api.hibiji.com` → API endpoints (dev01-api.hibiji.com, qa02-api.hibiji.com)
  - Automatic DNS validation via Route53
- ✅ **Production URLs** with valid SSL (no certificate warnings)
- ✅ **Cost Optimized** - Free ACM certificates with automatic renewal
- ✅ **Automatic Coverage** for new environments
- ✅ **Zero-configuration** SSL deployment

**🔧 Technical Implementation:**

```terraform
# Dynamic SSL certificate generation
resource "aws_acm_certificate" "website" {
  domain_name       = "${var.sub_environment}.hibiji.com"
  subject_alternative_names = ["*.${var.sub_environment}.hibiji.com"]
  validation_method = "DNS"
}

# Automatic DNS validation
resource "aws_route53_record" "website_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.website.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }
}
```

**💰 Benefits Achieved:**

- 🔒 **Professional HTTPS** for all environments
- 💰 **$0 SSL cost** (using free ACM certificates)
- 🚀 **Instant deployment** with `./scripts/deploy-serverless.sh`
- 🔄 **Automatic renewal** (no manual certificate management)
- 📈 **Unlimited environments** support

**📈 Status**: ✅ **Production Ready** - SSL fully implemented and operational

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🎉 Getting Started

**For immediate development:**

1. **Docker (Recommended)**: `./docker-start.sh dev --logs`
2. **VS Code**: Use "Debug Full Stack" or "Debug Full Stack (Docker)" configuration
3. **Manual**: Follow the Local Development Setup above

**For production deployment:**

4. **AWS Deployment**: `./scripts/deploy-serverless.sh -e dev -s dev01` → https://dev01.hibiji.com

The platform includes **enterprise-grade authentication**, **full containerization**, **comprehensive file management**, and **production SSL deployment** - ready for both development and production deployment!

**🔗 Quick Access:**

- **Docker Frontend**: http://localhost:3100
- **Docker Backend**: http://localhost:3101
- **Local Frontend**: http://localhost:4000
- **Local Backend**: http://localhost:4001
- **Production Example**: https://dev01.hibiji.com
