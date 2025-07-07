#!/bin/bash
# scripts/setup-aws-prerequisites-skip-secrets.sh
# AWS Prerequisites Setup Script for Hibiji Platform (skips secrets)

set -e

echo "🚀 Setting up AWS prerequisites for Hibiji Platform (SKIPPING SECRETS)..."

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

# Check if AWS CLI is installed
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed. Please install it first:"
        echo "  macOS: brew install awscli"
        echo "  Ubuntu: sudo apt-get install awscli"
        echo "  Windows: Download from https://aws.amazon.com/cli/"
        exit 1
    fi
    print_success "AWS CLI is installed"
}

# Check AWS credentials
check_aws_credentials() {
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured. Please run:"
        echo "  aws configure"
        exit 1
    fi
    
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    USER_ARN=$(aws sts get-caller-identity --query Arn --output text)
    print_success "AWS credentials configured for account: $ACCOUNT_ID"
    print_status "User: $USER_ARN"
}

# Create S3 bucket for Terraform state
create_terraform_backend() {
    BUCKET_NAME="hibiji-terraform-state"
    
    print_status "Creating S3 bucket for Terraform state..."
    
    if aws s3 ls "s3://$BUCKET_NAME" 2>&1 | grep -q 'NoSuchBucket'; then
        aws s3 mb "s3://$BUCKET_NAME" --region us-west-1
        aws s3api put-bucket-versioning \
            --bucket "$BUCKET_NAME" \
            --versioning-configuration Status=Enabled
        aws s3api put-bucket-encryption \
            --bucket "$BUCKET_NAME" \
            --server-side-encryption-configuration '{
                "Rules": [
                    {
                        "ApplyServerSideEncryptionByDefault": {
                            "SSEAlgorithm": "AES256"
                        }
                    }
                ]
            }'
        print_success "S3 bucket '$BUCKET_NAME' created with versioning and encryption"
    else
        print_warning "S3 bucket '$BUCKET_NAME' already exists"
    fi
}

# Create ECR repositories
create_ecr_repositories() {
    print_status "Creating ECR repositories..."
    
    REPOS=("hibiji-backend" "hibiji-frontend")
    
    for repo in "${REPOS[@]}"; do
        if ! aws ecr describe-repositories --repository-names "$repo" &> /dev/null; then
            aws ecr create-repository \
                --repository-name "$repo" \
                --image-scanning-configuration scanOnPush=true \
                --encryption-configuration encryptionType=AES256
            print_success "ECR repository '$repo' created"
        else
            print_warning "ECR repository '$repo' already exists"
        fi
    done
}

# Create IAM roles for ECS
create_iam_roles() {
    print_status "Creating IAM roles for ECS..."
    
    # ECS Execution Role
    if ! aws iam get-role --role-name hibiji-ecs-execution-role --no-cli-pager &> /dev/null; then
        aws iam create-role \
            --role-name hibiji-ecs-execution-role \
            --assume-role-policy-document '{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ecs-tasks.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }'
        
        aws iam attach-role-policy \
            --role-name hibiji-ecs-execution-role \
            --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
        
        aws iam attach-role-policy \
            --role-name hibiji-ecs-execution-role \
            --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly
        
        print_success "ECS execution role created"
    else
        print_warning "ECS execution role already exists"
    fi
    
    # ECS Task Role
    if ! aws iam get-role --role-name hibiji-ecs-task-role --no-cli-pager &> /dev/null; then
        aws iam create-role \
            --role-name hibiji-ecs-task-role \
            --assume-role-policy-document '{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ecs-tasks.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }'
        
        # Create custom policy for application permissions
        aws iam put-role-policy \
            --role-name hibiji-ecs-task-role \
            --policy-name hibiji-application-policy \
            --policy-document '{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ],
                        "Resource": "arn:aws:s3:::hibiji-*/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue"
                        ],
                        "Resource": "arn:aws:secretsmanager:us-west-1:*:secret:hibiji-*"
                    }
                ]
            }'
        
        print_success "ECS task role created"
    else
        print_warning "ECS task role already exists"
    fi
}

# Main execution
main() {
    echo "=========================================="
    echo "  Hibiji Platform AWS Setup Script"
    echo "  (SKIPPING SECRETS CREATION)"
    echo "=========================================="
    echo ""
    
    check_aws_cli
    check_aws_credentials
    create_terraform_backend
    create_ecr_repositories
    create_iam_roles
    
    echo ""
    echo "=========================================="
    print_success "AWS prerequisites setup completed (without secrets)!"
    echo "=========================================="
    echo ""
    echo "Note: Secrets were skipped. You may need to create them manually:"
    echo "1. hibiji-database-password"
    echo "2. hibiji-secret-key"
    echo ""
    echo "Next steps:"
    echo "1. Configure GitHub secrets for CI/CD"
    echo "2. Deploy to dev environment"
    echo "3. Test the deployment"
    echo ""
    echo "For detailed instructions, see DEPLOYMENT_GUIDE.md"
}

# Run main function
main "$@" 