# 🚀 Hibiji Digital Persona Platform

A scalable, cost-optimized digital persona platform built with FastAPI, React, and AWS infrastructure.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Branch-to-Environment Strategy](#-branch-to-environment-strategy)
- [Quick Start](#quick-start)
- [Deployment Status](#deployment-status)
- [Infrastructure](#infrastructure)
- [Development](#development)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## 🌟 Overview

Hibiji is a comprehensive digital persona platform that enables users to create, manage, and interact with AI-powered digital personas. The platform features social media integration, automatic learning, and scalable cloud infrastructure.

### Key Features

- 🤖 **AI-Powered Personas**: Create and manage intelligent digital personas
- 📱 **Social Media Integration**: Import and learn from social media data
- 🔄 **Automatic Learning**: Continuous persona improvement from interactions
- ☁️ **Scalable Infrastructure**: AWS-based architecture with auto-scaling
- 💰 **Cost Optimized**: Environment-based resource sizing and budget controls
- 🔐 **Enterprise Security**: VPC isolation, IAM roles, and SSL encryption

## 🏗️ Architecture

### Technology Stack

**Backend**

- **Framework**: FastAPI (Python 3.11)
- **Database**: PostgreSQL 15 with connection pooling
- **Cache**: Redis for session management
- **File Storage**: S3 with multipart uploads
- **Authentication**: JWT with refresh tokens

**Frontend**

- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Build Tool**: Vite

**Infrastructure**

- **Container Orchestration**: AWS ECS Fargate
- **Load Balancing**: Application Load Balancer
- **Database**: RDS PostgreSQL
- **Caching**: ElastiCache Redis
- **Monitoring**: CloudWatch
- **CI/CD**: GitHub Actions

### Environment Structure

```
hibiji.com
├── www.hibiji.com (Production)
├── api.hibiji.com (API Gateway)
├── dev.hibiji.com
│   ├── dev01.hibiji.com
│   ├── dev02.hibiji.com
│   └── dev03.hibiji.com
├── qa.hibiji.com
│   ├── qa01.hibiji.com
│   ├── qa02.hibiji.com
│   └── qa03.hibiji.com
├── staging.hibiji.com
│   ├── staging01.hibiji.com
│   ├── staging02.hibiji.com
│   └── staging03.hibiji.com
└── prod.hibiji.com
    ├── prod01.hibiji.com
    └── prod02.hibiji.com
```

## 🌿 Branch-to-Environment Strategy

### **Branch Mapping**

Our CI/CD pipeline automatically deploys code based on Git branches. Each branch maps to a specific AWS environment:

| Branch Name | Environment       | Terraform Directory               | Domain Pattern         | Purpose                                              |
| ----------- | ----------------- | --------------------------------- | ---------------------- | ---------------------------------------------------- |
| `main`      | Production        | `terraform/environments/main/`    | `main01.hibiji.com`    | **Production** - Live user traffic                   |
| `prod`      | Production Alt    | `terraform/environments/prod/`    | `prod01.hibiji.com`    | **Production** - Alternative production environment  |
| `staging`   | Staging           | `terraform/environments/staging/` | `staging01.hibiji.com` | **Pre-Production** - Final testing before production |
| `qa`        | Quality Assurance | `terraform/environments/qa/`      | `qa01.hibiji.com`      | **Testing** - Integration and acceptance testing     |
| `dev`       | Development       | `terraform/environments/dev/`     | `dev01.hibiji.com`     | **Development** - Feature development and testing    |

### **Automatic Deployment Flow**

```mermaid
graph LR
    A[Feature Branch] --> B[Pull Request]
    B --> C[dev Branch]
    C --> D[dev01.hibiji.com]
    D --> E[qa Branch]
    E --> F[qa01.hibiji.com]
    F --> G[staging Branch]
    G --> H[staging01.hibiji.com]
    H --> I[main Branch]
    I --> J[main01.hibiji.com]
```

### **Branch Protection Rules**

| Branch    | Protection Level | Required Reviews | Status Checks  | Auto-Deploy |
| --------- | ---------------- | ---------------- | -------------- | ----------- |
| `main`    | **Strict**       | 2 approvals      | All tests pass | ✅ Yes      |
| `prod`    | **Strict**       | 2 approvals      | All tests pass | ✅ Yes      |
| `staging` | **Medium**       | 1 approval       | Backend tests  | ✅ Yes      |
| `qa`      | **Medium**       | 1 approval       | Backend tests  | ✅ Yes      |
| `dev`     | **Light**        | None             | Basic tests    | ✅ Yes      |

### **Recommended Branching Strategy**

#### **🌱 Git Flow with Environment Mapping**

```bash
# 1. Create feature branch from dev
git checkout dev
git pull origin dev
git checkout -b feature/new-feature

# 2. Develop and test locally
# ... make changes ...
git commit -m "feat: add new feature"

# 3. Push and create PR to dev
git push origin feature/new-feature
# Create PR: feature/new-feature → dev

# 4. After PR approval, merge to dev
# Automatic deployment to dev01.hibiji.com

# 5. Promote to qa (when ready for testing)
git checkout qa
git merge dev
git push origin qa
# Automatic deployment to qa01.hibiji.com

# 6. Promote to staging (when ready for pre-production)
git checkout staging
git merge qa
git push origin staging
# Automatic deployment to staging01.hibiji.com

# 7. Promote to production (when ready for release)
git checkout main
git merge staging
git push origin main
# Automatic deployment to main01.hibiji.com
```

#### **🚀 Release Strategy**

**Option 1: Continuous Deployment (Recommended)**

- Every merge to `main` automatically deploys to production
- Use feature flags for gradual rollouts
- Monitor metrics and rollback if needed

**Option 2: Scheduled Releases**

- Merge to `main` on release day
- Deploy during maintenance windows
- Coordinate with stakeholders

**Option 3: Blue-Green Deployment**

- Use `main` and `prod` branches for blue-green deployments
- Zero-downtime deployments
- Instant rollback capability

### **Environment-Specific Configurations**

#### **Resource Allocation by Environment**

| Environment | CPU  | Memory | Database    | Auto-Scaling | Cost/Month |
| ----------- | ---- | ------ | ----------- | ------------ | ---------- |
| **main**    | 1024 | 2048MB | db.t3.small | ✅ Enabled   | ~$1000     |
| **prod**    | 1024 | 2048MB | db.t3.small | ✅ Enabled   | ~$1000     |
| **staging** | 512  | 1024MB | db.t3.micro | ✅ Enabled   | ~$200      |
| **qa**      | 256  | 512MB  | db.t3.micro | ❌ Disabled  | ~$100      |
| **dev**     | 256  | 512MB  | db.t3.micro | ❌ Disabled  | ~$50       |

#### **Environment Variables**

Each environment has its own configuration:

```bash
# Development
ENVIRONMENT=development
LOG_LEVEL=DEBUG
DEBUG=true

# QA
ENVIRONMENT=qa
LOG_LEVEL=INFO
DEBUG=false

# Staging
ENVIRONMENT=staging
LOG_LEVEL=INFO
DEBUG=false

# Production
ENVIRONMENT=production
LOG_LEVEL=WARNING
DEBUG=false
```

### **Multi-Sub-Environment Support**

For teams working on multiple features simultaneously, we support sub-environments:

```bash
# Create sub-environment for feature team
git checkout dev
git checkout -b feature/team-a
git push origin feature/team-a

# Deploy to sub-environment via GitHub Actions
# Creates: dev02.hibiji.com, dev03.hibiji.com, etc.
```

#### **Sub-Environment Naming Convention**

- `dev01.hibiji.com` - Main development environment
- `dev02.hibiji.com` - Feature team A
- `dev03.hibiji.com` - Feature team B
- `qa01.hibiji.com` - Main QA environment
- `qa02.hibiji.com` - QA team A
- `staging01.hibiji.com` - Main staging environment

### **Deployment Triggers**

#### **Automatic Deployments**

| Event    | Branch    | Environment    | Trigger      |
| -------- | --------- | -------------- | ------------ |
| **Push** | `main`    | Production     | ✅ Automatic |
| **Push** | `prod`    | Production Alt | ✅ Automatic |
| **Push** | `staging` | Staging        | ✅ Automatic |
| **Push** | `qa`      | QA             | ✅ Automatic |
| **Push** | `dev`     | Development    | ✅ Automatic |

#### **Manual Deployments**

```bash
# Deploy specific environment via GitHub Actions
# Go to: Actions → "Hibiji CI/CD Pipeline" → "Run workflow"
# Select environment: dev01, qa01, staging01, prod01, prod02
```

### **Rollback Procedures**

#### **Quick Rollback (Last 5 minutes)**

```bash
# Revert last commit
git revert HEAD
git push origin main
# Automatic rollback deployment
```

#### **Rollback to Specific Version**

```bash
# Find the commit to rollback to
git log --oneline -10

# Create rollback branch
git checkout -b rollback/v1.2.3
git reset --hard <commit-hash>
git push origin rollback/v1.2.3

# Merge to main
git checkout main
git merge rollback/v1.2.3
git push origin main
```

#### **Infrastructure Rollback**

```bash
# Rollback Terraform changes
cd terraform/environments/main
terraform plan -var="image_tag=<previous-tag>"
terraform apply
```

### **Best Practices**

#### **✅ Do's**

- **Use feature branches** for all development work
- **Test in dev first** before promoting to higher environments
- **Use descriptive commit messages** with conventional commits
- **Monitor deployments** and set up alerts
- **Use feature flags** for gradual rollouts
- **Keep environments in sync** with regular promotions

#### **❌ Don'ts**

- **Don't commit directly to main** (use PRs)
- **Don't skip environments** in the promotion chain
- **Don't deploy on Fridays** (unless critical)
- **Don't ignore test failures** - fix them first
- **Don't mix feature work** in the same branch

#### **🔧 Branch Management Commands**

```bash
# Clean up merged feature branches
git branch --merged | grep -v "\*" | grep -v "main" | grep -v "dev" | xargs -n 1 git branch -d

# Update all branches
git checkout main && git pull origin main
git checkout dev && git pull origin dev
git checkout qa && git pull origin qa
git checkout staging && git pull origin staging

# Check branch status
git for-each-ref --format='%(refname:short) %(upstream:short)' refs/heads

# Sync feature branch with latest dev
git checkout feature/my-feature
git rebase dev
```

### **Monitoring & Alerts**

#### **Deployment Monitoring**

- **GitHub Actions**: Monitor deployment status
- **CloudWatch**: Application and infrastructure metrics
- **Sentry**: Error tracking and performance monitoring
- **PagerDuty**: Incident alerts and escalation

#### **Health Checks**

```bash
# Check environment health
curl -f https://main01.hibiji.com/health
curl -f https://staging01.hibiji.com/health
curl -f https://qa01.hibiji.com/health
curl -f https://dev01.hibiji.com/health
```

#### **Cost Monitoring**

- **AWS Cost Explorer**: Real-time cost tracking
- **Budget Alerts**: Monthly and daily budget notifications
- **Resource Optimization**: Automatic scaling recommendations

## 🚀 Quick Start

### Prerequisites

- **AWS Account** with appropriate permissions
- **AWS CLI** (v2.0+)
- **Terraform** (v1.5.0+)
- **Docker** (v20.0+)
- **Git** (v2.30+)

### 30-Minute Deployment

1. **Install Tools** (5 minutes)

   ```bash
   # macOS
   brew install awscli terraform docker gh

   # Ubuntu
   sudo apt-get install awscli terraform docker.io gh
   ```

2. **Configure AWS** (5 minutes)

   ```bash
   aws configure
   # Enter your Access Key ID, Secret Access Key, region (us-west-1), format (json)
   ```

3. **Run Automated Setup** (10 minutes)

   ```bash
   chmod +x scripts/setup-aws-prerequisites.sh
   ./scripts/setup-aws-prerequisites.sh
   ```

4. **Configure GitHub** (5 minutes)

   ```bash
   chmod +x scripts/setup-github-secrets.sh
   ./scripts/setup-github-secrets.sh
   ```

5. **Deploy Platform** (15 minutes)
   ```bash
   chmod +x scripts/first-deployment.sh
   ./scripts/first-deployment.sh
   ```

For detailed instructions, see [QUICK_START.md](QUICK_START.md).

### 🛡️ Safe Deployment Approach

If you encounter resource conflicts or want to ensure a clean deployment:

#### **Option 1: Preview Changes (Recommended)**

```bash
# Navigate to Terraform directory
cd terraform/environments/dev

# Initialize Terraform
terraform init \
  -backend-config="bucket=hibiji-terraform-state" \
  -backend-config="key=dev/terraform.tfstate" \
  -backend-config="region=us-west-1"

# Preview what will be destroyed
terraform plan -destroy

# Review the output carefully, then destroy if safe
terraform destroy

# If you encounter Secrets Manager conflicts, force delete them
aws secretsmanager list-secrets --region us-west-1 --query 'SecretList[?contains(Name, `hibiji`)].Name' --output text | \
  xargs -I {} aws secretsmanager delete-secret \
  --secret-id {} \
  --force-delete-without-recovery \
  --region us-west-1

# Return to root and deploy fresh
cd ../../..
./scripts/first-deployment.sh
```

#### **Option 2: Clean Slate (Use with Caution)**

```bash
# ⚠️ WARNING: This will delete ALL infrastructure and data
cd terraform/environments/dev
terraform destroy -auto-approve
cd ../../..
./scripts/first-deployment.sh
```

#### **Option 3: Manual Resource Cleanup**

```bash
# Check existing resources
aws elbv2 describe-target-groups --region us-west-1
aws ecs list-services --cluster hibiji-dev-cluster --region us-west-1
aws rds describe-db-instances --region us-west-1

# Remove specific conflicting resources
aws elbv2 delete-target-group --target-group-arn <target-group-arn>
```

#### **Option 4: Force Delete Secrets (Secrets Manager Conflicts)**

If you encounter "secret already scheduled for deletion" errors:

```bash
# List all secrets (including those scheduled for deletion)
aws secretsmanager list-secrets --region us-west-1

# Force delete specific secrets (removes 30-day recovery period)
aws secretsmanager delete-secret \
  --secret-id hibiji-dev01-secret-key \
  --force-delete-without-recovery \
  --region us-west-1

aws secretsmanager delete-secret \
  --secret-id hibiji-dev01-db-password \
  --force-delete-without-recovery \
  --region us-west-1

# Or force delete all secrets with hibiji prefix
aws secretsmanager list-secrets --region us-west-1 --query 'SecretList[?contains(Name, `hibiji`)].Name' --output text | \
  xargs -I {} aws secretsmanager delete-secret \
  --secret-id {} \
  --force-delete-without-recovery \
  --region us-west-1
```

### 🔍 **Resource Verification**

After deployment, verify your resources:

```bash
# Check ECS services
aws ecs describe-services \
  --cluster hibiji-dev-cluster \
  --services hibiji-dev-backend hibiji-dev-frontend \
  --region us-west-1

# Check ALB health
aws elbv2 describe-load-balancers \
  --names hibiji-dev-alb \
  --region us-west-1

# Check RDS status
aws rds describe-db-instances \
  --db-instance-identifier hibiji-dev-db \
  --region us-west-1
```

## 📊 Deployment Status

### ✅ Completed Infrastructure

- [x] **Cost Control Module** - Budget management and cost alerts
- [x] **VPC Module** - Multi-tier networking with cost optimization
- [x] **RDS Module** - PostgreSQL with connection pooling
- [x] **ECS Module** - Fargate cluster with auto-scaling
- [x] **ALB Module** - Load balancer with SSL termination
- [x] **Route53 Module** - DNS management for multi-environments
- [x] **CI/CD Pipeline** - GitHub Actions with cost estimation
- [x] **IAM Permission Groups** - Role-based access control

### 🔄 In Progress

- [ ] **Domain Registration** - hibiji.com domain setup
- [ ] **SSL Certificate Validation** - ACM certificate verification
- [ ] **Production Deployment** - Full production environment
- [ ] **Advanced Monitoring** - Custom CloudWatch dashboards

### 📋 Planned

- [ ] **Multi-Region Deployment** - Disaster recovery setup
- [ ] **Advanced Security** - WAF and Shield protection
- [ ] **Performance Optimization** - CDN and caching layers
- [ ] **Backup Automation** - Cross-region backup strategies

## 🏗️ Infrastructure

### Cost Optimization

| Environment | RDS Instance | ECS CPU/Memory | Monthly Cost | Auto-Scaling |
| ----------- | ------------ | -------------- | ------------ | ------------ |
| Development | db.t3.micro  | 256/512MB      | ~$50         | Disabled     |
| QA          | db.t3.small  | 512/1GB        | ~$100        | Minimal      |
| Staging     | db.t3.medium | 1024/2GB       | ~$200        | Enabled      |
| Production  | db.r6g.large | 2048/4GB       | ~$1000       | Enabled      |

### Security Features

- **VPC Isolation**: Private subnets for application servers
- **IAM Roles**: Least privilege access control
- **SSL/TLS**: Automatic certificate management
- **Secrets Management**: AWS Secrets Manager integration
- **Access Logging**: Comprehensive audit trails

### Monitoring & Alerting

- **CloudWatch Dashboards**: Application and infrastructure metrics
- **Cost Alerts**: Budget threshold notifications
- **Health Checks**: Service availability monitoring
- **Performance Insights**: Database and application performance

## 💻 Development

### Local Development Setup

The platform can be run entirely locally for development. Choose from three setup options:

#### Option 1: Docker Compose (Recommended - Easiest)

```bash
# Clone repository
git clone https://github.com/your-org/hibiji-platform.git
cd hibiji-platform

# Start all services locally
docker-compose up -d

# Access applications
# Frontend: http://localhost
# Backend: http://localhost:8001
# API Docs: http://localhost:8001/docs
# Health Check: http://localhost:8001/health
# Grafana Dashboard: http://localhost:3001
# Prometheus: http://localhost:9090
```

#### Option 2: Automated Script (Recommended - Production-like)

```bash
# Clone repository
git clone https://github.com/your-org/hibiji-platform.git
cd hibiji-platform

# Make script executable and run
chmod +x start.sh
./start.sh

# The script will:
# ✅ Check prerequisites (Python 3.12+, Node.js 16+)
# ✅ Set up virtual environment
# ✅ Install dependencies
# ✅ Create .env file if missing
# ✅ Start backend and frontend services
```

#### Option 3: Manual Setup (Advanced)

```bash
# Clone repository
git clone https://github.com/your-org/hibiji-platform.git
cd hibiji-platform

# Backend setup
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd frontend
npm install
cd ..

# Database setup (optional - uses SQLite by default)
docker run -d --name postgres -p 5432:5432 \
  -e POSTGRES_DB=digital_persona \
  -e POSTGRES_USER=dpp_user \
  -e POSTGRES_PASSWORD=dpp_password \
  postgres:15-alpine

# Start services
# Terminal 1: Backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2: Frontend
cd frontend && npm start
```

### Local Services

When running locally, you get access to:

#### Docker Compose (Option 1)

| Service          | URL                          | Description                   |
| ---------------- | ---------------------------- | ----------------------------- |
| **Frontend**     | http://localhost             | React application (nginx)     |
| **Backend API**  | http://localhost:8001        | FastAPI backend               |
| **API Docs**     | http://localhost:8001/docs   | Interactive API documentation |
| **Health Check** | http://localhost:8001/health | Service health status         |
| **Grafana**      | http://localhost:3001        | Monitoring dashboard          |
| **Prometheus**   | http://localhost:9090        | Metrics collection            |
| **PostgreSQL**   | localhost:5432               | Database                      |
| **Redis**        | localhost:6379               | Cache                         |

#### Local Development (Option 2 & 3)

| Service          | URL                          | Description                   |
| ---------------- | ---------------------------- | ----------------------------- |
| **Frontend**     | http://localhost:3000        | React application (dev mode)  |
| **Backend API**  | http://localhost:8000        | FastAPI backend (with reload) |
| **API Docs**     | http://localhost:8000/docs   | Interactive API documentation |
| **Health Check** | http://localhost:8000/health | Service health status         |

### Port Configuration

The platform uses different ports for Docker production and local development to avoid conflicts:

#### 🐳 Docker Production (docker-compose up -d)

| Service          | Port | URL                          | Description                   |
| ---------------- | ---- | ---------------------------- | ----------------------------- |
| **Frontend**     | 80   | http://localhost             | React application (nginx)     |
| **Backend API**  | 8001 | http://localhost:8001        | FastAPI backend               |
| **API Docs**     | 8001 | http://localhost:8001/docs   | Interactive API documentation |
| **Health Check** | 8001 | http://localhost:8001/health | Service health status         |
| **Grafana**      | 3001 | http://localhost:3001        | Monitoring dashboard          |
| **Prometheus**   | 9090 | http://localhost:9090        | Metrics collection            |
| **PostgreSQL**   | 5432 | localhost:5432               | Database                      |
| **Redis**        | 6379 | localhost:6379               | Cache                         |

#### 💻 Local Development (./start.sh)

| Service          | Port | URL                          | Description                   |
| ---------------- | ---- | ---------------------------- | ----------------------------- |
| **Frontend**     | 3000 | http://localhost:3000        | React application (dev mode)  |
| **Backend API**  | 8000 | http://localhost:8000        | FastAPI backend (with reload) |
| **API Docs**     | 8000 | http://localhost:8000/docs   | Interactive API documentation |
| **Health Check** | 8000 | http://localhost:8000/health | Service health status         |

#### 🔄 Automatic Container Management

The `start.sh` script automatically manages Docker containers:

1. **Stops Docker containers** when starting local development
2. **Starts local servers** on ports 3000 (frontend) and 8000 (backend)
3. **Restarts Docker containers** when you exit local development

```bash
# Start local development (stops Docker, starts local servers)
./start.sh

# When done developing, press Ctrl+C
# Docker containers automatically restart
```

### Environment Configuration

The platform automatically creates a `.env` file with local defaults:

```bash
# Database (SQLite for local development)
DATABASE_URL=sqlite+aiosqlite:///./digital_persona.db

# JWT Authentication
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OpenAI Integration (optional)
OPENAI_API_KEY=your-openai-api-key-here

# Redis Cache (optional)
REDIS_URL=redis://localhost:6379

# AWS S3 (optional - for file uploads)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_DEFAULT_REGION=us-west-1
S3_BUCKET_NAME=your-bucket-name
```

### Database Migrations

```bash
# Run database migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "Description of changes"

# Rollback migration
alembic downgrade -1
```

### Development Workflow

```bash
# 1. Start local environment
docker-compose up -d

# 2. Run migrations
alembic upgrade head

# 3. Make code changes

# 4. Test changes
pytest tests/ -v

# 5. Check frontend
cd frontend && npm test

# 6. Restart services if needed
docker-compose restart backend frontend
```

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/hibiji

# Redis
REDIS_URL=redis://localhost:6379

# AWS
AWS_REGION=us-west-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Application
SECRET_KEY=your_secret_key
ENVIRONMENT=development
```

### Testing

```bash
# Backend tests
pytest tests/ -v --cov=app

# Frontend tests
cd frontend && npm test

# Integration tests
pytest tests/integration/ -v
```

## 📈 Monitoring

### CloudWatch Dashboards

- **Application Metrics**: Response times, error rates, throughput
- **Infrastructure Metrics**: CPU, memory, disk usage
- **Cost Metrics**: Real-time cost tracking and alerts

### Log Management

- **Application Logs**: Structured logging to CloudWatch
- **Access Logs**: ALB access logs to S3 with lifecycle policies
- **Database Logs**: RDS logs for performance monitoring

### Alerting

- **Cost Alerts**: Budget threshold notifications
- **Performance Alerts**: High latency, error rate alerts
- **Health Checks**: Service availability monitoring

## 🚨 Troubleshooting

### Common Issues

#### ECS Service Not Starting

```bash
# Check service events
aws ecs describe-services \
  --cluster hibiji-dev-cluster \
  --services hibiji-dev-backend

# Check task logs
aws logs get-log-events \
  --log-group-name /ecs/hibiji-dev-app \
  --log-stream-name <stream-name>
```

#### Database Connection Issues

```bash
# Check RDS status
aws rds describe-db-instances \
  --db-instance-identifier hibiji-dev-db

# Test connection
psql -h <rds-endpoint> -U hibiji_admin -d hibiji_dev
```

#### SSL Certificate Issues

```bash
# Check certificate status
aws acm describe-certificate \
  --certificate-arn <certificate-arn>

# Verify DNS records
dig www.hibiji.com
```

### Rollback Procedures

#### Application Rollback

```bash
# Rollback to previous image
aws ecs update-service \
  --cluster hibiji-dev-cluster \
  --service hibiji-dev-backend \
  --task-definition hibiji-dev-backend:<previous-revision>
```

#### Infrastructure Rollback

```bash
# Terraform rollback
terraform plan -var="image_tag=<previous-tag>"
terraform apply
```

## 🤝 Contributing

### Development Workflow

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**

   - Follow coding standards
   - Add tests for new features
   - Update documentation

3. **Test Locally**

   ```bash
   # Run all tests
   pytest tests/ -v
   cd frontend && npm test
   ```

4. **Create Pull Request**
   - Target appropriate environment branch
   - Include description of changes
   - Link related issues

### Code Standards

- **Python**: Black formatting, flake8 linting
- **TypeScript**: ESLint, Prettier formatting
- **Terraform**: terraform fmt, tflint
- **Documentation**: Keep README and guides updated

### Environment Branches

- **main**: Production-ready code
- **staging**: Pre-production testing
- **qa**: Quality assurance
- **dev**: Development and feature testing

## 📚 Documentation

- [Quick Start Guide](QUICK_START.md) - 30-minute deployment
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - Comprehensive deployment instructions
- [Social Media Learning](SOCIAL_MEDIA_LEARNING.md) - Social media integration features
- [API Documentation](http://localhost:8000/docs) - Interactive API docs

## 📞 Support

### Contact Information

- **DevOps Team**: devops@hibiji.com
- **Emergency**: +1-555-0123 (24/7)
- **Documentation**: https://docs.hibiji.com

### Escalation Matrix

1. **Level 1**: On-call engineer (15 min response)
2. **Level 2**: DevOps lead (30 min response)
3. **Level 3**: CTO (1 hour response)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Development Complete, Ready for Production Deployment

# Trigger CI/CD
