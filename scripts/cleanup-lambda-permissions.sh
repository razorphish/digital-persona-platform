#!/bin/bash

# =================================
# Clean Up Manual Lambda Permissions
# =================================
# This script removes manually added Lambda permissions so Terraform can manage them

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
LAMBDA_NAME="dev-dev01-dpp-api"

print_status "Cleaning up manual Lambda permissions for Terraform management..."

# Check current permissions
print_status "Current Lambda permissions:"
aws lambda get-policy --function-name "$LAMBDA_NAME" --query 'Policy' --output text | jq . 2>/dev/null || echo "No policy found"

# Remove manual permissions that conflict with Terraform
print_status "Removing manual permissions..."

# Remove the permissions we added manually
aws lambda remove-permission \
    --function-name "$LAMBDA_NAME" \
    --statement-id "AllowExecutionFromAPIGateway" 2>/dev/null && print_success "✅ Removed AllowExecutionFromAPIGateway" || print_warning "⚠️ AllowExecutionFromAPIGateway not found"

aws lambda remove-permission \
    --function-name "$LAMBDA_NAME" \
    --statement-id "allow-apigateway-invoke" 2>/dev/null && print_success "✅ Removed allow-apigateway-invoke" || print_warning "⚠️ allow-apigateway-invoke not found"

# Remove any other stale permissions (from old API Gateways)
print_status "Checking for stale permissions from old API Gateways..."
aws lambda get-policy --function-name "$LAMBDA_NAME" --query 'Policy' --output text 2>/dev/null | jq -r '.Statement[].Sid' 2>/dev/null | while read -r sid; do
    if [[ "$sid" == "AllowExecutionFromAPIGateway"* ]] || [[ "$sid" == "allow-apigateway-invoke"* ]]; then
        echo "Removing stale permission: $sid"
        aws lambda remove-permission --function-name "$LAMBDA_NAME" --statement-id "$sid" 2>/dev/null || echo "Could not remove $sid"
    fi
done

print_status "Cleanup completed. Terraform should now manage Lambda permissions properly."

print_warning "Next steps:"
echo "1. Run 'terraform plan' to see the Lambda permission that will be created"
echo "2. Run 'terraform apply' to let Terraform manage the permission properly"
echo "3. Test the health endpoint after Terraform applies the permission" 