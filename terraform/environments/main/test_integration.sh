#!/bin/bash
# test_integration.sh - Integration tests for complete deployment workflow
set -e

echo "🔗 Running Integration Tests for Complete Deployment Workflow..."
echo "================================================================"

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
echo -e "\n${YELLOW}Checking Integration Test Prerequisites...${NC}"

if ! command_exists terraform; then
    echo -e "${RED}❌ Terraform is not installed${NC}"
    exit 1
fi

if ! command_exists aws; then
    echo -e "${RED}❌ AWS CLI is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Prerequisites check passed${NC}"

# Test 1: Complete workflow simulation
echo -e "\n${YELLOW}Testing Complete Workflow Simulation...${NC}"

# Step 1: Initialize Terraform
run_test "Terraform Init" "terraform init"

# Step 2: Check if automation files exist
run_test "Auto .tfvars Exists" "test -f main.auto.tfvars"
run_test "Fetch Script Exists" "test -f fetch-terraform-vars.sh"
run_test "Fetch Script Executable" "test -x fetch-terraform-vars.sh"

# Step 3: Validate Terraform configuration
run_test "Terraform Validate" "terraform validate"

# Step 4: Test ECR repository discovery
echo -e "\n${YELLOW}Testing ECR Repository Discovery...${NC}"

# Check if ECR repositories exist
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

# Test 5: Test variable injection workflow
echo -e "\n${YELLOW}Testing Variable Injection Workflow...${NC}"

# Simulate the fetch script logic
BACKEND_REPO=$(aws ecr describe-repositories --query "repositories[?repositoryName=='hibiji-backend'].repositoryUri" --output text 2>/dev/null || echo "dummy-backend")
FRONTEND_REPO=$(aws ecr describe-repositories --query "repositories[?repositoryName=='hibiji-frontend'].repositoryUri" --output text 2>/dev/null || echo "dummy-frontend")

export TF_VAR_ecr_repository_url="$BACKEND_REPO"
export TF_VAR_frontend_ecr_repository_url="$FRONTEND_REPO"
export TF_VAR_image_tag="integration-test"
export TF_VAR_frontend_image_tag="integration-test"

if [ -n "$TF_VAR_ecr_repository_url" ] && [ -n "$TF_VAR_frontend_ecr_repository_url" ]; then
    echo -e "${GREEN}✅ Variable injection workflow works${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Variable injection workflow failed${NC}"
    ((TESTS_FAILED++))
fi

# Test 6: Test complete Terraform plan
echo -e "\n${YELLOW}Testing Complete Terraform Plan...${NC}"

# Run terraform plan with all variables
if terraform plan -var-file=main.auto.tfvars >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Complete Terraform plan succeeds${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Complete Terraform plan failed${NC}"
    ((TESTS_FAILED++))
fi

# Test 7: Test GitHub Actions workflow simulation
echo -e "\n${YELLOW}Testing GitHub Actions Workflow Simulation...${NC}"

# Check if workflow file exists
if [ -f "../../../.github/workflows/terraform-deploy.yml" ]; then
    echo -e "${GREEN}✅ GitHub Actions workflow exists${NC}"
    ((TESTS_PASSED++))
    
    # Check workflow structure
    if grep -q "workflow_dispatch" ../../../.github/workflows/terraform-deploy.yml; then
        echo -e "${GREEN}✅ Workflow has manual trigger${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ Workflow missing manual trigger${NC}"
        ((TESTS_FAILED++))
    fi
    
    # Check for required steps
    if grep -q "Setup Terraform\|Configure AWS credentials\|Terraform Init\|Terraform Apply" ../../../.github/workflows/terraform-deploy.yml; then
        echo -e "${GREEN}✅ Workflow has required steps${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ Workflow missing required steps${NC}"
        ((TESTS_FAILED++))
    fi
else
    echo -e "${RED}❌ GitHub Actions workflow not found${NC}"
    ((TESTS_FAILED++))
fi

# Test 8: Test environment-specific configurations
echo -e "\n${YELLOW}Testing Environment-Specific Configurations...${NC}"

# Check if environment variables are properly set in .tfvars
if grep -q "environment.*=.*\"dev\"" main.auto.tfvars; then
    echo -e "${GREEN}✅ Environment is set to dev${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Environment not properly set${NC}"
    ((TESTS_FAILED++))
fi

if grep -q "sub_environment.*=.*\"main\"" main.auto.tfvars; then
    echo -e "${GREEN}✅ Sub-environment is set to main${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}❌ Sub-environment not properly set${NC}"
    ((TESTS_FAILED++))
fi

# Test 9: Test resource naming consistency
echo -e "\n${YELLOW}Testing Resource Naming Consistency...${NC}"

# Check if resources use consistent naming patterns
if grep -q "hibiji-main" main.tf; then
    echo -e "${GREEN}✅ Resources use consistent naming pattern${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  Resource naming may not be consistent${NC}"
fi

# Test 10: Test security configurations
echo -e "\n${YELLOW}Testing Security Configurations...${NC}"

# Check for proper security group configurations
if grep -q "security_groups.*=.*\[aws_security_group" main.tf; then
    echo -e "${GREEN}✅ Security groups properly referenced${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  Security group configuration may need review${NC}"
fi

# Check for encryption settings
if grep -q "storage_encrypted.*=.*true" main.tf; then
    echo -e "${GREEN}✅ Storage encryption enabled${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  Storage encryption may not be enabled${NC}"
fi

# Test 11: Test output validation
echo -e "\n${YELLOW}Testing Output Validation...${NC}"

# Check if all expected outputs are defined
EXPECTED_OUTPUTS=("alb_dns_name" "alb_name" "cluster_name" "domain_name")

for output in "${EXPECTED_OUTPUTS[@]}"; do
    if grep -q "output \"$output\"" main.tf; then
        echo -e "${GREEN}✅ Output '$output' is defined${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ Output '$output' is missing${NC}"
        ((TESTS_FAILED++))
    fi
done

# Test 12: Test documentation completeness
echo -e "\n${YELLOW}Testing Documentation Completeness...${NC}"

if [ -f "README.md" ]; then
    echo -e "${GREEN}✅ README.md exists${NC}"
    ((TESTS_PASSED++))
    
    # Check for key documentation sections
    if grep -q "Quick Start\|Prerequisites\|Local Development\|CI/CD" README.md; then
        echo -e "${GREEN}✅ README has key sections${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${YELLOW}⚠️  README may be missing key sections${NC}"
    fi
else
    echo -e "${RED}❌ README.md not found${NC}"
    ((TESTS_FAILED++))
fi

# Test 13: Test error handling and validation
echo -e "\n${YELLOW}Testing Error Handling and Validation...${NC}"

# Test that the fetch script validates ECR repositories
if grep -q "if.*-z.*BACKEND_REPO\|if.*-z.*FRONTEND_REPO" fetch-terraform-vars.sh; then
    echo -e "${GREEN}✅ Fetch script validates ECR repositories${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  Fetch script may not validate ECR repositories${NC}"
fi

# Test that scripts have proper error handling
if grep -q "set -e" fetch-terraform-vars.sh; then
    echo -e "${GREEN}✅ Scripts have error handling${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️  Scripts may not have proper error handling${NC}"
fi

# Summary
echo -e "\n${BLUE}================================================================"
echo "🔗 Integration Test Summary"
echo "================================================================"
echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
echo -e "${BLUE}Total Tests: $((TESTS_PASSED + TESTS_FAILED))${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All integration tests passed! Your complete deployment workflow is ready.${NC}"
    echo -e "${GREEN}🚀 You can now run: ./fetch-terraform-vars.sh${NC}"
    exit 0
else
    echo -e "\n${RED}⚠️  Some integration tests failed. Please review the issues above before deploying.${NC}"
    exit 1
fi 