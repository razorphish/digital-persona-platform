#!/bin/bash

# Test Cost Monitoring Setup Script
# This script tests the cost monitoring configuration without deploying

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Cross-platform date function
get_first_day_of_month() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS (BSD date)
        date -v1d -v$(date +%m)m -v$(date +%Y)y +%Y-%m-%d
    else
        # Linux (GNU date)
        date -d "$(date +%Y-%m-01)" +%Y-%m-%d
    fi
}

# Test AWS permissions
test_aws_permissions() {
    print_header "Testing AWS Permissions"
    
    # Test Cost Explorer access
    print_info "Testing Cost Explorer access..."
    if aws ce get-cost-and-usage \
        --time-period Start=$(get_first_day_of_month),End=$(date +%Y-%m-%d) \
        --granularity MONTHLY \
        --metrics BlendedCost \
        --query 'ResultsByTime[0].Total.BlendedCost.Amount' \
        --output text &> /dev/null; then
        print_status "Cost Explorer access confirmed"
    else
        print_error "Cost Explorer access failed"
        print_info "Required permissions: ce:GetCostAndUsage"
    fi
    
    # Test Budgets access
    print_info "Testing Budgets access..."
    if aws budgets describe-budgets \
        --account-id $(aws sts get-caller-identity --query Account --output text) &> /dev/null; then
        print_status "Budgets access confirmed"
    else
        print_error "Budgets access failed"
        print_info "Required permissions: budgets:DescribeBudgets"
    fi
    
    # Test CloudWatch access
    print_info "Testing CloudWatch access..."
    if aws cloudwatch list-dashboards --dashboard-name-prefix hibiji &> /dev/null; then
        print_status "CloudWatch access confirmed"
    else
        print_warning "CloudWatch access failed"
        print_info "Required permissions: cloudwatch:ListDashboards"
    fi
    
    # Test SNS access
    print_info "Testing SNS access..."
    if aws sns list-topics --query 'Topics[?contains(TopicArn, `cost-alerts`)]' &> /dev/null; then
        print_status "SNS access confirmed"
    else
        print_warning "SNS access failed"
        print_info "Required permissions: sns:ListTopics"
    fi
}

# Test Terraform configuration
test_terraform_config() {
    print_header "Testing Terraform Configuration"
    
    # Test cost control module
    print_info "Testing cost control module..."
    if [ -f "terraform/modules/cost-control/main.tf" ]; then
        print_status "Cost control module found"
        
        # Validate Terraform syntax
        cd terraform/modules/cost-control
        if terraform validate &> /dev/null; then
            print_status "Cost control module syntax is valid"
        else
            print_error "Cost control module syntax is invalid"
        fi
        cd - > /dev/null
    else
        print_error "Cost control module not found"
    fi
    
    # Test environment configurations
    for env in dev qa staging hotfix prod; do
        if [ -d "terraform/environments/$env" ]; then
            print_status "Environment $env configuration found"
        else
            print_warning "Environment $env configuration not found"
        fi
    done
}

# Test GitHub Actions workflow
test_github_actions() {
    print_header "Testing GitHub Actions Workflow"
    
    if [ -f ".github/workflows/cost-monitor.yml" ]; then
        print_status "Cost monitoring workflow found"
        
        # Check workflow syntax
        if command -v yamllint &> /dev/null; then
            if yamllint .github/workflows/cost-monitor.yml &> /dev/null; then
                print_status "Workflow syntax is valid"
            else
                print_warning "Workflow syntax issues detected"
            fi
        else
            print_info "yamllint not installed, skipping workflow syntax check"
        fi
    else
        print_error "Cost monitoring workflow not found"
    fi
}

# Test cost optimization script
test_cost_optimization_script() {
    print_header "Testing Cost Optimization Script"
    
    if [ -f "scripts/cost-optimization.sh" ]; then
        print_status "Cost optimization script found"
        
        # Check if script is executable
        if [ -x "scripts/cost-optimization.sh" ]; then
            print_status "Cost optimization script is executable"
        else
            print_warning "Cost optimization script is not executable"
            print_info "Run: chmod +x scripts/cost-optimization.sh"
        fi
    else
        print_error "Cost optimization script not found"
    fi
}

# Test setup script
test_setup_script() {
    print_header "Testing Setup Script"
    
    if [ -f "scripts/setup-cost-monitoring.sh" ]; then
        print_status "Setup script found"
        
        # Check if script is executable
        if [ -x "scripts/setup-cost-monitoring.sh" ]; then
            print_status "Setup script is executable"
        else
            print_warning "Setup script is not executable"
            print_info "Run: chmod +x scripts/setup-cost-monitoring.sh"
        fi
    else
        print_error "Setup script not found"
    fi
}

# Test documentation
test_documentation() {
    print_header "Testing Documentation"
    
    if [ -f "COST_MONITORING.md" ]; then
        print_status "Cost monitoring documentation found"
    else
        print_error "Cost monitoring documentation not found"
    fi
    
    if [ -f "monitoring/grafana/dashboards/cost-dashboard.json" ]; then
        print_status "Cost dashboard configuration found"
    else
        print_error "Cost dashboard configuration not found"
    fi
}

# Generate test report
generate_test_report() {
    print_header "Generating Test Report"
    
    cat > cost_monitoring_test_report.md << EOF
# Cost Monitoring Test Report

Generated on: $(date)

## Test Results

### AWS Permissions
- Cost Explorer: $(aws ce get-cost-and-usage --time-period Start=$(get_first_day_of_month),End=$(date +%Y-%m-%d) --granularity MONTHLY --metrics BlendedCost --query 'ResultsByTime[0].Total.BlendedCost.Amount' --output text 2>/dev/null && echo "✅ Working" || echo "❌ Failed")
- Budgets: $(aws budgets describe-budgets --account-id $(aws sts get-caller-identity --query Account --output text) &>/dev/null && echo "✅ Working" || echo "❌ Failed")
- CloudWatch: $(aws cloudwatch list-dashboards --dashboard-name-prefix hibiji &>/dev/null && echo "✅ Working" || echo "❌ Failed")
- SNS: $(aws sns list-topics --query 'Topics[?contains(TopicArn, `cost-alerts`)]' &>/dev/null && echo "✅ Working" || echo "❌ Failed")

### Configuration Files
- Cost Control Module: $(test -f "terraform/modules/cost-control/main.tf" && echo "✅ Found" || echo "❌ Missing")
- GitHub Actions Workflow: $(test -f ".github/workflows/cost-monitor.yml" && echo "✅ Found" || echo "❌ Missing")
- Cost Optimization Script: $(test -f "scripts/cost-optimization.sh" && echo "✅ Found" || echo "❌ Missing")
- Setup Script: $(test -f "scripts/setup-cost-monitoring.sh" && echo "✅ Found" || echo "❌ Missing")
- Documentation: $(test -f "COST_MONITORING.md" && echo "✅ Found" || echo "❌ Missing")
- Dashboard Config: $(test -f "monitoring/grafana/dashboards/cost-dashboard.json" && echo "✅ Found" || echo "❌ Missing")

### Environment Configurations
$(for env in dev qa staging hotfix prod; do
    echo "- $env: $(test -d "terraform/environments/$env" && echo "✅ Found" || echo "❌ Missing")"
done)

## Recommendations

1. **Fix any failed tests** before proceeding with deployment
2. **Verify AWS permissions** are properly configured
3. **Test in a non-production environment** first
4. **Review budget configurations** before deployment

## Next Steps

1. Run the setup script: \`./scripts/setup-cost-monitoring.sh\`
2. Verify email subscriptions
3. Test cost optimization: \`./scripts/cost-optimization.sh\`
4. Monitor the cost dashboard

---

EOF
    
    print_status "Test report saved to: cost_monitoring_test_report.md"
}

# Main execution
main() {
    print_header "Cost Monitoring Test"
    print_header "Hibiji Platform"
    
    # Run all tests
    test_aws_permissions
    test_terraform_config
    test_github_actions
    test_cost_optimization_script
    test_setup_script
    test_documentation
    
    # Generate report
    generate_test_report
    
    print_header "Test Complete"
    print_status "All tests completed. Check the test report for details."
}

# Run main function
main "$@" 