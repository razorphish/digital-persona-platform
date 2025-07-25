#!/bin/bash

# =================================
# Fix IAM Permissions Script
# =================================
# This script helps diagnose and fix IAM permissions issues

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

print_status "Diagnosing IAM permissions issues..."

# Check current AWS identity
print_status "Current AWS identity:"
aws sts get-caller-identity --output table || {
    print_error "Cannot get AWS caller identity"
    exit 1
}

CURRENT_USER=$(aws sts get-caller-identity --query 'Arn' --output text)
print_status "Using AWS identity: $CURRENT_USER"

# Test IAM permissions
print_status "Testing IAM permissions..."

# Test basic IAM read permissions
if aws iam get-user >/dev/null 2>&1; then
    print_success "✅ Basic IAM read permissions working"
else
    print_warning "⚠️ Limited IAM read permissions"
fi

# Test role listing
if aws iam list-roles --max-items 1 >/dev/null 2>&1; then
    print_success "✅ Can list IAM roles"
else
    print_error "❌ Cannot list IAM roles"
fi

# Test specific role access
LAMBDA_ROLE="dev-dev01-dpp-lambda-execution"
print_status "Testing access to Lambda execution role: $LAMBDA_ROLE"

if aws iam get-role --role-name "$LAMBDA_ROLE" >/dev/null 2>&1; then
    print_success "✅ Can read Lambda execution role"
else
    print_warning "⚠️ Cannot read Lambda execution role (may not exist yet)"
fi

# Test role policy access (this is what's failing)
if aws iam list-role-policies --role-name "$LAMBDA_ROLE" >/dev/null 2>&1; then
    print_success "✅ Can read role policies"
else
    print_error "❌ Cannot read role policies - this is the main issue!"
    print_status "Error: Missing iam:GetRolePolicy and iam:ListRolePolicies permissions"
fi

# Provide solutions
print_status ""
print_status "🔧 SOLUTIONS TO FIX IAM PERMISSIONS:"
print_status ""

print_status "1. IMMEDIATE WORKAROUND - Skip IAM policy reads in Terraform:"
echo "   Add this to your Lambda module to ignore policy changes:"
echo ""
echo "   In terraform/modules/lambda-backend/main.tf, add to aws_iam_role.lambda_execution:"
echo '   lifecycle {'
echo '     ignore_changes = [inline_policy]'
echo '   }'

print_status ""
print_status "2. PROPER FIX - Add missing IAM permissions:"
echo "   Add these permissions to your deployment user/role policy:"
echo ""
echo '   {'
echo '     "Version": "2012-10-17",'
echo '     "Statement": ['
echo '       {'
echo '         "Effect": "Allow",'
echo '         "Action": ['
echo '           "iam:GetRolePolicy",'
echo '           "iam:ListRolePolicies",'
echo '           "iam:PutRolePolicy",'
echo '           "iam:DeleteRolePolicy"'
echo '         ],'
echo '         "Resource": "arn:aws:iam::*:role/dev-dev01-dpp-*"'
echo '       }'
echo '     ]'
echo '   }'

print_status ""
print_status "3. TERRAFORM STATE CLEANUP (if needed):"
echo "   If Terraform state is corrupted, you may need to:"
echo "   cd terraform/environments/dev"
echo "   terraform state rm module.lambda_backend.aws_iam_role.lambda_execution"
echo "   terraform import module.lambda_backend.aws_iam_role.lambda_execution $LAMBDA_ROLE"

print_status ""
print_status "4. ALTERNATIVE DEPLOYMENT APPROACH:"
echo "   Use existing IAM role instead of creating new one:"
echo "   - Create the Lambda execution role manually in AWS Console"
echo "   - Modify Terraform to use data source instead of resource"

print_status ""
print_warning "RECOMMENDATION: Apply solution #1 (workaround) first to unblock deployment,"
print_warning "then work on solution #2 (proper permissions) for long-term fix."

print_status ""
print_status "Would you like me to apply the workaround automatically? (y/n)" 