#!/bin/bash

# =================================
# Cost-Optimized Deployment Script
# =================================
# Deploy development/test environments with aggressive cost optimizations
# Supports: dev, qa, local environments

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEFAULT_ENVIRONMENT="dev"
DEFAULT_SUB_ENVIRONMENT="dev01"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

show_help() {
    cat << EOF
🚀 Cost-Optimized Deployment Script

USAGE:
    $0 [OPTIONS] <environment> <sub_environment>

ARGUMENTS:
    environment       Target environment (dev, qa, local)
    sub_environment   Sub-environment identifier (dev01, qa03, mars, etc.)

OPTIONS:
    -h, --help       Show this help message
    -v, --validate   Validate configuration without deploying
    -d, --destroy    Destroy the environment instead of deploying
    -p, --plan       Show terraform plan without applying
    -f, --force      Skip confirmation prompts
    --budget AMOUNT  Override budget limit (default: varies by environment)
    --pause-delay N  Override Aurora auto-pause delay in seconds (default: 300)

EXAMPLES:
    # Deploy cost-optimized dev environment
    $0 dev dev01

    # Deploy personal local environment
    $0 local mars

    # Deploy QA with custom budget
    $0 qa qa03 --budget 200

    # Plan changes without applying
    $0 dev dev01 --plan

    # Destroy environment
    $0 local mars --destroy

COST OPTIMIZATION FEATURES:
    ✅ Aurora Serverless auto-pause (5-10 min idle)
    ✅ Minimal Lambda memory allocation
    ✅ Aggressive S3 lifecycle policies
    ✅ Reduced CloudWatch log retention
    ✅ Budget monitoring & alerts
    ✅ Spot instances for Batch workloads
    ✅ Single AZ for non-critical resources

ESTIMATED COSTS:
    dev/qa:  $50-100/month (70-80% savings)
    local:   $10-30/month  (85-90% savings)
EOF
}

validate_environment() {
    local env="$1"
    case "$env" in
        dev|qa|local)
            return 0
            ;;
        staging|prod|hotfix)
            log_error "Environment '$env' is not eligible for cost optimization"
            log_info "Use regular deploy.sh for staging/prod/hotfix environments"
            exit 1
            ;;
        *)
            log_error "Invalid environment: $env"
            log_info "Valid cost-optimized environments: dev, qa, local"
            exit 1
            ;;
    esac
}

estimate_costs() {
    local env="$1"
    local budget_limit="$2"
    
    case "$env" in
        local)
            echo "💰 Estimated monthly cost: \$10-30 (85-90% savings vs production)"
            echo "📊 Budget limit: \$$budget_limit"
            echo "🎯 Auto-pause: 5 minutes, minimal capacity"
            ;;
        dev)
            echo "💰 Estimated monthly cost: \$50-100 (70-80% savings vs production)"
            echo "📊 Budget limit: \$$budget_limit" 
            echo "🎯 Auto-pause: 5 minutes, standard capacity"
            ;;
        qa)
            echo "💰 Estimated monthly cost: \$75-150 (65-75% savings vs production)"
            echo "📊 Budget limit: \$$budget_limit"
            echo "🎯 Auto-pause: 10 minutes, testing capacity"
            ;;
    esac
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check required tools
    for tool in terraform aws jq; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "Required tool not found: $tool"
            exit 1
        fi
    done
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured or invalid"
        exit 1
    fi
    
    # Check terraform state bucket access
    if ! aws s3 ls s3://hibiji-terraform-state/ &> /dev/null; then
        log_error "Cannot access terraform state bucket: hibiji-terraform-state"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

deploy_environment() {
    local environment="$1"
    local sub_environment="$2"
    local action="$3"
    local budget_limit="$4"
    local pause_delay="$5"
    local skip_confirmation="$6"
    
    log_info "Preparing cost-optimized deployment..."
    
    # Set working directory
    local env_dir="$PROJECT_ROOT/terraform/environments/$environment"
    
    if [[ ! -d "$env_dir" ]]; then
        log_error "Environment directory not found: $env_dir"
        exit 1
    fi
    
    cd "$env_dir"
    
    # Initialize terraform
    log_info "Initializing Terraform..."
    terraform init \
        -backend-config="key=$environment/$sub_environment/terraform.tfstate" \
        -backend-config="region=us-west-1"
    
    # Set terraform variables
    export TF_VAR_environment="$environment"
    export TF_VAR_sub_environment="$sub_environment"
    export TF_VAR_cost_budget_limit="$budget_limit"
    export TF_VAR_aurora_pause_delay="$pause_delay"
    
    # Cost optimization overrides
    case "$environment" in
        local)
            export TF_VAR_aurora_auto_pause="true"
            export TF_VAR_aurora_min_capacity="0.5"
            export TF_VAR_aurora_max_capacity="1.0"
            export TF_VAR_lambda_memory_size="256"
            export TF_VAR_log_retention_days="7"
            export TF_VAR_s3_lifecycle_expiration_days="30"
            ;;
        dev)
            export TF_VAR_aurora_auto_pause="true"
            export TF_VAR_aurora_min_capacity="0.5"
            export TF_VAR_aurora_max_capacity="2.0"
            export TF_VAR_lambda_memory_size="512"
            export TF_VAR_log_retention_days="14"
            export TF_VAR_s3_lifecycle_expiration_days="365"
            ;;
        qa)
            export TF_VAR_aurora_auto_pause="true"
            export TF_VAR_aurora_min_capacity="0.5" 
            export TF_VAR_aurora_max_capacity="4.0"
            export TF_VAR_lambda_memory_size="512"
            export TF_VAR_log_retention_days="30"
            export TF_VAR_s3_lifecycle_expiration_days="180"
            ;;
    esac
    
    # Show configuration summary
    echo ""
    log_info "=== COST-OPTIMIZED DEPLOYMENT CONFIGURATION ==="
    echo "🎯 Environment: $environment-$sub_environment"
    echo "📦 Aurora: Auto-pause enabled, ${TF_VAR_aurora_min_capacity}-${TF_VAR_aurora_max_capacity} ACU"
    echo "⚡ Lambda: ${TF_VAR_lambda_memory_size}MB memory"
    echo "📝 Logs: ${TF_VAR_log_retention_days} days retention"
    echo "🗂️  S3: ${TF_VAR_s3_lifecycle_expiration_days} days lifecycle"
    estimate_costs "$environment" "$budget_limit"
    echo ""
    
    if [[ "$skip_confirmation" == "false" ]]; then
        read -p "Proceed with cost-optimized deployment? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Deployment cancelled"
            exit 0
        fi
    fi
    
    # Execute terraform action
    case "$action" in
        plan)
            log_info "Generating terraform plan..."
            terraform plan -var-file="${environment}.auto.tfvars"
            ;;
        apply)
            log_info "Applying terraform configuration..."
            terraform apply -var-file="${environment}.auto.tfvars" -auto-approve
            
            # Show deployment summary
            echo ""
            log_success "=== DEPLOYMENT COMPLETED ==="
            terraform output -json | jq -r '
                .website_url.value as $website |
                .api_url.value as $api |
                .cost_optimization_summary.value as $cost |
                "🌐 Website: \($website)",
                "🔗 API: \($api)",
                "💰 Budget: \($cost.budget_limit)",
                "⚡ Aurora: \($cost.aurora_capacity)",
                "📊 Savings: \($cost.estimated_savings)"
            '
            echo ""
            log_success "Cost-optimized environment deployed successfully!"
            ;;
        destroy)
            log_warning "This will DESTROY the entire $environment-$sub_environment environment!"
            if [[ "$skip_confirmation" == "false" ]]; then
                read -p "Are you absolutely sure? Type 'destroy' to confirm: " -r
                if [[ $REPLY != "destroy" ]]; then
                    log_info "Destruction cancelled"
                    exit 0
                fi
            fi
            log_info "Destroying terraform resources..."
            terraform destroy -var-file="${environment}.auto.tfvars" -auto-approve
            log_success "Environment destroyed successfully"
            ;;
    esac
}

# Parse command line arguments
ENVIRONMENT=""
SUB_ENVIRONMENT=""
ACTION="apply"
BUDGET_LIMIT=""
PAUSE_DELAY="300"
SKIP_CONFIRMATION=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -v|--validate)
            ACTION="plan"
            shift
            ;;
        -d|--destroy)
            ACTION="destroy"
            shift
            ;;
        -p|--plan)
            ACTION="plan"
            shift
            ;;
        -f|--force)
            SKIP_CONFIRMATION=true
            shift
            ;;
        --budget)
            BUDGET_LIMIT="$2"
            shift 2
            ;;
        --pause-delay)
            PAUSE_DELAY="$2"
            shift 2
            ;;
        -*)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
        *)
            if [[ -z "$ENVIRONMENT" ]]; then
                ENVIRONMENT="$1"
            elif [[ -z "$SUB_ENVIRONMENT" ]]; then
                SUB_ENVIRONMENT="$1"
            else
                log_error "Too many arguments"
                show_help
                exit 1
            fi
            shift
            ;;
    esac
done

# Set defaults if not provided
ENVIRONMENT="${ENVIRONMENT:-$DEFAULT_ENVIRONMENT}"
SUB_ENVIRONMENT="${SUB_ENVIRONMENT:-$DEFAULT_SUB_ENVIRONMENT}"

# Set default budget based on environment
if [[ -z "$BUDGET_LIMIT" ]]; then
    case "$ENVIRONMENT" in
        local) BUDGET_LIMIT="50" ;;
        dev) BUDGET_LIMIT="100" ;;
        qa) BUDGET_LIMIT="150" ;;
    esac
fi

# Validate inputs
validate_environment "$ENVIRONMENT"

# Main execution
echo "🚀 Digital Persona Platform - Cost-Optimized Deployment"
echo "=================================================="

check_prerequisites
deploy_environment "$ENVIRONMENT" "$SUB_ENVIRONMENT" "$ACTION" "$BUDGET_LIMIT" "$PAUSE_DELAY" "$SKIP_CONFIRMATION"