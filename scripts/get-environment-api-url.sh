#!/bin/bash

# =================================
# GET ENVIRONMENT API URL
# =================================
# This script dynamically generates the correct API URL for any environment
# Usage: ./get-environment-api-url.sh [environment]
# Example: ./get-environment-api-url.sh dev01

set -e

# Source the environment configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config/environment.sh"

# Function to get API URL from Terraform outputs
get_api_url_from_terraform() {
    local env="$1"
    local main_env="${env%[0-9]*}"
    local sub_env="${env#[a-z]*}"
    
    if [[ -z "$sub_env" ]]; then
        sub_env="01"
    fi
    
    echo "🔍 Looking up API URL for environment: $env (main: $main_env, sub: $sub_env)" >&2
    
    # Change to the appropriate terraform directory
    local tf_dir="$SCRIPT_DIR/../terraform/environments/$main_env"
    
    if [[ ! -d "$tf_dir" ]]; then
        echo "❌ Terraform directory not found: $tf_dir" >&2
        return 1
    fi
    
    # Get the API URL from terraform outputs
    cd "$tf_dir"
    
    # Initialize terraform if needed
    if [[ ! -d ".terraform" ]]; then
        echo "🔧 Initializing Terraform..." >&2
        terraform init -backend=false >&2
    fi
    
    # Get the API URL output
    local api_url
    if api_url=$(terraform output -raw api_url 2>/dev/null); then
        echo "$api_url"
        return 0
    else
        echo "❌ Failed to get API URL from Terraform outputs" >&2
        return 1
    fi
}

# Function to get API URL from AWS resources
get_api_url_from_aws() {
    local env="$1"
    local main_env="${env%[0-9]*}"
    local sub_env="${env#[a-z]*}"
    
    if [[ -z "$sub_env" ]]; then
        sub_env="01"
    fi
    
    local resource_prefix="${main_env}-${env}-dpp"
    
    echo "🔍 Looking up API Gateway for resource prefix: $resource_prefix" >&2
    
    # Get API Gateway ID
    local api_gateway_id
    api_gateway_id=$(aws apigatewayv2 get-apis \
        --query "Items[?Name=='${resource_prefix}-api'].ApiId" \
        --output text 2>/dev/null | head -1)
    
    if [[ -z "$api_gateway_id" || "$api_gateway_id" == "None" ]]; then
        echo "❌ API Gateway not found for resource prefix: $resource_prefix" >&2
        return 1
    fi
    
    # Get the stage name (usually 'v1')
    local stage_name
    stage_name=$(aws apigatewayv2 get-stages \
        --api-id "$api_gateway_id" \
        --query "Items[0].StageName" \
        --output text 2>/dev/null)
    
    if [[ -z "$stage_name" || "$stage_name" == "None" ]]; then
        stage_name="v1"  # Default stage name
    fi
    
    # Construct the API URL
    local api_url="https://${api_gateway_id}.execute-api.${AWS_REGION}.amazonaws.com/${stage_name}"
    echo "$api_url"
    return 0
}

# Function to get custom domain API URL
get_custom_domain_api_url() {
    local env="$1"
    local main_env="${env%[0-9]*}"
    local sub_env="${env#[a-z]*}"
    
    if [[ -z "$sub_env" ]]; then
        sub_env="01"
    fi
    
    # Generate custom domain
    local api_domain="${env}-api.${BASE_DOMAIN}"
    
    echo "🔍 Checking custom domain: $api_domain" >&2
    
    # Test if the custom domain is accessible
    if curl -s --head "https://$api_domain/health" >/dev/null 2>&1; then
        echo "https://$api_domain"
        return 0
    else
        echo "❌ Custom domain not accessible: $api_domain" >&2
        return 1
    fi
}

# Main function
main() {
    local target_env="${1:-$ENVIRONMENT}"
    
    if [[ -z "$target_env" ]]; then
        echo "❌ No environment specified and no default environment detected" >&2
        echo "Usage: $0 [environment]" >&2
        echo "Example: $0 dev01" >&2
        exit 1
    fi
    
    echo "🌍 Getting API URL for environment: $target_env" >&2
    
    # Try different methods in order of preference
    local api_url=""
    
    # Method 1: Try custom domain first (most user-friendly)
    if api_url=$(get_custom_domain_api_url "$target_env"); then
        echo "✅ Found custom domain API URL" >&2
        echo "$api_url"
        return 0
    fi
    
    # Method 2: Try Terraform outputs
    if api_url=$(get_api_url_from_terraform "$target_env"); then
        echo "✅ Found API URL from Terraform outputs" >&2
        echo "$api_url"
        return 0
    fi
    
    # Method 3: Try AWS resource discovery
    if api_url=$(get_api_url_from_aws "$target_env"); then
        echo "✅ Found API URL from AWS resources" >&2
        echo "$api_url"
        return 0
    fi
    
    echo "❌ Could not find API URL for environment: $target_env" >&2
    echo "💡 Make sure the environment is deployed and accessible" >&2
    exit 1
}

# Run main function
main "$@"
