# 🚀 Hibiji Digital Persona Platform

A scalable, cost-optimized digital persona platform built with FastAPI, React, and AWS infrastructure.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
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

### Local Development

1. **Clone Repository**

   ```bash
   git clone https://github.com/your-org/hibiji-platform.git
   cd hibiji-platform
   ```

2. **Start Local Environment**

   ```bash
   docker-compose up -d
   ```

3. **Run Migrations**

   ```bash
   alembic upgrade head
   ```

4. **Access Applications**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:8000
   - API Docs: http://localhost:8000/docs

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
