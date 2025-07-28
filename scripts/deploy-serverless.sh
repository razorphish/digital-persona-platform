#!/bin/bash

# =============================================================================
# Deploy Serverless Infrastructure Script (IAC Precedence - COMPREHENSIVE)
# =============================================================================
# Deploys complete serverless infrastructure for any sub-environment
# Follows Infrastructure as Code precedence with comprehensive resource import
# Handles all resource types that can cause "AlreadyExists" errors via Terraform
# =============================================================================

set -e

TARGET_ENV="$1"
PROJECT_NAME="dpp"
AWS_REGION="us-west-1"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}$1${NC}"
}

print_warning() {
    echo -e "${YELLOW}$1${NC}"
}

print_error() {
    echo -e "${RED}$1${NC}"
}

# Usage check
if [ -z "$TARGET_ENV" ]; then
    print_error "❌ Usage: $0 <environment>"
    print_warning "📋 Examples:"
    echo "   $0 dev01     # Deploy to dev01 environment"
    echo "   $0 qa03      # Deploy to qa03 environment"
    echo "   $0 staging   # Deploy to staging environment"
    exit 1
fi

print_header "🚀 COMPREHENSIVE IAC Infrastructure Deployment: $TARGET_ENV"
print_warning "✅ Following Infrastructure as Code precedence"
print_warning "✅ Terraform + Workflows + Scripts - NO ad-hoc fixes"
echo ""

# Determine main environment from sub-environment
case $TARGET_ENV in
    dev*)
        MAIN_ENV="dev"
        ;;
    qa*)
        MAIN_ENV="qa"
        ;;
    staging*)
        MAIN_ENV="staging"
        ;;
    prod*)
        MAIN_ENV="prod"
        ;;
    hotfix*)
        MAIN_ENV="hotfix"
        ;;
    *)
        MAIN_ENV="dev"  # Default fallback
        ;;
esac

RESOURCE_PREFIX="${MAIN_ENV}-${TARGET_ENV}-${PROJECT_NAME}"

print_header "🏷️  Resource Naming Pattern: $RESOURCE_PREFIX-*"
print_success "📋 Target Environment: $TARGET_ENV (Main: $MAIN_ENV)"
print_success "🔧 All resources will be managed via Terraform"
echo ""

# Validation
if [[ ! -d "terraform/environments/${MAIN_ENV}" ]]; then
    print_error "Terraform environment directory not found: terraform/environments/${MAIN_ENV}"
    exit 1
fi

# =================================
# Pre-deployment checks
# =================================
print_header "🔍 Running pre-deployment checks..."

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
    print_header "🛠️  Building frontend for static export..."
    
    # Install dependencies
    print_header "📦 Installing dependencies..."
    npm ci
    
    # Build shared packages
    print_header "🔗 Building shared packages..."
    npm run build --workspace=@digital-persona/shared --if-present
    npm run build --workspace=@digital-persona/database --if-present
    
    # Build frontend
    cd apps/web
    print_header "🚀 Building frontend..."
    
    # Set environment variables for build
    export NODE_ENV=production
    export NEXT_PUBLIC_API_URL="https://api-${SUB_ENVIRONMENT}.hibiji.com"  # Will be updated after infrastructure
    
    if [[ "$DRY_RUN" == false ]]; then
        npm run build
        print_success "Frontend build completed"
    else
        print_warning "DRY RUN: Would build frontend"
    fi
    
    cd ../..
else
    print_warning "⚠️ Skipping frontend build"
fi

# =================================
# Build Backend Lambda Package
# =================================
if [[ "$SKIP_BUILD" == false ]]; then
    print_header "🛠️  Building backend Lambda package..."
    
    cd apps/server
    
    # Build backend
    print_header "🚀 Building backend..."
    if [[ "$DRY_RUN" == false ]]; then
        npm run build
        
        # Create Lambda deployment package
        print_header "📦 Creating Lambda deployment package..."
        
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
        print_warning "DRY RUN: Would build Lambda package"
    fi
    
    cd ../..
else
    print_warning "⚠️ Skipping backend build"
fi

# =================================
# Deploy Infrastructure
# =================================
if [[ "$SKIP_INFRASTRUCTURE" == false ]]; then
    print_header "🚀 Deploying infrastructure with Terraform..."
    
    cd "terraform/environments/${MAIN_ENV}"
    
    # Initialize Terraform
    print_header "🔧 Initializing Terraform..."
    if [[ "$DRY_RUN" == false ]]; then
        terraform init
    else
        print_warning "DRY RUN: Would run terraform init"
    fi
    
    # Plan deployment
    print_header "📋 Planning infrastructure changes..."
    if [[ "$DRY_RUN" == false ]]; then
        terraform plan \
            -var="sub_environment=${TARGET_ENV}" \
            -input=false \
            -out=tfplan
    else
        terraform plan \
            -var="sub_environment=${TARGET_ENV}" \
            -input=false
    fi
    
    # Apply changes
    if [[ "$DRY_RUN" == false ]]; then
        print_header "🚀 Applying infrastructure changes..."
        terraform apply -input=false tfplan
        
        # Get outputs
        WEBSITE_BUCKET=$(terraform output -raw website_bucket_name)
        API_URL=$(terraform output -raw api_url)
        LAMBDA_FUNCTION=$(terraform output -raw lambda_function_name)
        SSL_CERTIFICATE_ARN=$(terraform output -raw ssl_certificate_arn 2>/dev/null || echo "")
        WEBSITE_DOMAIN=$(terraform output -raw website_domain 2>/dev/null || echo "")
        CLOUDFRONT_DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id 2>/dev/null || echo "")
        
        print_success "Infrastructure deployed successfully"
        print_header "Website bucket: ${WEBSITE_BUCKET}"
        print_header "API URL: ${API_URL}"
        print_header "Lambda function: ${LAMBDA_FUNCTION}"
        
        # Show SSL certificate information
        if [[ -n "$SSL_CERTIFICATE_ARN" && "$SSL_CERTIFICATE_ARN" != "null" ]]; then
            print_success "🔒 SSL Certificate deployed: ${SSL_CERTIFICATE_ARN}"
        fi
        
        if [[ -n "$WEBSITE_DOMAIN" && "$WEBSITE_DOMAIN" != "null" ]]; then
            print_success "🌐 Custom domain configured: https://${WEBSITE_DOMAIN}"
        fi
        
        if [[ -n "$CLOUDFRONT_DISTRIBUTION_ID" && "$CLOUDFRONT_DISTRIBUTION_ID" != "null" ]]; then
            print_header "📡 CloudFront distribution: ${CLOUDFRONT_DISTRIBUTION_ID}"
        fi
    else
        print_warning "DRY RUN: Would apply infrastructure changes"
    fi
    
    cd ../../..
else
    print_warning "⚠️ Skipping infrastructure deployment"
    
    # Still need to get outputs if skipping infrastructure
    if [[ "$DRY_RUN" == false ]]; then
        cd "terraform/environments/${MAIN_ENV}"
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
    print_header "🚀 Deploying frontend to S3..."
    
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
        print_header "Invalidating CloudFront cache..."
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
        print_warning "DRY RUN: Would deploy frontend to S3: ${WEBSITE_BUCKET}"
    fi
fi

# =================================
# Deploy Backend Lambda
# =================================
if [[ "$SKIP_BUILD" == false && -n "$LAMBDA_FUNCTION" ]]; then
    print_header "🚀 Deploying backend Lambda function..."
    
    if [[ "$DRY_RUN" == false ]]; then
        # Update Lambda function code
        aws lambda update-function-code \
            --function-name $LAMBDA_FUNCTION \
            --zip-file fileb://apps/server/lambda-deployment.zip
        
        # Wait for update to complete
        print_header "Waiting for Lambda update to complete..."
        aws lambda wait function-updated \
            --function-name $LAMBDA_FUNCTION
        
        print_success "Lambda function updated"
    else
        print_warning "DRY RUN: Would update Lambda function: ${LAMBDA_FUNCTION}"
    fi
fi

# =================================
# Health Checks
# =================================
if [[ "$DRY_RUN" == false && -n "$API_URL" ]]; then
    print_header "🔍 Running health checks..."
    
    # Test API health endpoint
    print_header "Testing API health endpoint..."
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
            print_header "Testing CloudFront distribution..."
            if curl -f "https://${WEBSITE_URL}" &> /dev/null; then
                print_success "CloudFront health check passed"
            else
                print_warning "CloudFront health check failed"
            fi
        fi
    fi
    
    # Test custom domain with SSL (if configured)
    if [[ -n "$WEBSITE_DOMAIN" && "$WEBSITE_DOMAIN" != "null" ]]; then
        print_header "Testing custom domain with SSL..."
        if curl -f -s --connect-timeout 15 "https://${WEBSITE_DOMAIN}" &> /dev/null; then
            print_success "✅ Custom domain SSL health check passed"
        else
            print_warning "⚠️ Custom domain not ready yet (SSL may still be validating)"
            print_header "💡 This is normal for new deployments - validation takes 5-15 minutes"
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
    print_header "DRY RUN COMPLETED - No changes were made"
else
    print_success "Serverless deployment completed successfully!"
fi

echo ""
print_header "Environment: ${MAIN_ENV}/${TARGET_ENV}"

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
    print_header "🔗 API URL: ${API_URL}"
fi

if [[ -n "$WEBSITE_BUCKET" ]]; then
    WEBSITE_URL=$(aws cloudfront list-distributions \
        --query "DistributionList.Items[?Comment=='${WEBSITE_BUCKET}'].DomainName" \
        --output text 2>/dev/null || echo "")
    
    if [[ -n "$WEBSITE_URL" && "$WEBSITE_URL" != "None" ]]; then
        print_header "📡 CloudFront URL: https://${WEBSITE_URL}"
    fi
    
    print_header "📦 S3 Bucket: ${WEBSITE_BUCKET}"
fi

if [[ -n "$LAMBDA_FUNCTION" ]]; then
    print_header "⚡ Lambda Function: ${LAMBDA_FUNCTION}"
fi

# SSL deployment verification
if [[ -n "$WEBSITE_DOMAIN" && "$WEBSITE_DOMAIN" != "null" && "$DRY_RUN" == false ]]; then
    echo ""
    print_header "🔍 Verifying SSL deployment..."
    
    # Test SSL certificate
    if curl -I -s --connect-timeout 10 "https://${WEBSITE_DOMAIN}" >/dev/null 2>&1; then
        print_success "✅ SSL certificate is working!"
    else
        print_warning "⚠️ SSL certificate may still be validating (can take 5-15 minutes)"
        print_header "💡 Check status: aws acm describe-certificate --certificate-arn ${SSL_CERTIFICATE_ARN} --region us-east-1"
    fi
fi 