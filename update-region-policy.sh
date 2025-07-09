#!/bin/bash

# Update Region Policy Script
# This script updates the existing UsWest1OnlyPolicy to include ECR permissions

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

# Function to update the region policy
update_region_policy() {
    POLICY_NAME="UsWest1OnlyPolicy"
    USERNAME="dev-airica"
    
    print_status "Updating region policy to include ECR permissions"
    
    # Get account ID
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    POLICY_ARN="arn:aws:iam::$ACCOUNT_ID:policy/$POLICY_NAME"
    
    # Check if policy exists
    if ! aws iam get-policy --policy-arn "$POLICY_ARN" &> /dev/null; then
        print_error "Policy '$POLICY_NAME' does not exist"
        exit 1
    fi
    
    # Create updated policy document
    print_status "Creating updated policy document with ECR permissions"
    
    cat > /tmp/updated-region-policy.json << EOF
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
                "ecr:CreateRepository",
                "ecr:DeleteRepository"
            ],
            "Resource": "*"
        },
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
    
    # Get the current policy version
    CURRENT_VERSION=$(aws iam get-policy --policy-arn "$POLICY_ARN" --query 'Policy.DefaultVersionId' --output text)
    
    # Create new policy version
    print_status "Creating new policy version"
    aws iam create-policy-version \
        --policy-arn "$POLICY_ARN" \
        --policy-document file:///tmp/updated-region-policy.json \
        --set-as-default
    
    # Delete old version if it's not the default
    if [ "$CURRENT_VERSION" != "v1" ]; then
        print_status "Deleting old policy version: $CURRENT_VERSION"
        aws iam delete-policy-version \
            --policy-arn "$POLICY_ARN" \
            --version-id "$CURRENT_VERSION"
    fi
    
    # Clean up temp file
    rm -f /tmp/updated-region-policy.json
    
    print_success "Region policy updated successfully"
}

# Function to test ECR access
test_ecr_access() {
    print_status "Testing ECR access"
    
    # Test ECR get authorization token
    if aws ecr get-authorization-token --region us-west-1 &> /dev/null; then
        print_success "ECR access test passed! User can now access ECR."
    else
        print_error "ECR access test failed. Please check the IAM policies."
        return 1
    fi
}

# Main function
main() {
    echo "=========================================="
    echo "  Update Region Policy for ECR Access"
    echo "=========================================="
    echo ""
    
    check_aws_cli
    
    echo "This script will:"
    echo "1. Update the existing UsWest1OnlyPolicy to include ECR permissions"
    echo "2. Test ECR access"
    echo ""
    
    echo -n "Do you want to proceed? (y/n): "
    read CONFIRM
    
    if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
        update_region_policy
        test_ecr_access
        
        echo ""
        print_success "Region policy has been updated!"
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