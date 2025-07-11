#!/bin/bash
# update-terraform-policy.sh - Update TerraformPolicy with S3 permissions
set -e

echo "🔧 Updating TerraformPolicy with S3 permissions..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to run a command and check result
run_command() {
    local description="$1"
    local command="$2"
    
    echo -e "\n${BLUE}${description}...${NC}"
    if eval "$command"; then
        echo -e "${GREEN}✅ Success${NC}"
    else
        echo -e "${RED}❌ Failed${NC}"
        return 1
    fi
}

# Check if AWS CLI is configured
echo -e "\n${YELLOW}Checking AWS CLI configuration...${NC}"
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo -e "${RED}❌ AWS CLI not configured or credentials invalid${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
TERRAFORM_POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/TerraformPolicy"

echo -e "\n${YELLOW}Step 1: Checking if TerraformPolicy exists...${NC}"

# Check if policy exists
if ! aws iam get-policy --policy-arn "${TERRAFORM_POLICY_ARN}" >/dev/null 2>&1; then
    echo -e "${RED}❌ TerraformPolicy does not exist. Please run apply-iam-security.sh first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ TerraformPolicy exists${NC}"

# Get the current policy version
echo -e "\n${YELLOW}Step 2: Getting current policy version...${NC}"
CURRENT_VERSION=$(aws iam get-policy --policy-arn "${TERRAFORM_POLICY_ARN}" --query 'Policy.DefaultVersionId' --output text)
echo -e "${BLUE}Current version: ${CURRENT_VERSION}${NC}"

# Get the current policy document
echo -e "\n${YELLOW}Step 3: Getting current policy document...${NC}"
aws iam get-policy-version --policy-arn "${TERRAFORM_POLICY_ARN}" --version-id "${CURRENT_VERSION}" --query 'PolicyVersion.Document' > /tmp/current-policy.json

# Create the updated policy document
echo -e "\n${YELLOW}Step 4: Creating updated policy document...${NC}"
cat > /tmp/updated-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "TerraformEC2Access",
      "Effect": "Allow",
      "Action": [
        "ec2:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "TerraformELBAccess",
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "TerraformECSAccess",
      "Effect": "Allow",
      "Action": [
        "ecs:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "TerraformRDSAccess",
      "Effect": "Allow",
      "Action": [
        "rds:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "TerraformACMAccess",
      "Effect": "Allow",
      "Action": [
        "acm:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "TerraformSecretsManagerAccess",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "TerraformCloudWatchLogsAccess",
      "Effect": "Allow",
      "Action": [
        "logs:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "TerraformKMSAccess",
      "Effect": "Allow",
      "Action": [
        "kms:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "TerraformRoute53Access",
      "Effect": "Allow",
      "Action": [
        "route53:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "TerraformCloudFrontAccess",
      "Effect": "Allow",
      "Action": [
        "cloudfront:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "TerraformIAMAccess",
      "Effect": "Allow",
      "Action": [
        "iam:CreateRole",
        "iam:DeleteRole",
        "iam:GetRole",
        "iam:PutRolePolicy",
        "iam:DeleteRolePolicy",
        "iam:AttachRolePolicy",
        "iam:DetachRolePolicy",
        "iam:CreatePolicy",
        "iam:DeletePolicy",
        "iam:GetPolicy",
        "iam:CreatePolicyVersion",
        "iam:DeletePolicyVersion",
        "iam:GetPolicyVersion",
        "iam:ListPolicyVersions",
        "iam:ListAttachedRolePolicies",
        "iam:ListRolePolicies",
        "iam:PassRole"
      ],
      "Resource": "*"
    },
    {
      "Sid": "TerraformECRAccess",
      "Effect": "Allow",
      "Action": [
        "ecr:*"
      ],
      "Resource": "*"
    },
    {
      "Sid": "TerraformSTSAccess",
      "Effect": "Allow",
      "Action": [
        "sts:AssumeRole"
      ],
      "Resource": "*"
    },
    {
      "Sid": "TerraformS3Access",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::hibiji-terraform-state",
        "arn:aws:s3:::hibiji-terraform-state/*"
      ]
    }
  ]
}
EOF

# Create new policy version
echo -e "\n${YELLOW}Step 5: Creating new policy version...${NC}"
run_command "Creating new policy version" \
    "aws iam create-policy-version --policy-arn '${TERRAFORM_POLICY_ARN}' --policy-document file:///tmp/updated-policy.json --set-as-default"

# Clean up old policy versions (keep only the latest 4)
echo -e "\n${YELLOW}Step 6: Cleaning up old policy versions...${NC}"
POLICY_VERSIONS=$(aws iam list-policy-versions --policy-arn "${TERRAFORM_POLICY_ARN}" --query 'Versions[?IsDefaultVersion==`false`].VersionId' --output text)

if [ -n "$POLICY_VERSIONS" ]; then
    for version in $POLICY_VERSIONS; do
        echo -e "${BLUE}Deleting old policy version: ${version}${NC}"
        aws iam delete-policy-version --policy-arn "${TERRAFORM_POLICY_ARN}" --version-id "${version}" || true
    done
fi

# Clean up temporary files
rm -f /tmp/current-policy.json /tmp/updated-policy.json

echo -e "\n${GREEN}🎉 TerraformPolicy updated successfully!${NC}"
echo -e "\n${BLUE}Summary:${NC}"
echo -e "  ✅ Added S3 permissions for Terraform state access"
echo -e "  ✅ Updated TerraformPolicy with new version"
echo -e "  ✅ Cleaned up old policy versions"

echo -e "\n${YELLOW}The GitHub Actions workflow should now be able to:${NC}"
echo -e "  • Access the Terraform state file: s3://hibiji-terraform-state/main/terraform.tfstate"
echo -e "  • Perform terraform init, plan, and apply operations"
echo -e "  • Deploy infrastructure successfully"

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "  1. Test the GitHub Actions workflow"
echo -e "  2. Verify that terraform init works without permission errors"
echo -e "  3. Monitor the deployment process" 