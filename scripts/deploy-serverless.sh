#!/bin/bash

# =================================
# Serverless Architecture Deployment Script
# =================================
# This script deploys the serverless architecture including:
# - Terraform infrastructure (Lambda, API Gateway, S3, CloudFront, SSL certificates)
# - Frontend build and S3 upload
# - Backend Lambda deployment
# - SSL certificate validation and custom domain setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="dev"
SUB_ENVIRONMENT="dev01"
SKIP_BUILD=false
SKIP_INFRASTRUCTURE=false
DRY_RUN=false

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to show usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -e, --environment ENVIRONMENT    Environment to deploy to (default: dev)"
    echo "  -s, --sub-environment SUB_ENV    Sub-environment to deploy to (default: dev01)"
    echo "  -b, --skip-build                 Skip build steps"
    echo "  -i, --skip-infrastructure        Skip infrastructure deployment"
    echo "  -d, --dry-run                    Show what would be deployed without making changes"
    echo "  -h, --help                       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                               # Deploy dev/dev01"
    echo "  $0 -e dev -s dev02              # Deploy dev/dev02"
    echo "  $0 -e staging -s staging        # Deploy staging"
    echo "  $0 --skip-build                 # Deploy without rebuilding"
    echo "  $0 --dry-run                    # Show deployment plan"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -s|--sub-environment)
            SUB_ENVIRONMENT="$2"
            shift 2
            ;;
        -b|--skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -i|--skip-infrastructure)
            SKIP_INFRASTRUCTURE=true
            shift
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Show banner
echo ""
echo "=========================================="
echo "🚀 SERVERLESS DEPLOYMENT"
echo "=========================================="
echo ""
print_status "Environment: ${ENVIRONMENT}"
print_status "Sub-environment: ${SUB_ENVIRONMENT}"
print_status "Skip build: ${SKIP_BUILD}"
print_status "Skip infrastructure: ${SKIP_INFRASTRUCTURE}"
print_status "Dry run: ${DRY_RUN}"
echo ""

# Validation
if [[ ! -d "terraform/environments/${ENVIRONMENT}" ]]; then
    print_error "Terraform environment directory not found: terraform/environments/${ENVIRONMENT}"
    exit 1
fi

# =================================
# Pre-deployment checks
# =================================
print_status "Running pre-deployment checks..."

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed"
    exit 1
fi

# Check AWS credentials
if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured or invalid"
    exit 1
fi

# Check Terraform
if ! command -v terraform &> /dev/null; then
    print_error "Terraform is not installed"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi

print_success "Pre-deployment checks passed"

# =================================
# Build Frontend
# =================================
if [[ "$SKIP_BUILD" == false ]]; then
    print_status "Building frontend for static export..."
    
    # Install dependencies
    print_status "Installing dependencies..."
    npm ci
    
    # Build shared packages
    print_status "Building shared packages..."
    npm run build --workspace=@digital-persona/shared --if-present
    npm run build --workspace=@digital-persona/database --if-present
    
    # Build frontend
    cd apps/web
    print_status "Building frontend..."
    
    # Set environment variables for build
    export NODE_ENV=production
    export NEXT_PUBLIC_API_URL="https://api-${SUB_ENVIRONMENT}.hibiji.com"  # Will be updated after infrastructure
    
    if [[ "$DRY_RUN" == false ]]; then
        npm run build
        print_success "Frontend build completed"
    else
        print_status "DRY RUN: Would build frontend"
    fi
    
    cd ../..
else
    print_status "Skipping frontend build"
fi

# =================================
# Build Backend Lambda Package
# =================================
if [[ "$SKIP_BUILD" == false ]]; then
    print_status "Building backend Lambda package..."
    
    cd apps/server
    
    # Build backend
    print_status "Building backend..."
    if [[ "$DRY_RUN" == false ]]; then
        npm run build
        
        # Create Lambda deployment package
        print_status "Creating Lambda deployment package..."
        
        # Clean up any existing deployment
        rm -rf deployment lambda-deployment.zip
        
        # Create deployment directory
        mkdir -p deployment
        
        # Copy built files
        cp -r dist/* deployment/
        
        # Copy package.json and install production dependencies
        cp package.json deployment/
        cd deployment
        npm install --only=production --ignore-scripts
        
        # Create zip file
        zip -r ../lambda-deployment.zip .
        cd ..
        
        # Clean up
        rm -rf deployment
        
        print_success "Lambda package created: apps/server/lambda-deployment.zip"
    else
        print_status "DRY RUN: Would build Lambda package"
    fi
    
    cd ../..
else
    print_status "Skipping backend build"
fi

# =================================
# Deploy Infrastructure
# =================================
if [[ "$SKIP_INFRASTRUCTURE" == false ]]; then
    print_status "Deploying infrastructure with Terraform..."
    
    cd "terraform/environments/${ENVIRONMENT}"
    
    # Initialize Terraform
    print_status "Initializing Terraform..."
    if [[ "$DRY_RUN" == false ]]; then
        terraform init
    else
        print_status "DRY RUN: Would run terraform init"
    fi
    
    # Plan deployment
    print_status "Planning infrastructure changes..."
    if [[ "$DRY_RUN" == false ]]; then
        terraform plan \
            -var="sub_environment=${SUB_ENVIRONMENT}" \
            -input=false \
            -out=tfplan
    else
        terraform plan \
            -var="sub_environment=${SUB_ENVIRONMENT}" \
            -input=false
    fi
    
    # Apply changes
    if [[ "$DRY_RUN" == false ]]; then
        print_status "Applying infrastructure changes..."
        terraform apply -input=false tfplan
        
        # Get outputs
        WEBSITE_BUCKET=$(terraform output -raw website_bucket_name)
        API_URL=$(terraform output -raw api_url)
        LAMBDA_FUNCTION=$(terraform output -raw lambda_function_name)
        SSL_CERTIFICATE_ARN=$(terraform output -raw ssl_certificate_arn 2>/dev/null || echo "")
        WEBSITE_DOMAIN=$(terraform output -raw website_domain 2>/dev/null || echo "")
        CLOUDFRONT_DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id 2>/dev/null || echo "")
        
        print_success "Infrastructure deployed successfully"
        print_status "Website bucket: ${WEBSITE_BUCKET}"
        print_status "API URL: ${API_URL}"
        print_status "Lambda function: ${LAMBDA_FUNCTION}"
        
        # Show SSL certificate information
        if [[ -n "$SSL_CERTIFICATE_ARN" && "$SSL_CERTIFICATE_ARN" != "null" ]]; then
            print_success "🔒 SSL Certificate deployed: ${SSL_CERTIFICATE_ARN}"
        fi
        
        if [[ -n "$WEBSITE_DOMAIN" && "$WEBSITE_DOMAIN" != "null" ]]; then
            print_success "🌐 Custom domain configured: https://${WEBSITE_DOMAIN}"
        fi
        
        if [[ -n "$CLOUDFRONT_DISTRIBUTION_ID" && "$CLOUDFRONT_DISTRIBUTION_ID" != "null" ]]; then
            print_status "📡 CloudFront distribution: ${CLOUDFRONT_DISTRIBUTION_ID}"
        fi
    else
        print_status "DRY RUN: Would apply infrastructure changes"
    fi
    
    cd ../../..
else
    print_status "Skipping infrastructure deployment"
    
    # Still need to get outputs if skipping infrastructure
    if [[ "$DRY_RUN" == false ]]; then
        cd "terraform/environments/${ENVIRONMENT}"
        WEBSITE_BUCKET=$(terraform output -raw website_bucket_name 2>/dev/null || echo "")
        API_URL=$(terraform output -raw api_url 2>/dev/null || echo "")
        LAMBDA_FUNCTION=$(terraform output -raw lambda_function_name 2>/dev/null || echo "")
        SSL_CERTIFICATE_ARN=$(terraform output -raw ssl_certificate_arn 2>/dev/null || echo "")
        WEBSITE_DOMAIN=$(terraform output -raw website_domain 2>/dev/null || echo "")
        CLOUDFRONT_DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id 2>/dev/null || echo "")
        cd ../../..
    fi
fi

# =================================
# Deploy Frontend to S3
# =================================
if [[ "$SKIP_BUILD" == false && -n "$WEBSITE_BUCKET" ]]; then
    print_status "Deploying frontend to S3..."
    
    if [[ "$DRY_RUN" == false ]]; then
        # Deploy static files with long cache
        aws s3 sync apps/web/out/ s3://${WEBSITE_BUCKET}/ \
            --delete \
            --cache-control "public, max-age=31536000" \
            --exclude "*.html" \
            --exclude "*.json"
        
        # Deploy HTML and JSON files with shorter cache
        aws s3 sync apps/web/out/ s3://${WEBSITE_BUCKET}/ \
            --delete \
            --cache-control "public, max-age=3600" \
            --include "*.html" \
            --include "*.json"
        
        print_success "Frontend deployed to S3"
        
        # Invalidate CloudFront cache
        print_status "Invalidating CloudFront cache..."
        DISTRIBUTION_ID=$(aws cloudfront list-distributions \
            --query "DistributionList.Items[?Comment=='${WEBSITE_BUCKET}'].Id" \
            --output text)
        
        if [[ -n "$DISTRIBUTION_ID" && "$DISTRIBUTION_ID" != "None" ]]; then
            aws cloudfront create-invalidation \
                --distribution-id $DISTRIBUTION_ID \
                --paths "/*"
            print_success "CloudFront cache invalidated"
        else
            print_warning "CloudFront distribution not found for invalidation"
        fi
    else
        print_status "DRY RUN: Would deploy frontend to S3: ${WEBSITE_BUCKET}"
    fi
fi

# =================================
# Deploy Backend Lambda
# =================================
if [[ "$SKIP_BUILD" == false && -n "$LAMBDA_FUNCTION" ]]; then
    print_status "Deploying backend Lambda function..."
    
    if [[ "$DRY_RUN" == false ]]; then
        # Update Lambda function code
        aws lambda update-function-code \
            --function-name $LAMBDA_FUNCTION \
            --zip-file fileb://apps/server/lambda-deployment.zip
        
        # Wait for update to complete
        print_status "Waiting for Lambda update to complete..."
        aws lambda wait function-updated \
            --function-name $LAMBDA_FUNCTION
        
        print_success "Lambda function updated"
    else
        print_status "DRY RUN: Would update Lambda function: ${LAMBDA_FUNCTION}"
    fi
fi

# =================================
# Health Checks
# =================================
if [[ "$DRY_RUN" == false && -n "$API_URL" ]]; then
    print_status "Running health checks..."
    
    # Test API health endpoint
    print_status "Testing API health endpoint..."
    for i in {1..5}; do
        if curl -f "${API_URL}/health" &> /dev/null; then
            print_success "API health check passed"
            break
        else
            print_warning "API not ready, retrying... (${i}/5)"
            sleep 10
        fi
    done
    
    # Test website (CloudFront distribution)
    if [[ -n "$WEBSITE_BUCKET" ]]; then
        WEBSITE_URL=$(aws cloudfront list-distributions \
            --query "DistributionList.Items[?Comment=='${WEBSITE_BUCKET}'].DomainName" \
            --output text)
        
        if [[ -n "$WEBSITE_URL" && "$WEBSITE_URL" != "None" ]]; then
            print_status "Testing CloudFront distribution..."
            if curl -f "https://${WEBSITE_URL}" &> /dev/null; then
                print_success "CloudFront health check passed"
            else
                print_warning "CloudFront health check failed"
            fi
        fi
    fi
    
    # Test custom domain with SSL (if configured)
    if [[ -n "$WEBSITE_DOMAIN" && "$WEBSITE_DOMAIN" != "null" ]]; then
        print_status "Testing custom domain with SSL..."
        if curl -f -s --connect-timeout 15 "https://${WEBSITE_DOMAIN}" &> /dev/null; then
            print_success "✅ Custom domain SSL health check passed"
        else
            print_warning "⚠️ Custom domain not ready yet (SSL may still be validating)"
            print_status "💡 This is normal for new deployments - validation takes 5-15 minutes"
        fi
    fi
fi

# =================================
# Summary
# =================================
echo ""
echo "=========================================="
echo "🎉 DEPLOYMENT SUMMARY"
echo "=========================================="

if [[ "$DRY_RUN" == true ]]; then
    print_status "DRY RUN COMPLETED - No changes were made"
else
    print_success "Serverless deployment completed successfully!"
fi

echo ""
print_status "Environment: ${ENVIRONMENT}/${SUB_ENVIRONMENT}"

# Show SSL and custom domain information first (most important)
if [[ -n "$WEBSITE_DOMAIN" && "$WEBSITE_DOMAIN" != "null" ]]; then
    print_success "🌐 Custom Domain (SSL): https://${WEBSITE_DOMAIN}"
fi

if [[ -n "$SSL_CERTIFICATE_ARN" && "$SSL_CERTIFICATE_ARN" != "null" ]]; then
    # Get certificate status
    CERT_STATUS=$(aws acm describe-certificate --certificate-arn "$SSL_CERTIFICATE_ARN" --region us-east-1 --query 'Certificate.Status' --output text 2>/dev/null || echo "Unknown")
    print_success "🔒 SSL Certificate Status: ${CERT_STATUS}"
fi

if [[ -n "$API_URL" ]]; then
    print_status "🔗 API URL: ${API_URL}"
fi

if [[ -n "$WEBSITE_BUCKET" ]]; then
    WEBSITE_URL=$(aws cloudfront list-distributions \
        --query "DistributionList.Items[?Comment=='${WEBSITE_BUCKET}'].DomainName" \
        --output text 2>/dev/null || echo "")
    
    if [[ -n "$WEBSITE_URL" && "$WEBSITE_URL" != "None" ]]; then
        print_status "📡 CloudFront URL: https://${WEBSITE_URL}"
    fi
    
    print_status "📦 S3 Bucket: ${WEBSITE_BUCKET}"
fi

if [[ -n "$LAMBDA_FUNCTION" ]]; then
    print_status "⚡ Lambda Function: ${LAMBDA_FUNCTION}"
fi

# SSL deployment verification
if [[ -n "$WEBSITE_DOMAIN" && "$WEBSITE_DOMAIN" != "null" && "$DRY_RUN" == false ]]; then
    echo ""
    print_status "🔍 Verifying SSL deployment..."
    
    # Test SSL certificate
    if curl -I -s --connect-timeout 10 "https://${WEBSITE_DOMAIN}" >/dev/null 2>&1; then
        print_success "✅ SSL certificate is working!"
    else
        print_warning "⚠️ SSL certificate may still be validating (can take 5-15 minutes)"
        print_status "💡 Check status: aws acm describe-certificate --certificate-arn ${SSL_CERTIFICATE_ARN} --region us-east-1"
    fi
fi 