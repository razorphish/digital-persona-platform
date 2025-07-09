#!/bin/bash

# Create GitHub Actions User Script
# This script creates a new IAM user specifically for GitHub Actions with ECR permissions

set -e

echo "=========================================="
echo "  Create GitHub Actions User"
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

# User details
USERNAME="github-actions"
POLICY_NAME="ECRGitHubActions"

echo "Creating user: $USERNAME"

# Check if user exists
if aws iam get-user --user-name "$USERNAME" &> /dev/null; then
    echo "WARNING: User '$USERNAME' already exists"
    echo -n "Do you want to continue and update the user? (y/n): "
    read CONTINUE
    if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
        echo "Operation cancelled"
        exit 0
    fi
else
    # Create user
    echo "Creating new user: $USERNAME"
    aws iam create-user --user-name "$USERNAME"
fi

# Create ECR policy
echo "Creating ECR policy: $POLICY_NAME"

cat > /tmp/ecr-github-policy.json << 'EOF'
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

POLICY_ARN="arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME"

# Check if policy exists
if aws iam get-policy --policy-arn "$POLICY_ARN" &> /dev/null; then
    echo "Policy already exists, updating..."
    
    # Get current version
    CURRENT_VERSION=$(aws iam get-policy --policy-arn "$POLICY_ARN" --query 'Policy.DefaultVersionId' --output text)
    
    # Create new version
    aws iam create-policy-version \
        --policy-arn "$POLICY_ARN" \
        --policy-document file:///tmp/ecr-github-policy.json \
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
        --policy-document file:///tmp/ecr-github-policy.json
fi

echo "SUCCESS: ECR policy created/updated"
echo ""

# Attach policy to user
echo "Attaching policy to user: $USERNAME"
aws iam attach-user-policy \
    --user-name "$USERNAME" \
    --policy-arn "$POLICY_ARN"

echo "SUCCESS: Policy attached to user"
echo ""

# Create access keys
echo "Creating access keys for user: $USERNAME"
ACCESS_KEY_OUTPUT=$(aws iam create-access-key --user-name "$USERNAME")

# Extract access key details
ACCESS_KEY_ID=$(echo "$ACCESS_KEY_OUTPUT" | grep -o '"AccessKeyId": "[^"]*' | grep -o '[^"]*$')
SECRET_ACCESS_KEY=$(echo "$ACCESS_KEY_OUTPUT" | grep -o '"SecretAccessKey": "[^"]*' | grep -o '[^"]*$')

echo "SUCCESS: Access keys created"
echo ""

# Clean up
rm -f /tmp/ecr-github-policy.json

echo "=========================================="
echo "  GitHub Actions User Created!"
echo "=========================================="
echo ""
echo "User Details:"
echo "├── Username: $USERNAME"
echo "├── Account ID: $ACCOUNT_ID"
echo "└── Policy: $POLICY_NAME"
echo ""
echo "Access Keys:"
echo "├── Access Key ID: $ACCESS_KEY_ID"
echo "└── Secret Access Key: $SECRET_ACCESS_KEY"
echo ""
echo "Next Steps:"
echo "1. Go to your GitHub repository"
echo "2. Navigate to Settings → Secrets and variables → Actions"
echo "3. Update the following secrets:"
echo "   - AWS_ACCESS_KEY_ID: $ACCESS_KEY_ID"
echo "   - AWS_SECRET_ACCESS_KEY: $SECRET_ACCESS_KEY"
echo ""
echo "4. Test the workflow by pushing a commit"
echo ""
echo "IMPORTANT: Store these credentials securely!"
echo "" 