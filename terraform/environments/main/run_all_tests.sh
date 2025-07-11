#!/bin/bash
# run_all_tests.sh - Master test script that runs all test suites
set -e

echo "🧪 Running All Test Suites for Terraform Deployment..."
echo "======================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Test suite results
TERRAFORM_TESTS_PASSED=0
TERRAFORM_TESTS_FAILED=0
AUTOMATION_TESTS_PASSED=0
AUTOMATION_TESTS_FAILED=0
INTEGRATION_TESTS_PASSED=0
INTEGRATION_TESTS_FAILED=0

# Function to run a test suite
run_test_suite() {
    local suite_name="$1"
    local script_name="$2"
    local color="$3"
    
    echo -e "\n${color}======================================================"
    echo -e "🧪 Running $suite_name Test Suite..."
    echo -e "======================================================"
    
    if [ -f "$script_name" ] && [ -x "$script_name" ]; then
        # Capture the exit code and output
        if ./"$script_name" 2>&1; then
            echo -e "\n${GREEN}✅ $suite_name Test Suite: PASSED${NC}"
            case "$suite_name" in
                "Terraform Configuration")
                    TERRAFORM_TESTS_PASSED=1
                    ;;
                "Automation Scripts")
                    AUTOMATION_TESTS_PASSED=1
                    ;;
                "Integration")
                    INTEGRATION_TESTS_PASSED=1
                    ;;
            esac
        else
            echo -e "\n${RED}❌ $suite_name Test Suite: FAILED${NC}"
            case "$suite_name" in
                "Terraform Configuration")
                    TERRAFORM_TESTS_FAILED=1
                    ;;
                "Automation Scripts")
                    AUTOMATION_TESTS_FAILED=1
                    ;;
                "Integration")
                    INTEGRATION_TESTS_FAILED=1
                    ;;
            esac
        fi
    else
        echo -e "\n${RED}❌ Test script $script_name not found or not executable${NC}"
        case "$suite_name" in
            "Terraform Configuration")
                TERRAFORM_TESTS_FAILED=1
                ;;
            "Automation Scripts")
                AUTOMATION_TESTS_FAILED=1
                ;;
            "Integration")
                INTEGRATION_TESTS_FAILED=1
                ;;
        esac
    fi
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "\n${YELLOW}Checking Test Prerequisites...${NC}"
    
    local missing_tools=()
    
    if ! command -v terraform >/dev/null 2>&1; then
        missing_tools+=("terraform")
    fi
    
    if ! command -v aws >/dev/null 2>&1; then
        missing_tools+=("aws")
    fi
    
    if ! command -v bash >/dev/null 2>&1; then
        missing_tools+=("bash")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        echo -e "${RED}❌ Missing required tools: ${missing_tools[*]}${NC}"
        echo -e "${YELLOW}Please install the missing tools before running tests.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All prerequisites are available${NC}"
}

# Check prerequisites first
check_prerequisites

# Run all test suites
run_test_suite "Terraform Configuration" "test_terraform.sh" "$BLUE"
run_test_suite "Automation Scripts" "test_automation.sh" "$PURPLE"
run_test_suite "Integration" "test_integration.sh" "$GREEN"

# Calculate overall results
TOTAL_SUITES=3
PASSED_SUITES=$((TERRAFORM_TESTS_PASSED + AUTOMATION_TESTS_PASSED + INTEGRATION_TESTS_PASSED))
FAILED_SUITES=$((TERRAFORM_TESTS_FAILED + AUTOMATION_TESTS_FAILED + INTEGRATION_TESTS_FAILED))

# Final summary
echo -e "\n${BLUE}======================================================"
echo -e "🎯 COMPREHENSIVE TEST SUMMARY"
echo -e "======================================================"

echo -e "\n${YELLOW}Test Suite Results:${NC}"
echo -e "  ${BLUE}Terraform Configuration Tests:${NC} $([ $TERRAFORM_TESTS_PASSED -eq 1 ] && echo -e "${GREEN}✅ PASSED${NC}" || echo -e "${RED}❌ FAILED${NC}")"
echo -e "  ${PURPLE}Automation Scripts Tests:${NC} $([ $AUTOMATION_TESTS_PASSED -eq 1 ] && echo -e "${GREEN}✅ PASSED${NC}" || echo -e "${RED}❌ FAILED${NC}")"
echo -e "  ${GREEN}Integration Tests:${NC} $([ $INTEGRATION_TESTS_PASSED -eq 1 ] && echo -e "${GREEN}✅ PASSED${NC}" || echo -e "${RED}❌ FAILED${NC}")"

echo -e "\n${YELLOW}Overall Results:${NC}"
echo -e "  ${GREEN}✅ Passed Suites: $PASSED_SUITES/$TOTAL_SUITES${NC}"
echo -e "  ${RED}❌ Failed Suites: $FAILED_SUITES/$TOTAL_SUITES${NC}"

# Provide next steps based on results
echo -e "\n${YELLOW}Next Steps:${NC}"

if [ $FAILED_SUITES -eq 0 ]; then
    echo -e "${GREEN}🎉 All test suites passed! Your deployment setup is ready.${NC}"
    echo -e "${GREEN}🚀 You can now proceed with deployment using:${NC}"
    echo -e "   ${BLUE}./fetch-terraform-vars.sh${NC} (for local deployment)"
    echo -e "   ${BLUE}GitHub Actions workflow${NC} (for CI/CD deployment)"
    echo -e "\n${GREEN}📚 Documentation available in README.md${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some test suites failed. Please review the issues above.${NC}"
    echo -e "${YELLOW}🔧 Recommended actions:${NC}"
    
    if [ $TERRAFORM_TESTS_FAILED -eq 1 ]; then
        echo -e "   • Review Terraform configuration syntax and variables"
        echo -e "   • Check for missing required variables or outputs"
    fi
    
    if [ $AUTOMATION_TESTS_FAILED -eq 1 ]; then
        echo -e "   • Verify automation scripts are executable and have proper syntax"
        echo -e "   • Check GitHub Actions workflow configuration"
    fi
    
    if [ $INTEGRATION_TESTS_FAILED -eq 1 ]; then
        echo -e "   • Ensure all components work together properly"
        echo -e "   • Verify ECR repositories and AWS credentials"
    fi
    
    echo -e "\n${YELLOW}📖 Check the individual test outputs above for specific issues.${NC}"
    exit 1
fi 