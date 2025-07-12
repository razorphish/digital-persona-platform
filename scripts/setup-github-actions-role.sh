#!/bin/bash

# Setup GitHub Actions IAM Role for Terraform
# This script creates the necessary IAM role and policy for GitHub Actions to manage AWS resources

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up GitHub Actions IAM Role for Terraform...${NC}"

# Get AWS account ID
echo -e "${YELLOW}Getting AWS account ID...${NC}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "ERROR")
if [ "$ACCOUNT_ID" = "ERROR" ]; then
    echo -e "${RED}❌ Could not get AWS account ID. Please ensure AWS CLI is configured properly.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ AWS Account ID: $ACCOUNT_ID${NC}"

# Create IAM policy for GitHub Actions
echo -e "${YELLOW}Creating IAM policy for GitHub Actions...${NC}"
cat > github-actions-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:*",
                "ecs:*",
                "ecr:*",
                "iam:*",
                "s3:*",
                "rds:*",
                "route53:*",
                "acm:*",
                "cloudfront:*",
                "secretsmanager:*",
                "cloudwatch:*",
                "logs:*",
                "elasticloadbalancing:*",
                "autoscaling:*",
                "sts:AssumeRole",
                "sts:GetCallerIdentity"
            ],
            "Resource": "*"
        }
    ]
}
EOF

# Create the policy
aws iam create-policy \
    --policy-name GitHubActionsTerraformPolicy \
    --policy-document file://github-actions-policy.json \
    --description "Policy for GitHub Actions to manage Terraform resources" \
    2>/dev/null || echo -e "${YELLOW}Policy already exists or failed to create${NC}"

# Create trust policy for GitHub Actions
echo -e "${YELLOW}Creating trust policy for GitHub Actions...${NC}"
cat > github-actions-trust-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Federated": "arn:aws:iam::$ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
            },
            "Action": "sts:AssumeRoleWithWebIdentity",
            "Condition": {
                "StringEquals": {
                    "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
                },
                "StringLike": {
                    "token.actions.githubusercontent.com:sub": "repo:razorphish/digital-persona-platform:*"
                }
            }
        }
    ]
}
EOF

# Create the role
echo -e "${YELLOW}Creating IAM role for GitHub Actions...${NC}"
aws iam create-role \
    --role-name GitHubActionsTerraformRole \
    --assume-role-policy-document file://github-actions-trust-policy.json \
    --description "Role for GitHub Actions to manage Terraform resources" \
    2>/dev/null || echo -e "${YELLOW}Role already exists or failed to create${NC}"

# Attach the policy to the role
echo -e "${YELLOW}Attaching policy to role...${NC}"
aws iam attach-role-policy \
    --role-name GitHubActionsTerraformRole \
    --policy-arn arn:aws:iam::$ACCOUNT_ID:policy/GitHubActionsTerraformPolicy \
    2>/dev/null || echo -e "${YELLOW}Policy attachment failed or already attached${NC}"

# Get the role ARN
ROLE_ARN="arn:aws:iam::$ACCOUNT_ID:role/GitHubActionsTerraformRole"

echo -e "${GREEN}✅ Setup complete!${NC}"
echo -e "${GREEN}Role ARN: $ROLE_ARN${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Go to your GitHub repository: https://github.com/razorphish/digital-persona-platform"
echo "2. Navigate to Settings → Secrets and variables → Actions"
echo "3. Click 'New repository secret'"
echo "4. Set Name: AWS_ROLE_ARN"
echo "5. Set Value: $ROLE_ARN"
echo "6. Click 'Add secret'"
echo ""
echo -e "${YELLOW}Note: You may also need to set up OIDC provider in AWS if not already configured.${NC}"

# Cleanup temporary files
rm -f github-actions-policy.json github-actions-trust-policy.json 