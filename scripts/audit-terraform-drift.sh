#!/bin/bash

# =================================
# Terraform Drift Audit Script
# =================================
# This script identifies drift between AWS reality and Terraform state
# Focuses on permissions and resources that may have been manually modified

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
ENVIRONMENT="dev"
BRANCH="dev01"
LAMBDA_NAME="dev-dev01-dpp-api"
API_NAME="dev-dev01-dpp-api"
S3_BUCKET="dev-dev01-dpp-uploads"
IAM_ROLE_NAME="dev-dev01-dpp-lambda-execution"

print_header "🔍 TERRAFORM DRIFT AUDIT"
echo "Environment: $ENVIRONMENT"
echo "Branch: $BRANCH"
echo "Lambda: $LAMBDA_NAME"
echo "API Gateway: $API_NAME"
echo "S3 Bucket: $S3_BUCKET"
echo "IAM Role: $IAM_ROLE_NAME"

# 1. LAMBDA PERMISSIONS AUDIT
print_header "🔐 LAMBDA PERMISSIONS AUDIT"

print_status "Checking Lambda function permissions..."
if aws lambda get-policy --function-name "$LAMBDA_NAME" --query 'Policy' --output text 2>/dev/null; then
    print_success "✅ Lambda has permission policy"
    
    # Get and analyze permissions
    POLICY_JSON=$(aws lambda get-policy --function-name "$LAMBDA_NAME" --query 'Policy' --output text)
    echo "📋 Current Lambda permissions:"
    echo "$POLICY_JSON" | jq '.' 2>/dev/null || echo "$POLICY_JSON"
    
    # Check for multiple API Gateway permissions (drift indicator)
    STATEMENT_COUNT=$(echo "$POLICY_JSON" | jq '.Statement | length' 2>/dev/null || echo "0")
    if [ "$STATEMENT_COUNT" -gt 1 ]; then
        print_warning "⚠️ Multiple permission statements found ($STATEMENT_COUNT) - potential drift"
        
        # List all statement IDs
        echo "Statement IDs:"
        echo "$POLICY_JSON" | jq -r '.Statement[].Sid' 2>/dev/null || echo "Could not parse"
    fi
    
    # Check for non-Terraform managed permissions
    if echo "$POLICY_JSON" | grep -q "allow-apigateway-invoke"; then
        print_warning "⚠️ Found manual permission 'allow-apigateway-invoke' - not managed by Terraform"
    fi
    
else
    print_error "❌ No permission policy found on Lambda function"
fi

# 2. IAM ROLE AUDIT  
print_header "👤 IAM ROLE AUDIT"

print_status "Checking IAM role: $IAM_ROLE_NAME"
if aws iam get-role --role-name "$IAM_ROLE_NAME" >/dev/null 2>&1; then
    print_success "✅ IAM role exists"
    
    # Check inline policies (these might be manually added)
    print_status "Checking inline policies..."
    INLINE_POLICIES=$(aws iam list-role-policies --role-name "$IAM_ROLE_NAME" --query 'PolicyNames' --output text)
    if [ -n "$INLINE_POLICIES" ] && [ "$INLINE_POLICIES" != "None" ]; then
        print_warning "⚠️ Found inline policies (may indicate manual changes):"
        echo "$INLINE_POLICIES"
        
        for policy in $INLINE_POLICIES; do
            echo "📋 Inline policy '$policy':"
            aws iam get-role-policy --role-name "$IAM_ROLE_NAME" --policy-name "$policy" --query 'PolicyDocument' --output json || echo "Could not retrieve policy"
        done
    else
        print_success "✅ No inline policies found"
    fi
    
    # Check attached managed policies
    print_status "Checking attached managed policies..."
    aws iam list-attached-role-policies --role-name "$IAM_ROLE_NAME" --query 'AttachedPolicies[].{PolicyName:PolicyName,PolicyArn:PolicyArn}' --output table
    
else
    print_error "❌ IAM role not found: $IAM_ROLE_NAME"
fi

# 3. API GATEWAY AUDIT
print_header "🌐 API GATEWAY AUDIT"

print_status "Checking API Gateway: $API_NAME"

# Get all APIs with this name
API_IDS=$(aws apigatewayv2 get-apis --query "Items[?Name=='$API_NAME'].ApiId" --output text)
API_COUNT=$(echo "$API_IDS" | wc -w)

if [ "$API_COUNT" -eq 0 ]; then
    print_error "❌ No API Gateway found with name: $API_NAME"
elif [ "$API_COUNT" -eq 1 ]; then
    print_success "✅ Single API Gateway found (good)"
    API_ID=$(echo "$API_IDS" | tr -d ' ')
    print_status "API ID: $API_ID"
else
    print_warning "⚠️ Multiple API Gateways found with same name ($API_COUNT) - DRIFT ISSUE"
    echo "API IDs: $API_IDS"
    
    # Show details of each API
    for api_id in $API_IDS; do
        echo "📋 API ID: $api_id"
        aws apigatewayv2 get-api --api-id "$api_id" --query '{Created:CreatedDate,Protocol:ProtocolType}' --output table
    done
    
    # Suggest cleanup
    print_warning "Recommendation: Use cleanup-old-api-gateways.sh to resolve this"
fi

# If we have an API, check its configuration
if [ -n "$API_ID" ]; then
    print_status "Checking API Gateway routes..."
    aws apigatewayv2 get-routes --api-id "$API_ID" --query 'Items[].{RouteKey:RouteKey,Target:Target}' --output table
    
    print_status "Checking API Gateway stages..."
    aws apigatewayv2 get-stages --api-id "$API_ID" --query 'Items[].{StageName:StageName,AutoDeploy:AutoDeploy}' --output table
fi

# 4. S3 BUCKET AUDIT
print_header "📦 S3 BUCKET AUDIT"

print_status "Checking S3 bucket: $S3_BUCKET"
if aws s3api head-bucket --bucket "$S3_BUCKET" 2>/dev/null; then
    print_success "✅ S3 bucket exists"
    
    # Check bucket policy
    print_status "Checking bucket policy..."
    if aws s3api get-bucket-policy --bucket "$S3_BUCKET" --query 'Policy' --output text 2>/dev/null >/dev/null; then
        print_status "📋 Bucket has a policy:"
        aws s3api get-bucket-policy --bucket "$S3_BUCKET" --query 'Policy' --output text | jq '.' 2>/dev/null || echo "Could not parse policy"
    else
        print_status "No bucket policy found"
    fi
    
    # Check public access block
    print_status "Checking public access block..."
    aws s3api get-public-access-block --bucket "$S3_BUCKET" --query 'PublicAccessBlockConfiguration' --output table 2>/dev/null || echo "No public access block configured"
    
    # Check CORS configuration
    print_status "Checking CORS configuration..."
    aws s3api get-bucket-cors --bucket "$S3_BUCKET" --query 'CORSRules' --output table 2>/dev/null || echo "No CORS configuration found"
    
else
    print_error "❌ S3 bucket not found: $S3_BUCKET"
fi

# 5. TERRAFORM STATE AUDIT
print_header "🏗️ TERRAFORM STATE AUDIT"

print_status "Checking Terraform state for drift..."
cd terraform/environments/dev

if [ -f "terraform.tfstate" ] || terraform state list >/dev/null 2>&1; then
    print_success "✅ Terraform state found"
    
    print_status "Resources in Terraform state:"
    terraform state list | sort
    
    # Check for specific resources we've had issues with
    print_status "\nChecking specific resources for drift:"
    
    # Lambda function
    if terraform state show aws_lambda_function.main >/dev/null 2>&1; then
        print_success "✅ Lambda function in state"
    else
        print_warning "⚠️ Lambda function not in Terraform state"
    fi
    
    # API Gateway
    if terraform state show module.api_gateway.aws_apigatewayv2_api.main >/dev/null 2>&1; then
        print_success "✅ API Gateway in state"
    else
        print_warning "⚠️ API Gateway not in Terraform state"
    fi
    
    # Lambda permission
    if terraform state show module.api_gateway.aws_lambda_permission.api_gateway_lambda >/dev/null 2>&1; then
        print_success "✅ Lambda permission in state"
    else
        print_warning "⚠️ Lambda permission not in Terraform state"
    fi
    
    # IAM role
    if terraform state show module.lambda_backend.aws_iam_role.lambda_execution >/dev/null 2>&1; then
        print_success "✅ IAM role in state"
    else
        print_warning "⚠️ IAM role not in Terraform state"
    fi
    
else
    print_error "❌ No Terraform state found"
fi

cd - >/dev/null

# 6. RECOMMENDATIONS
print_header "🎯 RECOMMENDATIONS"

echo "Based on the audit above, here are recommended actions:"
echo ""

print_status "1. 🧹 CLEANUP ACTIONS:"
echo "   • Run ./scripts/cleanup-lambda-permissions.sh to remove manual permissions"
echo "   • Run ./scripts/cleanup-old-api-gateways.sh to remove duplicate APIs"
echo "   • Consider cleaning up any unexpected inline IAM policies"
echo ""

print_status "2. 🔄 TERRAFORM ACTIONS:"
echo "   • Run 'terraform plan' to see what Terraform wants to change"
echo "   • Run 'terraform refresh' to sync state with AWS reality"
echo "   • Run 'terraform apply' to ensure everything is properly managed"
echo ""

print_status "3. 📋 MONITORING:"
echo "   • Set up regular drift detection (terraform plan in CI)"
echo "   • Use AWS Config for compliance monitoring"
echo "   • Document any intentional manual changes"
echo ""

print_warning "⚠️ IMPORTANT:"
echo "Review all findings before making changes. Some 'drift' might be intentional."
echo "Always test in a safe environment first."

print_header "✅ AUDIT COMPLETE" 