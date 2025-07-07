# Hibiji Platform Deployment Guide

## 🚀 Overview

This guide covers the deployment of the Hibiji Digital Persona Platform to AWS using Infrastructure as Code (Terraform) and CI/CD pipelines.

## 📋 Prerequisites

### Required Tools

- **AWS CLI** (v2.0+)
- **Terraform** (v1.5.0+)
- **Docker** (v20.0+)
- **Git** (v2.30+)
- **Python** (v3.11+)
- **Node.js** (v18+)

### AWS Account Setup

1. **Create AWS Account** with appropriate permissions
2. **Configure AWS CLI** with access keys
3. **Enable Required Services**:
   - ECS (Elastic Container Service)
   - ECR (Elastic Container Registry)
   - RDS (Relational Database Service)
   - ElastiCache (Redis)
   - Application Load Balancer
   - Route 53
   - CloudWatch
   - S3
   - IAM

## 🏗️ Infrastructure Architecture

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

### Cost Optimization Features

- **Environment-based sizing**: Smaller instances for dev/qa
- **Auto-scaling**: Only enabled for staging/prod
- **Connection pooling**: PgBouncer for database optimization
- **S3 lifecycle policies**: Automatic cost optimization
- **Budget alerts**: Real-time cost monitoring

## 🔧 Initial Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/hibiji-platform.git
cd hibiji-platform
```

### 2. Configure AWS Credentials

```bash
aws configure
# Enter your AWS Access Key ID
# Enter your AWS Secret Access Key
# Enter your default region (us-west-1)
# Enter your output format (json)
```

### 3. Create S3 Backend for Terraform State

```bash
aws s3 mb s3://hibiji-terraform-state
aws s3api put-bucket-versioning \
  --bucket hibiji-terraform-state \
  --versioning-configuration Status=Enabled
```

### 4. Create ECR Repositories

```bash
aws ecr create-repository --repository-name hibiji-backend
aws ecr create-repository --repository-name hibiji-frontend
```

## 🚀 Deployment Process

### Automated Deployment (Recommended)

#### 1. GitHub Actions Setup

1. **Fork/Clone** the repository to your GitHub account
2. **Add Secrets** in GitHub repository settings:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `DATABASE_PASSWORD`
   - `SECRET_KEY`

#### 2. Environment Protection Rules

Configure branch protection rules for each environment:

- **dev**: Require PR reviews, status checks
- **qa**: Require PR reviews, status checks, cost approval
- **staging**: Require PR reviews, status checks, cost approval
- **prod**: Require PR reviews, status checks, cost approval, manual approval

#### 3. Deploy via Git Push

```bash
# Deploy to dev environment
git checkout dev
git push origin dev

# Deploy to qa environment
git checkout qa
git push origin qa

# Deploy to staging environment
git checkout staging
git push origin staging

# Deploy to production
git checkout prod
git push origin prod
```

### Manual Deployment

#### 1. Build and Push Docker Images

```bash
# Build backend image
docker build -t hibiji-backend:latest .
aws ecr get-login-password --region us-west-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-west-1.amazonaws.com
docker tag hibiji-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.us-west-1.amazonaws.com/hibiji-backend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-west-1.amazonaws.com/hibiji-backend:latest

# Build frontend image
cd frontend
docker build -t hibiji-frontend:latest .
docker tag hibiji-frontend:latest $AWS_ACCOUNT_ID.dkr.ecr.us-west-1.amazonaws.com/hibiji-frontend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.us-west-1.amazonaws.com/hibiji-frontend:latest
```

#### 2. Deploy Infrastructure

```bash
# Navigate to environment directory
cd terraform/environments/dev01

# Initialize Terraform
terraform init \
  -backend-config="bucket=hibiji-terraform-state" \
  -backend-config="key=dev01/terraform.tfstate" \
  -backend-config="region=us-west-1"

# Plan deployment
terraform plan -var="image_tag=latest" -var="frontend_image_tag=latest"

# Apply changes
terraform apply -auto-approve
```

## 🔐 Security Configuration

### IAM Permission Groups

#### 1. SuperAdmin Group

- **Access**: All assets in all environments
- **Use Case**: Platform-wide administration
- **Members**: DevOps team leads

#### 2. EnvironmentAdmin Group

- **Access**: All assets in dev, qa, staging
- **Use Case**: Environment management
- **Members**: Senior developers

#### 3. DevQAAdmin Group

- **Access**: Admin access to dev and qa environments
- **Use Case**: Development and QA administration
- **Members**: Development team leads

#### 4. DevFullAccess Group

- **Access**: All assets in dev environment
- **Use Case**: Development work
- **Members**: Developers

#### 5. ReadOnly Group

- **Access**: Read-only access in all environments
- **Use Case**: Monitoring and reporting
- **Members**: Support team, stakeholders

### Security Best Practices

- **Secrets Management**: Use AWS Secrets Manager for sensitive data
- **Network Security**: VPC with private subnets for application servers
- **SSL/TLS**: Automatic certificate management with ACM
- **Access Logging**: Enable CloudTrail and ALB access logs
- **Regular Updates**: Automated security patches via CI/CD

## 📊 Monitoring and Observability

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

## 🔄 Sub-Environment Management

### Creating New Sub-Environments

```bash
# Use the management script
./scripts/manage-sub-environments.sh create dev dev04

# Or manually with Terraform
cd terraform/environments/dev
terraform workspace new dev04
terraform plan -var="sub_environment=dev04"
terraform apply
```

### Listing Sub-Environments

```bash
./scripts/manage-sub-environments.sh list dev
```

### Destroying Sub-Environments

```bash
./scripts/manage-sub-environments.sh destroy dev dev04
```

## 💰 Cost Optimization

### Environment-Specific Optimizations

#### Development Environment

- **RDS**: db.t3.micro (1 vCPU, 1 GB RAM)
- **ECS**: 256 CPU units, 512 MB RAM
- **Auto-scaling**: Disabled
- **Backup retention**: 7 days

#### QA Environment

- **RDS**: db.t3.small (2 vCPU, 2 GB RAM)
- **ECS**: 512 CPU units, 1 GB RAM
- **Auto-scaling**: Minimal (1-2 instances)
- **Backup retention**: 7 days

#### Staging Environment

- **RDS**: db.t3.medium (2 vCPU, 4 GB RAM)
- **ECS**: 1024 CPU units, 2 GB RAM
- **Auto-scaling**: Enabled (1-3 instances)
- **Backup retention**: 14 days

#### Production Environment

- **RDS**: db.r6g.large (2 vCPU, 16 GB RAM)
- **ECS**: 2048 CPU units, 4 GB RAM
- **Auto-scaling**: Enabled (2-5 instances)
- **Backup retention**: 30 days
- **Multi-AZ**: Enabled

### Cost Monitoring

- **Monthly Budgets**: Set per environment
- **Cost Anomaly Detection**: Automatic alerts
- **Resource Tagging**: Comprehensive tagging for cost allocation
- **Scheduled Scaling**: Scale down non-production environments during off-hours

## 🚨 Troubleshooting

### Common Issues

#### 1. ECS Service Not Starting

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

#### 2. Database Connection Issues

```bash
# Check RDS status
aws rds describe-db-instances \
  --db-instance-identifier hibiji-dev-db

# Test connection
psql -h <rds-endpoint> -U hibiji_admin -d hibiji_dev
```

#### 3. SSL Certificate Issues

```bash
# Check certificate status
aws acm describe-certificate \
  --certificate-arn <certificate-arn>

# Verify DNS records
dig www.hibiji.com
```

### Rollback Procedures

#### 1. Application Rollback

```bash
# Rollback to previous image
aws ecs update-service \
  --cluster hibiji-dev-cluster \
  --service hibiji-dev-backend \
  --task-definition hibiji-dev-backend:<previous-revision>
```

#### 2. Infrastructure Rollback

```bash
# Terraform rollback
terraform plan -var="image_tag=<previous-tag>"
terraform apply
```

## 📞 Support

### Contact Information

- **DevOps Team**: devops@hibiji.com
- **Emergency**: +1-555-0123 (24/7)
- **Documentation**: https://docs.hibiji.com

### Escalation Matrix

1. **Level 1**: On-call engineer (15 min response)
2. **Level 2**: DevOps lead (30 min response)
3. **Level 3**: CTO (1 hour response)

---

**Last Updated**: December 2024
**Version**: 1.0.0
