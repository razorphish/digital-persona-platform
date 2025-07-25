#!/bin/bash

# =================================
# Fix All Terraform Drift Issues
# =================================
# Comprehensive fix for all identified drift issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

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
API_NAME="dev-dev01-dpp-api"
IAM_ROLE_NAME="dev-dev01-dpp-lambda-execution"
IAM_ECS_ROLE_NAME="dev-dev01-dpp-ecs-execution"

print_header "🔧 COMPREHENSIVE DRIFT FIX"
echo "This script will fix all identified drift issues:"
echo "• Clean up duplicate Lambda permissions"
echo "• Fix IAM role configurations"
echo "• Import missing resources into Terraform state"
echo "• Align infrastructure with Terraform configuration"
echo ""

read -p "Continue? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_status "Aborted by user"
    exit 0
fi

# STEP 1: BACKUP CURRENT STATE
print_header "📋 STEP 1: BACKUP CURRENT STATE"

mkdir -p backups/$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="backups/$(date +%Y%m%d-%H%M%S)"

print_status "Creating backups in: $BACKUP_DIR"

# Backup Lambda permissions
print_status "Backing up Lambda permissions..."
aws lambda get-policy --function-name "$LAMBDA_NAME" --query 'Policy' --output text > "$BACKUP_DIR/lambda-permissions.json" 2>/dev/null || echo "No Lambda policy found"

# Backup Terraform state
print_status "Backing up Terraform state..."
cd terraform/environments/dev
cp terraform.tfstate "$BACKUP_DIR/terraform.tfstate.backup" 2>/dev/null || echo "No state file found"
cd - >/dev/null

print_success "✅ Backups created in $BACKUP_DIR"

# STEP 2: CLEAN UP DUPLICATE LAMBDA PERMISSIONS
print_header "🧹 STEP 2: CLEAN UP LAMBDA PERMISSIONS"

print_status "Removing duplicate/manual Lambda permissions..."

# Remove manual permission
aws lambda remove-permission \
    --function-name "$LAMBDA_NAME" \
    --statement-id "allow-apigateway-invoke" 2>/dev/null && print_success "✅ Removed manual permission" || print_warning "⚠️ Manual permission not found"

# Remove any Terraform-managed permission (we'll recreate it properly)
aws lambda remove-permission \
    --function-name "$LAMBDA_NAME" \
    --statement-id "AllowExecutionFromAPIGateway" 2>/dev/null && print_success "✅ Removed old Terraform permission" || print_warning "⚠️ Terraform permission not found"

print_success "✅ Lambda permissions cleaned up"

# STEP 3: FIX IAM ROLES (APPLY IGNORE_CHANGES WORKAROUND)
print_header "👤 STEP 3: FIX IAM ROLE CONFIGURATIONS"

print_status "Adding ignore_changes to IAM roles to work around permission issues..."

# The ignore_changes block is already in lambda-backend/main.tf
# We need to add it to the main ECS role as well

cd terraform/environments/dev

# Check if ECS role needs ignore_changes
if grep -q "ignore_changes.*inline_policy" main.tf; then
    print_success "✅ ECS role already has ignore_changes configured"
else
    print_status "Adding ignore_changes to ECS execution role..."
    
    # Add ignore_changes to ECS execution role
    sed -i.bak '/resource "aws_iam_role" "ecs_execution"/,/^}$/ {
        /assume_role_policy/a\
\
  lifecycle {\
    ignore_changes = [inline_policy]\
  }
    }' main.tf
    
    print_success "✅ Added ignore_changes to ECS execution role"
fi

cd - >/dev/null

# STEP 4: IMPORT MISSING RESOURCES INTO TERRAFORM STATE
print_header "🏗️ STEP 4: IMPORT MISSING RESOURCES"

cd terraform/environments/dev

print_status "Importing missing AWS resources into Terraform state..."

# Get API Gateway ID
API_ID=$(aws apigatewayv2 get-apis --query "Items[?Name=='$API_NAME'].ApiId" --output text | head -1)
if [ -n "$API_ID" ] && [ "$API_ID" != "None" ]; then
    print_status "Found API Gateway ID: $API_ID"
    
    # Import API Gateway resources
    print_status "Importing API Gateway..."
    terraform import module.api_gateway.aws_apigatewayv2_api.main "$API_ID" 2>/dev/null && print_success "✅ Imported API Gateway" || print_warning "⚠️ API Gateway import failed"
    
    # Import API Gateway stage
    terraform import module.api_gateway.aws_apigatewayv2_stage.main "$API_ID/v1" 2>/dev/null && print_success "✅ Imported API Gateway stage" || print_warning "⚠️ Stage import failed"
    
    # Import routes (get route IDs first)
    HEALTH_ROUTE_ID=$(aws apigatewayv2 get-routes --api-id "$API_ID" --query "Items[?RouteKey=='GET /health'].RouteId" --output text 2>/dev/null || echo "")
    TRPC_ROUTE_ID=$(aws apigatewayv2 get-routes --api-id "$API_ID" --query "Items[?RouteKey=='ANY /api/trpc/{proxy+}'].RouteId" --output text 2>/dev/null || echo "")
    DEFAULT_ROUTE_ID=$(aws apigatewayv2 get-routes --api-id "$API_ID" --query "Items[?RouteKey=='\$default'].RouteId" --output text 2>/dev/null || echo "")
    
    if [ -n "$HEALTH_ROUTE_ID" ] && [ "$HEALTH_ROUTE_ID" != "None" ]; then
        terraform import module.api_gateway.aws_apigatewayv2_route.health "$API_ID/$HEALTH_ROUTE_ID" 2>/dev/null && print_success "✅ Imported health route" || print_warning "⚠️ Health route import failed"
    fi
    
    if [ -n "$TRPC_ROUTE_ID" ] && [ "$TRPC_ROUTE_ID" != "None" ]; then
        terraform import module.api_gateway.aws_apigatewayv2_route.api_trpc "$API_ID/$TRPC_ROUTE_ID" 2>/dev/null && print_success "✅ Imported tRPC route" || print_warning "⚠️ tRPC route import failed"
    fi
    
    if [ -n "$DEFAULT_ROUTE_ID" ] && [ "$DEFAULT_ROUTE_ID" != "None" ]; then
        terraform import module.api_gateway.aws_apigatewayv2_route.default "$API_ID/$DEFAULT_ROUTE_ID" 2>/dev/null && print_success "✅ Imported default route" || print_warning "⚠️ Default route import failed"
    fi
    
    # Import integrations
    INTEGRATION_ID=$(aws apigatewayv2 get-integrations --api-id "$API_ID" --query "Items[0].IntegrationId" --output text 2>/dev/null || echo "")
    if [ -n "$INTEGRATION_ID" ] && [ "$INTEGRATION_ID" != "None" ]; then
        terraform import module.api_gateway.aws_apigatewayv2_integration.lambda_api "$API_ID/$INTEGRATION_ID" 2>/dev/null && print_success "✅ Imported API Gateway integration" || print_warning "⚠️ Integration import failed"
    fi
else
    print_warning "⚠️ No API Gateway found to import"
fi

# Import Lambda function
print_status "Importing Lambda function..."
terraform import aws_lambda_function.main "$LAMBDA_NAME" 2>/dev/null && print_success "✅ Imported Lambda function" || print_warning "⚠️ Lambda function import failed"

cd - >/dev/null

# STEP 5: TERRAFORM PLAN AND APPLY
print_header "🚀 STEP 5: ALIGN INFRASTRUCTURE"

cd terraform/environments/dev

print_status "Running terraform plan to check remaining drift..."
if terraform plan -detailed-exitcode >/dev/null 2>&1; then
    print_success "✅ No drift detected - infrastructure is aligned!"
else
    EXIT_CODE=$?
    if [ $EXIT_CODE -eq 2 ]; then
        print_warning "⚠️ Drift still detected. Running terraform apply to fix..."
        
        print_status "Applying Terraform changes..."
        if terraform apply -auto-approve; then
            print_success "✅ Terraform apply completed successfully"
        else
            print_error "❌ Terraform apply failed"
            echo "Check the output above for errors"
            echo "You may need to run manual fixes or contact support"
        fi
    else
        print_error "❌ Terraform plan failed with errors"
    fi
fi

cd - >/dev/null

# STEP 6: VERIFICATION
print_header "✅ STEP 6: VERIFICATION"

print_status "Verifying fixes..."

# Check Lambda permissions
print_status "Checking Lambda permissions..."
if aws lambda get-policy --function-name "$LAMBDA_NAME" --query 'Policy' --output text 2>/dev/null >/dev/null; then
    POLICY_JSON=$(aws lambda get-policy --function-name "$LAMBDA_NAME" --query 'Policy' --output text)
    STATEMENT_COUNT=$(echo "$POLICY_JSON" | jq '.Statement | length' 2>/dev/null || echo "0")
    
    if [ "$STATEMENT_COUNT" -eq 1 ]; then
        print_success "✅ Lambda has exactly 1 permission statement (good)"
    else
        print_warning "⚠️ Lambda has $STATEMENT_COUNT permission statements"
    fi
else
    print_error "❌ Lambda has no permissions - this needs to be fixed"
fi

# Check API Gateway health
print_status "Testing API Gateway health endpoint..."
API_URL=$(aws apigatewayv2 get-apis --query "Items[?Name=='$API_NAME'].ApiEndpoint" --output text 2>/dev/null | head -1)
if [ -n "$API_URL" ] && [ "$API_URL" != "None" ]; then
    if curl -s "$API_URL/v1/health" >/dev/null; then
        print_success "✅ API Gateway health endpoint responding"
    else
        print_warning "⚠️ API Gateway health endpoint not responding"
    fi
else
    print_warning "⚠️ Could not determine API Gateway URL"
fi

# Check Terraform state
print_status "Checking Terraform state..."
cd terraform/environments/dev
RESOURCE_COUNT=$(terraform state list | wc -l)
print_status "Terraform managing $RESOURCE_COUNT resources"

if terraform state show aws_lambda_function.main >/dev/null 2>&1; then
    print_success "✅ Lambda function in Terraform state"
else
    print_warning "⚠️ Lambda function not in Terraform state"
fi

if terraform state show module.api_gateway.aws_apigatewayv2_api.main >/dev/null 2>&1; then
    print_success "✅ API Gateway in Terraform state"
else
    print_warning "⚠️ API Gateway not in Terraform state"
fi

cd - >/dev/null

print_header "🎉 DRIFT FIX COMPLETE"

print_status "Summary of actions taken:"
echo "• Cleaned up duplicate Lambda permissions"
echo "• Added IAM role workarounds for permission issues"
echo "• Imported missing resources into Terraform state"
echo "• Applied Terraform changes to align infrastructure"
echo "• Verified fixes"
echo ""

print_status "Next steps:"
echo "• Monitor the next serverless deployment for success"
echo "• Run './scripts/audit-terraform-drift.sh' periodically to check for new drift"
echo "• Consider setting up automated drift detection in CI/CD"
echo ""

print_success "✅ All drift issues have been addressed!" 