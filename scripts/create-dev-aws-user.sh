#!/bin/bash

# AWS Developer User Creation Script
# This script creates a developer user with full development access and user management permissions
# chmod +x create-dev-user.sh
set -e  # Exit on any error

# Configuration
USERNAME=""
GROUP_NAME="developers"
TEMP_PASSWORD="TempPassword123!"
REGION="us-west-1"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Function to check if AWS CLI is configured
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    print_status "AWS CLI is configured and working"
}

# Function to get username input
get_username() {
    while [[ -z "$USERNAME" ]]; do
        echo -n "Enter username for the new developer: "
        read USERNAME
        
        if [[ -z "$USERNAME" ]]; then
            print_warning "Username cannot be empty. Please try again."
        elif [[ ! "$USERNAME" =~ ^[a-zA-Z0-9._-]+$ ]]; then
            print_warning "Username can only contain letters, numbers, dots, underscores, and hyphens."
            USERNAME=""
        fi
    done
}

# Function to create developers group if it doesn't exist
create_developers_group() {
    print_header "Creating Developers Group"
    
    # Check if group exists
    if aws iam get-group --group-name "$GROUP_NAME" &> /dev/null; then
        print_status "Group '$GROUP_NAME' already exists"
    else
        print_status "Creating group '$GROUP_NAME'"
        aws iam create-group --group-name "$GROUP_NAME"
    fi
    
    # Attach PowerUserAccess policy
    print_status "Attaching PowerUserAccess policy to group"
    aws iam attach-group-policy \
        --group-name "$GROUP_NAME" \
        --policy-arn arn:aws:iam::aws:policy/PowerUserAccess || true
    
    # Attach IAM Full Access policy for user management
    print_status "Attaching IAMFullAccess policy to group"
    aws iam attach-group-policy \
        --group-name "$GROUP_NAME" \
        --policy-arn arn:aws:iam::aws:policy/IAMFullAccess || true
    
    # Attach Billing policy for cost monitoring
    print_status "Attaching Billing policy to group"
    aws iam attach-group-policy \
        --group-name "$GROUP_NAME" \
        --policy-arn arn:aws:iam::aws:policy/job-function/Billing || true
}

# Function to create user
create_user() {
    print_header "Creating User: $USERNAME"
    
    # Check if user exists
    if aws iam get-user --user-name "$USERNAME" &> /dev/null; then
        print_warning "User '$USERNAME' already exists"
        return 1
    fi
    
    # Create user
    print_status "Creating user '$USERNAME'"
    aws iam create-user --user-name "$USERNAME"
    
    # Add user to developers group
    print_status "Adding user to '$GROUP_NAME' group"
    aws iam add-user-to-group \
        --group-name "$GROUP_NAME" \
        --user-name "$USERNAME"
    
    return 0
}

# Function to create console access
create_console_access() {
    print_header "Creating Console Access"
    
    print_status "Creating console login profile"
    aws iam create-login-profile \
        --user-name "$USERNAME" \
        --password "$TEMP_PASSWORD" \
        --password-reset-required
    
    print_status "Console access created successfully"
}

# Function to create access keys
create_access_keys() {
    print_header "Creating Access Keys"
    
    print_status "Creating programmatic access keys"
    ACCESS_KEY_OUTPUT=$(aws iam create-access-key --user-name "$USERNAME")
    
    # Extract access key details
    ACCESS_KEY_ID=$(echo "$ACCESS_KEY_OUTPUT" | grep -o '"AccessKeyId": "[^"]*' | grep -o '[^"]*$')
    SECRET_ACCESS_KEY=$(echo "$ACCESS_KEY_OUTPUT" | grep -o '"SecretAccessKey": "[^"]*' | grep -o '[^"]*$')
    
    print_status "Access keys created successfully"
}

# Function to create custom IAM policy for region restriction (optional)
create_region_policy() {
    print_header "Creating Region Restriction Policy"
    
    POLICY_NAME="UsWest1OnlyPolicy"
    
    # Create policy document
    cat > /tmp/region-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "*",
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "aws:RequestedRegion": "us-west-1"
                }
            }
        },
        {
            "Effect": "Allow",
            "Action": [
                "iam:*",
                "cloudfront:*",
                "route53:*",
                "waf:*",
                "support:*",
                "trustedadvisor:*",
                "organizations:*"
            ],
            "Resource": "*"
        }
    ]
}
EOF
    
    # Get account ID
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    
    # Create policy if it doesn't exist
    if aws iam get-policy --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME" &> /dev/null; then
        print_status "Region policy already exists"
    else
        print_status "Creating region restriction policy"
        aws iam create-policy \
            --policy-name "$POLICY_NAME" \
            --policy-document file:///tmp/region-policy.json
    fi
    
    # Attach policy to user
    print_status "Attaching region policy to user"
    aws iam attach-user-policy \
        --user-name "$USERNAME" \
        --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME"
    
    # Clean up temp file
    rm -f /tmp/region-policy.json
}

# Function to display user information
display_user_info() {
    print_header "User Creation Complete!"
    
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    
    echo -e "${GREEN}User Details:${NC}"
    echo "├── Username: $USERNAME"
    echo "├── Group: $GROUP_NAME"
    echo "├── Region: $REGION"
    echo "└── Account ID: $ACCOUNT_ID"
    echo ""
    
    echo -e "${GREEN}Console Access:${NC}"
    echo "├── URL: https://$ACCOUNT_ID.signin.aws.amazon.com/console"
    echo "├── Username: $USERNAME"
    echo "├── Password: $TEMP_PASSWORD"
    echo "└── Password Reset Required: Yes"
    echo ""
    
    echo -e "${GREEN}Programmatic Access:${NC}"
    echo "├── Access Key ID: $ACCESS_KEY_ID"
    echo "├── Secret Access Key: $SECRET_ACCESS_KEY"
    echo "└── Default Region: $REGION"
    echo ""
    
    echo -e "${GREEN}Permissions:${NC}"
    echo "├── PowerUserAccess (Full AWS services except IAM user/role management)"
    echo "├── IAMFullAccess (Can create and manage IAM users)"
    echo "├── Billing (Can view billing information)"
    echo "└── Region Restricted to: us-west-1"
    echo ""
    
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Save the access keys securely"
    echo "2. Configure AWS CLI with these credentials"
    echo "3. User must change password on first console login"
    echo "4. Consider enabling MFA for additional security"
    echo ""
    
    echo -e "${BLUE}AWS CLI Configuration:${NC}"
    echo "aws configure"
    echo "AWS Access Key ID: $ACCESS_KEY_ID"
    echo "AWS Secret Access Key: $SECRET_ACCESS_KEY"
    echo "Default region name: $REGION"
    echo "Default output format: json"
}

# Function to save credentials to file
save_credentials() {
    CREDS_FILE="aws-credentials-$USERNAME.txt"
    
    cat > "$CREDS_FILE" << EOF
AWS Developer User Credentials
==============================

User: $USERNAME
Created: $(date)
Account ID: $(aws sts get-caller-identity --query Account --output text)

Console Access:
URL: https://$(aws sts get-caller-identity --query Account --output text).signin.aws.amazon.com/console
Username: $USERNAME
Password: $TEMP_PASSWORD
Password Reset Required: Yes

Programmatic Access:
Access Key ID: $ACCESS_KEY_ID
Secret Access Key: $SECRET_ACCESS_KEY
Default Region: $REGION

AWS CLI Configuration:
aws configure
AWS Access Key ID: $ACCESS_KEY_ID
AWS Secret Access Key: $SECRET_ACCESS_KEY
Default region name: $REGION
Default output format: json

Permissions:
- PowerUserAccess (Full AWS services except IAM user/role management)
- IAMFullAccess (Can create and manage IAM users)
- Billing (Can view billing information)
- Region Restricted to: us-west-1

IMPORTANT: Store these credentials securely and delete this file after use!
EOF
    
    print_status "Credentials saved to: $CREDS_FILE"
}

# Main function
main() {
    print_header "AWS Developer User Creation Script"
    
    # Check prerequisites
    check_aws_cli
    
    # Get username
    get_username
    
    # Ask for region restriction
    echo -n "Do you want to restrict user to us-west-1 region only? (y/n): "
    read RESTRICT_REGION
    
    # Create developers group
    create_developers_group
    
    # Create user
    if create_user; then
        # Create console access
        create_console_access
        
        # Create access keys
        create_access_keys
        
        # Apply region restriction if requested
        if [[ "$RESTRICT_REGION" =~ ^[Yy]$ ]]; then
            create_region_policy
        fi
        
        # Display information
        display_user_info
        
        # Save credentials
        echo -n "Save credentials to file? (y/n): "
        read SAVE_CREDS
        if [[ "$SAVE_CREDS" =~ ^[Yy]$ ]]; then
            save_credentials
        fi
        
        print_status "Script completed successfully!"
    else
        print_error "User creation failed or user already exists"
        exit 1
    fi
}

# Run main function
main "$@"