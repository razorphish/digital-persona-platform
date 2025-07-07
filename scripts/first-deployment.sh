#!/bin/bash
# scripts/first-deployment.sh
# First Deployment Script for Hibiji Platform

set -e

echo "🚀 First Deployment Script for Hibiji Platform..."

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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI not found. Please install it first."
        exit 1
    fi
    
    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform not found. Please install it first."
        exit 1
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker not found. Please install it first."
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured. Please run: aws configure"
        exit 1
    fi
    
    print_success "All prerequisites met"
}

# Get AWS account ID
get_aws_account_id() {
    AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    print_status "AWS Account ID: $AWS_ACCOUNT_ID"
}

# Build and push Docker images
build_and_push_images() {
    print_status "Building and pushing Docker images..."
    
    # Login to ECR
    aws ecr get-login-password --region us-west-1 | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.us-west-1.amazonaws.com
    
    # Build and push backend
    print_status "Building backend image..."
    docker build -t hibiji-backend:latest .
    docker tag hibiji-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.us-west-1.amazonaws.com/hibiji-backend:latest
    docker push $AWS_ACCOUNT_ID.dkr.ecr.us-west-1.amazonaws.com/hibiji-backend:latest
    print_success "Backend image pushed"
    
    # Build and push frontend
    print_status "Building frontend image..."
    cd frontend
    docker build -t hibiji-frontend:latest .
    docker tag hibiji-frontend:latest $AWS_ACCOUNT_ID.dkr.ecr.us-west-1.amazonaws.com/hibiji-frontend:latest
    docker push $AWS_ACCOUNT_ID.dkr.ecr.us-west-1.amazonaws.com/hibiji-frontend:latest
    cd ..
    print_success "Frontend image pushed"
}

# Deploy infrastructure
deploy_infrastructure() {
    print_status "Deploying infrastructure to dev environment..."
    
    cd terraform/environments/dev
    
    # Initialize Terraform
    terraform init \
        -backend-config="bucket=hibiji-terraform-state" \
        -backend-config="key=dev/terraform.tfstate" \
        -backend-config="region=us-west-1"
    
    # Plan deployment
    terraform plan \
        -var="image_tag=latest" \
        -var="frontend_image_tag=latest" \
        -var="ecr_repository_url=$AWS_ACCOUNT_ID.dkr.ecr.us-west-1.amazonaws.com/hibiji-backend" \
        -var="frontend_ecr_repository_url=$AWS_ACCOUNT_ID.dkr.ecr.us-west-1.amazonaws.com/hibiji-frontend" \
        -out=tfplan
    
    # Apply changes
    terraform apply tfplan
    
    cd ../../..
    print_success "Infrastructure deployed"
}

# Wait for services to be ready
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for ECS services to be stable
    aws ecs wait services-stable \
        --cluster hibiji-dev-cluster \
        --services hibiji-dev-backend hibiji-dev-frontend
    
    print_success "Services are stable"
}

# Test deployment
test_deployment() {
    print_status "Testing deployment..."
    
    # Get ALB DNS name
    ALB_DNS=$(aws elbv2 describe-load-balancers \
        --names hibiji-dev-alb \
        --query 'LoadBalancers[0].DNSName' \
        --output text)
    
    print_status "ALB DNS: $ALB_DNS"
    
    # Wait for health checks to pass
    sleep 60
    
    # Test backend health
    print_status "Testing backend health..."
    if curl -f http://$ALB_DNS/health; then
        print_success "Backend health check passed"
    else
        print_error "Backend health check failed"
        exit 1
    fi
    
    # Test frontend
    print_status "Testing frontend..."
    if curl -f http://$ALB_DNS/; then
        print_success "Frontend health check passed"
    else
        print_error "Frontend health check failed"
        exit 1
    fi
}

# Display deployment information
display_info() {
    print_status "Deployment completed successfully!"
    echo ""
    echo "=========================================="
    echo "  Deployment Information"
    echo "=========================================="
    echo ""
    
    # Get ALB DNS name
    ALB_DNS=$(aws elbv2 describe-load-balancers \
        --names hibiji-dev-alb \
        --query 'LoadBalancers[0].DNSName' \
        --output text)
    
    echo "🌐 Application URL: http://$ALB_DNS"
    echo "🔧 Backend API: http://$ALB_DNS/api"
    echo "📊 Health Check: http://$ALB_DNS/health"
    echo ""
    
    # Get ECS cluster info
    echo "🐳 ECS Cluster: hibiji-dev-cluster"
    echo "🔗 ECS Console: https://us-west-1.console.aws.amazon.com/ecs/home?region=us-west-1#/clusters/hibiji-dev-cluster"
    echo ""
    
    # Get RDS info
    RDS_ENDPOINT=$(aws rds describe-db-instances \
        --db-instance-identifier hibiji-dev-db \
        --query 'DBInstances[0].Endpoint.Address' \
        --output text)
    echo "🗄️ Database: $RDS_ENDPOINT"
    echo ""
    
    echo "Next steps:"
    echo "1. Configure DNS for dev.hibiji.com"
    echo "2. Set up SSL certificates"
    echo "3. Test all features"
    echo "4. Deploy to other environments"
}

# Main execution
main() {
    echo "=========================================="
    echo "  Hibiji Platform First Deployment"
    echo "=========================================="
    echo ""
    
    check_prerequisites
    get_aws_account_id
    build_and_push_images
    deploy_infrastructure
    wait_for_services
    test_deployment
    display_info
}

# Run main function
main "$@" 