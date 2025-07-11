# GitHub Actions Terraform Variables Fix

## Problem

The GitHub Actions workflow was hanging on the Terraform plan step with:

```
var.ecr_repository_url
  Backend ECR repository URL
```

The workflow was waiting for interactive input because required Terraform variables were not provided.

## Root Cause

The Terraform configuration in `terraform/environments/main/main.tf` requires several variables that don't have default values:

1. `ecr_repository_url` - Backend ECR repository URL
2. `frontend_ecr_repository_url` - Frontend ECR repository URL

These variables are required but not provided in the workflow, causing Terraform to prompt for them interactively.

## Solution Applied

### 1. Added ECR Registry URL Detection

Added a step to dynamically determine the ECR registry URL:

```yaml
- name: Get ECR Registry URL
  run: |
    # Get the ECR registry URL dynamically
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    ECR_REGISTRY="${ACCOUNT_ID}.dkr.ecr.${{ env.AWS_REGION }}.amazonaws.com"
    echo "ECR_REGISTRY=$ECR_REGISTRY" >> $GITHUB_ENV
    echo "Using ECR registry: $ECR_REGISTRY"
```

### 2. Added Required Terraform Variables

Updated both Terraform Plan and Apply steps to include all required variables:

```yaml
env:
  TF_VAR_environment: ${{ github.ref == 'refs/heads/main' && 'prod' || 'dev' }}
  TF_VAR_ecr_repository_url: ${{ env.ECR_REGISTRY }}/dpp-backend
  TF_VAR_frontend_ecr_repository_url: ${{ env.ECR_REGISTRY }}/dpp-frontend
  TF_VAR_image_tag: ${{ github.sha }}
  TF_VAR_frontend_image_tag: ${{ github.sha }}
```

### 3. Updated Docker Build Steps

Updated Docker build and push commands to use the dynamically determined ECR registry:

```yaml
# Build backend image
docker build -t dpp-backend:${{ github.sha }} .
docker tag dpp-backend:${{ github.sha }} ${{ env.ECR_REGISTRY }}/dpp-backend:${{ github.sha }}
docker tag dpp-backend:${{ github.sha }} ${{ env.ECR_REGISTRY }}/dpp-backend:latest
docker push ${{ env.ECR_REGISTRY }}/dpp-backend:${{ github.sha }}
docker push ${{ env.ECR_REGISTRY }}/dpp-backend:latest
```

## Files Modified

- `.github/workflows/deploy-with-iam-role.yml` - Added ECR registry detection and Terraform variables

## Variables Added

### Required Variables (no defaults)

- `TF_VAR_ecr_repository_url` - Backend ECR repository URL
- `TF_VAR_frontend_ecr_repository_url` - Frontend ECR repository URL

### Optional Variables (with defaults)

- `TF_VAR_image_tag` - Backend image tag (set to commit SHA)
- `TF_VAR_frontend_image_tag` - Frontend image tag (set to commit SHA)

## ECR Registry URL Format

The ECR registry URL is constructed as:

```
{ACCOUNT_ID}.dkr.ecr.{REGION}.amazonaws.com
```

Example: `570827307849.dkr.ecr.us-west-2.amazonaws.com`

## Result

The Terraform steps should now:

- ✅ Complete without hanging on variable prompts
- ✅ Use dynamically determined ECR registry URLs
- ✅ Deploy infrastructure with correct image references
- ✅ Build and push Docker images to the correct ECR repositories

## Next Steps

1. Test the GitHub Actions workflow
2. Monitor the Terraform plan and apply steps
3. Verify that ECR repositories are created and accessible
4. Check that Docker images are built and pushed correctly

## Commands Added

```bash
# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Construct ECR registry URL
ECR_REGISTRY="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# Set environment variable for GitHub Actions
echo "ECR_REGISTRY=$ECR_REGISTRY" >> $GITHUB_ENV
```

The fix ensures that all required Terraform variables are provided automatically, eliminating the need for interactive input during the workflow execution.
