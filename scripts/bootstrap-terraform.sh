#!/bin/bash

# =================================
# Terraform Bootstrap Script
# =================================
# This script creates the foundational infrastructure needed for Terraform
# state management before main deployments can run.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Configuration
AWS_REGION="${AWS_REGION:-us-west-1}"
STATE_BUCKET_NAME="${STATE_BUCKET_NAME:-hibiji-terraform-state}"
PROJECT_NAME="${PROJECT_NAME:-dpp}"
BOOTSTRAP_DIR="terraform/bootstrap"

print_status "🚀 Terraform Bootstrap for Digital Persona Platform"
echo "===========================================" 
echo ""
print_status "Configuration:"
echo "  AWS Region: $AWS_REGION"
echo "  State Bucket: $STATE_BUCKET_NAME"
echo "  Project: $PROJECT_NAME"
echo ""

# Check if bootstrap directory exists
if [ ! -d "$BOOTSTRAP_DIR" ]; then
    print_error "Bootstrap directory not found: $BOOTSTRAP_DIR"
    print_error "Please run this script from the project root directory"
    exit 1
fi

cd "$BOOTSTRAP_DIR"

# Check if state bucket already exists
print_status "🔍 Checking if state bucket already exists..."
if aws s3api head-bucket --bucket "$STATE_BUCKET_NAME" --region "$AWS_REGION" >/dev/null 2>&1; then
    print_success "State bucket '$STATE_BUCKET_NAME' already exists"
    print_status "Verifying bucket configuration..."
    
    # Check versioning
    VERSIONING=$(aws s3api get-bucket-versioning --bucket "$STATE_BUCKET_NAME" --query 'Status' --output text 2>/dev/null || echo "None")
    if [ "$VERSIONING" = "Enabled" ]; then
        print_success "✓ Bucket versioning is enabled"
    else
        print_warning "⚠ Bucket versioning is not enabled - will be configured via Terraform"
    fi
    
    # Check encryption
    if aws s3api get-bucket-encryption --bucket "$STATE_BUCKET_NAME" >/dev/null 2>&1; then
        print_success "✓ Bucket encryption is configured"
    else
        print_warning "⚠ Bucket encryption is not configured - will be configured via Terraform"
    fi
    
    print_status "Proceeding with Terraform to ensure proper configuration..."
else
    print_status "State bucket does not exist - will be created"
fi

print_status "🔧 Initializing Terraform bootstrap..."
terraform init

print_status "📋 Planning bootstrap infrastructure..."
terraform plan \
    -var="aws_region=$AWS_REGION" \
    -var="state_bucket_name=$STATE_BUCKET_NAME" \
    -var="project_name=$PROJECT_NAME" \
    -out=bootstrap.tfplan

print_status "🚀 Applying bootstrap infrastructure..."
terraform apply bootstrap.tfplan

print_success "✅ Bootstrap completed successfully!"
echo ""

# Display outputs
print_status "📊 Bootstrap Results:"
echo ""
echo "State Bucket: $(terraform output -raw state_bucket_name)"
echo "Bucket ARN: $(terraform output -raw state_bucket_arn)"
echo "Region: $(terraform output -raw state_bucket_region)"
echo ""

print_success "🎯 Terraform state bucket is ready for use!"
print_status "Main deployments can now proceed with remote state management."

# Clean up plan file
rm -f bootstrap.tfplan

echo ""
print_status "Next steps:"
echo "  1. Main infrastructure deployments will now use: s3://$STATE_BUCKET_NAME"
echo "  2. State files will be organized by environment: {env}/{sub_env}/terraform.tfstate"
echo "  3. Run your normal deployment workflows" 