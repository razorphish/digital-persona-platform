#!/bin/bash

# Simple ECR Fix Script
# This script creates a simple ECR policy and attaches it to the dev-airica user

set -e

echo "=========================================="
echo "  Simple ECR Permissions Fix"
echo "=========================================="
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo "ERROR: AWS CLI is not installed"
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    echo "ERROR: AWS CLI is not configured"
    exit 1
fi

echo "SUCCESS: AWS CLI is configured and working"
echo ""

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "Account ID: $ACCOUNT_ID"
echo ""

# Create ECR policy
POLICY_NAME="ECRSimpleAccess"
POLICY_ARN="arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME"

echo "Creating ECR policy: $POLICY_NAME"

# Create policy document
cat > /tmp/ecr-simple-policy.json << 'EOF'
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload",
                "ecr:PutImage",
                "ecr:DescribeRepositories",
                "ecr:ListRepositories",
                "ecr:DescribeImages",
                "ecr:ListImages",
                "ecr:BatchDeleteImage",
                "ecr:CreateRepository",
                "ecr:DeleteRepository"
            ],
            "Resource": "*"
        }
    ]
}
EOF

# Check if policy exists
if aws iam get-policy --policy-arn "$POLICY_ARN" &> /dev/null; then
    echo "Policy already exists, updating..."
    
    # Get current version
    CURRENT_VERSION=$(aws iam get-policy --policy-arn "$POLICY_ARN" --query 'Policy.DefaultVersionId' --output text)
    
    # Create new version
    aws iam create-policy-version \
        --policy-arn "$POLICY_ARN" \
        --policy-document file:///tmp/ecr-simple-policy.json \
        --set-as-default
    
    # Delete old version if not v1
    if [ "$CURRENT_VERSION" != "v1" ]; then
        aws iam delete-policy-version \
            --policy-arn "$POLICY_ARN" \
            --version-id "$CURRENT_VERSION"
    fi
else
    echo "Creating new policy..."
    aws iam create-policy \
        --policy-name "$POLICY_NAME" \
        --policy-document file:///tmp/ecr-simple-policy.json
fi

echo "SUCCESS: ECR policy created/updated"
echo ""

# Attach policy to user
echo "Attaching policy to user: dev-airica"
aws iam attach-user-policy \
    --user-name dev-airica \
    --policy-arn "$POLICY_ARN"

echo "SUCCESS: Policy attached to user"
echo ""

# Clean up
rm -f /tmp/ecr-simple-policy.json

echo "=========================================="
echo "  ECR Permissions Fixed!"
echo "=========================================="
echo ""
echo "The user 'dev-airica' now has ECR permissions including:"
echo "- ecr:GetAuthorizationToken"
echo "- ecr:PutImage (push images)"
echo "- ecr:BatchGetImage (pull images)"
echo "- ecr:CreateRepository"
echo "- ecr:DeleteRepository"
echo ""
echo "You can now re-run your GitHub Actions workflow."
echo "" 