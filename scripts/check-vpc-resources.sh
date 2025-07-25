#!/bin/bash

# Check resources in a specific VPC
# Usage: ./check-vpc-resources.sh <vpc-id>

set -e

if [ -z "$1" ]; then
  echo "❌ Usage: $0 <vpc-id>"
  echo "Example: $0 vpc-12345678"
  exit 1
fi

VPC_ID=$1

echo "�� Checking resources in VPC: $VPC_ID"
echo "====================================="

# Check if AWS credentials are configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
  echo "❌ AWS credentials not configured. Please run 'aws configure' first."
  exit 1
fi

# Verify VPC exists
VPC_INFO=$(aws ec2 describe-vpcs --vpc-ids $VPC_ID --query "Vpcs[0]" --output json 2>/dev/null || echo "null")

if [ "$VPC_INFO" == "null" ]; then
  echo "❌ VPC $VPC_ID not found"
  exit 1
fi

echo "✅ VPC found: $VPC_ID"

# Check EC2 instances
echo ""
echo "��️  EC2 Instances:"
echo "=================="
INSTANCES=$(aws ec2 describe-instances --filters "Name=vpc-id,Values=$VPC_ID" --query "Reservations[].Instances[?State.Name!='terminated'].{InstanceId:InstanceId,State:State.Name,Type:InstanceType}" --output table)
if [ -z "$INSTANCES" ]; then
  echo "No running instances found"
else
  echo "$INSTANCES"
fi

# Check RDS instances
echo ""
echo "��️  RDS Instances:"
echo "=================="
RDS_INSTANCES=$(aws rds describe-db-instances --query "DBInstances[?DBSubnetGroup.VpcId=='$VPC_ID'].{DBInstanceIdentifier:DBInstanceIdentifier,Status:DBInstanceStatus,Engine:Engine}" --output table 2>/dev/null || echo "No RDS instances found")
echo "$RDS_INSTANCES"

# Check ECS services
echo ""
echo "🐳 ECS Services:"
echo "================"
ECS_SERVICES=$(aws ecs list-services --query "serviceArns" --output text 2>/dev/null || echo "")
if [ -z "$ECS_SERVICES" ]; then
  echo "No ECS services found"
else
  echo "ECS services exist (check ECS console for details)"
fi

# Check Lambda functions
echo ""
echo "⚡ Lambda Functions:"
echo "==================="
LAMBDA_FUNCTIONS=$(aws lambda list-functions --query "Functions[?VpcConfig.VpcId=='$VPC_ID'].{FunctionName:FunctionName,Runtime:Runtime}" --output table 2>/dev/null || echo "No Lambda functions found")
echo "$LAMBDA_FUNCTIONS"

# Check Load Balancers
echo ""
echo "⚖️  Load Balancers:"
echo "=================="
ALB=$(aws elbv2 describe-load-balancers --query "LoadBalancers[?VpcId=='$VPC_ID'].{LoadBalancerArn:LoadBalancerArn,Type:Type,State:State.Code}" --output table 2>/dev/null || echo "No load balancers found")
echo "$ALB"

# Check NAT Gateways
echo ""
echo "🌐 NAT Gateways:"
echo "================"
NAT_GATEWAYS=$(aws ec2 describe-nat-gateways --filters "Name=vpc-id,Values=$VPC_ID" --query "NatGateways[?State!='deleted'].{NatGatewayId:NatGatewayId,State:State}" --output table)
if [ -z "$NAT_GATEWAYS" ]; then
  echo "No NAT gateways found"
else
  echo "$NAT_GATEWAYS"
fi

# Check Internet Gateways
echo ""
echo "�� Internet Gateways:"
echo "====================="
IGW=$(aws ec2 describe-internet-gateways --filters "Name=attachment.vpc-id,Values=$VPC_ID" --query "InternetGateways[].{InternetGatewayId:InternetGatewayId,State:Attachments[0].State}" --output table)
if [ -z "$IGW" ]; then
  echo "No internet gateways found"
else
  echo "$IGW"
fi

# Check Subnets
echo ""
echo "🌐 Subnets:"
echo "==========="
SUBNETS=$(aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" --query "Subnets[].{SubnetId:SubnetId,CidrBlock:CidrBlock,AvailabilityZone:AvailabilityZone,State:State}" --output table)
echo "$SUBNETS"

# Check Security Groups
echo ""
echo "�� Security Groups:"
echo "=================="
SECURITY_GROUPS=$(aws ec2 describe-security-groups --filters "Name=vpc-id,Values=$VPC_ID" --query "SecurityGroups[].{GroupId:GroupId,GroupName:GroupName,Description:Description}" --output table)
echo "$SECURITY_GROUPS"

echo ""
echo "✅ Resource check complete for VPC: $VPC_ID" 