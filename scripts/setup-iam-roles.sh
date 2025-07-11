#!/bin/bash
# setup-iam-roles.sh - Set up IAM roles for automation (CI/CD)
set -e

echo "🔧 Setting up IAM Roles for Automation..."
echo "=============================================="

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

# Create trust policy for GitHub Actions
cat > /tmp/github-actions-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com"
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

# Replace ACCOUNT_ID with actual account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
sed -i.bak "s/ACCOUNT_ID/${ACCOUNT_ID}/g" /tmp/github-actions-trust-policy.json

# Create OIDC provider for GitHub Actions (if it doesn't exist)
echo -e "\n${YELLOW}Step 1: Setting up OIDC provider for GitHub Actions...${NC}"

if ! aws iam get-open-id-connect-provider --open-id-connect-provider-arn "arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com" >/dev/null 2>&1; then
    run_command "Creating OIDC provider for GitHub Actions" \
        "aws iam create-open-id-connect-provider --url https://token.actions.githubusercontent.com --client-id-list sts.amazonaws.com --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1"
else
    echo -e "${GREEN}✅ OIDC provider already exists${NC}"
fi

# Create GitHub Actions role
echo -e "\n${YELLOW}Step 2: Creating GitHub Actions role...${NC}"

run_command "Creating GitHubActionsRole" \
    "aws iam create-role --role-name GitHubActionsRole --assume-role-policy-document file:///tmp/github-actions-trust-policy.json --description 'Role for GitHub Actions to deploy infrastructure'"

# Attach Terraform policy to the role
TERRAFORM_POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/TerraformPolicy"
run_command "Attaching TerraformPolicy to GitHubActionsRole" \
    "aws iam attach-role-policy --role-name GitHubActionsRole --policy-arn ${TERRAFORM_POLICY_ARN}"

# Create trust policy for EC2 instances (if needed)
cat > /tmp/ec2-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create EC2 role for applications
echo -e "\n${YELLOW}Step 3: Creating EC2 application role...${NC}"

run_command "Creating EC2ApplicationRole" \
    "aws iam create-role --role-name EC2ApplicationRole --assume-role-policy-document file:///tmp/ec2-trust-policy.json --description 'Role for EC2 instances running applications'"

# Create policy for EC2 applications
cat > /tmp/ec2-application-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "S3Access",
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::dpp-persona-media-*",
        "arn:aws:s3:::dpp-persona-media-*/*"
      ]
    },
    {
      "Sid": "SecretsManagerAccess",
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:*:*:secret:hibiji-*"
    },
    {
      "Sid": "CloudWatchLogsAccess",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogStreams"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
EOF

run_command "Creating EC2ApplicationPolicy" \
    "aws iam create-policy --policy-name EC2ApplicationPolicy --policy-document file:///tmp/ec2-application-policy.json --description 'Policy for EC2 instances running applications'"

EC2_POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/EC2ApplicationPolicy"
run_command "Attaching EC2ApplicationPolicy to EC2ApplicationRole" \
    "aws iam attach-role-policy --role-name EC2ApplicationRole --policy-arn ${EC2_POLICY_ARN}"

# Create instance profile for EC2
run_command "Creating instance profile for EC2ApplicationRole" \
    "aws iam create-instance-profile --instance-profile-name EC2ApplicationProfile"

run_command "Adding EC2ApplicationRole to instance profile" \
    "aws iam add-role-to-instance-profile --instance-profile-name EC2ApplicationProfile --role-name EC2ApplicationRole"

# Clean up temporary files
rm -f /tmp/github-actions-trust-policy.json /tmp/ec2-trust-policy.json /tmp/ec2-application-policy.json /tmp/github-actions-trust-policy.json.bak

# Verify the setup
echo -e "\n${YELLOW}Step 4: Verifying setup...${NC}"

echo -e "\n${BLUE}Created roles:${NC}"
aws iam list-roles --query 'Roles[?contains(RoleName, `GitHubActions`) || contains(RoleName, `EC2Application`)].{RoleName:RoleName,Arn:Arn}' --output table

echo -e "\n${BLUE}Created policies:${NC}"
aws iam list-policies --scope Local --query 'Policies[?contains(PolicyName, `EC2Application`)].{PolicyName:PolicyName,Arn:Arn}' --output table

echo -e "\n${BLUE}Instance profiles:${NC}"
aws iam list-instance-profiles --query 'InstanceProfiles[?contains(InstanceProfileName, `EC2Application`)].{InstanceProfileName:InstanceProfileName,Arn:Arn}' --output table

echo -e "\n${GREEN}🎉 IAM Roles setup completed successfully!${NC}"
echo -e "\n${BLUE}Summary:${NC}"
echo -e "  ✅ Created OIDC provider for GitHub Actions"
echo -e "  ✅ Created GitHubActionsRole for CI/CD"
echo -e "  ✅ Created EC2ApplicationRole for applications"
echo -e "  ✅ Created EC2ApplicationPolicy for application permissions"
echo -e "  ✅ Created EC2ApplicationProfile for EC2 instances"

echo -e "\n${YELLOW}Usage:${NC}"
echo -e "  • GitHub Actions: Use role ARN: arn:aws:iam::${ACCOUNT_ID}:role/GitHubActionsRole"
echo -e "  • EC2 Instances: Use instance profile: EC2ApplicationProfile"
echo -e "  • No more access keys needed for automation!"

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "  1. Update your GitHub Actions workflow to use the role"
echo -e "  2. Update your EC2 instances to use the instance profile"
echo -e "  3. Remove access keys from automation systems"
echo -e "  4. Test the new role-based authentication" 