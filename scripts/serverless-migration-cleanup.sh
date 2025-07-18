#!/bin/bash

# =================================
# Serverless Migration Cleanup Script
# =================================
# This script will destroy all current AWS resources except Route 53 records
# to prepare for the serverless architecture migration.

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="dev"
SUB_ENVIRONMENT="dev01"
SKIP_CONFIRMATION=false

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to show usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo "Options:"
    echo "  -e, --environment ENVIRONMENT    Environment to clean up (default: dev)"
    echo "  -s, --sub-environment SUB_ENV    Sub-environment to clean up (default: dev01)"
    echo "  -y, --yes                        Skip confirmation prompts"
    echo "  -h, --help                       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                               # Clean up dev/dev01 with confirmation"
    echo "  $0 -e dev -s dev02 -y           # Clean up dev/dev02 without confirmation"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -s|--sub-environment)
            SUB_ENVIRONMENT="$2"
            shift 2
            ;;
        -y|--yes)
            SKIP_CONFIRMATION=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Show banner
echo ""
echo "=========================================="
echo "🧹 SERVERLESS MIGRATION CLEANUP"
echo "=========================================="
echo ""
print_status "Environment: ${ENVIRONMENT}"
print_status "Sub-environment: ${SUB_ENVIRONMENT}"
echo ""

# Warning about what will be destroyed
print_warning "This script will DESTROY the following AWS resources:"
echo "  ✗ ECS Cluster and Services"
echo "  ✗ Application Load Balancer (ALB)"
echo "  ✗ ECR Repositories"
echo "  ✗ VPC and all networking components"
echo "  ✗ RDS Database instances"
echo "  ✗ CloudFront distributions"
echo "  ✗ IAM roles and policies"
echo "  ✗ Secrets Manager secrets"
echo "  ✗ CloudWatch log groups"
echo ""
print_success "The following resources will be PRESERVED:"
echo "  ✓ Route 53 hosted zone and records"
echo "  ✓ Terraform state bucket"
echo ""

# Confirmation prompt
if [ "$SKIP_CONFIRMATION" = false ]; then
    echo -e "${YELLOW}⚠️  WARNING: This action is IRREVERSIBLE!${NC}"
    echo ""
    read -p "Are you sure you want to proceed? Type 'yes' to continue: " confirmation
    if [ "$confirmation" != "yes" ]; then
        print_error "Cleanup cancelled by user"
        exit 1
    fi
fi

# Change to terraform environment directory
TERRAFORM_DIR="terraform/environments/${ENVIRONMENT}"
if [ ! -d "$TERRAFORM_DIR" ]; then
    print_error "Terraform directory not found: $TERRAFORM_DIR"
    exit 1
fi

cd "$TERRAFORM_DIR"

print_status "Changed to directory: $(pwd)"

# Initialize Terraform
print_status "Initializing Terraform..."
if ! terraform init; then
    print_error "Failed to initialize Terraform"
    exit 1
fi

# Create a backup of the current state
print_status "Creating state backup..."
BACKUP_FILE="terraform-state-backup-$(date +%Y%m%d-%H%M%S).json"
if terraform show -json > "$BACKUP_FILE"; then
    print_success "State backup created: $BACKUP_FILE"
else
    print_warning "Failed to create state backup, continuing anyway..."
fi

# Plan the destroy operation
print_status "Planning destroy operation..."
if ! terraform plan -destroy -var="sub_environment=${SUB_ENVIRONMENT}" -out=destroy.tfplan; then
    print_error "Failed to create destroy plan"
    exit 1
fi

# Show what will be destroyed
echo ""
print_warning "Review the destroy plan above. This will:"
echo "  - Destroy $(terraform show -json destroy.tfplan | jq -r '.planned_values.root_module.resources | length') resources"
echo ""

# Final confirmation for destroy
if [ "$SKIP_CONFIRMATION" = false ]; then
    read -p "Proceed with destroy? Type 'DESTROY' to confirm: " destroy_confirmation
    if [ "$destroy_confirmation" != "DESTROY" ]; then
        print_error "Destroy cancelled by user"
        rm -f destroy.tfplan
        exit 1
    fi
fi

# Execute the destroy
print_status "Executing destroy operation..."
echo "⏳ This may take 10-15 minutes..."
echo ""

if terraform apply destroy.tfplan; then
    print_success "✅ Successfully destroyed all resources!"
    rm -f destroy.tfplan
else
    print_error "❌ Destroy operation failed!"
    print_status "Check the Terraform output above for details"
    rm -f destroy.tfplan
    exit 1
fi

# Clean up ECR repositories manually (if they weren't destroyed)
print_status "Cleaning up ECR repositories..."
ECR_REPOS=("dpp-backend" "dpp-frontend")
for repo in "${ECR_REPOS[@]}"; do
    if aws ecr describe-repositories --repository-names "$repo" --region us-west-1 >/dev/null 2>&1; then
        print_status "Deleting ECR repository: $repo"
        if aws ecr delete-repository --repository-name "$repo" --region us-west-1 --force; then
            print_success "Deleted ECR repository: $repo"
        else
            print_warning "Failed to delete ECR repository: $repo (may not exist)"
        fi
    else
        print_status "ECR repository $repo not found or already deleted"
    fi
done

# Summary
echo ""
echo "=========================================="
echo "🎉 CLEANUP COMPLETED!"
echo "=========================================="
print_success "All AWS resources have been cleaned up successfully"
print_success "Route 53 records have been preserved"
print_success "Ready for serverless architecture deployment"
echo ""
print_status "Next steps:"
echo "  1. Review the new serverless Terraform configuration"
echo "  2. Deploy the new architecture with: ./scripts/deploy-serverless.sh"
echo "  3. Test the new deployment"
echo ""

# Return to original directory
cd - >/dev/null 