#!/bin/bash
# test-s3-permissions.sh - Test S3 permissions for GitHub Actions role
set -e

echo "🧪 Testing S3 permissions for GitHub Actions role..."
echo "===================================================="

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
    if eval "$command" >/dev/null 2>&1; then
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

# Test S3 bucket access
echo -e "\n${YELLOW}Testing S3 bucket access...${NC}"

run_command "Testing s3:ListBucket on hibiji-terraform-state" \
    "aws s3 ls s3://hibiji-terraform-state/"

run_command "Testing s3:GetObject on terraform state file" \
    "aws s3 cp s3://hibiji-terraform-state/main/terraform.tfstate /tmp/test-state.json"

# Clean up test file
rm -f /tmp/test-state.json

echo -e "\n${GREEN}🎉 S3 permissions test completed!${NC}"
echo -e "\n${BLUE}Summary:${NC}"
echo -e "  ✅ S3 bucket listing works"
echo -e "  ✅ S3 object retrieval works"
echo -e "  ✅ GitHub Actions should now be able to access Terraform state"

echo -e "\n${YELLOW}The GitHub Actions workflow should now work without permission errors.${NC}" 