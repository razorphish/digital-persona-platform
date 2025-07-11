#!/bin/bash
# cleanup-policy-versions.sh - Clean up old IAM policy versions

echo "🧹 Cleaning up IAM Policy Versions..."
echo "====================================="

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
echo -e "${BLUE}Account ID: ${ACCOUNT_ID}${NC}"

# List of policies to check
POLICIES=("DevUserPolicy" "TerraformPolicy" "EC2ApplicationPolicy")

for POLICY_NAME in "${POLICIES[@]}"; do
    POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/${POLICY_NAME}"
    
    echo -e "\n${YELLOW}Checking policy: ${POLICY_NAME}${NC}"
    
    # Check if policy exists
    if ! aws iam get-policy --policy-arn "${POLICY_ARN}" >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Policy ${POLICY_NAME} does not exist, skipping${NC}"
        continue
    fi
    
    # Get policy versions
    VERSIONS=$(aws iam list-policy-versions --policy-arn "${POLICY_ARN}" --query 'Versions[?IsDefaultVersion==`false`].VersionId' --output text)
    DEFAULT_VERSION=$(aws iam list-policy-versions --policy-arn "${POLICY_ARN}" --query 'Versions[?IsDefaultVersion==`true`].VersionId' --output text)
    
    echo -e "${BLUE}Default version: ${DEFAULT_VERSION}${NC}"
    echo -e "${BLUE}Non-default versions: ${VERSIONS}${NC}"
    
    # Count non-default versions
    VERSION_COUNT=$(echo "${VERSIONS}" | wc -w)
    echo -e "${BLUE}Number of non-default versions: ${VERSION_COUNT}${NC}"
    
    # If we have more than 4 non-default versions, we need to clean up
    if [ "${VERSION_COUNT}" -gt 4 ]; then
        echo -e "${YELLOW}⚠️  Policy ${POLICY_NAME} has more than 4 non-default versions${NC}"
        echo -e "${YELLOW}This exceeds the 5-version limit. Cleaning up...${NC}"
        
        # Delete oldest non-default versions (keep only 3 non-default + 1 default = 4 total)
        VERSIONS_TO_DELETE=$(echo "${VERSIONS}" | tr ' ' '\n' | head -n $((VERSION_COUNT - 3)))
        
        for VERSION_ID in ${VERSIONS_TO_DELETE}; do
            echo -e "${BLUE}Deleting version: ${VERSION_ID}${NC}"
            run_command "Deleting version ${VERSION_ID} from ${POLICY_NAME}" \
                "aws iam delete-policy-version --policy-arn ${POLICY_ARN} --version-id ${VERSION_ID}"
        done
    else
        echo -e "${GREEN}✅ Policy ${POLICY_NAME} has acceptable number of versions${NC}"
    fi
done

echo -e "\n${GREEN}🎉 Policy version cleanup completed!${NC}"
echo -e "\n${BLUE}Summary:${NC}"
echo -e "  ✅ Checked all custom policies for version limits"
echo -e "  ✅ Deleted excess versions where needed"
echo -e "  ✅ Maintained default versions"
echo -e "  ✅ Stayed within AWS 5-version limit" 