#!/bin/bash

# =================================
# Fix API Gateway Routes Script
# =================================
# This script diagnoses and fixes missing API Gateway routes

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
PROJECT_NAME="dpp"
AWS_REGION="us-west-1"

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
        -h|--help)
            echo "Usage: $0 [OPTIONS]"
            echo "Options:"
            echo "  -e, --environment ENV      Environment (default: dev)"
            echo "  -s, --sub-environment ENV  Sub-environment (default: dev01)"
            echo "  -h, --help                 Show this help"
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

RESOURCE_PREFIX="${ENVIRONMENT}-${SUB_ENVIRONMENT}-${PROJECT_NAME}"
API_NAME="${RESOURCE_PREFIX}-api"
LAMBDA_NAME="${RESOURCE_PREFIX}-api"

print_status "Diagnosing API Gateway routes issue for ${ENVIRONMENT}/${SUB_ENVIRONMENT}"

# Step 1: Check if API Gateway exists
print_status "Step 1: Checking API Gateway..."
API_ID=$(aws apigatewayv2 get-apis --query "Items[?Name=='$API_NAME'] | [0].ApiId" --output text 2>/dev/null)

if [ -z "$API_ID" ] || [ "$API_ID" = "None" ]; then
    print_error "API Gateway '$API_NAME' not found"
    exit 1
fi

print_success "Found API Gateway: $API_ID"

# Step 2: Check API Gateway stages
print_status "Step 2: Checking API Gateway stages..."
STAGES=$(aws apigatewayv2 get-stages --api-id "$API_ID" --query 'Items[*].StageName' --output text 2>/dev/null)
if [ -n "$STAGES" ]; then
    print_success "API Gateway stages: $STAGES"
else
    print_error "No stages found for API Gateway $API_ID"
fi

# Step 3: Check API Gateway routes
print_status "Step 3: Checking API Gateway routes..."
ROUTES=$(aws apigatewayv2 get-routes --api-id "$API_ID" --query 'Items[*].RouteKey' --output text 2>/dev/null)
if [ -n "$ROUTES" ] && [ "$ROUTES" != "" ]; then
    print_success "API Gateway routes found: $ROUTES"
    print_status "Routes are already configured. The issue may be elsewhere."
    exit 0
else
    print_warning "No routes found for API Gateway $API_ID - this is the problem!"
fi

# Step 4: Check Lambda function
print_status "Step 4: Checking Lambda function..."
if aws lambda get-function --function-name "$LAMBDA_NAME" >/dev/null 2>&1; then
    print_success "Lambda function '$LAMBDA_NAME' exists"
    
    # Get Lambda function details
    LAMBDA_STATE=$(aws lambda get-function --function-name "$LAMBDA_NAME" --query 'Configuration.State' --output text)
    LAMBDA_ARN=$(aws lambda get-function --function-name "$LAMBDA_NAME" --query 'Configuration.FunctionArn' --output text)
    print_status "Lambda state: $LAMBDA_STATE"
    print_status "Lambda ARN: $LAMBDA_ARN"
    
    if [ "$LAMBDA_STATE" != "Active" ]; then
        print_warning "Lambda function is not in Active state: $LAMBDA_STATE"
    fi
else
    print_error "Lambda function '$LAMBDA_NAME' not found"
    print_status "This explains why API Gateway routes couldn't be created"
    exit 1
fi

# Step 5: Check API Gateway integrations
print_status "Step 5: Checking API Gateway integrations..."
INTEGRATIONS=$(aws apigatewayv2 get-integrations --api-id "$API_ID" --query 'Items[*].IntegrationId' --output text 2>/dev/null)
if [ -n "$INTEGRATIONS" ] && [ "$INTEGRATIONS" != "" ]; then
    print_success "API Gateway integrations found: $INTEGRATIONS"
else
    print_error "No integrations found for API Gateway $API_ID"
    print_status "This explains why routes couldn't be created - missing Lambda integration"
fi

# Step 6: Attempt to fix via Terraform
print_status "Step 6: Attempting to fix via targeted Terraform apply..."

TERRAFORM_DIR="terraform/environments/$ENVIRONMENT"
if [ ! -d "$TERRAFORM_DIR" ]; then
    print_error "Terraform directory not found: $TERRAFORM_DIR"
    exit 1
fi

cd "$TERRAFORM_DIR"

print_status "Running targeted Terraform apply for API Gateway resources..."

# Apply API Gateway module specifically
if terraform apply -auto-approve -lock-timeout=300s -target=module.api_gateway; then
    print_success "Terraform apply for API Gateway completed"
else
    print_error "Terraform apply failed"
    
    print_status "Trying individual resource targeting..."
    
    # Try to apply individual resources
    terraform apply -auto-approve -lock-timeout=300s \
        -target=module.api_gateway.aws_apigatewayv2_integration.lambda_api || print_error "Lambda integration failed"
    
    terraform apply -auto-approve -lock-timeout=300s \
        -target=module.api_gateway.aws_apigatewayv2_route.health || print_error "Health route failed"
    
    terraform apply -auto-approve -lock-timeout=300s \
        -target=module.api_gateway.aws_apigatewayv2_route.api_trpc || print_error "API route failed"
    
    terraform apply -auto-approve -lock-timeout=300s \
        -target=module.api_gateway.aws_lambda_permission.api_gateway_lambda || print_error "Lambda permission failed"
fi

# Step 7: Verify the fix
print_status "Step 7: Verifying the fix..."
sleep 10  # Give AWS time to propagate changes

NEW_ROUTES=$(aws apigatewayv2 get-routes --api-id "$API_ID" --query 'Items[*].RouteKey' --output text 2>/dev/null)
if [ -n "$NEW_ROUTES" ] && [ "$NEW_ROUTES" != "" ]; then
    print_success "✅ Routes successfully created: $NEW_ROUTES"
    
    # Test the health endpoint
    FIRST_STAGE=$(echo "$STAGES" | awk '{print $1}')
    HEALTH_URL="https://${API_ID}.execute-api.${AWS_REGION}.amazonaws.com/${FIRST_STAGE}/health"
    
    print_status "Testing health endpoint: $HEALTH_URL"
    if curl -s -f --max-time 10 "$HEALTH_URL" >/dev/null 2>&1; then
        print_success "✅ Health endpoint is responding!"
    else
        print_warning "⚠️ Health endpoint not responding yet (may need more time)"
    fi
else
    print_error "❌ Routes still not created after Terraform apply"
    print_status "Manual intervention may be required"
fi

cd - >/dev/null

print_status "API Gateway routes fix completed" 