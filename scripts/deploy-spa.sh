#!/bin/bash

set -e

# Configuration - Update these values for your deployment
BUCKET_NAME="${FRONTEND_S3_BUCKET:-your-frontend-bucket-name}"
DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID}"
REGION="${AWS_DEFAULT_REGION:-us-east-1}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if required environment variables are set
check_config() {
    log_info "Checking configuration..."
    
    if [ -z "$BUCKET_NAME" ] || [ "$BUCKET_NAME" = "your-frontend-bucket-name" ]; then
        log_error "Please set FRONTEND_S3_BUCKET environment variable or update BUCKET_NAME in this script"
        exit 1
    fi
    
    if [ -z "$DISTRIBUTION_ID" ]; then
        log_warning "CLOUDFRONT_DISTRIBUTION_ID not set - CloudFront invalidation will be skipped"
    fi
    
    # Check if AWS CLI is configured
    if ! aws sts get-caller-identity >/dev/null 2>&1; then
        log_error "AWS CLI not configured. Please run 'aws configure' first"
        exit 1
    fi
    
    log_success "Configuration check passed"
}

# Build the application
build_app() {
    log_info "Building Next.js SPA..."
    
    cd apps/web
    
    # Clean previous builds
    npm run clean
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        log_info "Installing dependencies..."
        npm install
    fi
    
    # Build the static export
    npm run build:export
    
    if [ ! -d "out" ]; then
        log_error "Build failed - 'out' directory not found"
        exit 1
    fi
    
    log_success "Build completed successfully"
    cd - > /dev/null
}

# Check if S3 bucket exists, create if not
setup_s3_bucket() {
    log_info "Setting up S3 bucket: $BUCKET_NAME"
    
    # Check if bucket exists
    if aws s3 ls "s3://$BUCKET_NAME" >/dev/null 2>&1; then
        log_info "Bucket $BUCKET_NAME already exists"
    else
        log_info "Creating S3 bucket: $BUCKET_NAME"
        if [ "$REGION" = "us-east-1" ]; then
            aws s3 mb "s3://$BUCKET_NAME"
        else
            aws s3 mb "s3://$BUCKET_NAME" --region "$REGION"
        fi
    fi
    
    # Configure bucket for static website hosting
    log_info "Configuring bucket for static website hosting..."
    aws s3 website "s3://$BUCKET_NAME" \
        --index-document index.html \
        --error-document 404.html
    
    # Set bucket policy for public read access
    log_info "Setting bucket policy for public read access..."
    cat > /tmp/bucket-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF
    
    aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy file:///tmp/bucket-policy.json
    rm /tmp/bucket-policy.json
    
    log_success "S3 bucket setup completed"
}

# Upload files to S3
upload_to_s3() {
    log_info "Uploading files to S3..."
    
    cd apps/web
    
    # Upload static assets with long cache control (1 year)
    log_info "Uploading static assets with long cache..."
    aws s3 sync out/ "s3://$BUCKET_NAME/" \
        --delete \
        --cache-control "public, max-age=31536000" \
        --exclude "*.html" \
        --exclude "*.txt" \
        --exclude "*.json"
    
    # Upload HTML and other files with shorter cache (1 hour)
    log_info "Uploading HTML files with short cache..."
    aws s3 sync out/ "s3://$BUCKET_NAME/" \
        --cache-control "public, max-age=3600" \
        --exclude "*" \
        --include "*.html" \
        --include "*.txt" \
        --include "*.json"
    
    cd - > /dev/null
    
    log_success "Upload to S3 completed"
}

# Invalidate CloudFront cache
invalidate_cloudfront() {
    if [ -z "$DISTRIBUTION_ID" ]; then
        log_warning "Skipping CloudFront invalidation (DISTRIBUTION_ID not set)"
        return
    fi
    
    log_info "Invalidating CloudFront cache..."
    
    aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text
    
    log_success "CloudFront invalidation initiated"
}

# Get website URL
get_website_url() {
    log_info "Getting website URL..."
    
    if [ -n "$DISTRIBUTION_ID" ]; then
        DOMAIN_NAME=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" --query 'Distribution.DomainName' --output text)
        echo ""
        log_success "🌐 Your app is available at: https://$DOMAIN_NAME"
    else
        WEBSITE_URL=$(aws s3api get-bucket-website --bucket "$BUCKET_NAME" --query 'WebsiteURL' --output text 2>/dev/null || echo "")
        if [ -n "$WEBSITE_URL" ]; then
            echo ""
            log_success "🌐 Your app is available at: $WEBSITE_URL"
        else
            REGION_ENDPOINT="s3-website-$REGION.amazonaws.com"
            if [ "$REGION" = "us-east-1" ]; then
                REGION_ENDPOINT="s3-website-us-east-1.amazonaws.com"
            fi
            echo ""
            log_success "🌐 Your app is available at: http://$BUCKET_NAME.$REGION_ENDPOINT"
        fi
    fi
}

# Main execution
main() {
    echo ""
    log_info "🚀 Starting SPA deployment to S3..."
    echo ""
    
    check_config
    build_app
    setup_s3_bucket
    upload_to_s3
    invalidate_cloudfront
    get_website_url
    
    echo ""
    log_success "🎉 Deployment completed successfully!"
    echo ""
}

# Run main function
main "$@" 