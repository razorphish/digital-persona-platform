#!/bin/bash

# =================================
# Serverless Deployment Troubleshooting Script
# =================================
# This script helps diagnose and fix common issues with the serverless deployment

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
FIX_ISSUES=false
CHECK_ONLY=false

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
    echo "  -e, --environment ENVIRONMENT    Environment to check (default: dev)"
    echo "  -s, --sub-environment SUB_ENV    Sub-environment to check (default: dev01)"
    echo "  -f, --fix                        Attempt to fix detected issues"
    echo "  -c, --check-only                 Only check for issues, don't suggest fixes"
    echo "  -h, --help                       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                               # Check dev/dev01"
    echo "  $0 -e dev -s dev02              # Check dev/dev02"
    echo "  $0 --fix                        # Check and attempt fixes"
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
        -f|--fix)
            FIX_ISSUES=true
            shift
            ;;
        -c|--check-only)
            CHECK_ONLY=true
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

# Set project variables
PROJECT_NAME="dpp"
RESOURCE_PREFIX="${ENVIRONMENT}-${SUB_ENVIRONMENT}-${PROJECT_NAME}"
MAIN_ENV="${ENVIRONMENT}"

print_status "Troubleshooting serverless deployment for ${ENVIRONMENT}/${SUB_ENVIRONMENT}"

# =================================
# Check 1: Terraform State Issues
# =================================
print_status "Checking Terraform state integrity..."

TERRAFORM_DIR="terraform/environments/${MAIN_ENV}"
if [ ! -d "$TERRAFORM_DIR" ]; then
    print_error "Terraform directory not found: $TERRAFORM_DIR"
    exit 1
fi

cd "$TERRAFORM_DIR"

# Check if terraform is initialized
if [ ! -d ".terraform" ]; then
    print_warning "Terraform not initialized"
    if [[ "$FIX_ISSUES" == true ]]; then
        print_status "Initializing Terraform..."
        terraform init
    else
        print_status "Fix: Run 'terraform init' in $TERRAFORM_DIR"
    fi
fi

# Check state lock
if terraform state list >/dev/null 2>&1; then
    print_success "Terraform state is accessible"
else
    print_error "Terraform state is locked or corrupted"
    if [[ "$FIX_ISSUES" == true ]]; then
        print_status "Attempting to unlock state..."
        terraform force-unlock -force || print_error "Could not unlock state"
    else
        print_status "Fix: Run 'terraform force-unlock -force' if state is locked"
    fi
fi

# =================================
# Check 2: AWS Resource Conflicts
# =================================
print_status "Checking for AWS resource conflicts..."

# Function to check if resource exists in both AWS and Terraform state
check_resource_conflict() {
    local resource_address="$1"
    local aws_check_command="$2"
    local resource_name="$3"
    
    # Check if in Terraform state
    local in_state=false
    if terraform state show "$resource_address" >/dev/null 2>&1; then
        in_state=true
    fi
    
    # Check if exists in AWS
    local in_aws=false
    if eval "$aws_check_command" >/dev/null 2>&1; then
        in_aws=true
    fi
    
    if [[ "$in_aws" == true && "$in_state" == false ]]; then
        print_warning "$resource_name exists in AWS but not in Terraform state"
        if [[ "$FIX_ISSUES" == true ]]; then
            print_status "Attempting to import $resource_name..."
            # The actual import commands would need to be customized per resource type
        else
            print_status "Fix: Import $resource_name with 'terraform import $resource_address <aws_resource_id>'"
        fi
    elif [[ "$in_aws" == false && "$in_state" == true ]]; then
        print_error "$resource_name is in Terraform state but not in AWS (orphaned)"
        if [[ "$FIX_ISSUES" == true ]]; then
            print_status "Removing orphaned resource from state..."
            terraform state rm "$resource_address" || print_error "Could not remove from state"
        else
            print_status "Fix: Remove from state with 'terraform state rm $resource_address'"
        fi
    elif [[ "$in_aws" == true && "$in_state" == true ]]; then
        print_success "$resource_name is properly managed"
    else
        print_status "$resource_name does not exist (will be created)"
    fi
}

# Check key resources
API_LOG_GROUP="/aws/apigateway/${RESOURCE_PREFIX}"
LAMBDA_LOG_GROUP="/aws/lambda/${RESOURCE_PREFIX}-api"
UPLOADS_BUCKET="${RESOURCE_PREFIX}-uploads"
LAMBDA_FUNCTION="${RESOURCE_PREFIX}-api"

check_resource_conflict "module.api_gateway.aws_cloudwatch_log_group.api_gateway" \
    "aws logs describe-log-groups --log-group-name-prefix '$API_LOG_GROUP' --query 'logGroups[?logGroupName==\`$API_LOG_GROUP\`]' --output text | grep -q '$API_LOG_GROUP'" \
    "API Gateway Log Group"

check_resource_conflict "module.lambda_backend.aws_cloudwatch_log_group.lambda_logs" \
    "aws logs describe-log-groups --log-group-name-prefix '$LAMBDA_LOG_GROUP' --query 'logGroups[?logGroupName==\`$LAMBDA_LOG_GROUP\`]' --output text | grep -q '$LAMBDA_LOG_GROUP'" \
    "Lambda Log Group"

check_resource_conflict "aws_s3_bucket.uploads" \
    "aws s3api head-bucket --bucket '$UPLOADS_BUCKET'" \
    "Uploads S3 Bucket"

# =================================
# Check 3: API Gateway Issues
# =================================
print_status "Checking API Gateway configuration..."

# Look for API Gateway with expected names
EXPECTED_API_NAME="${RESOURCE_PREFIX}-api"
API_ID=$(aws apigatewayv2 get-apis --query "Items[?Name=='$EXPECTED_API_NAME'].ApiId" --output text 2>/dev/null | tr -d '[:space:]')

if [ -n "$API_ID" ] && [ "$API_ID" != "None" ]; then
    print_success "API Gateway found: $EXPECTED_API_NAME ($API_ID)"
    
    # Check if API has stages
    STAGES=$(aws apigatewayv2 get-stages --api-id "$API_ID" --query 'Items[*].StageName' --output text 2>/dev/null)
    if [ -n "$STAGES" ]; then
        print_success "API Gateway stages: $STAGES"
    else
        print_warning "API Gateway has no stages configured"
    fi
    
    # Check if API has routes
    ROUTES=$(aws apigatewayv2 get-routes --api-id "$API_ID" --query 'Items[*].RouteKey' --output text 2>/dev/null)
    if [ -n "$ROUTES" ]; then
        print_success "API Gateway routes configured"
    else
        print_warning "API Gateway has no routes configured"
    fi
else
    print_error "API Gateway not found with name: $EXPECTED_API_NAME"
    print_status "Available APIs:"
    aws apigatewayv2 get-apis --query 'Items[*].{Name:Name,Id:ApiId}' --output table 2>/dev/null || print_error "Could not list APIs"
fi

# =================================
# Check 4: Lambda Function Issues
# =================================
print_status "Checking Lambda function..."

if aws lambda get-function --function-name "$LAMBDA_FUNCTION" >/dev/null 2>&1; then
    print_success "Lambda function found: $LAMBDA_FUNCTION"
    
    # Check function configuration
    LAMBDA_STATE=$(aws lambda get-function --function-name "$LAMBDA_FUNCTION" --query 'Configuration.State' --output text 2>/dev/null)
    if [ "$LAMBDA_STATE" = "Active" ]; then
        print_success "Lambda function is active"
    else
        print_warning "Lambda function state: $LAMBDA_STATE"
    fi
    
    # Check if function has code
    CODE_SIZE=$(aws lambda get-function --function-name "$LAMBDA_FUNCTION" --query 'Configuration.CodeSize' --output text 2>/dev/null)
    if [ "$CODE_SIZE" -gt 1000 ]; then
        print_success "Lambda function has code deployed (${CODE_SIZE} bytes)"
    else
        print_warning "Lambda function appears to have minimal/placeholder code (${CODE_SIZE} bytes)"
    fi
else
    print_error "Lambda function not found: $LAMBDA_FUNCTION"
fi

# =================================
# Check 5: DNS Configuration
# =================================
print_status "Checking DNS configuration..."

EXPECTED_DOMAIN="${SUB_ENVIRONMENT}.hibiji.com"
EXPECTED_API_DOMAIN="${SUB_ENVIRONMENT}-api.hibiji.com"

# Check if DNS records exist
if dig +short "$EXPECTED_DOMAIN" >/dev/null 2>&1; then
    print_success "Website DNS record exists: $EXPECTED_DOMAIN"
else
    print_warning "Website DNS record missing: $EXPECTED_DOMAIN"
fi

if dig +short "$EXPECTED_API_DOMAIN" >/dev/null 2>&1; then
    print_success "API DNS record exists: $EXPECTED_API_DOMAIN"
else
    print_warning "API DNS record missing: $EXPECTED_API_DOMAIN"
fi

# =================================
# Summary and Recommendations
# =================================
print_status "Troubleshooting complete!"

if [[ "$CHECK_ONLY" == false ]]; then
    echo ""
    print_status "Common fixes for serverless deployment issues:"
    echo "1. Clear Terraform state locks: terraform force-unlock -force"
    echo "2. Import existing resources: Use the improved import script in the deployment workflow"
    echo "3. Refresh Terraform state: terraform refresh"
    echo "4. Apply with targeting: terraform apply -target=module.api_gateway"
    echo "5. Check AWS permissions: Ensure deployment role has sufficient permissions"
    echo "6. Verify region settings: Ensure all resources are in the correct region (us-west-1)"
    echo ""
    print_status "For persistent issues, consider:"
    echo "- Running: terraform plan -detailed-exitcode"
    echo "- Checking CloudWatch logs for Lambda and API Gateway"
    echo "- Verifying IAM roles and policies"
    echo "- Ensuring all required secrets exist in AWS Secrets Manager"
fi

cd - >/dev/null

print_success "Troubleshooting script completed" 