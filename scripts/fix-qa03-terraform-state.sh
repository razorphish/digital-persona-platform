#!/bin/bash

# Fix QA03 Terraform State Corruption
# This script removes resources from Terraform state that exist in state but not in AWS

set -e

print_header() {
    echo "=================================================================="
    echo "$1"
    echo "=================================================================="
}

print_success() {
    echo "✅ $1"
}

print_warning() {
    echo "⚠️ $1"
}

print_error() {
    echo "❌ $1"
}

print_info() {
    echo "ℹ️ $1"
}

# Configuration
ENVIRONMENT="qa"
SUB_ENVIRONMENT="qa03"
AWS_REGION="us-west-1"
STATE_BUCKET="hibiji-terraform-state"
STATE_KEY="qa/serverless/terraform.tfstate"
TERRAFORM_DIR="terraform/environments/qa"

print_header "🔧 QA03 Terraform State Corruption Fix"

echo "🎯 Target Environment: ${ENVIRONMENT}-${SUB_ENVIRONMENT}"
echo "🗂️ State File: s3://${STATE_BUCKET}/${STATE_KEY}"
echo "📂 Terraform Directory: ${TERRAFORM_DIR}"
echo ""

# Check if we're in the right directory
if [ ! -d "$TERRAFORM_DIR" ]; then
    print_error "Terraform directory not found: $TERRAFORM_DIR"
    print_info "Please run this script from the project root directory"
    exit 1
fi

cd "$TERRAFORM_DIR"

print_header "📋 Step 1: Backup Current State"

# Create backup directory
BACKUP_DIR="../../backups/qa03-state-fix-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Download and backup current state
if aws s3 cp "s3://${STATE_BUCKET}/${STATE_KEY}" "${BACKUP_DIR}/terraform.tfstate.backup" 2>/dev/null; then
    print_success "State file backed up to: ${BACKUP_DIR}/terraform.tfstate.backup"
else
    print_warning "Could not backup state file (may not exist yet)"
fi

print_header "📋 Step 2: Initialize Terraform"

terraform init -backend-config="bucket=${STATE_BUCKET}" \
               -backend-config="key=${STATE_KEY}" \
               -backend-config="region=${AWS_REGION}"

print_header "📋 Step 3: Check Current State"

print_info "Listing resources in Terraform state..."
echo ""
terraform state list || print_warning "No resources in state or state file doesn't exist"
echo ""

print_header "📋 Step 4: Verify AWS Resources"

FUNCTION_NAME="${ENVIRONMENT}-${SUB_ENVIRONMENT}-dpp-api"
BUCKET_NAME="${ENVIRONMENT}-${SUB_ENVIRONMENT}-dpp-website"
API_NAME="${SUB_ENVIRONMENT}"

print_info "Checking if resources actually exist in AWS..."
echo ""

# Check Lambda function
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$AWS_REGION" >/dev/null 2>&1; then
    print_success "Lambda function EXISTS in AWS: $FUNCTION_NAME"
    LAMBDA_EXISTS=true
else
    print_warning "Lambda function MISSING in AWS: $FUNCTION_NAME"
    LAMBDA_EXISTS=false
fi

# Check S3 bucket
if aws s3 ls "s3://$BUCKET_NAME" >/dev/null 2>&1; then
    print_success "S3 bucket EXISTS in AWS: $BUCKET_NAME"
    S3_EXISTS=true
else
    print_warning "S3 bucket MISSING in AWS: $BUCKET_NAME"
    S3_EXISTS=false
fi

# Check API Gateway
API_ID=$(aws apigatewayv2 get-apis --region "$AWS_REGION" --query "Items[?Name=='$API_NAME'].ApiId" --output text 2>/dev/null || echo "")
if [ -n "$API_ID" ] && [ "$API_ID" != "None" ]; then
    print_success "API Gateway EXISTS in AWS: $API_NAME (ID: $API_ID)"
    API_EXISTS=true
else
    print_warning "API Gateway MISSING in AWS: $API_NAME"
    API_EXISTS=false
fi

echo ""

print_header "📋 Step 5: Remove Missing Resources from State"

# Resources to potentially remove from state
RESOURCES_TO_REMOVE=(
    "module.lambda_backend.aws_lambda_function.main"
    "module.lambda_backend.aws_iam_role.lambda_execution"
    "module.lambda_backend.aws_iam_role_policy_attachment.lambda_execution"
    "module.s3_website.aws_s3_bucket.website"
    "module.s3_website.aws_s3_bucket_public_access_block.website"
    "module.s3_website.aws_s3_bucket_website_configuration.website"
    "module.s3_website.aws_s3_bucket_policy.website"
    "module.api_gateway.aws_apigatewayv2_api.main"
    "module.api_gateway.aws_apigatewayv2_stage.main"
    "module.api_gateway.aws_apigatewayv2_integration.lambda"
    "module.api_gateway.aws_apigatewayv2_route.health"
    "module.api_gateway.aws_apigatewayv2_route.api_trpc"
    "module.api_gateway.aws_lambda_permission.api_gateway_lambda"
)

print_info "Checking which resources are in state but missing in AWS..."
echo ""

REMOVED_COUNT=0

for resource in "${RESOURCES_TO_REMOVE[@]}"; do
    # Check if resource exists in state
    if terraform state show "$resource" >/dev/null 2>&1; then
        # Determine if this resource should be removed based on AWS checks
        SHOULD_REMOVE=false
        
        case "$resource" in
            *lambda_function* | *lambda_execution* | *lambda_permission*)
                if [ "$LAMBDA_EXISTS" = false ]; then
                    SHOULD_REMOVE=true
                fi
                ;;
            *s3_bucket*)
                if [ "$S3_EXISTS" = false ]; then
                    SHOULD_REMOVE=true
                fi
                ;;
            *apigatewayv2*)
                if [ "$API_EXISTS" = false ]; then
                    SHOULD_REMOVE=true
                fi
                ;;
        esac
        
        if [ "$SHOULD_REMOVE" = true ]; then
            print_warning "Removing from state (missing in AWS): $resource"
            if terraform state rm "$resource"; then
                print_success "Successfully removed: $resource"
                ((REMOVED_COUNT++))
            else
                print_error "Failed to remove: $resource"
            fi
        else
            print_info "Keeping in state (exists in AWS): $resource"
        fi
    fi
done

echo ""
print_info "Removed $REMOVED_COUNT resources from Terraform state"
echo ""

print_header "📋 Step 6: Verify State After Cleanup"

print_info "Resources remaining in Terraform state:"
terraform state list || print_info "No resources in state"
echo ""

print_header "📋 Step 7: Plan Next Deployment"

print_info "Running terraform plan to see what will be created..."
terraform plan -var="sub_environment=$SUB_ENVIRONMENT" -var="environment=$ENVIRONMENT" || print_warning "Terraform plan failed - this is expected if there are unresolved dependencies"

echo ""
print_header "🎉 State Cleanup Complete!"

echo ""
print_success "✅ Terraform state has been cleaned up for QA03"
print_info "📁 Backup location: ${BACKUP_DIR}/terraform.tfstate.backup"
echo ""
print_info "🚀 Next Steps:"
echo "1. Trigger the QA03 serverless workflow again"
echo "2. Monitor the Deploy Infrastructure job - it should now run terraform apply"
echo "3. Watch for the Lambda function qa-qa03-dpp-api to be created"
echo ""
print_info "🔗 Trigger workflow with:"
echo "   git commit --allow-empty -m 'trigger: qa03 after state cleanup' && git push origin qa03"
echo ""

if [ $REMOVED_COUNT -gt 0 ]; then
    print_success "State corruption fixed! $REMOVED_COUNT resources removed from state."
    print_info "The next deployment should recreate the missing resources."
else
    print_warning "No resources were removed from state."
    print_info "The issue might be elsewhere - check terraform plan output above."
fi 