#!/bin/bash

# Cleanup VPCs that have no resources
# This script identifies and removes VPCs that are completely empty

set -e

echo "🧹 Empty VPC Cleanup Script"
echo "==========================="

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

# Get all available VPCs
echo ""
echo "�� Finding empty VPCs..."
VPCS=$(aws ec2 describe-vpcs --filters "Name=state,Values=available" --query "Vpcs[].VpcId" --output text)

EMPTY_VPCS=()

for vpc_id in $VPCS; do
  echo " Checking VPC: $vpc_id"
  
  # Check for EC2 instances
  INSTANCES=$(aws ec2 describe-instances --filters "Name=vpc-id,Values=$vpc_id" --query "Reservations[].Instances[?State.Name!='terminated'].InstanceId" --output text)
  
  # Check for RDS instances
  RDS_INSTANCES=$(aws rds describe-db-instances --query "DBInstances[?DBSubnetGroup.VpcId=='$vpc_id'].DBInstanceIdentifier" --output text 2>/dev/null || echo "")
  
  # Check for Lambda functions
  LAMBDA_FUNCTIONS=$(aws lambda list-functions --query "Functions[?VpcConfig.VpcId=='$vpc_id'].FunctionName" --output text 2>/dev/null || echo "")
  
  # Check for Load Balancers
  ALB=$(aws elbv2 describe-load-balancers --query "LoadBalancers[?VpcId=='$vpc_id'].LoadBalancerArn" --output text 2>/dev/null || echo "")
  
  # Check for NAT Gateways
  NAT_GATEWAYS=$(aws ec2 describe-nat-gateways --filters "Name=vpc-id,Values=$vpc_id" --query "NatGateways[?State!='deleted'].NatGatewayId" --output text)
  
  # Check for Network Interfaces
  ENIS=$(aws ec2 describe-network-interfaces --filters "Name=vpc-id,Values=$vpc_id" --query "NetworkInterfaces[].NetworkInterfaceId" --output text)
  
  # If no resources found, mark as empty
  if [ -z "$INSTANCES" ] && [ -z "$RDS_INSTANCES" ] && [ -z "$LAMBDA_FUNCTIONS" ] && [ -z "$ALB" ] && [ -z "$NAT_GATEWAYS" ] && [ -z "$ENIS" ]; then
    echo "  ✅ VPC $vpc_id is empty"
    EMPTY_VPCS+=("$vpc_id")
  else
    echo "  ❌ VPC $vpc_id has resources"
  fi
done

echo ""
echo "�� Empty VPC Summary:"
echo "====================="
echo "Empty VPCs found: ${#EMPTY_VPCS[@]}"

if [ ${#EMPTY_VPCS[@]} -gt 0 ]; then
  echo ""
  echo "🗑️  Empty VPCs that can be deleted:"
  for vpc_id in "${EMPTY_VPCS[@]}"; do
    echo "  - $vpc_id"
  done
  
  echo ""
  echo "⚠️  WARNING: This will permanently delete the above VPCs!"
  read -p "Do you want to proceed with deletion? (yes/no): " confirm
  
  if [[ "$confirm" == "yes" ]]; then
    echo ""
    echo "🔄 Starting deletion process..."
    
    for vpc_id in "${EMPTY_VPCS[@]}"; do
      echo "��️  Deleting VPC: $vpc_id"
      
      # Delete VPC (this will fail if there are still resources)
      aws ec2 delete-vpc --vpc-id $vpc_id
      
      echo "✅ VPC $vpc_id deleted successfully"
    done
    
    echo ""
    echo "✅ All empty VPCs deleted!"
  else
    echo "❌ Deletion cancelled"
  fi
else
  echo "✅ No empty VPCs found"
fi

echo ""
echo "🎉 Empty VPC cleanup completed!" 