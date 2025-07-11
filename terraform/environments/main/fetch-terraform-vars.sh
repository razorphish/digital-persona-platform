#!/bin/bash
# fetch-terraform-vars.sh
set -e

echo "🔍 Discovering ECR repository URLs..."

# Discover ECR repository URLs dynamically (requires AWS CLI configured)
BACKEND_REPO=$(aws ecr describe-repositories --query "repositories[?repositoryName=='hibiji-backend'].repositoryUri" --output text)
FRONTEND_REPO=$(aws ecr describe-repositories --query "repositories[?repositoryName=='hibiji-frontend'].repositoryUri" --output text)
IMAGE_TAG="latest"  # Or dynamically fetch the latest tag if needed

# Validate that we got the repositories
if [ -z "$BACKEND_REPO" ]; then
    echo "❌ Error: Could not find hibiji-backend ECR repository"
    exit 1
fi

if [ -z "$FRONTEND_REPO" ]; then
    echo "❌ Error: Could not find hibiji-frontend ECR repository"
    exit 1
fi

echo "✅ Backend ECR: $BACKEND_REPO"
echo "✅ Frontend ECR: $FRONTEND_REPO"
echo "✅ Image tag: $IMAGE_TAG"

export TF_VAR_ecr_repository_url="$BACKEND_REPO"
export TF_VAR_frontend_ecr_repository_url="$FRONTEND_REPO"
export TF_VAR_image_tag="$IMAGE_TAG"
export TF_VAR_frontend_image_tag="$IMAGE_TAG"

echo "🚀 Running terraform apply with environment variables for dynamic values..."
terraform apply 