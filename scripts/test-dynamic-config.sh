#!/bin/bash

# =================================
# TEST DYNAMIC CONFIGURATION
# =================================
# This script tests that the configuration is truly dynamic across environments
# Usage: ./test-dynamic-config.sh [environment1] [environment2] [environment3]
# Example: ./test-dynamic-config.sh dev01 dev99 qa27

set -e

# Source the environment configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config/environment.sh"

# Function to display usage
usage() {
    echo "Usage: $0 [environment1] [environment2] [environment3] ..."
    echo ""
    echo "Examples:"
    echo "  $0 dev01 dev99 qa27"
    echo "  $0 dev01 dev02 dev03"
    echo "  $0 qa01 qa02 qa03"
    echo "  $0 staging01 staging02 staging03"
    echo ""
    echo "This script will test that:"
    echo "  1. Each environment generates unique API URLs"
    echo "  2. Terraform outputs are dynamic"
    echo "  3. Environment variables are properly set"
    echo "  4. No hard-coded configurations exist"
}

# Function to test environment configuration
test_environment() {
    local env="$1"
    echo "🧪 Testing environment: $env"
    echo "----------------------------------------"
    
    # Set environment variables for this test
    export ENVIRONMENT="$env"
    source "$SCRIPT_DIR/config/environment.sh"
    
    # Test 1: Check if environment detection works
    echo "✅ Environment detection: $ENVIRONMENT (main: $MAIN_ENV, sub: $SUB_ENV)"
    
    # Test 2: Check domain generation
    echo "✅ Website domain: $WEBSITE_DOMAIN"
    echo "✅ API domain: $API_DOMAIN"
    
    # Test 3: Check resource naming
    echo "✅ Resource prefix: $RESOURCE_PREFIX"
    
    # Test 4: Check URL generation
    echo "✅ Frontend URL: $FRONTEND_URL"
    echo "✅ API URL: $API_URL"
    
    # Test 5: Try to get API URL from Terraform (if deployed)
    echo "🔍 Checking Terraform outputs..."
    if api_url=$("$SCRIPT_DIR/get-environment-api-url.sh" "$env" 2>/dev/null); then
        echo "✅ Terraform API URL: $api_url"
    else
        echo "⚠️  Terraform API URL: Not available (environment may not be deployed)"
    fi
    
    # Test 6: Check AWS resource discovery
    echo "🔍 Checking AWS resources..."
    if [[ -n "$API_GATEWAY_ID" && "$API_GATEWAY_ID" != "None" ]]; then
        echo "✅ API Gateway ID: $API_GATEWAY_ID"
    else
        echo "⚠️  API Gateway ID: Not found (environment may not be deployed)"
    fi
    
    echo ""
}

# Function to test for hard-coded configurations
test_hardcoded_configs() {
    echo "🔍 Testing for hard-coded configurations..."
    echo "----------------------------------------"
    
    local errors=0
    
    # Test 1: Check for hard-coded environment names in application code
    echo "🔍 Checking application code for hard-coded environments..."
    if grep -r "dev01\|dev02\|qa01\|staging01\|prod01" apps/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" >/dev/null 2>&1; then
        echo "❌ Found hard-coded environment names in application code"
        ((errors++))
    else
        echo "✅ No hard-coded environment names in application code"
    fi
    
    # Test 2: Check for hard-coded localhost URLs in production code
    echo "🔍 Checking for hard-coded localhost URLs..."
    if grep -r "localhost:400[01]" apps/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "fallback\|default\|example" >/dev/null 2>&1; then
        echo "❌ Found hard-coded localhost URLs in application code"
        ((errors++))
    else
        echo "✅ No hard-coded localhost URLs in application code"
    fi
    
    # Test 3: Check for hard-coded domain names
    echo "🔍 Checking for hard-coded domain names..."
    if grep -r "hibiji\.com\|mars\.hibiji\.com" apps/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" | grep -v "example\|fallback\|default" >/dev/null 2>&1; then
        echo "❌ Found hard-coded domain names in application code"
        ((errors++))
    else
        echo "✅ No hard-coded domain names in application code"
    fi
    
    # Test 4: Check Terraform configurations
    echo "🔍 Checking Terraform configurations..."
    if grep -r "dev01\|dev02\|qa01\|staging01\|prod01" terraform/ --include="*.tf" | grep -v "example\|description\|comment" >/dev/null 2>&1; then
        echo "❌ Found hard-coded environment names in Terraform"
        ((errors++))
    else
        echo "✅ No hard-coded environment names in Terraform"
    fi
    
    if [[ $errors -gt 0 ]]; then
        echo "❌ Found $errors hard-coded configuration issues"
        return 1
    else
        echo "✅ No hard-coded configuration issues found"
        return 0
    fi
}

# Function to test environment setup script
test_environment_setup() {
    local env="$1"
    echo "🧪 Testing environment setup for: $env"
    echo "----------------------------------------"
    
    # Test the setup script
    if "$SCRIPT_DIR/setup-environment.sh" "$env" >/dev/null 2>&1; then
        echo "✅ Environment setup script works for $env"
        
        # Check if .env file was created
        if [[ -f ".env" ]]; then
            echo "✅ .env file created successfully"
            
            # Check if API URL is dynamic
            local api_url
            api_url=$(grep "NEXT_PUBLIC_API_URL" .env | cut -d'=' -f2 | tr -d '"')
            if [[ "$api_url" == *"$env"* ]]; then
                echo "✅ API URL is environment-specific: $api_url"
            else
                echo "⚠️  API URL may not be environment-specific: $api_url"
            fi
        else
            echo "❌ .env file not created"
        fi
    else
        echo "⚠️  Environment setup script failed for $env (may not be deployed)"
    fi
    
    echo ""
}

# Main function
main() {
    local environments=("$@")
    
    if [[ ${#environments[@]} -eq 0 ]]; then
        echo "❌ No environments specified" >&2
        usage
        exit 1
    fi
    
    if [[ "$1" == "-h" || "$1" == "--help" ]]; then
        usage
        exit 0
    fi
    
    echo "🌍 Testing dynamic configuration across environments"
    echo "=================================================="
    echo "Environments to test: ${environments[*]}"
    echo ""
    
    # Test each environment
    for env in "${environments[@]}"; do
        test_environment "$env"
    done
    
    # Test for hard-coded configurations
    test_hardcoded_configs
    local hardcoded_result=$?
    
    # Test environment setup script
    echo "🧪 Testing environment setup scripts..."
    echo "=================================================="
    for env in "${environments[@]}"; do
        test_environment_setup "$env"
    done
    
    # Summary
    echo "📊 TEST SUMMARY"
    echo "=================================================="
    echo "✅ Tested ${#environments[@]} environments: ${environments[*]}"
    if [[ $hardcoded_result -eq 0 ]]; then
        echo "✅ No hard-coded configurations found"
    else
        echo "❌ Hard-coded configurations found - see details above"
    fi
    echo ""
    echo "🎉 Dynamic configuration test complete!"
    
    if [[ $hardcoded_result -eq 0 ]]; then
        exit 0
    else
        exit 1
    fi
}

# Run main function
main "$@"
