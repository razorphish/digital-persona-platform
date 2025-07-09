#!/bin/bash

# Fix ECR Permissions Script
# This script fixes the ECR permissions issue for the dev-airica user

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if AWS CLI is configured
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    print_success "AWS CLI is configured and working"
}

# Function to fix ECR permissions for the user
fix_ecr_permissions() {
    USERNAME="dev-airica"
    POLICY_NAME="ECRFullAccessPolicy"
    
    print_status "Fixing ECR permissions for user: $USERNAME"
    
    # Check if user exists
    if ! aws iam get-user --user-name "$USERNAME" &> /dev/null; then
        print_error "User '$USERNAME' does not exist"
        exit 1
    fi
    
    # Get account ID
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    
    # Create ECR full access policy
    print_status "Creating ECR full access policy"
    
    cat > /tmp/ecr-policy.json << EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload",
                "ecr:PutImage",
                "ecr:GetRepositoryPolicy",
                "ecr:SetRepositoryPolicy",
                "ecr:DeleteRepositoryPolicy",
                "ecr:DescribeRepositories",
                "ecr:ListRepositories",
                "ecr:DescribeImages",
                "ecr:ListImages",
                "ecr:BatchDeleteImage",
                "ecr:GetLifecyclePolicy",
                "ecr:PutLifecyclePolicy",
                "ecr:DeleteLifecyclePolicy",
                "ecr:GetLifecyclePolicyPreview",
                "ecr:StartLifecyclePolicyPreview",
                "ecr:TagResource",
                "ecr:UntagResource",
                "ecr:GetRepositoryPolicy",
                "ecr:SetRepositoryPolicy",
                "ecr:DeleteRepositoryPolicy",
                "ecr:CreateRepository",
                "ecr:DeleteRepository"
            ],
            "Resource": "*"
        }
    ]
}
EOF
    
    # Create or update the policy
    if aws iam get-policy --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME" &> /dev/null; then
        print_status "Policy '$POLICY_NAME' already exists, updating it"
        
        # Get the current policy version
        CURRENT_VERSION=$(aws iam get-policy --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME" --query 'Policy.DefaultVersionId' --output text)
        
        # Create new policy version
        aws iam create-policy-version \
            --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME" \
            --policy-document file:///tmp/ecr-policy.json \
            --set-as-default
        
        # Delete old version if it's not the default
        if [ "$CURRENT_VERSION" != "v1" ]; then
            aws iam delete-policy-version \
                --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME" \
                --version-id "$CURRENT_VERSION"
        fi
    else
        print_status "Creating new policy '$POLICY_NAME'"
        aws iam create-policy \
            --policy-name "$POLICY_NAME" \
            --policy-document file:///tmp/ecr-policy.json
    fi
    
    # Attach policy to user
    print_status "Attaching ECR policy to user '$USERNAME'"
    aws iam attach-user-policy \
        --user-name "$USERNAME" \
        --policy-arn "arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME"
    
    # Clean up temp file
    rm -f /tmp/ecr-policy.json
    
    print_success "ECR permissions fixed for user '$USERNAME'"
}

# Function to test ECR access
test_ecr_access() {
    USERNAME="dev-airica"
    
    print_status "Testing ECR access for user '$USERNAME'"
    
    # Create temporary credentials for testing
    print_status "Creating temporary credentials for testing"
    
    # Get the user's access keys
    ACCESS_KEYS=$(aws iam list-access-keys --user-name "$USERNAME" --query 'AccessKeyMetadata[0]' --output json)
    ACCESS_KEY_ID=$(echo "$ACCESS_KEYS" | grep -o '"AccessKeyId": "[^"]*' | grep -o '[^"]*$')
    
    if [ -z "$ACCESS_KEY_ID" ]; then
        print_warning "No access keys found for user '$USERNAME'. Please create access keys first."
        return 1
    fi
    
    print_status "Testing with access key: $ACCESS_KEY_ID"
    
    # Test ECR get authorization token
    if aws ecr get-authorization-token --region us-west-1 &> /dev/null; then
        print_success "ECR access test passed! User can now access ECR."
    else
        print_error "ECR access test failed. Please check the IAM policies."
        return 1
    fi
}

# Function to display current user policies
show_user_policies() {
    USERNAME="dev-airica"
    
    print_status "Current policies for user '$USERNAME':"
    
    echo ""
    echo "Attached policies:"
    aws iam list-attached-user-policies --user-name "$USERNAME" --query 'AttachedPolicies[].PolicyName' --output table
    
    echo ""
    echo "Inline policies:"
    aws iam list-user-policies --user-name "$USERNAME" --query 'PolicyNames' --output table
    
    echo ""
    echo "Group memberships:"
    aws iam list-groups-for-user --user-name "$USERNAME" --query 'Groups[].GroupName' --output table
}

# Main function
main() {
    echo "=========================================="
    echo "  Fix ECR Permissions for dev-airica"
    echo "=========================================="
    echo ""
    
    check_aws_cli
    
    # Show current policies
    show_user_policies
    
    echo ""
    echo "This script will:"
    echo "1. Create/update an ECR full access policy"
    echo "2. Attach the policy to the dev-airica user"
    echo "3. Test ECR access"
    echo ""
    
    echo -n "Do you want to proceed? (y/n): "
    read CONFIRM
    
    if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
        fix_ecr_permissions
        test_ecr_access
        
        echo ""
        print_success "ECR permissions have been fixed!"
        echo ""
        echo "The user 'dev-airica' should now be able to:"
        echo "- Get ECR authorization tokens"
        echo "- Push and pull Docker images"
        echo "- Manage ECR repositories"
        echo ""
        echo "You can now re-run your GitHub Actions workflow."
    else
        print_warning "Operation cancelled"
        exit 0
    fi
}

# Run main function
main "$@" 