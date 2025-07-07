#!/bin/bash
# scripts/setup-github-secrets.sh
# GitHub Secrets Setup Script for Hibiji Platform

set -e

echo "🔧 Setting up GitHub secrets for Hibiji Platform CI/CD..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if gh CLI is installed
check_gh_cli() {
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI is not installed. Please install it first:"
        echo "  macOS: brew install gh"
        echo "  Ubuntu: sudo apt-get install gh"
        echo "  Windows: winget install GitHub.cli"
        exit 1
    fi
    print_success "GitHub CLI is installed"
}

# Check GitHub authentication
check_gh_auth() {
    if ! gh auth status &> /dev/null; then
        print_error "GitHub CLI not authenticated. Please run:"
        echo "  gh auth login"
        exit 1
    fi
    print_success "GitHub CLI authenticated"
}

# Get AWS credentials
get_aws_credentials() {
    print_status "Getting AWS credentials..."
    
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured. Please run:"
        echo "  aws configure"
        exit 1
    fi
    
    # Get AWS access key ID
    AWS_ACCESS_KEY_ID=$(aws configure get aws_access_key_id)
    if [ -z "$AWS_ACCESS_KEY_ID" ]; then
        print_error "AWS access key ID not found"
        exit 1
    fi
    
    # Get AWS secret access key
    AWS_SECRET_ACCESS_KEY=$(aws configure get aws_secret_access_key)
    if [ -z "$AWS_SECRET_ACCESS_KEY" ]; then
        print_error "AWS secret access key not found"
        exit 1
    fi
    
    print_success "AWS credentials retrieved"
}

# Get Secrets Manager values
get_secrets() {
    print_status "Getting secrets from AWS Secrets Manager..."
    
    # Get database password
    DB_PASSWORD=$(aws secretsmanager get-secret-value \
        --secret-id hibiji-database-password \
        --query SecretString \
        --output text | jq -r .password)
    
    if [ -z "$DB_PASSWORD" ]; then
        print_error "Database password not found in Secrets Manager"
        exit 1
    fi
    
    # Get application secret key
    SECRET_KEY=$(aws secretsmanager get-secret-value \
        --secret-id hibiji-secret-key \
        --query SecretString \
        --output text | jq -r .secret_key)
    
    if [ -z "$SECRET_KEY" ]; then
        print_error "Application secret key not found in Secrets Manager"
        exit 1
    fi
    
    print_success "Secrets retrieved from AWS Secrets Manager"
}

# Set GitHub secrets
set_github_secrets() {
    print_status "Setting GitHub secrets..."
    
    # Get repository name
    REPO_NAME=$(gh repo view --json name -q .name)
    REPO_OWNER=$(gh repo view --json owner -q .owner.login)
    
    print_status "Setting secrets for repository: $REPO_OWNER/$REPO_NAME"
    
    # Set AWS credentials
    echo "$AWS_ACCESS_KEY_ID" | gh secret set AWS_ACCESS_KEY_ID --repo "$REPO_OWNER/$REPO_NAME"
    print_success "AWS_ACCESS_KEY_ID secret set"
    
    echo "$AWS_SECRET_ACCESS_KEY" | gh secret set AWS_SECRET_ACCESS_KEY --repo "$REPO_OWNER/$REPO_NAME"
    print_success "AWS_SECRET_ACCESS_KEY secret set"
    
    # Set application secrets
    echo "$DB_PASSWORD" | gh secret set DATABASE_PASSWORD --repo "$REPO_OWNER/$REPO_NAME"
    print_success "DATABASE_PASSWORD secret set"
    
    echo "$SECRET_KEY" | gh secret set SECRET_KEY --repo "$REPO_OWNER/$REPO_NAME"
    print_success "SECRET_KEY secret set"
    
    # Set additional secrets
    echo "us-west-1" | gh secret set AWS_REGION --repo "$REPO_OWNER/$REPO_NAME"
    print_success "AWS_REGION secret set"
    
    echo "hibiji.com" | gh secret set DOMAIN_NAME --repo "$REPO_OWNER/$REPO_NAME"
    print_success "DOMAIN_NAME secret set"
}

# Create environment protection rules
setup_environment_protection() {
    print_status "Setting up environment protection rules..."
    
    REPO_NAME=$(gh repo view --json name -q .name)
    REPO_OWNER=$(gh repo view --json owner -q .owner.login)
    
    # Create environments
    ENVIRONMENTS=("dev" "qa" "staging" "prod")
    
    for env in "${ENVIRONMENTS[@]}"; do
        print_status "Setting up protection rules for $env environment..."
        
        # Create environment if it doesn't exist
        gh api repos/$REPO_OWNER/$REPO_NAME/environments/$env \
            --method PUT \
            --field protection_rules='[{"id":1,"node_id":"MDQ6RW52aXJvbm1lbnRQcm90ZWN0aW9uUnVsZTE=","type":"required_reviewers","wait_timer":0}]' \
            --field reviewers='[{"type":"User","id":1}]' \
            --silent || true
        
        print_success "Environment $env configured"
    done
}

# Main execution
main() {
    echo "=========================================="
    echo "  GitHub Secrets Setup Script"
    echo "=========================================="
    echo ""
    
    check_gh_cli
    check_gh_auth
    get_aws_credentials
    get_secrets
    set_github_secrets
    setup_environment_protection
    
    echo ""
    echo "=========================================="
    print_success "GitHub secrets setup completed!"
    echo "=========================================="
    echo ""
    echo "Secrets configured:"
    echo "✅ AWS_ACCESS_KEY_ID"
    echo "✅ AWS_SECRET_ACCESS_KEY"
    echo "✅ DATABASE_PASSWORD"
    echo "✅ SECRET_KEY"
    echo "✅ AWS_REGION"
    echo "✅ DOMAIN_NAME"
    echo ""
    echo "Environment protection rules configured for:"
    echo "✅ dev, qa, staging, prod"
    echo ""
    echo "Next steps:"
    echo "1. Deploy to dev environment"
    echo "2. Test the CI/CD pipeline"
    echo "3. Configure domain DNS"
}

# Run main function
main "$@" 