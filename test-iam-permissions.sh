#!/bin/bash
# test-iam-permissions.sh - Test current IAM permissions

echo "🔍 Testing IAM Permissions..."
echo "=============================="

# Test basic AWS access
echo "Testing AWS CLI access..."
aws sts get-caller-identity

echo -e "\nTesting EC2 permissions..."
aws ec2 describe-instances --max-items 1 --query 'Reservations[0].Instances[0].InstanceId' --output text

echo -e "\nTesting ECS permissions..."
aws ecs list-clusters --query 'clusterArns[0]' --output text

echo -e "\nTesting RDS permissions..."
aws rds describe-db-instances --max-items 1 --query 'DBInstances[0].DBInstanceIdentifier' --output text

echo -e "\nTesting IAM permissions (should fail)..."
aws iam list-users --max-items 1 2>&1 | head -1

echo -e "\n✅ Permission tests completed!" 