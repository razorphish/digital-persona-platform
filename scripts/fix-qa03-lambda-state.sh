#!/bin/bash

# =================================
# Fix QA03 Lambda State Script
# =================================
# This script fixes the missing qa-qa03-dpp-api Lambda function
# by forcing Terraform to create the missing resources

set -e

print_header() {
    echo ""
    echo "🔧 =========================================="
    echo "🎯 FIX QA03 LAMBDA STATE"
    echo "🔧 =========================================="
    echo ""
}

print_success() {
    echo "✅ $1"
}

print_error() {
    echo "❌ $1"
}

print_info() {
    echo "📋 $1"
}

print_warning() {
    echo "⚠️ $1"
}

# Check if we're in the right directory
check_directory() {
    if [[ ! -f "main.tf" ]] || [[ ! -d "../../modules/lambda-backend" ]]; then
        print_error "Must be run from terraform/environments/qa directory"
        exit 1
    fi
    print_success "Running from correct directory: $(pwd)"
}

# Initialize terraform
init_terraform() {
    print_info "Initializing Terraform..."
    if terraform init; then
        print_success "Terraform initialized successfully"
    else
        print_error "Terraform init failed"
        exit 1
    fi
}

# Check current state
check_current_state() {
    print_info "Checking current Terraform state..."
    
    # Check what's in state
    echo "📋 Resources in Terraform state:"
    terraform state list | grep -E "(lambda|api)" || echo "No Lambda resources found in state"
    
    # Check what exists in AWS
    echo ""
    print_info "Checking AWS Lambda functions..."
    aws lambda list-functions --query "Functions[?contains(FunctionName, 'qa-qa03')].FunctionName" --output table || echo "No qa-qa03 functions found"
}

# Force creation of missing Lambda function
force_create_lambda() {
    print_info "Attempting to force creation of missing Lambda function..."
    
    # Try targeted apply for just the Lambda backend module
    print_info "Running targeted terraform apply for lambda_backend module..."
    
    # Apply with auto-approve and target the specific module
    if terraform apply -target=module.lambda_backend -auto-approve; then
        print_success "Lambda backend module apply completed"
    else
        print_warning "Targeted apply failed, trying individual resources..."
        
        # Try applying individual resources within the Lambda module
        print_info "Trying to apply Lambda function specifically..."
        if terraform apply -target=module.lambda_backend.aws_lambda_function.api -auto-approve; then
            print_success "Lambda function created successfully"
        else
            print_error "Failed to create Lambda function"
            return 1
        fi
    fi
}

# Verify the fix
verify_fix() {
    print_info "Verifying the fix..."
    
    # Check if Lambda function now exists in state
    if terraform state list | grep -q "module.lambda_backend.aws_lambda_function.api"; then
        print_success "Lambda function found in Terraform state"
    else
        print_error "Lambda function still missing from Terraform state"
        return 1
    fi
    
    # Check if Lambda function exists in AWS
    if aws lambda get-function --function-name qa-qa03-dpp-api >/dev/null 2>&1; then
        print_success "Lambda function qa-qa03-dpp-api exists in AWS"
    else
        print_error "Lambda function qa-qa03-dpp-api not found in AWS"
        return 1
    fi
    
    print_success "✅ Fix verified successfully!"
}

# Run a final terraform plan to show current state
show_final_state() {
    print_info "Running final terraform plan to show current state..."
    
    if terraform plan -detailed-exitcode; then
        print_success "✅ No further changes needed - infrastructure is up to date"
    elif [ $? -eq 2 ]; then
        print_info "📋 Additional changes detected (this is normal, continuing...)"
    else
        print_warning "Terraform plan failed, but Lambda function should be created"
    fi
}

# Main execution
main() {
    print_header
    
    check_directory
    init_terraform
    check_current_state
    
    print_info "🎯 Attempting to fix missing Lambda function..."
    
    if force_create_lambda; then
        verify_fix
        show_final_state
        
        echo ""
        print_success "🎉 QA03 Lambda state fixed successfully!"
        print_info "The qa-qa03-dpp-api Lambda function should now be created"
        print_info "You can now re-trigger the GitHub Actions workflow"
    else
        print_error "Failed to fix Lambda state"
        exit 1
    fi
}

# Check if script is being sourced or executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 