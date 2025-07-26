#!/bin/bash

# update-iam-permissions.sh
# Automatically updates IAM permissions for GitHub Actions Terraform role
# Works dynamically with any AWS account and wildcard environments
#
# USAGE:
#   ./scripts/update-iam-permissions.sh
#
# ENVIRONMENT VARIABLES:
#   TERRAFORM_POLICY_NAME - Name of the IAM policy (default: TerraformPolicy)
#   AWS_DEFAULT_REGION    - AWS region if not configured (default: us-west-1)  
#   AWS_PROFILE          - AWS profile to use (optional)
#
# EXAMPLES:
#   # Standard usage (auto-detects account/region)
#   ./scripts/update-iam-permissions.sh
#
#   # Use different policy name
#   TERRAFORM_POLICY_NAME="MyCustomTerraformPolicy" ./scripts/update-iam-permissions.sh
#
#   # Use specific AWS profile
#   AWS_PROFILE="production" ./scripts/update-iam-permissions.sh

set -e

# Dynamic configuration - no hardcoded values
POLICY_NAME="${TERRAFORM_POLICY_NAME:-TerraformPolicy}"
POLICY_FILE="terraform/iam-policies/terraform-policy.json"

echo "🔐 IAM Permissions Update Script (Dynamic)"
echo "=========================================="

# Get current AWS account ID dynamically
echo "🔍 Detecting AWS account information..."
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
AWS_REGION=$(aws configure get region || echo "${AWS_DEFAULT_REGION:-us-west-1}")

if [[ -z "$AWS_ACCOUNT_ID" ]]; then
    echo "❌ Cannot determine AWS account ID. Please ensure AWS credentials are configured."
    exit 1
fi

# Construct policy ARN dynamically
POLICY_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:policy/${POLICY_NAME}"

echo "🎯 Target AWS Account: $AWS_ACCOUNT_ID"
echo "🌍 Current Region: $AWS_REGION"  
echo "📋 Policy ARN: $POLICY_ARN"
echo "📄 Policy File: $POLICY_FILE"
echo ""

# Check if policy file exists
if [[ ! -f "$POLICY_FILE" ]]; then
    echo "❌ Policy file not found: $POLICY_FILE"
    exit 1
fi

# Check if policy exists
echo "🔍 Checking if policy exists..."
if ! aws iam get-policy --policy-arn "$POLICY_ARN" &>/dev/null; then
    echo "❌ Policy does not exist: $POLICY_ARN"
    echo "💡 This might be a new AWS account or environment."
    echo "📋 You may need to create the policy first with:"
    echo "   aws iam create-policy --policy-name '$POLICY_NAME' --policy-document file://$POLICY_FILE"
    exit 1
fi

echo "✅ Policy exists!"
echo "📋 Current policy versions:"
aws iam list-policy-versions --policy-arn "$POLICY_ARN" --query 'Versions[*].[VersionId,IsDefaultVersion]' --output table

# Get current policy version
CURRENT_VERSION=$(aws iam get-policy --policy-arn "$POLICY_ARN" --query 'Policy.DefaultVersionId' --output text)
echo "🎯 Current default version: $CURRENT_VERSION"

# Get current policy document
echo "📖 Checking if policy needs update..."
aws iam get-policy-version --policy-arn "$POLICY_ARN" --version-id "$CURRENT_VERSION" --query 'PolicyVersion.Document' > current-policy.json

# Compare with our desired policy (normalize JSON)
if jq --sort-keys . current-policy.json > current-policy-sorted.json && \
   jq --sort-keys . "$POLICY_FILE" > desired-policy-sorted.json; then
   
    if cmp -s current-policy-sorted.json desired-policy-sorted.json; then
        echo "✅ IAM policy is already up to date!"
        rm -f current-policy*.json desired-policy-sorted.json
        exit 0
    fi
fi

echo "🔄 Policy needs update - creating new version..."

# Check if we have room for a new version (AWS allows max 5)
VERSION_COUNT=$(aws iam list-policy-versions --policy-arn "$POLICY_ARN" --query 'length(Versions)' --output text)
if [[ $VERSION_COUNT -ge 5 ]]; then
    echo "⚠️  Maximum policy versions reached ($VERSION_COUNT/5)"
    # Delete oldest non-default version
    OLDEST_VERSION=$(aws iam list-policy-versions --policy-arn "$POLICY_ARN" \
        --query 'Versions[?IsDefaultVersion==`false`] | sort_by(@, &CreateDate) | [0].VersionId' --output text)
    
    if [[ "$OLDEST_VERSION" != "None" && "$OLDEST_VERSION" != "" ]]; then
        echo "🗑️  Deleting oldest version: $OLDEST_VERSION"
        aws iam delete-policy-version --policy-arn "$POLICY_ARN" --version-id "$OLDEST_VERSION"
    fi
fi

# Create new policy version
echo "📝 Creating new policy version..."
NEW_VERSION=$(aws iam create-policy-version \
    --policy-arn "$POLICY_ARN" \
    --policy-document "file://$POLICY_FILE" \
    --set-as-default \
    --query 'PolicyVersion.VersionId' --output text)

echo "✅ Successfully created and activated policy version: $NEW_VERSION"

# Cleanup temp files
rm -f current-policy*.json desired-policy-sorted.json

echo "🎉 IAM permissions updated successfully!"
echo "📋 Services now supported:"
echo "   • EC2, ELB, ECS, RDS, Lambda, API Gateway"  
echo "   • S3, ECR, Route53, CloudFront, ACM"
echo "   • SQS, AWS Batch (for ML processing)"
echo "   • CloudWatch Logs, Secrets Manager, KMS"
echo "   • IAM roles and policies" 