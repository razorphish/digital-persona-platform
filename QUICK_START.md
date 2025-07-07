# 🚀 Hibiji Platform Quick Start Guide

## **Get Your Platform Running in 30 Minutes**

This guide will help you deploy the Hibiji Digital Persona Platform to AWS quickly and efficiently.

## **📋 Prerequisites (5 minutes)**

### **Required Tools**

```bash
# Install AWS CLI
brew install awscli  # macOS
# or
sudo apt-get install awscli  # Ubuntu

# Install Terraform
brew install terraform  # macOS
# or
sudo apt-get install terraform  # Ubuntu

# Install Docker
brew install docker  # macOS
# or
sudo apt-get install docker.io  # Ubuntu

# Install GitHub CLI (optional, for automated setup)
brew install gh  # macOS
# or
sudo apt-get install gh  # Ubuntu
```

### **AWS Account Setup**

1. **Create AWS Account** at https://aws.amazon.com
2. **Create IAM User** with programmatic access
3. **Attach AdministratorAccess policy** (for initial setup)
4. **Configure AWS CLI**:
   ```bash
   aws configure
   # Enter your Access Key ID
   # Enter your Secret Access Key
   # Enter region: us-west-1
   # Enter output format: json
   ```

## **🔧 Automated Setup (10 minutes)**

### **Step 1: Run AWS Prerequisites Script**

```bash
# Make script executable
chmod +x scripts/setup-aws-prerequisites.sh

# Run the setup script
./scripts/setup-aws-prerequisites.sh
```

This script will:

- ✅ Create S3 bucket for Terraform state
- ✅ Create ECR repositories for Docker images
- ✅ Create IAM roles for ECS
- ✅ Create Secrets Manager secrets

### **Step 2: Configure GitHub Secrets (if using CI/CD)**

```bash
# Make script executable
chmod +x scripts/setup-github-secrets.sh

# Run the setup script
./scripts/setup-github-secrets.sh
```

This script will:

- ✅ Configure AWS credentials in GitHub
- ✅ Set up application secrets
- ✅ Create environment protection rules

## **🚀 First Deployment (15 minutes)**

### **Option A: Automated Deployment (Recommended)**

```bash
# Make script executable
chmod +x scripts/first-deployment.sh

# Run the deployment script
./scripts/first-deployment.sh
```

This script will:

- ✅ Build and push Docker images
- ✅ Deploy infrastructure with Terraform
- ✅ Wait for services to be ready
- ✅ Test the deployment
- ✅ Display deployment information

### **Option B: Manual Deployment**

```bash
# 1. Build and push images
docker build -t hibiji-backend:latest .
docker build -t hibiji-frontend:latest ./frontend

# 2. Deploy infrastructure
cd terraform/environments/dev
terraform init
terraform plan
terraform apply

# 3. Test deployment
curl http://<alb-dns-name>/health
```

## **✅ Verification (5 minutes)**

### **Check Deployment Status**

```bash
# Check ECS services
aws ecs describe-services \
  --cluster hibiji-dev-cluster \
  --services hibiji-dev-backend hibiji-dev-frontend

# Check ALB health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>

# Test application
curl http://<alb-dns-name>/health
```

### **Access Your Application**

- **Frontend**: http://<alb-dns-name>
- **Backend API**: http://<alb-dns-name>/api
- **Health Check**: http://<alb-dns-name>/health
- **API Documentation**: http://<alb-dns-name>/docs

## **🔗 Useful Links**

### **AWS Console Links**

- **ECS Console**: https://us-west-1.console.aws.amazon.com/ecs/
- **RDS Console**: https://us-west-1.console.aws.amazon.com/rds/
- **CloudWatch**: https://us-west-1.console.aws.amazon.com/cloudwatch/
- **S3 Console**: https://s3.console.aws.amazon.com/

### **Cost Monitoring**

- **AWS Cost Explorer**: https://console.aws.amazon.com/cost-management/home
- **Budget Alerts**: Check your email for budget notifications

## **🚨 Troubleshooting**

### **Common Issues**

#### **1. ECS Service Not Starting**

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

#### **2. Database Connection Issues**

```bash
# Check RDS status
aws rds describe-db-instances \
  --db-instance-identifier hibiji-dev-db
```

#### **3. ALB Health Check Failing**

```bash
# Check target health
aws elbv2 describe-target-health \
  --target-group-arn <target-group-arn>
```

### **Get Help**

- **Documentation**: See `DEPLOYMENT_GUIDE.md` for detailed instructions
- **Issues**: Create an issue in the GitHub repository
- **Emergency**: Contact the DevOps team

## **🎯 Next Steps**

### **Immediate (Day 1)**

1. ✅ **Test all features** of the deployed application
2. ✅ **Configure DNS** for your domain (dev.hibiji.com)
3. ✅ **Set up SSL certificates** (automatic with ACM)
4. ✅ **Review cost estimates** and adjust if needed

### **Short Term (Week 1)**

1. 🔄 **Deploy to QA environment**
2. 🔄 **Set up monitoring and alerting**
3. 🔄 **Configure backup strategies**
4. 🔄 **Test disaster recovery procedures**

### **Medium Term (Month 1)**

1. 🔄 **Deploy to staging environment**
2. 🔄 **Set up production environment**
3. 🔄 **Implement CI/CD pipeline**
4. 🔄 **Configure advanced monitoring**

## **💰 Cost Estimates**

### **Development Environment**

- **Monthly Cost**: ~$50-100
- **Components**:
  - RDS: db.t3.micro ($15/month)
  - ECS: 256 CPU units ($10/month)
  - ALB: $20/month
  - Other services: $15/month

### **Production Environment**

- **Monthly Cost**: ~$500-1000
- **Components**:
  - RDS: db.r6g.large ($200/month)
  - ECS: 2048 CPU units ($100/month)
  - ALB: $20/month
  - Other services: $180/month

## **🎉 Congratulations!**

You've successfully deployed the Hibiji Digital Persona Platform to AWS!

Your platform is now:

- ✅ **Scalable**: Auto-scaling enabled for production
- ✅ **Secure**: VPC isolation, SSL certificates, IAM roles
- ✅ **Cost-optimized**: Environment-based resource sizing
- ✅ **Monitored**: CloudWatch integration and health checks
- ✅ **Backed up**: Automated database backups

---

**Need help?** Check the `DEPLOYMENT_GUIDE.md` for detailed instructions or create an issue in the repository.
