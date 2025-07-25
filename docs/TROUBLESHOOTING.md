# Troubleshooting Guide

This guide helps resolve common issues encountered during the Hibiji platform deployment.

## AWS Prerequisites Setup Script Hanging

### Symptoms

- The `setup-aws-prerequisites.sh` script hangs after creating IAM roles
- No error messages, just stops responding
- Script appears to freeze during secrets creation

### Common Causes and Solutions

#### 1. OpenSSL Issues

**Problem**: OpenSSL command hangs or fails
**Solution**:

```bash
# Check if openssl is installed
which openssl

# Test openssl command
openssl rand -base64 32

# If not installed on macOS
brew install openssl

# If not installed on Ubuntu
sudo apt-get install openssl
```

#### 2. AWS Secrets Manager Permissions

**Problem**: Insufficient permissions to create secrets
**Solution**:

```bash
# Test AWS Secrets Manager access
aws secretsmanager list-secrets --max-items 1

# Check your IAM permissions
aws iam get-user
aws iam list-attached-user-policies --user-name YOUR_USERNAME
```

#### 3. Network/Connectivity Issues

**Problem**: AWS CLI commands timeout
**Solution**:

```bash
# Test AWS connectivity
aws sts get-caller-identity

# Check AWS region configuration
aws configure get region

# Test specific service
aws secretsmanager list-secrets --max-items 1
```

#### 4. AWS CLI Version Issues

**Problem**: Outdated AWS CLI version
**Solution**:

```bash
# Check AWS CLI version
aws --version

# Update AWS CLI (macOS)
brew upgrade awscli

# Update AWS CLI (Ubuntu)
sudo apt-get update && sudo apt-get upgrade awscli
```

### Debugging Steps

#### Step 1: Use Debug Script

Run the debug version to see exactly where it hangs:

```bash
./scripts/setup-aws-prerequisites-debug.sh
```

#### Step 2: Test Secrets Creation Separately

Test just the secrets creation part:

```bash
./scripts/test-secrets-creation.sh
```

#### Step 3: Skip Secrets Creation

If secrets creation is the issue, run without secrets:

```bash
./scripts/setup-aws-prerequisites-skip-secrets.sh
```

#### Step 4: Manual Secrets Creation

If the script hangs on secrets, create them manually:

```bash
# Generate passwords
DB_PASSWORD=$(openssl rand -base64 32)
SECRET_KEY=$(openssl rand -base64 64)

# Create database password secret
aws secretsmanager create-secret \
    --name hibiji-database-password \
    --description "Database password for Hibiji platform" \
    --secret-string "{\"password\":\"$DB_PASSWORD\"}"

# Create application secret key
aws secretsmanager create-secret \
    --name hibiji-secret-key \
    --description "Application secret key for Hibiji platform" \
    --secret-string "{\"secret_key\":\"$SECRET_KEY\"}"
```

### Alternative Solutions

#### Option 1: Use Different Password Generation

If OpenSSL hangs, use alternative methods:

```bash
# Use /dev/urandom instead
DB_PASSWORD=$(head -c 32 /dev/urandom | base64)
SECRET_KEY=$(head -c 64 /dev/urandom | base64)

# Or use Python
DB_PASSWORD=$(python3 -c "import secrets; print(secrets.token_urlsafe(32))")
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(64))")
```

#### Option 2: Create Secrets Later

Skip secrets creation in the initial setup and create them manually before deployment:

```bash
# Run setup without secrets
./scripts/setup-aws-prerequisites-skip-secrets.sh

# Create secrets manually before deployment
./scripts/create-secrets-manually.sh
```

## Terraform Deployment Issues

### Common Terraform Errors

#### 1. State Lock Issues

**Problem**: Terraform state is locked
**Solution**:

```bash
# Check if state is locked
aws dynamodb describe-table --table-name hibiji-terraform-locks

# Force unlock (use with caution)
terraform force-unlock LOCK_ID
```

#### 2. Resource Already Exists

**Problem**: Resources already exist in AWS
**Solution**:

```bash
# Import existing resources
terraform import aws_resource_type.resource_name resource_id

# Or destroy and recreate
terraform destroy
terraform apply
```

#### 3. Permission Issues

**Problem**: Insufficient AWS permissions
**Solution**:

```bash
# Check required permissions
cat terraform/required-permissions.md

# Verify your IAM permissions
aws iam get-user
aws iam list-attached-user-policies --user-name YOUR_USERNAME
```

## Docker Build Issues

### Common Docker Problems

#### 1. Build Context Too Large

**Problem**: Docker build context exceeds limits
**Solution**:

```bash
# Add to .dockerignore
node_modules/
.git/
*.log
.env
```

#### 2. Memory Issues

**Problem**: Docker build runs out of memory
**Solution**:

```bash
# Increase Docker memory limit
# In Docker Desktop: Settings > Resources > Memory

# Or use buildx with more memory
docker buildx build --memory=4g .
```

#### 3. Network Issues

**Problem**: Cannot pull base images
**Solution**:

```bash
# Check Docker network
docker network ls

# Restart Docker
sudo systemctl restart docker  # Linux
# Or restart Docker Desktop on macOS/Windows
```

## CI/CD Pipeline Issues

### GitHub Actions Problems

#### 1. Secrets Not Found

**Problem**: GitHub secrets are not configured
**Solution**:

```bash
# Check required secrets
cat scripts/configure-github-secrets.sh

# Configure secrets manually in GitHub
# Settings > Secrets and variables > Actions
```

#### 2. AWS Credentials Issues

**Problem**: GitHub Actions cannot access AWS
**Solution**:

```bash
# Verify AWS credentials in GitHub secrets
# Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY

# Test credentials locally
aws sts get-caller-identity
```

#### 3. Build Failures

**Problem**: Docker builds fail in CI/CD
**Solution**:

```bash
# Check build logs
# Look for specific error messages

# Test build locally
docker build -t hibiji-backend ./backend
docker build -t hibiji-frontend ./frontend
```

## Database Issues

### PostgreSQL Problems

#### 1. Connection Issues

**Problem**: Cannot connect to RDS
**Solution**:

```bash
# Check security groups
aws ec2 describe-security-groups --group-ids sg-xxxxxxxxx

# Verify VPC settings
aws rds describe-db-instances --db-instance-identifier hibiji-db
```

#### 2. Migration Failures

**Problem**: Alembic migrations fail
**Solution**:

```bash
# Check database logs
aws logs describe-log-groups --log-group-name-prefix hibiji

# Run migrations manually
cd backend
alembic upgrade head
```

## Monitoring and Logs

### Accessing Logs

#### 1. CloudWatch Logs

```bash
# List log groups
aws logs describe-log-groups --log-group-name-prefix hibiji

# Get log events
aws logs get-log-events \
    --log-group-name /ecs/hibiji-backend \
    --log-stream-name ecs/hibiji-backend/container-name
```

#### 2. ECS Service Logs

```bash
# Describe services
aws ecs describe-services \
    --cluster hibiji-cluster \
    --services hibiji-backend

# Get task logs
aws logs get-log-events \
    --log-group-name /ecs/hibiji-backend \
    --log-stream-name ecs/hibiji-backend/task-id
```

### Health Checks

#### 1. Application Health

```bash
# Check application endpoints
curl https://api.hibiji.com/health
curl https://www.hibiji.com

# Check load balancer health
aws elbv2 describe-target-health \
    --target-group-arn arn:aws:elasticloadbalancing:...
```

#### 2. Infrastructure Health

```bash
# Check ECS cluster
aws ecs describe-clusters --clusters hibiji-cluster

# Check RDS instance
aws rds describe-db-instances --db-instance-identifier hibiji-db

# Check S3 buckets
aws s3 ls s3://hibiji-uploads
```

## Getting Help

### Before Asking for Help

1. **Check this troubleshooting guide**
2. **Review the logs** (CloudWatch, application logs)
3. **Test the issue locally** if possible
4. **Document the exact error messages**
5. **Note your environment** (OS, AWS CLI version, etc.)

### Useful Commands for Debugging

```bash
# Check AWS configuration
aws configure list

# Check AWS CLI version
aws --version

# Test AWS connectivity
aws sts get-caller-identity

# Check Terraform version
terraform version

# Check Docker version
docker --version

# Check system resources
df -h
free -h
```

### Contact Information

- **GitHub Issues**: Create an issue in the repository
- **Documentation**: Check the main README.md and DEPLOYMENT_GUIDE.md
- **AWS Support**: If it's an AWS-specific issue

## Quick Fixes

### Most Common Solutions

1. **Script hanging**: Use debug script or skip secrets creation
2. **Permission denied**: Check IAM permissions and AWS credentials
3. **Resource exists**: Import existing resources or destroy/recreate
4. **Build fails**: Check Docker context and memory limits
5. **Connection issues**: Verify security groups and VPC settings
