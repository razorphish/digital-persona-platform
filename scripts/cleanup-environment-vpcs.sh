#!/bin/bash

# Cleanup VPCs for specific environments (dev, qa, staging, hotfix)
# Usage: ./cleanup-environment-vpcs.sh <environment>

set -e

if [ -z "$1" ]; then
  echo "❌ Usage: $0 <environment>"
  echo "Example: $0 dev"
  echo "Example: $0 qa"
  echo "Example: $0 staging"
  echo "Example: $0 hotfix"
  exit 1
fi

ENVIRONMENT=$1

echo "🧹 Environment VPC Cleanup Script"
echo "================================="
echo "Target Environment: $ENVIRONMENT"

# Check if AWS credentials are configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
  echo "❌ AWS credentials not configured. Please run 'aws configure' first."
  exit 1
fi

# Get current AWS account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo "🏢 AWS Account: $ACCOUNT_ID"

# Get current region
REGION=$(aws configure get region || echo "us-west-1")
echo "🌍 AWS Region: $REGION"

# Find VPCs with the specified environment tag
echo ""
echo "🔍 Finding VPCs for environment: $ENVIRONMENT"
VPCS=$(aws ec2 describe-vpcs --filters "Name=tag:Environment,Values=$ENVIRONMENT" "Name=state,Values=available" --query "Vpcs[].VpcId" --output text)

if [ -z "$VPCS" ]; then
  echo "✅ No VPCs found for environment: $ENVIRONMENT"
  exit 0
fi

echo "Found VPCs: $VPCS"

# List VPCs with details
echo ""
echo "📋 VPCs for environment $ENVIRONMENT:"
echo "====================================="
aws ec2 describe-vpcs --filters "Name=tag:Environment,Values=$ENVIRONMENT" --query "Vpcs[].{
  VpcId:VpcId,
  CidrBlock:CidrBlock,
  Name:Tags[?Key=='Name'].Value|[0],
  SubEnvironment:Tags[?Key=='SubEnvironment'].Value|[0]
}" --output table

echo ""
echo "⚠️  WARNING: This will delete ALL VPCs for environment: $ENVIRONMENT"
read -p "Do you want to proceed with deletion? (yes/no): " confirm

if [[ "$confirm" == "yes" ]]; then
  echo ""
  echo "🔄 Starting deletion process..."
  
  for vpc_id in $VPCS; do
    echo "��️  Deleting VPC: $vpc_id"
    
    # Delete VPC (this will fail if there are still resources)
    aws ec2 delete-vpc --vpc-id $vpc_id
    
    echo "✅ VPC $vpc_id deleted successfully"
  done
  
  echo ""
  echo "✅ All VPCs for environment $ENVIRONMENT deleted!"
else
  echo "❌ Deletion cancelled"
fi

echo ""
echo "🎉 Environment VPC cleanup completed!" 