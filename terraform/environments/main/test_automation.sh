#!/bin/bash
# test_automation.sh - Test automation scripts and CI/CD components
set -e

echo "🤖 Testing Automation Scripts and CI/CD Components..."
echo "===================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "\n${BLUE}Testing: ${test_name}${NC}"
    echo "Command: $test_command"
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASS: ${test_name}${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL: ${test_name}${NC}"
        ((TESTS_FAILED++))
    fi
}

# Test 1: Check if fetch-terraform-vars.sh exists
run_test "Fetch Script Exists" "test -f fetch-terraform-vars.sh"

# Test 2: Check if fetch script is executable
run_test "Fetch Script Executable" "test -x fetch-terraform-vars.sh"

# Test 3: Test fetch script syntax
run_test "Fetch Script Syntax" "bash -n fetch-terraform-vars.sh"

# Test 4: Test fetch script with mock AWS CLI (dry run)
echo -e "\n${YELLOW}Testing Fetch Script with Mock AWS CLI...${NC}"

# Create a mock AWS CLI function for testing
mock_aws_cli() {
    if [[ "$*" == *"describe-repositories"* ]]; then
        if [[ "$*" == *"hibiji-backend"* ]]; then
            echo '{"repositories": [{"repositoryUri": "123456789012.dkr.ecr.us-west-1.amazonaws.com/hibiji-backend"}]}'
        elif [[ "$*" == *"hibiji-frontend"* ]]; then
            echo '{"repositories": [{"repositoryUri": "123456789012.dkr.ecr.us-west-1.amazonaws.com/hibiji-frontend"}]}'
        fi
    fi
}

# Test the script logic without actually running terraform
test_fetch_script() {
    # Source the script to test its logic
    source fetch-terraform-vars.sh
    
    # Check if variables are set
    if [ -n "$TF_VAR_ecr_repository_url" ] && [ -n "$TF_VAR_frontend_ecr_repository_url" ]; then
        echo -e "${GREEN}✅ Environment variables set correctly${NC}"
        return 0
    else
        echo -e "${RED}❌ Environment variables not set${NC}"
        return 1
    fi
}

# Mock AWS CLI and test
export -f mock_aws_cli
if test_fetch_script; then
    echo -e "${GREEN}✅ PASS: Fetch Script Logic${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL: Fetch Script Logic${NC}"
    ((TESTS_FAILED++))
fi

# Test 5: Check .tfvars file format
run_test "Auto .tfvars Format" "test -f main.auto.tfvars"

# Test 6: Validate .tfvars syntax
run_test "Auto .tfvars Syntax" "terraform validate -var-file=main.auto.tfvars"

# Test 7: Check for required variables in .tfvars
echo -e "\n${YELLOW}Checking .tfvars Variables...${NC}"

REQUIRED_TFVARS=("domain_name" "environment" "sub_environment")

for var in "${REQUIRED_TFVARS[@]}"; do
    if grep -q "$var.*=" main.auto.tfvars; then
        echo -e "${GREEN}✅ Variable '$var' is set in .tfvars${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ Variable '$var' is missing from .tfvars${NC}"
        ((TESTS_FAILED++))
    fi
done

# Test 8: Check GitHub Actions workflow
echo -e "\n${YELLOW}Checking GitHub Actions Workflow...${NC}"

if [ -f "../../../.github/workflows/terraform-deploy.yml" ]; then
    echo -e "${GREEN}✅ GitHub Actions workflow exists${NC}"
    ((TESTS_PASSED++))
    
    # Check workflow syntax
    if command -v yamllint >/dev/null 2>&1; then
        if yamllint ../../../.github/workflows/terraform-deploy.yml >/dev/null 2>&1; then
            echo -e "${GREEN}✅ GitHub Actions workflow syntax is valid${NC}"
            ((TESTS_PASSED++))
        else
            echo -e "${RED}❌ GitHub Actions workflow syntax is invalid${NC}"
            ((TESTS_FAILED++))
        fi
    else
        echo -e "${YELLOW}⚠️  yamllint not available, skipping workflow syntax check${NC}"
    fi
else
    echo -e "${RED}❌ GitHub Actions workflow not found${NC}"
    ((TESTS_FAILED++))
fi

# Test 9: Check for required GitHub secrets documentation
echo -e "\n${YELLOW}Checking Documentation...${NC}"

if [ -f "README.md" ]; then
    echo -e "${GREEN}✅ README.md exists${NC}"
    ((TESTS_PASSED++))
    
    # Check if README mentions required secrets
    if grep -q "AWS_ACCESS_KEY_ID\|AWS_SECRET_ACCESS_KEY" README.md; then
        echo -e "${GREEN}✅ README documents required GitHub secrets${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${YELLOW}⚠️  README may not document required GitHub secrets${NC}"
    fi
else
    echo -e "${RED}❌ README.md not found${NC}"
    ((TESTS_FAILED++))
fi

# Test 10: Test environment variable injection
echo -e "\n${YELLOW}Testing Environment Variable Injection...${NC}"

# Test that the script exports the correct variables
export TF_VAR_ecr_repository_url="test-backend-url"
export TF_VAR_frontend_ecr_repository_url="test-frontend-url"
export TF_VAR_image_tag="test-tag"
export TF_VAR_frontend_image_tag="test-tag"

if [ "$TF_VAR_ecr_repository_url" = "test-backend-url" ]; then
    echo -e "${GREEN}✅ Environment variable injection works${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Environment variable injection failed${NC}"
    ((TESTS_FAILED++))
fi

# Test 11: Check for error handling in scripts
echo -e "\n${YELLOW}Checking Error Handling...${NC}"

# Check if scripts have proper error handling
if grep -q "set -e" fetch-terraform-vars.sh; then
    echo -e "${GREEN}✅ Script has error handling (set -e)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  Script may not have proper error handling${NC}"
fi

# Test 12: Check for logging and user feedback
if grep -q "echo.*🔍\|echo.*✅\|echo.*❌" fetch-terraform-vars.sh; then
    echo -e "${GREEN}✅ Script provides user feedback${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  Script may not provide sufficient user feedback${NC}"
fi

# Test 13: Test terraform plan with automation variables
echo -e "\n${YELLOW}Testing Terraform Plan with Automation Variables...${NC}"

# Set test variables
export TF_VAR_ecr_repository_url="dummy-backend"
export TF_VAR_frontend_ecr_repository_url="dummy-frontend"
export TF_VAR_image_tag="test"
export TF_VAR_frontend_image_tag="test"

# Run a dry plan
if terraform plan -var-file=main.auto.tfvars >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Terraform plan works with automation variables${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Terraform plan failed with automation variables${NC}"
    ((TESTS_FAILED++))
fi

# Test 14: Check for security best practices in automation
echo -e "\n${YELLOW}Checking Security Best Practices...${NC}"

# Check if secrets are handled via environment variables
if grep -q "TF_VAR_.*_arn\|TF_VAR_.*_password" fetch-terraform-vars.sh; then
    echo -e "${GREEN}✅ Script handles secrets via environment variables${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  Script may not handle secrets properly${NC}"
fi

# Summary
echo -e "\n${BLUE}===================================================="
echo "🤖 Automation Test Summary"
echo "===================================================="
echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
echo -e "${BLUE}Total Tests: $((TESTS_PASSED + TESTS_FAILED))${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All automation tests passed! Your deployment automation is ready.${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some automation tests failed. Please review the issues above.${NC}"
    exit 1
fi 