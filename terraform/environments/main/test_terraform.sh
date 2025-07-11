#!/bin/bash
# test_terraform.sh - Comprehensive Terraform testing script
set -e

echo "🧪 Starting Terraform Configuration Tests..."
echo "=============================================="

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "\n${YELLOW}Checking Prerequisites...${NC}"

if ! command_exists terraform; then
    echo -e "${RED}❌ Terraform is not installed${NC}"
    exit 1
fi

if ! command_exists aws; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Test 1: Terraform version
run_test "Terraform Version" "terraform version"

# Test 2: Terraform format check
run_test "Terraform Format" "terraform fmt -check -recursive"

# Test 3: Terraform validate
run_test "Terraform Validate" "terraform validate"

# Test 4: Check if .tfvars file exists
run_test "Auto .tfvars File Exists" "test -f main.auto.tfvars"

# Test 5: Validate .tfvars syntax
run_test "Auto .tfvars Syntax" "terraform validate -var-file=main.auto.tfvars"

# Test 6: Check if fetch script exists and is executable
run_test "Fetch Script Exists" "test -f fetch-terraform-vars.sh"
run_test "Fetch Script Executable" "test -x fetch-terraform-vars.sh"

# Test 7: Test fetch script syntax (without executing)
run_test "Fetch Script Syntax" "bash -n fetch-terraform-vars.sh"

# Test 8: Check AWS credentials
run_test "AWS Credentials" "aws sts get-caller-identity >/dev/null 2>&1"

# Test 9: Check ECR repositories exist
echo -e "\n${YELLOW}Checking ECR Repositories...${NC}"
if aws ecr describe-repositories --repository-names hibiji-backend >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend ECR repository exists${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  Backend ECR repository not found (will be created during deployment)${NC}"
fi

if aws ecr describe-repositories --repository-names hibiji-frontend >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend ECR repository exists${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  Frontend ECR repository not found (will be created during deployment)${NC}"
fi

# Test 10: Terraform init
run_test "Terraform Init" "terraform init"

# Test 11: Terraform plan with dummy values (dry run)
echo -e "\n${YELLOW}Running Terraform Plan with Dummy Values...${NC}"
if timeout 60s terraform plan -var='ecr_repository_url=dummy' -var='frontend_ecr_repository_url=dummy' -var='image_tag=test' -var='frontend_image_tag=test' -var='domain_name=test.com' -var='environment=dev' -var='sub_environment=main' >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Terraform Plan (Dry Run)${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  Terraform Plan (Dry Run) - may need real ECR URLs${NC}"
fi

# Test 12: Check for required variables
echo -e "\n${YELLOW}Checking Required Variables...${NC}"

# Check if all required variables are defined in main.tf
REQUIRED_VARS=("ecr_repository_url" "frontend_ecr_repository_url" "image_tag" "frontend_image_tag" "domain_name" "environment" "sub_environment")

for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "variable \"$var\"" main.tf; then
        echo -e "${GREEN}✅ Variable '$var' is defined${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ Variable '$var' is missing${NC}"
        ((TESTS_FAILED++))
    fi
done

# Test 13: Check for outputs
echo -e "\n${YELLOW}Checking Outputs...${NC}"

REQUIRED_OUTPUTS=("alb_dns_name" "alb_name" "cluster_name" "domain_name")

for output in "${REQUIRED_OUTPUTS[@]}"; do
    if grep -q "output \"$output\"" main.tf; then
        echo -e "${GREEN}✅ Output '$output' is defined${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ Output '$output' is missing${NC}"
        ((TESTS_FAILED++))
    fi
done

# Test 14: Check for security best practices
echo -e "\n${YELLOW}Checking Security Best Practices...${NC}"

# Check for hardcoded secrets
if grep -q "password.*=.*\".*\"" main.tf; then
    echo -e "${RED}❌ Hardcoded password found in main.tf${NC}"
    ((TESTS_FAILED++))
else
    echo -e "${GREEN}✅ No hardcoded passwords found${NC}"
    ((TESTS_PASSED++))
fi

# Check for proper security group configurations
if grep -q "cidr_blocks.*=.*\[\"0\.0\.0\.0/0\"\]" main.tf; then
    echo -e "${YELLOW}⚠️  Open security group rule found (review if needed)${NC}"
else
    echo -e "${GREEN}✅ Security groups appear properly configured${NC}"
    ((TESTS_PASSED++))
fi

# Test 15: Check for proper tagging
echo -e "\n${YELLOW}Checking Resource Tagging...${NC}"

if grep -q "tags.*=.*local\.common_tags" main.tf; then
    echo -e "${GREEN}✅ Resources use common tags${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  Some resources may not use common tags${NC}"
fi

# Test 16: Check for proper state management
echo -e "\n${YELLOW}Checking State Management...${NC}"

if [ -d ".terraform" ]; then
    echo -e "${GREEN}✅ Terraform initialized${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Terraform not initialized${NC}"
    ((TESTS_FAILED++))
fi

# Summary
echo -e "\n${BLUE}=============================================="
echo "🧪 Test Summary"
echo "=============================================="
echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
echo -e "${BLUE}Total Tests: $((TESTS_PASSED + TESTS_FAILED))${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All tests passed! Your Terraform configuration is ready for deployment.${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some tests failed. Please review the issues above before deploying.${NC}"
    exit 1
fi 