#!/bin/bash
# scripts/manage-sub-environments.sh

# AWS Region configuration
AWS_REGION="us-west-1"

# Function to create new sub-environment
create_sub_environment() {
    local main_env=$1
    local sub_env=$2
    
    echo "Creating sub-environment: $sub_env under $main_env in $AWS_REGION"
    
    # Create Terraform workspace
    cd terraform/environments/$main_env
    terraform workspace new $sub_env
    
    # Initialize and deploy
    terraform init
    terraform plan -out=tfplan -var="sub_environment=$sub_env"
    terraform apply tfplan
    
    echo "Sub-environment $sub_env created successfully in $AWS_REGION"
}

# Function to list all sub-environments
list_sub_environments() {
    local main_env=$1
    
    echo "Sub-environments under $main_env in $AWS_REGION:"
    
    cd terraform/environments/$main_env
    terraform workspace list | grep "^$main_env" | sort
}

# Function to destroy sub-environment
destroy_sub_environment() {
    local main_env=$1
    local sub_env=$2
    
    echo "Destroying sub-environment: $sub_env in $AWS_REGION"
    
    cd terraform/environments/$main_env
    terraform workspace select $sub_env
    terraform destroy -var="sub_environment=$sub_env"
    
    # Remove workspace
    terraform workspace select default
    terraform workspace delete $sub_env
    
    echo "Sub-environment $sub_env destroyed successfully"
}

# Function to find next available sub-environment number
find_next_sub_env() {
    local main_env=$1
    
    cd terraform/environments/$main_env
    
    # Get existing sub-environments
    existing_envs=$(terraform workspace list | grep "^$main_env" | sed "s/$main_env//" | sort -n)
    
    # Find next available number
    next_num=1
    for env_num in $existing_envs; do
        if [ "$env_num" = "$next_num" ]; then
            next_num=$((next_num + 1))
        else
            break
        fi
    done
    
    echo "${main_env}${next_num:02d}"
}

# Function to create wildcard sub-environment
create_wildcard_sub_env() {
    local main_env=$1
    
    next_sub_env=$(find_next_sub_env $main_env)
    create_sub_environment $main_env $next_sub_env
    
    echo "Created wildcard sub-environment: $next_sub_env in $AWS_REGION"
}

# Function to check AWS credentials
check_aws_credentials() {
    echo "Checking AWS credentials for region $AWS_REGION..."
    
    if ! aws sts get-caller-identity --region $AWS_REGION > /dev/null 2>&1; then
        echo "Error: AWS credentials not configured or invalid for region $AWS_REGION"
        echo "Please run: aws configure --region $AWS_REGION"
        exit 1
    fi
    
    echo "AWS credentials verified for region $AWS_REGION"
}

# Main script logic
case "$1" in
    "create")
        check_aws_credentials
        create_sub_environment "$2" "$3"
        ;;
    "list")
        list_sub_environments "$2"
        ;;
    "destroy")
        check_aws_credentials
        destroy_sub_environment "$2" "$3"
        ;;
    "wildcard")
        check_aws_credentials
        create_wildcard_sub_env "$2"
        ;;
    "next")
        find_next_sub_env "$2"
        ;;
    "check-aws")
        check_aws_credentials
        ;;
    *)
        echo "Usage: $0 {create|list|destroy|wildcard|next|check-aws} [main_env] [sub_env]"
        echo "Examples:"
        echo "  $0 create dev dev04"
        echo "  $0 list dev"
        echo "  $0 destroy dev dev04"
        echo "  $0 wildcard dev"
        echo "  $0 next dev"
        echo "  $0 check-aws"
        echo ""
        echo "AWS Region: $AWS_REGION"
        exit 1
        ;;
esac 