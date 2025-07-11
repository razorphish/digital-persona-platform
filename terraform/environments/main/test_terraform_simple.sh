#!/bin/bash
# test_terraform_simple.sh - Simplified Terraform testing script
set -e

echo "🧪 Starting Simplified Terraform Configuration Tests..."
echo "========================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

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
echo -e "\n${BLUE}Testing: Terraform Version${NC}"
if terraform version >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS: Terraform Version${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL: Terraform Version${NC}"
    ((TESTS_FAILED++))
fi

# Test 2: Terraform format check
echo -e "\n${BLUE}Testing: Terraform Format${NC}"
if terraform fmt -check -recursive >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS: Terraform Format${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL: Terraform Format${NC}"
    ((TESTS_FAILED++))
fi

# Test 3: Terraform validate
echo -e "\n${BLUE}Testing: Terraform Validate${NC}"
if terraform validate >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS: Terraform Validate${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL: Terraform Validate${NC}"
    ((TESTS_FAILED++))
fi

# Test 4: Check if .tfvars file exists
echo -e "\n${BLUE}Testing: Auto .tfvars File Exists${NC}"
if test -f main.auto.tfvars; then
    echo -e "${GREEN}✅ PASS: Auto .tfvars File Exists${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL: Auto .tfvars File Exists${NC}"
    ((TESTS_FAILED++))
fi

# Test 5: Validate .tfvars syntax
echo -e "\n${BLUE}Testing: Auto .tfvars Syntax${NC}"
if terraform validate >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS: Auto .tfvars Syntax${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL: Auto .tfvars Syntax${NC}"
    ((TESTS_FAILED++))
fi

# Test 6: Check if fetch script exists and is executable
echo -e "\n${BLUE}Testing: Fetch Script Exists${NC}"
if test -f fetch-terraform-vars.sh; then
    echo -e "${GREEN}✅ PASS: Fetch Script Exists${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL: Fetch Script Exists${NC}"
    ((TESTS_FAILED++))
fi

echo -e "\n${BLUE}Testing: Fetch Script Executable${NC}"
if test -x fetch-terraform-vars.sh; then
    echo -e "${GREEN}✅ PASS: Fetch Script Executable${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL: Fetch Script Executable${NC}"
    ((TESTS_FAILED++))
fi

# Test 7: Test fetch script syntax
echo -e "\n${BLUE}Testing: Fetch Script Syntax${NC}"
if bash -n fetch-terraform-vars.sh >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS: Fetch Script Syntax${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL: Fetch Script Syntax${NC}"
    ((TESTS_FAILED++))
fi

# Test 8: Check AWS credentials
echo -e "\n${BLUE}Testing: AWS Credentials${NC}"
if aws sts get-caller-identity >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS: AWS Credentials${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL: AWS Credentials${NC}"
    ((TESTS_FAILED++))
fi

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
echo -e "\n${BLUE}Testing: Terraform Init${NC}"
if terraform init >/dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS: Terraform Init${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ FAIL: Terraform Init${NC}"
    ((TESTS_FAILED++))
fi

# Test 11: Check for required variables
echo -e "\n${YELLOW}Checking Required Variables...${NC}"

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

# Test 12: Check for outputs
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

# Test 13: Check for security best practices
echo -e "\n${YELLOW}Checking Security Best Practices...${NC}"

# Check for hardcoded secrets
if grep -q "password.*=.*\".*\"" main.tf; then
    echo -e "${RED}❌ Hardcoded password found in main.tf${NC}"
    ((TESTS_FAILED++))
else
    echo -e "${GREEN}✅ No hardcoded passwords found${NC}"
    ((TESTS_PASSED++))
fi

# Test 14: Check for proper tagging
echo -e "\n${YELLOW}Checking Resource Tagging...${NC}"

if grep -q "tags.*=.*local\.common_tags" main.tf; then
    echo -e "${GREEN}✅ Resources use common tags${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  Some resources may not use common tags${NC}"
fi

# Test 15: Check for proper state management
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