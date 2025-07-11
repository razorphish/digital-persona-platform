#!/bin/bash
# apply-iam-security.sh - Apply restrictive IAM policies for better security
set -e

echo "🔒 Applying IAM Security Improvements..."
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

# Step 1: Create the new policies
echo -e "\n${YELLOW}Step 1: Creating new IAM policies...${NC}"

run_command "Creating DevUserPolicy" \
    "aws iam create-policy --policy-name DevUserPolicy --policy-document file://terraform/iam-policies/dev-user-policy.json --description 'Restrictive policy for dev-airica user based on actual usage'"

run_command "Creating TerraformPolicy" \
    "aws iam create-policy --policy-name TerraformPolicy --policy-document file://terraform/iam-policies/terraform-policy.json --description 'Policy for Terraform infrastructure management'"

# Step 2: Get policy ARNs
echo -e "\n${YELLOW}Step 2: Getting policy ARNs...${NC}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
DEV_POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/DevUserPolicy"
TERRAFORM_POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/TerraformPolicy"

echo -e "${BLUE}Account ID: ${ACCOUNT_ID}${NC}"
echo -e "${BLUE}DevUserPolicy ARN: ${DEV_POLICY_ARN}${NC}"
echo -e "${BLUE}TerraformPolicy ARN: ${TERRAFORM_POLICY_ARN}${NC}"

# Step 3: Attach new policies to user
echo -e "\n${YELLOW}Step 3: Attaching new policies to dev-airica user...${NC}"

run_command "Attaching DevUserPolicy to dev-airica" \
    "aws iam attach-user-policy --user-name dev-airica --policy-arn ${DEV_POLICY_ARN}"

run_command "Attaching TerraformPolicy to dev-airica" \
    "aws iam attach-user-policy --user-name dev-airica --policy-arn ${TERRAFORM_POLICY_ARN}"

# Step 4: Remove broad policies (with confirmation)
echo -e "\n${YELLOW}Step 4: Removing broad policies...${NC}"
echo -e "${RED}⚠️  WARNING: This will remove IAMFullAccess, PowerUserAccess, and Billing policies${NC}"
echo -e "${YELLOW}This will restrict your permissions significantly.${NC}"
read -p "Do you want to proceed? (y/N): " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Removing broad policies...${NC}"
    
    # Remove from developers group
    run_command "Removing IAMFullAccess from developers group" \
        "aws iam detach-group-policy --group-name developers --policy-arn arn:aws:iam::aws:policy/IAMFullAccess"
    
    run_command "Removing PowerUserAccess from developers group" \
        "aws iam detach-group-policy --group-name developers --policy-arn arn:aws:iam::aws:policy/PowerUserAccess"
    
    run_command "Removing Billing from developers group" \
        "aws iam detach-group-policy --group-name developers --policy-arn arn:aws:iam::aws:policy/job-function/Billing"
    
    echo -e "${GREEN}✅ Broad policies removed${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping removal of broad policies${NC}"
    echo -e "${YELLOW}You can remove them manually later if needed${NC}"
fi

# Step 5: Verify the changes
echo -e "\n${YELLOW}Step 5: Verifying changes...${NC}"

echo -e "\n${BLUE}Current policies attached to dev-airica:${NC}"
aws iam list-attached-user-policies --user-name dev-airica --output table

echo -e "\n${BLUE}Current policies attached to developers group:${NC}"
aws iam list-attached-group-policies --group-name developers --output table

# Step 6: Test permissions
echo -e "\n${YELLOW}Step 6: Testing permissions...${NC}"

run_command "Testing EC2 describe access" \
    "aws ec2 describe-instances --max-items 1 >/dev/null 2>&1"

run_command "Testing ECS describe access" \
    "aws ecs list-clusters >/dev/null 2>&1"

run_command "Testing RDS describe access" \
    "aws rds describe-db-instances --max-items 1 >/dev/null 2>&1"

echo -e "\n${GREEN}🎉 IAM Security improvements applied successfully!${NC}"
echo -e "\n${BLUE}Summary:${NC}"
echo -e "  ✅ Created DevUserPolicy (read-only access based on actual usage)"
echo -e "  ✅ Created TerraformPolicy (infrastructure management)"
echo -e "  ✅ Attached new policies to dev-airica user"
echo -e "  ✅ Tested permissions"

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "  ✅ Removed broad policies (IAMFullAccess, PowerUserAccess, Billing)"
else
    echo -e "  ⚠️  Broad policies still attached (remove manually if needed)"
fi

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "  1. Test your Terraform operations"
echo -e "  2. If you encounter permission issues, you can temporarily re-attach broad policies"
echo -e "  3. Consider creating IAM roles for automation instead of access keys"
echo -e "  4. Enable MFA on your IAM user" 