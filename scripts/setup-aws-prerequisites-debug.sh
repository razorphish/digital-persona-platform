#!/bin/bash
# scripts/setup-aws-prerequisites-debug.sh
# Debug version of AWS Prerequisites Setup Script for Hibiji Platform

set -e

echo "🚀 Setting up AWS prerequisites for Hibiji Platform (DEBUG MODE)..."

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

print_debug() {
    echo -e "${YELLOW}[DEBUG]${NC} $1"
}

# Check if AWS CLI is installed
check_aws_cli() {
    print_debug "Checking AWS CLI installation..."
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
    print_debug "Checking AWS credentials..."
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
    print_debug "Starting S3 bucket creation..."
    BUCKET_NAME="hibiji-terraform-state"
    
    print_status "Creating S3 bucket for Terraform state..."
    
    if aws s3 ls "s3://$BUCKET_NAME" 2>&1 | grep -q 'NoSuchBucket'; then
        print_debug "Creating bucket: $BUCKET_NAME"
        aws s3 mb "s3://$BUCKET_NAME" --region us-west-1
        print_debug "Enabling versioning..."
        aws s3api put-bucket-versioning \
            --bucket "$BUCKET_NAME" \
            --versioning-configuration Status=Enabled
        print_debug "Enabling encryption..."
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
    print_debug "Starting ECR repository creation..."
    print_status "Creating ECR repositories..."
    
    REPOS=("hibiji-backend" "hibiji-frontend")
    
    for repo in "${REPOS[@]}"; do
        print_debug "Checking repository: $repo"
        if ! aws ecr describe-repositories --repository-names "$repo" &> /dev/null; then
            print_debug "Creating repository: $repo"
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
    print_debug "Starting IAM role creation..."
    print_status "Creating IAM roles for ECS..."
    
    # ECS Execution Role
    print_debug "Checking ECS execution role..."
    if ! aws iam get-role --role-name hibiji-ecs-execution-role &> /dev/null; then
        print_debug "Creating ECS execution role..."
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
        
        print_debug "Attaching ECS task execution policy..."
        aws iam attach-role-policy \
            --role-name hibiji-ecs-execution-role \
            --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
        
        print_debug "Attaching ECR read-only policy..."
        aws iam attach-role-policy \
            --role-name hibiji-ecs-execution-role \
            --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly
        
        print_success "ECS execution role created"
    else
        print_warning "ECS execution role already exists"
    fi
    
    # ECS Task Role
    print_debug "Checking ECS task role..."
    if ! aws iam get-role --role-name hibiji-ecs-task-role &> /dev/null; then
        print_debug "Creating ECS task role..."
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
        
        print_debug "Creating custom application policy..."
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

# Create Secrets Manager secrets
create_secrets() {
    print_debug "Starting secrets creation..."
    print_status "Creating Secrets Manager secrets..."
    
    # Check if openssl is available
    print_debug "Checking openssl availability..."
    if ! command -v openssl &> /dev/null; then
        print_error "openssl is not installed. Please install it first:"
        echo "  macOS: brew install openssl"
        echo "  Ubuntu: sudo apt-get install openssl"
        exit 1
    fi
    
    # Generate random passwords
    print_debug "Generating database password..."
    DB_PASSWORD=$(openssl rand -base64 32)
    print_debug "Database password generated (length: ${#DB_PASSWORD})"
    
    print_debug "Generating secret key..."
    SECRET_KEY=$(openssl rand -base64 64)
    print_debug "Secret key generated (length: ${#SECRET_KEY})"
    
    # Database password secret
    print_debug "Checking database password secret..."
    if ! aws secretsmanager describe-secret --secret-id hibiji-database-password &> /dev/null; then
        print_debug "Creating database password secret..."
        aws secretsmanager create-secret \
            --name hibiji-database-password \
            --description "Database password for Hibiji platform" \
            --secret-string "{\"password\":\"$DB_PASSWORD\"}"
        print_success "Database password secret created"
    else
        print_warning "Database password secret already exists"
    fi
    
    # Application secret key
    print_debug "Checking application secret key..."
    if ! aws secretsmanager describe-secret --secret-id hibiji-secret-key &> /dev/null; then
        print_debug "Creating application secret key..."
        aws secretsmanager create-secret \
            --name hibiji-secret-key \
            --description "Application secret key for Hibiji platform" \
            --secret-string "{\"secret_key\":\"$SECRET_KEY\"}"
        print_success "Application secret key created"
    else
        print_warning "Application secret key already exists"
    fi
}

# Main execution
main() {
    echo "=========================================="
    echo "  Hibiji Platform AWS Setup Script (DEBUG)"
    echo "=========================================="
    echo ""
    
    print_debug "Starting main execution..."
    check_aws_cli
    check_aws_credentials
    create_terraform_backend
    create_ecr_repositories
    create_iam_roles
    create_secrets
    
    echo ""
    echo "=========================================="
    print_success "AWS prerequisites setup completed!"
    echo "=========================================="
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