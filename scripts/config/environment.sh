#!/bin/bash

# =================================
# ENVIRONMENT CONFIGURATION
# =================================
# Central configuration for all dynamic values used across scripts, workflows, and Terraform
# Source this file in other scripts: source "$(dirname "$0")/config/environment.sh"

# =================================
# PRIMARY CONFIGURATION
# =================================

# Domain Configuration
export BASE_DOMAIN="${BASE_DOMAIN:-hibiji.com}"
export DOMAIN_NAME="${DOMAIN_NAME:-$BASE_DOMAIN}"

# AWS Configuration  
export AWS_REGION="${AWS_REGION:-$(aws configure get region 2>/dev/null || echo 'us-west-1')}"
export AWS_CERT_REGION="${AWS_CERT_REGION:-us-east-1}"  # CloudFront certificates must be in us-east-1
export AWS_ACCOUNT_ID="${AWS_ACCOUNT_ID:-$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo '')}"

# Project Configuration
export PROJECT_NAME="${PROJECT_NAME:-dpp}"
export ORGANIZATION_NAME="${ORGANIZATION_NAME:-hibiji}"

# =================================
# ENVIRONMENT DETECTION
# =================================

# Auto-detect environment from branch name, directory, or explicit setting
detect_environment() {
    local env_from_branch=""
    local env_from_dir=""
    
    # Try to get from git branch
    if git rev-parse --git-dir >/dev/null 2>&1; then
        local branch=$(git branch --show-current 2>/dev/null || echo "")
        if [[ "$branch" =~ ^(dev|qa|staging|hotfix)([0-9]+)$ ]]; then
            env_from_branch="$branch"
        elif [[ "$branch" == "main" ]]; then
            env_from_branch="main"
        fi
    fi
    
    # Try to get from current directory
    local current_dir=$(pwd)
    if [[ "$current_dir" =~ /(dev|qa|staging|hotfix|main)$ ]]; then
        env_from_dir=$(basename "$current_dir")
    fi
    
    # Priority: Explicit setting > Branch > Directory > Default
    export ENVIRONMENT="${ENVIRONMENT:-${env_from_branch:-${env_from_dir:-dev01}}}"
    
    # Extract main environment and sub-environment
    if [[ "$ENVIRONMENT" =~ ^([a-z]+)([0-9]+)?$ ]]; then
        export MAIN_ENV="${BASH_REMATCH[1]}"
        export SUB_ENV="${BASH_REMATCH[2]:-01}"
        export SUB_ENVIRONMENT="${ENVIRONMENT}"
    else
        export MAIN_ENV="$ENVIRONMENT"
        export SUB_ENV="01"
        export SUB_ENVIRONMENT="${ENVIRONMENT}01"
    fi
}

# =================================
# DYNAMIC DOMAIN GENERATION
# =================================

generate_domains() {
    if [[ "$ENVIRONMENT" == "main" ]] || [[ "$ENVIRONMENT" == "prod" ]]; then
        export WEBSITE_DOMAIN="www.${BASE_DOMAIN}"
        export API_DOMAIN="api.${BASE_DOMAIN}"
    else
        export WEBSITE_DOMAIN="${SUB_ENVIRONMENT}.${BASE_DOMAIN}"
        export API_DOMAIN="${SUB_ENVIRONMENT}-api.${BASE_DOMAIN}"
    fi
}

# =================================
# RESOURCE NAME GENERATION  
# =================================

generate_resource_names() {
    export RESOURCE_PREFIX="${MAIN_ENV}-${SUB_ENVIRONMENT}-${PROJECT_NAME}"
    export LAMBDA_FUNCTION_NAME="${RESOURCE_PREFIX}-api"
    export S3_BUCKET_PREFIX="${RESOURCE_PREFIX}"
    export IAM_ROLE_PREFIX="${RESOURCE_PREFIX}"
    export ECR_REPOSITORY="${RESOURCE_PREFIX}-ml-service"
}

# =================================
# URL GENERATION
# =================================

generate_urls() {
    export FRONTEND_URL="https://${WEBSITE_DOMAIN}"
    export API_URL="https://${API_DOMAIN}"
    export API_HEALTH_URL="${API_URL}/health"
}

# =================================
# AWS RESOURCE DISCOVERY
# =================================

discover_aws_resources() {
    if [[ -n "$AWS_ACCOUNT_ID" ]]; then
        # Discover API Gateway ID
        export API_GATEWAY_ID=$(aws apigatewayv2 get-apis \
            --query "Items[?Name=='${RESOURCE_PREFIX}-api'].ApiId" \
            --output text 2>/dev/null | head -1)
        
        # Discover CloudFront distributions
        export WEBSITE_CLOUDFRONT_ID=$(aws cloudfront list-distributions \
            --query "DistributionList.Items[?Aliases.Items[0]=='${WEBSITE_DOMAIN}'].Id" \
            --output text 2>/dev/null)
        
        export API_CLOUDFRONT_ID=$(aws cloudfront list-distributions \
            --query "DistributionList.Items[?Aliases.Items[0]=='${API_DOMAIN}'].Id" \
            --output text 2>/dev/null)
        
        # Generate direct API URL if we have the gateway ID
        if [[ -n "$API_GATEWAY_ID" && "$API_GATEWAY_ID" != "None" ]]; then
            export API_DIRECT_URL="https://${API_GATEWAY_ID}.execute-api.${AWS_REGION}.amazonaws.com/v1/health"
        fi
        
        # Discover Route53 Hosted Zone
        export HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name \
            --dns-name "${BASE_DOMAIN}" \
            --query "HostedZones[0].Id" \
            --output text 2>/dev/null | sed 's|/hostedzone/||')
    fi
}

# =================================
# INITIALIZATION
# =================================

init_environment() {
    detect_environment
    generate_domains  
    generate_resource_names
    generate_urls
    discover_aws_resources
    
    # Export common tags for Terraform
    export TF_VAR_environment="$MAIN_ENV"
    export TF_VAR_sub_environment="$SUB_ENVIRONMENT" 
    export TF_VAR_project_name="$PROJECT_NAME"
    export TF_VAR_domain_name="$BASE_DOMAIN"
    export TF_VAR_aws_region="$AWS_REGION"
}

# =================================
# UTILITY FUNCTIONS
# =================================

print_environment_info() {
    echo "=========================================="
    echo "🌍 ENVIRONMENT CONFIGURATION"
    echo "=========================================="
    echo "Environment: $ENVIRONMENT (main: $MAIN_ENV, sub: $SUB_ENV)"
    echo "Domain: $BASE_DOMAIN"
    echo "Website: $WEBSITE_DOMAIN"
    echo "API: $API_DOMAIN"
    echo "AWS Region: $AWS_REGION"
    echo "AWS Account: ${AWS_ACCOUNT_ID:-'Not detected'}"
    echo "Resource Prefix: $RESOURCE_PREFIX"
    echo "=========================================="
}

validate_configuration() {
    local errors=0
    
    if [[ -z "$BASE_DOMAIN" ]]; then
        echo "❌ BASE_DOMAIN not set"
        ((errors++))
    fi
    
    if [[ -z "$AWS_REGION" ]]; then
        echo "❌ AWS_REGION not set"
        ((errors++))
    fi
    
    if [[ -z "$ENVIRONMENT" ]]; then
        echo "❌ ENVIRONMENT not set"
        ((errors++))
    fi
    
    if [[ $errors -gt 0 ]]; then
        echo "❌ Configuration validation failed with $errors errors"
        return 1
    fi
    
    echo "✅ Configuration validation passed"
    return 0
}

# =================================
# AUTO-INITIALIZATION
# =================================

# Initialize environment variables when this script is sourced
init_environment 