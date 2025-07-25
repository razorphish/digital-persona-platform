#!/bin/bash

# Digital Persona Platform - First Backend Deployment Script
# Backend-only deployment system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

echo -e "${BLUE}🚀 Digital Persona Platform - First Backend Deployment${NC}"
echo "============================================================="

# Check if we're in the right directory
if [ ! -f "terraform/environments/dev/main.tf" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Get AWS account details
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION="us-west-1"

print_status "AWS Account ID: $AWS_ACCOUNT_ID"
print_status "AWS Region: $AWS_REGION"

# Check if ECR repositories exist
print_status "Checking ECR repositories..."
if ! aws ecr describe-repositories --repository-names hibiji-backend --region $AWS_REGION > /dev/null 2>&1; then
    print_status "Creating backend ECR repository..."
    aws ecr create-repository --repository-name hibiji-backend --region $AWS_REGION
    print_success "Backend ECR repository created"
else
    print_success "Backend ECR repository exists"
fi

# Login to ECR
print_status "Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push backend
print_status "Building backend image..."
docker build -t hibiji-backend:latest .
docker tag hibiji-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/hibiji-backend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/hibiji-backend:latest

print_success "Backend image pushed"

# Navigate to Terraform directory
cd terraform/environments/dev

# Initialize Terraform
print_status "Initializing Terraform..."
terraform init

# Apply Terraform configuration
print_status "Applying Terraform configuration..."
terraform apply -auto-approve \
    -var="backend_image_tag=latest" \
    -var="environment=dev" \
    -var="backend_ecr_repository_url=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/hibiji-backend" \
    -var="aws_region=$AWS_REGION"

print_success "Infrastructure deployed"

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 60

# Get ALB DNS name
ALB_DNS=$(terraform output -raw alb_dns_name 2>/dev/null || echo "not-available")

if [ "$ALB_DNS" != "not-available" ]; then
    print_status "Application Load Balancer DNS: $ALB_DNS"
    
    # Wait for ALB to be ready
    print_status "Waiting for ALB to be ready..."
    sleep 30
    
    # Test backend
    print_status "Testing backend..."
    if curl -f http://$ALB_DNS/health > /dev/null 2>&1; then
        print_success "Backend health check passed"
    else
        print_error "Backend health check failed"
        print_status "Checking ECS service status..."
        aws ecs describe-services --cluster hibiji-dev-cluster --services hibiji-dev-backend --region $AWS_REGION
    fi
    
    # Show deployment info
    echo ""
    print_success "🎉 Deployment completed!"
    echo ""
    print_status "📋 Deployment Information:"
    print_status "🔧 Backend API: http://$ALB_DNS"
    print_status "📚 API Documentation: http://$ALB_DNS/docs"
    print_status "💚 Health Check: http://$ALB_DNS/health"
    echo ""
    print_status "🛠️ Management Commands:"
    print_status "📊 View ECS Service: aws ecs describe-services --cluster hibiji-dev-cluster --services hibiji-dev-backend --region $AWS_REGION"
    print_status "📋 View Logs: aws logs tail /ecs/hibiji-dev-app --follow --region $AWS_REGION"
    print_status "🔄 Update Service: terraform apply -var=\"backend_image_tag=new-tag\""
else
    print_error "Could not retrieve ALB DNS name from Terraform output"
    print_status "Check Terraform state and AWS console for deployment status"
fi

print_success "First deployment script completed!" 