#!/bin/bash

# =================================
# GITHUB ACTIONS IAM ROLE SETUP
# =================================
# Creates the IAM role needed for GitHub Actions OIDC authentication

set -e

echo "=========================================="
echo "🔧 SETTING UP GITHUB ACTIONS IAM ROLE"
echo "=========================================="

# Variables
REPO_OWNER="razorphish"
REPO_NAME="digital-persona-platform"
ROLE_NAME="GitHubActionsRole"

echo ""
echo "📋 Creating IAM role for GitHub Actions..."

# Create trust policy
cat > github-actions-trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::$(aws sts get-caller-identity --query Account --output text):oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:${REPO_OWNER}/${REPO_NAME}:*"
        }
      }
    }
  ]
}
EOF

# Create the role
aws iam create-role \
  --role-name "$ROLE_NAME" \
  --assume-role-policy-document file://github-actions-trust-policy.json \
  --description "Role for GitHub Actions to deploy serverless infrastructure"

# Attach necessary policies
aws iam attach-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-arn "arn:aws:iam::aws:policy/PowerUserAccess"

# Get role ARN
ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)

echo ""
echo "✅ GitHub Actions role created successfully!"
echo ""
echo "🔑 Add this secret to GitHub:"
echo "   Secret Name: AWS_ROLE_ARN"
echo "   Secret Value: $ROLE_ARN"
echo ""
echo "🌐 Go to: https://github.com/${REPO_OWNER}/${REPO_NAME}/settings/secrets/actions"
echo ""

# Cleanup
rm github-actions-trust-policy.json

echo "==========================================" 