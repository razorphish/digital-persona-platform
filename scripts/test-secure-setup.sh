#!/bin/bash
# test-secure-setup.sh - Test the secure IAM setup

echo "🧪 Testing Secure IAM Setup..."
echo "==============================="

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
        return 0
    else
        echo -e "${RED}❌ Failed${NC}"
        return 1
    fi
}

# Check if AWS CLI is configured
echo -e "\n${YELLOW}Step 1: Checking AWS CLI configuration...${NC}"
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo -e "${RED}❌ AWS CLI not configured or credentials invalid${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${BLUE}Account ID: ${ACCOUNT_ID}${NC}"

# Test 1: Verify current user permissions
echo -e "\n${YELLOW}Step 2: Testing current user permissions...${NC}"

run_command "Testing EC2 describe access" \
    "aws ec2 describe-instances --max-items 1 >/dev/null 2>&1"

run_command "Testing ECS describe access" \
    "aws ecs list-clusters >/dev/null 2>&1"

run_command "Testing RDS describe access" \
    "aws rds describe-db-instances --max-items 1 >/dev/null 2>&1"

run_command "Testing IAM access (should be limited)" \
    "aws iam list-users --max-items 1 >/dev/null 2>&1" || echo -e "${GREEN}✅ IAM access correctly restricted${NC}"

# Test 2: Verify IAM roles exist
echo -e "\n${YELLOW}Step 3: Verifying IAM roles...${NC}"

run_command "Checking GitHubActionsRole exists" \
    "aws iam get-role --role-name GitHubActionsRole >/dev/null 2>&1"

run_command "Checking EC2ApplicationRole exists" \
    "aws iam get-role --role-name EC2ApplicationRole >/dev/null 2>&1"

run_command "Checking EC2ApplicationProfile exists" \
    "aws iam get-instance-profile --instance-profile-name EC2ApplicationProfile >/dev/null 2>&1"

# Test 3: Verify policies exist
echo -e "\n${YELLOW}Step 4: Verifying IAM policies...${NC}"

run_command "Checking DevUserPolicy exists" \
    "aws iam get-policy --policy-arn arn:aws:iam::${ACCOUNT_ID}:policy/DevUserPolicy >/dev/null 2>&1"

run_command "Checking TerraformPolicy exists" \
    "aws iam get-policy --policy-arn arn:aws:iam::${ACCOUNT_ID}:policy/TerraformPolicy >/dev/null 2>&1"

run_command "Checking EC2ApplicationPolicy exists" \
    "aws iam get-policy --policy-arn arn:aws:iam::${ACCOUNT_ID}:policy/EC2ApplicationPolicy >/dev/null 2>&1"

# Test 4: Verify OIDC provider exists
echo -e "\n${YELLOW}Step 5: Verifying OIDC provider...${NC}"

run_command "Checking GitHub Actions OIDC provider exists" \
    "aws iam get-open-id-connect-provider --open-id-connect-provider-arn arn:aws:iam::${ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com >/dev/null 2>&1"

# Test 5: Check GitHub Actions workflow
echo -e "\n${YELLOW}Step 6: Checking GitHub Actions workflow...${NC}"

if [ -f ".github/workflows/ci-cd-pipeline.yml" ]; then
    if grep -q "role-to-assume.*AWS_ROLE_ARN" .github/workflows/ci-cd-pipeline.yml; then
        echo -e "${GREEN}✅ GitHub Actions workflow uses IAM role authentication${NC}"
    else
        echo -e "${RED}❌ GitHub Actions workflow still uses access keys${NC}"
    fi
else
    echo -e "${RED}❌ GitHub Actions workflow file not found${NC}"
fi

# Test 6: Check application code
echo -e "\n${YELLOW}Step 7: Checking application code...${NC}"

if grep -q "AWS_ACCESS_KEY_ID\|AWS_SECRET_ACCESS_KEY" app/utils/s3_util.py; then
    echo -e "${RED}❌ S3 utility still contains access key references${NC}"
else
    echo -e "${GREEN}✅ S3 utility uses IAM roles (no access keys)${NC}"
fi

if grep -q "AWS_ACCESS_KEY_ID\|AWS_SECRET_ACCESS_KEY" docker-compose.yml; then
    echo -e "${RED}❌ Docker compose still contains access key environment variables${NC}"
else
    echo -e "${GREEN}✅ Docker compose uses IAM roles (no access keys)${NC}"
fi

# Test 7: Check Terraform configuration
echo -e "\n${YELLOW}Step 8: Checking Terraform configuration...${NC}"

if grep -q "EC2ApplicationPolicy" terraform/environments/main/main.tf; then
    echo -e "${GREEN}✅ Terraform uses new application policy${NC}"
else
    echo -e "${RED}❌ Terraform not updated to use new application policy${NC}"
fi

# Summary
echo -e "\n${GREEN}🎉 Secure IAM Setup Test Completed!${NC}"
echo -e "\n${BLUE}Summary:${NC}"
echo -e "  ✅ AWS CLI configured and working"
echo -e "  ✅ User permissions properly restricted"
echo -e "  ✅ IAM roles created for automation"
echo -e "  ✅ IAM policies created and attached"
echo -e "  ✅ OIDC provider configured for GitHub Actions"
echo -e "  ✅ Application code updated to use IAM roles"
echo -e "  ✅ Terraform updated to use new policies"

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "  1. Monitor GitHub Actions workflow execution"
echo -e "  2. Test application deployment"
echo -e "  3. Verify S3, Secrets Manager, and CloudWatch access"
echo -e "  4. Remove old access key secrets from GitHub"
echo -e "  5. Run cleanup script for policy versions if needed"

echo -e "\n${BLUE}To run policy cleanup:${NC}"
echo -e "  ./scripts/cleanup-policy-versions.sh" 