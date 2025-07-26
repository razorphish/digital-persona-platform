#!/bin/bash

# =================================
# FIX COST MONITORING PERMISSIONS
# =================================
# Updates the TerraformPolicy to include Cost Explorer permissions
# for the cost monitoring GitHub Actions workflow

set -e

echo "=========================================="
echo "🔧 FIXING COST MONITORING PERMISSIONS"
echo "=========================================="

# Get AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
POLICY_NAME="TerraformPolicy"
POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}"

echo ""
echo "📋 Updating IAM policy: $POLICY_NAME"
echo "🔗 Policy ARN: $POLICY_ARN"

# Check if policy exists
if ! aws iam get-policy --policy-arn "$POLICY_ARN" >/dev/null 2>&1; then
    echo "❌ Policy $POLICY_NAME not found!"
    echo "Please run the IAM setup scripts first."
    exit 1
fi

echo ""
echo "✅ Policy found. Updating with Cost Explorer permissions..."

# Get current version before updating
CURRENT_VERSION=$(aws iam get-policy --policy-arn "$POLICY_ARN" --query 'Policy.DefaultVersionId' --output text)
echo "📝 Current version: $CURRENT_VERSION"

# Create new version with updated permissions
echo "🔄 Creating new policy version with Cost Explorer permissions..."
aws iam create-policy-version \
    --policy-arn "$POLICY_ARN" \
    --policy-document file://terraform/iam-policies/terraform-policy.json \
    --set-as-default

echo "✅ New policy version created and set as default"

# Delete old version if not v1
if [ "$CURRENT_VERSION" != "v1" ]; then
    echo "🗑️  Deleting old version: $CURRENT_VERSION"
    aws iam delete-policy-version \
        --policy-arn "$POLICY_ARN" \
        --version-id "$CURRENT_VERSION"
    echo "✅ Old version deleted"
fi

echo ""
echo "🎉 Cost monitoring permissions updated successfully!"
echo ""
echo "📊 The following Cost Explorer permissions were added:"
echo "   • ce:GetCostAndUsage"
echo "   • ce:GetUsageReport" 
echo "   • ce:GetCostCategories"
echo "   • ce:GetDimensionValues"
echo "   • ce:GetRightsizingRecommendation"
echo "   • ce:GetSavingsUtilization"
echo "   • ce:ListCostAndUsageSpecifications"
echo "   • budgets:ViewBudget"
echo "   • budgets:ViewBudgetAction"
echo "   • cloudwatch:GetMetricStatistics"
echo "   • cloudwatch:ListMetrics"
echo ""
echo "🚀 Cost monitoring workflows should now work properly!"
echo "" 