# GitHub Actions Setup Guide

## Current Issues and Solutions

### ✅ **Fixed Issues:**

1. **Missing Frontend Tests** - Created basic test files
2. **Complex Workflow** - Created simplified `simple-deploy.yml`

### ❌ **Remaining Issues:**

1. **Missing GitHub Secrets** - Need to configure AWS credentials
2. **Missing ECR Repositories** - Need to be created in AWS
3. **Missing Terraform Environments** - Only `dev/` exists

## Setup Steps

### 1. Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add:

```
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

### 2. Create ECR Repositories

Run these AWS CLI commands or create via AWS Console:

```bash
aws ecr create-repository --repository-name hibiji-backend --region us-west-1
aws ecr create-repository --repository-name hibiji-frontend --region us-west-1
```

### 3. Choose Your Workflow

#### Option A: Use Simple Deploy (Recommended)

- Uses `simple-deploy.yml`
- Works with current setup
- Only deploys to `dev` environment
- Creates ECR repos automatically

#### Option B: Fix Complex Workflow

- Update `ci-cd-pipeline.yml` to work with current setup
- Create missing Terraform environments
- Configure domain settings

### 4. Test the Workflow

1. Push to `main` or `dev` branch
2. Check Actions tab in GitHub
3. Monitor the workflow execution

## Workflow Features

### Simple Deploy Workflow:

- ✅ Backend tests
- ✅ Frontend build and tests
- ✅ Docker image builds
- ✅ Security scanning
- ✅ AWS deployment (if secrets configured)

### What It Does:

1. **Tests**: Runs backend and frontend tests
2. **Builds**: Creates Docker images
3. **Security**: Scans for vulnerabilities
4. **Deploys**: Pushes to ECR and deploys to AWS (if configured)

## Troubleshooting

### Common Issues:

1. **Tests Fail**: Check test files and dependencies
2. **Build Fails**: Check Dockerfile and dependencies
3. **Deploy Fails**: Check AWS credentials and permissions
4. **ECR Issues**: Ensure repositories exist and have proper permissions

### Debug Commands:

```bash
# Test locally
npm test -- --watchAll=false
pytest tests/ -v

# Build Docker images
docker build -t test-backend .
docker build -t test-frontend ./frontend
```

## Next Steps

1. Configure GitHub secrets
2. Test the simple workflow
3. Gradually add more environments as needed
4. Customize the workflow for your specific needs
