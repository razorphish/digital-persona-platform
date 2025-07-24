#!/bin/bash

# List and analyze VPCs in AWS
# This script lists all VPCs and their basic information

set -e

echo "📋 AWS VPC Analysis Script"
echo "=========================="

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

# List all VPCs with detailed information
echo ""
echo "📋 All VPCs in $REGION:"
echo "======================="
aws ec2 describe-vpcs --query "Vpcs[].{
  VpcId:VpcId,
  CidrBlock:CidrBlock,
  State:State,
  Name:Tags[?Key=='Name'].Value|[0],
  Environment:Tags[?Key=='Environment'].Value|[0],
  Project:Tags[?Key=='Project'].Value|[0],
  CreatedAt:CreationTime
}" --output table

# Count VPCs by state
echo ""
echo "📊 VPC Statistics:"
echo "=================="
TOTAL_VPCS=$(aws ec2 describe-vpcs --query "length(Vpcs)" --output text)
AVAILABLE_VPCS=$(aws ec2 describe-vpcs --filters "Name=state,Values=available" --query "length(Vpcs)" --output text)
PENDING_VPCS=$(aws ec2 describe-vpcs --filters "Name=state,Values=pending" --query "length(Vpcs)" --output text)

echo "Total VPCs: $TOTAL_VPCS"
echo "Available VPCs: $AVAILABLE_VPCS"
echo "Pending VPCs: $PENDING_VPCS"

# List VPCs by environment tag
echo ""
echo "🏷️  VPCs by Environment Tag:"
echo "============================"
aws ec2 describe-vpcs --query "Vpcs[?Tags[?Key=='Environment']].{
  VpcId:VpcId,
  Environment:Tags[?Key=='Environment'].Value|[0],
  Name:Tags[?Key=='Name'].Value|[0],
  CidrBlock:CidrBlock
}" --output table

echo ""
echo "✅ VPC analysis complete!" 