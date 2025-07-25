#!/bin/bash

# =================================
# Manual Fix QA03 Lambda Script
# =================================
# This script manually creates the missing qa-qa03-dpp-api Lambda function
# and imports it into Terraform state to fix the deployment issue

set -e

print_header() {
    echo ""
    echo "🔧 =========================================="
    echo "🎯 MANUAL FIX QA03 LAMBDA"
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

# Check if the Lambda execution role exists
check_lambda_role() {
    print_info "Checking if Lambda execution role exists..."
    
    if aws iam get-role --role-name qa-qa03-dpp-lambda-execution >/dev/null 2>&1; then
        print_success "Lambda execution role qa-qa03-dpp-lambda-execution exists"
        return 0
    else
        print_error "Lambda execution role qa-qa03-dpp-lambda-execution not found"
        print_info "The role must be created first. Run the terraform apply for the role only."
        return 1
    fi
}

# Check if S3 bucket exists for Lambda deployments
check_s3_bucket() {
    print_info "Checking if Lambda deployments S3 bucket exists..."
    
    if aws s3api head-bucket --bucket qa-qa03-dpp-lambda-deployments 2>/dev/null; then
        print_success "S3 bucket qa-qa03-dpp-lambda-deployments exists"
        return 0
    else
        print_error "S3 bucket qa-qa03-dpp-lambda-deployments not found"
        print_info "The bucket must be created first. Run terraform apply for S3 resources."
        return 1
    fi
}

# Create a placeholder Lambda function file
create_placeholder_function() {
    print_info "Creating placeholder Lambda function..."
    
    # Create a simple placeholder function
    cat > /tmp/placeholder-lambda.js << 'EOF'
exports.handler = async (event) => {
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            message: 'Placeholder Lambda function - will be updated by CI/CD',
            timestamp: new Date().toISOString(),
            event: event
        })
    };
};
EOF

    # Create a zip file
    cd /tmp && zip -q placeholder-lambda.zip placeholder-lambda.js
    print_success "Placeholder function created: /tmp/placeholder-lambda.zip"
}

# Upload placeholder to S3
upload_placeholder_to_s3() {
    print_info "Uploading placeholder function to S3..."
    
    if aws s3 cp /tmp/placeholder-lambda.zip s3://qa-qa03-dpp-lambda-deployments/placeholder-function.zip; then
        print_success "Placeholder function uploaded to S3"
        return 0
    else
        print_error "Failed to upload placeholder function to S3"
        return 1
    fi
}

# Create the Lambda function manually
create_lambda_function() {
    print_info "Creating Lambda function qa-qa03-dpp-api..."
    
    # Get the role ARN
    local role_arn=$(aws iam get-role --role-name qa-qa03-dpp-lambda-execution --query 'Role.Arn' --output text)
    print_info "Using role ARN: $role_arn"
    
    # Create the Lambda function
    if aws lambda create-function \
        --function-name qa-qa03-dpp-api \
        --runtime nodejs18.x \
        --role "$role_arn" \
        --handler index.handler \
        --code S3Bucket=qa-qa03-dpp-lambda-deployments,S3Key=placeholder-function.zip \
        --timeout 30 \
        --memory-size 512 \
        --description "DPP API Lambda function for QA03 environment" \
        --environment Variables='{NODE_ENV=qa}' >/dev/null; then
        print_success "Lambda function qa-qa03-dpp-api created successfully"
        return 0
    else
        print_error "Failed to create Lambda function"
        return 1
    fi
}

# Import the Lambda function into Terraform state
import_lambda_to_terraform() {
    print_info "Importing Lambda function into Terraform state..."
    
    # Initialize terraform first
    terraform init >/dev/null 2>&1
    
    # Import the Lambda function
    if terraform import module.lambda_backend.aws_lambda_function.api qa-qa03-dpp-api; then
        print_success "Lambda function imported into Terraform state"
        return 0
    else
        print_error "Failed to import Lambda function into Terraform state"
        return 1
    fi
}

# Verify the fix
verify_fix() {
    print_info "Verifying the fix..."
    
    # Check if Lambda function exists in AWS
    if aws lambda get-function --function-name qa-qa03-dpp-api >/dev/null 2>&1; then
        print_success "Lambda function qa-qa03-dpp-api exists in AWS"
    else
        print_error "Lambda function qa-qa03-dpp-api not found in AWS"
        return 1
    fi
    
    # Check if Lambda function exists in Terraform state
    if terraform state list | grep -q "module.lambda_backend.aws_lambda_function.api"; then
        print_success "Lambda function found in Terraform state"
    else
        print_error "Lambda function still missing from Terraform state"
        return 1
    fi
    
    print_success "✅ Fix verified successfully!"
}

# Clean up temporary files
cleanup() {
    print_info "Cleaning up temporary files..."
    rm -f /tmp/placeholder-lambda.js /tmp/placeholder-lambda.zip
    print_success "Cleanup completed"
}

# Main execution
main() {
    print_header
    
    check_directory
    
    print_warning "This script manually creates the qa-qa03-dpp-api Lambda function"
    print_warning "This is a workaround for the Terraform configuration issue"
    print_info "Proceeding with manual Lambda creation..."
    
    # Check prerequisites
    if ! check_lambda_role; then
        print_error "Prerequisites not met. Exiting."
        exit 1
    fi
    
    if ! check_s3_bucket; then
        print_error "Prerequisites not met. Exiting."
        exit 1
    fi
    
    # Create and upload placeholder
    create_placeholder_function
    upload_placeholder_to_s3
    
    # Create Lambda function
    if create_lambda_function; then
        # Import into Terraform
        if import_lambda_to_terraform; then
            verify_fix
            cleanup
            
            echo ""
            print_success "🎉 Manual fix completed successfully!"
            print_info "The qa-qa03-dpp-api Lambda function has been created and imported"
            print_info "You can now re-trigger the GitHub Actions workflow"
            print_info "The subsequent deployment jobs should now find the Lambda function"
        else
            print_error "Failed to import Lambda into Terraform state"
            cleanup
            exit 1
        fi
    else
        print_error "Failed to create Lambda function"
        cleanup
        exit 1
    fi
}

# Check if script is being sourced or executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi 