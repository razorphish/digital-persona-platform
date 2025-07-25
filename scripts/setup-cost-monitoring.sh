#!/bin/bash

# Cost Monitoring Setup Script for Hibiji Platform
# This script helps set up the complete cost monitoring system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="us-west-1"
PROJECT_NAME="hibiji"

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

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed"
        echo "Please install AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    fi
    print_status "AWS CLI is installed"
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured"
        echo "Please run: aws configure"
        exit 1
    fi
    print_status "AWS credentials are configured"
    
    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform is not installed"
        echo "Please install Terraform: https://developer.hashicorp.com/terraform/downloads"
        exit 1
    fi
    print_status "Terraform is installed"
    
    # Check Git
    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        echo "Please install Git: https://git-scm.com/downloads"
        exit 1
    fi
    print_status "Git is installed"
}

# Get user input
get_user_input() {
    print_header "Configuration"
    
    # Get email for alerts
    read -p "Enter email address for cost alerts: " ALERT_EMAIL
    
    if [ -z "$ALERT_EMAIL" ]; then
        print_error "Email address is required"
        exit 1
    fi
    
    # Validate email format
    if [[ ! "$ALERT_EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
        print_error "Invalid email format"
        exit 1
    fi
    
    # Get environment
    echo "Select environment to deploy cost monitoring:"
    echo "1) dev"
    echo "2) qa"
    echo "3) staging"
    echo "4) hotfix"
    echo "5) prod"
    echo "6) all"
    
    read -p "Enter choice (1-6): " ENV_CHOICE
    
    case $ENV_CHOICE in
        1) ENVIRONMENT="dev" ;;
        2) ENVIRONMENT="qa" ;;
        3) ENVIRONMENT="staging" ;;
        4) ENVIRONMENT="hotfix" ;;
        5) ENVIRONMENT="prod" ;;
        6) ENVIRONMENT="all" ;;
        *) 
            print_error "Invalid choice"
            exit 1
            ;;
    esac
    
    # Get budget confirmation
    echo ""
    echo "Default budgets:"
    echo "- dev: \$50/month"
    echo "- qa: \$100/month"
    echo "- staging: \$200/month"
    echo "- hotfix: \$150/month"
    echo "- prod: \$1000/month"
    
    read -p "Do you want to customize budgets? (y/N): " CUSTOMIZE_BUDGETS
    
    if [[ "$CUSTOMIZE_BUDGETS" =~ ^[Yy]$ ]]; then
        read -p "Enter dev budget (default: 50): " DEV_BUDGET
        read -p "Enter qa budget (default: 100): " QA_BUDGET
        read -p "Enter staging budget (default: 200): " STAGING_BUDGET
        read -p "Enter hotfix budget (default: 150): " HOTFIX_BUDGET
        read -p "Enter prod budget (default: 1000): " PROD_BUDGET
        
        # Set defaults if empty
        DEV_BUDGET=${DEV_BUDGET:-50}
        QA_BUDGET=${QA_BUDGET:-100}
        STAGING_BUDGET=${STAGING_BUDGET:-200}
        HOTFIX_BUDGET=${HOTFIX_BUDGET:-150}
        PROD_BUDGET=${PROD_BUDGET:-1000}
    fi
}

# Deploy cost monitoring infrastructure
deploy_infrastructure() {
    print_header "Deploying Cost Monitoring Infrastructure"
    
    if [ "$ENVIRONMENT" = "all" ]; then
        # Deploy to all environments
        for env in dev qa staging hotfix prod; do
            print_info "Deploying to $env environment..."
            deploy_to_environment "$env"
        done
    else
        # Deploy to specific environment
        deploy_to_environment "$ENVIRONMENT"
    fi
}

deploy_to_environment() {
    local env=$1
    local env_dir="terraform/environments/$env"
    
    if [ ! -d "$env_dir" ]; then
        print_warning "Environment directory $env_dir not found, skipping..."
        return
    fi
    
    print_info "Setting up cost monitoring for $env environment..."
    
    # Create cost monitoring configuration
    create_cost_monitoring_config "$env"
    
    # Deploy cost monitoring separately
    deploy_cost_monitoring_module "$env"
}

create_cost_monitoring_config() {
    local env=$1
    
    print_info "Creating cost monitoring configuration for $env..."
    
    # Create a separate cost monitoring directory
    local cost_dir="terraform/cost-monitoring/$env"
    mkdir -p "$cost_dir"
    
    # Create main.tf for cost monitoring
    cat > "$cost_dir/main.tf" << EOF
terraform {
  required_version = ">= 1.0"
  
  backend "s3" {
    bucket = "hibiji-terraform-state"
    key    = "cost-monitoring/$env/terraform.tfstate"
    region = "us-west-1"
  }
}

# Cost monitoring variables
variable "alert_emails" {
  description = "Email addresses for cost alerts"
  type        = list(string)
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "$env"
}

# Cost control module
module "cost_control" {
  source = "../../modules/cost-control"
  
  alert_emails = var.alert_emails
}

# Outputs
output "cost_dashboard_url" {
  description = "URL for the CloudWatch cost dashboard"
  value       = module.cost_control.cost_dashboard_url
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for cost alerts"
  value       = module.cost_control.sns_topic_arn
}
EOF

    # Create tfvars file
    cat > "$cost_dir/cost_monitoring.auto.tfvars" << EOF
# Cost Monitoring Configuration
alert_emails = ["$ALERT_EMAIL"]
environment = "$env"

# Custom budgets (if provided)
${DEV_BUDGET:+dev_budget = $DEV_BUDGET}
${QA_BUDGET:+qa_budget = $QA_BUDGET}
${STAGING_BUDGET:+staging_budget = $STAGING_BUDGET}
${HOTFIX_BUDGET:+hotfix_budget = $HOTFIX_BUDGET}
${PROD_BUDGET:+prod_budget = $PROD_BUDGET}
EOF
}

deploy_cost_monitoring_module() {
    local env=$1
    local cost_dir="terraform/cost-monitoring/$env"
    
    print_info "Deploying cost monitoring module for $env..."
    
    cd "$cost_dir"
    
    # Initialize Terraform
    print_info "Initializing Terraform..."
    terraform init
    
    # Plan and apply
    print_info "Planning Terraform changes..."
    terraform plan -var-file="cost_monitoring.auto.tfvars" -out=tfplan
    
    print_info "Applying Terraform changes..."
    terraform apply tfplan
    
    # Get outputs
    print_info "Getting deployment outputs..."
    COST_DASHBOARD_URL=$(terraform output -raw cost_dashboard_url 2>/dev/null || echo "Not available")
    SNS_TOPIC_ARN=$(terraform output -raw sns_topic_arn 2>/dev/null || echo "Not available")
    
    print_status "Cost monitoring deployed to $env environment"
    
    cd - > /dev/null
}

# Setup GitHub Actions
setup_github_actions() {
    print_header "Setting up GitHub Actions"
    
    # Check if we're in a git repository
    if [ ! -d ".git" ]; then
        print_warning "Not in a git repository, skipping GitHub Actions setup"
        return
    fi
    
    # Check if GitHub Actions workflow exists
    if [ ! -f ".github/workflows/cost-monitor.yml" ]; then
        print_warning "Cost monitoring workflow not found"
        return
    fi
    
    print_info "GitHub Actions workflow found"
    print_info "Make sure to set the following secrets in your GitHub repository:"
    echo ""
    echo "AWS_ROLE_ARN=arn:aws:iam::ACCOUNT:role/GitHubActionsRole"
    echo "SLACK_WEBHOOK_URL=https://hooks.slack.com/services/... (optional)"
    echo ""
    
    read -p "Do you want to test the GitHub Actions workflow? (y/N): " TEST_WORKFLOW
    
    if [[ "$TEST_WORKFLOW" =~ ^[Yy]$ ]]; then
        print_info "You can manually trigger the cost monitoring workflow:"
        echo "1. Go to your GitHub repository"
        echo "2. Navigate to Actions > Cost Monitor"
        echo "3. Click 'Run workflow'"
        echo "4. Select environment and click 'Run workflow'"
    fi
}

# Test cost monitoring
test_cost_monitoring() {
    print_header "Testing Cost Monitoring"
    
    print_info "Testing cost optimization script..."
    if [ -f "scripts/cost-optimization.sh" ]; then
        ./scripts/cost-optimization.sh
        print_status "Cost optimization script executed successfully"
    else
        print_warning "Cost optimization script not found"
    fi
    
    print_info "Testing AWS Cost Explorer access..."
    if aws ce get-cost-and-usage \
        --time-period Start=$(get_first_day_of_month),End=$(date +%Y-%m-%d) \
        --granularity MONTHLY \
        --metrics BlendedCost \
        --query 'ResultsByTime[0].Total.BlendedCost.Amount' \
        --output text &> /dev/null; then
        print_status "AWS Cost Explorer access confirmed"
    else
        print_warning "AWS Cost Explorer access failed - check permissions"
    fi
    
    print_info "Testing budget access..."
    if aws budgets describe-budgets \
        --account-id $(aws sts get-caller-identity --query Account --output text) &> /dev/null; then
        print_status "AWS Budgets access confirmed"
    else
        print_warning "AWS Budgets access failed - check permissions"
    fi
}

# Generate summary
generate_summary() {
    print_header "Setup Summary"
    
    cat > cost_monitoring_setup_summary.md << EOF
# Cost Monitoring Setup Summary

## Configuration

- **Alert Email**: $ALERT_EMAIL
- **Environment**: $ENVIRONMENT
- **AWS Region**: $AWS_REGION
- **Project**: $PROJECT_NAME

## Deployed Components

1. **Terraform Cost Control Module**
   - Budgets for all environments
   - Cost anomaly detection
   - CloudWatch dashboards
   - SNS notifications

2. **GitHub Actions Workflow**
   - Daily cost monitoring
   - Weekly summaries
   - Monthly reports
   - Automated alerts

3. **Cost Optimization Script**
   - Resource analysis
   - Optimization recommendations
   - Detailed reports

## Access Points

- **Cost Dashboard**: $COST_DASHBOARD_URL
- **SNS Topic**: $SNS_TOPIC_ARN
- **GitHub Actions**: .github/workflows/cost-monitor.yml

## Next Steps

1. **Verify Email Subscription**: Check your email for SNS subscription confirmation
2. **Test Alerts**: Trigger a test alert to verify notifications
3. **Review Budgets**: Adjust budgets based on your requirements
4. **Monitor Costs**: Check the cost dashboard regularly
5. **Run Optimization**: Execute the cost optimization script monthly

## Useful Commands

\`\`\`bash
# Run cost optimization analysis
./scripts/cost-optimization.sh

# Check current costs
aws ce get-cost-and-usage --time-period Start=2024-01-01,End=2024-01-31 --granularity MONTHLY --metrics BlendedCost

# Check budget status
aws budgets describe-budgets --account-id \$(aws sts get-caller-identity --query Account --output text)
\`\`\`

## Documentation

- **Cost Monitoring Guide**: COST_MONITORING.md
- **Terraform Documentation**: terraform/modules/cost-control/
- **GitHub Actions**: .github/workflows/cost-monitor.yml

---

Generated on: $(date)
EOF
    
    print_status "Setup summary saved to: cost_monitoring_setup_summary.md"
}

# Main execution
main() {
    print_header "Cost Monitoring Setup"
    print_header "Hibiji Platform"
    
    # Check prerequisites
    check_prerequisites
    
    # Get user input
    get_user_input
    
    # Deploy infrastructure
    deploy_infrastructure
    
    # Setup GitHub Actions
    setup_github_actions
    
    # Test cost monitoring
    test_cost_monitoring
    
    # Generate summary
    generate_summary
    
    print_header "Setup Complete"
    print_status "Cost monitoring system has been deployed successfully!"
    print_info "Check the setup summary for next steps and access information."
}

# Run main function
main "$@" 