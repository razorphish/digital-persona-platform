#!/bin/bash

# =================================
# Fix Lambda Permissions for API Gateway
# =================================
# This script fixes the missing Lambda permission that prevents API Gateway from invoking the function

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

# Dynamic Configuration (no hardcoded values)
# These can be overridden with environment variables
LAMBDA_NAME="${LAMBDA_FUNCTION_NAME:-$(echo "${ENVIRONMENT:-dev}-${SUB_ENVIRONMENT:-dev01}-dpp-api")}"
API_ID="${API_GATEWAY_ID:-}"  # Must be provided via environment variable
AWS_REGION="${AWS_DEFAULT_REGION:-$(aws configure get region || echo 'us-west-1')}"
ACCOUNT_ID="$(aws sts get-caller-identity --query 'Account' --output text)"

echo "🔍 Dynamic Configuration Detected:"
echo "   Lambda Name: $LAMBDA_NAME"  
echo "   API Gateway ID: ${API_ID:-'❌ NOT SET - Please set API_GATEWAY_ID environment variable'}"
echo "   AWS Region: $AWS_REGION"
echo "   AWS Account: $ACCOUNT_ID"
echo ""

if [[ -z "$API_ID" ]]; then
    echo "❌ Error: API_GATEWAY_ID environment variable is required"
    echo "💡 Usage: API_GATEWAY_ID=your_api_id ./scripts/fix-lambda-permissions.sh"
    exit 1
fi

print_status "Fixing Lambda permissions for API Gateway invocation..."

# Check current Lambda policy
print_status "Checking current Lambda policy..."
if aws lambda get-policy --function-name "$LAMBDA_NAME" >/dev/null 2>&1; then
    print_status "Current Lambda policy:"
    aws lambda get-policy --function-name "$LAMBDA_NAME" --query 'Policy' --output text | jq . 2>/dev/null || echo "Policy exists but couldn't parse as JSON"
else
    print_warning "No policy attached to Lambda function"
fi

# Add API Gateway permission to Lambda
print_status "Adding API Gateway permission to Lambda function..."

# Remove existing permission if it exists (to avoid conflicts)
aws lambda remove-permission \
    --function-name "$LAMBDA_NAME" \
    --statement-id "AllowExecutionFromAPIGateway" 2>/dev/null || echo "No existing permission to remove"

# Add the correct permission
SOURCE_ARN="arn:aws:execute-api:${AWS_REGION}:${ACCOUNT_ID}:${API_ID}/*/*"

if aws lambda add-permission \
    --function-name "$LAMBDA_NAME" \
    --statement-id "AllowExecutionFromAPIGateway" \
    --action "lambda:InvokeFunction" \
    --principal "apigateway.amazonaws.com" \
    --source-arn "$SOURCE_ARN"; then
    print_success "✅ Lambda permission added successfully"
else
    print_error "❌ Failed to add Lambda permission"
    exit 1
fi

# Verify the permission was added
print_status "Verifying Lambda permissions..."
if aws lambda get-policy --function-name "$LAMBDA_NAME" --query 'Policy' --output text | grep -q "AllowExecutionFromAPIGateway"; then
    print_success "✅ API Gateway permission is now configured"
else
    print_error "❌ Permission verification failed"
    exit 1
fi

# Test the health endpoint
print_status "Testing health endpoint..."
HEALTH_URL="https://${API_ID}.execute-api.${AWS_REGION}.amazonaws.com/v1/health"

print_status "Testing: $HEALTH_URL"
sleep 5  # Give AWS a moment to propagate the permission

if curl -s -f --max-time 15 "$HEALTH_URL" >/dev/null 2>&1; then
    print_success "🎉 Health endpoint is now working!"
    echo "Response:"
    curl -s --max-time 15 "$HEALTH_URL" | jq . 2>/dev/null || curl -s --max-time 15 "$HEALTH_URL"
else
    print_warning "⚠️ Health endpoint still not responding (may need more time for propagation)"
    print_status "Checking API Gateway logs for any remaining issues..."
fi

print_success "Lambda permission fix completed!" 