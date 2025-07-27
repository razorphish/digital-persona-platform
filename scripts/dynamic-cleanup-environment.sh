#!/bin/bash

# Dynamic Environment Cleanup Script
# Usage: ./scripts/dynamic-cleanup-environment.sh <environment>
# Example: ./scripts/dynamic-cleanup-environment.sh qa10

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}$1${NC}"
}

print_warning() {
    echo -e "${YELLOW}$1${NC}"
}

print_error() {
    echo -e "${RED}$1${NC}"
}

# Check if environment parameter is provided
if [ -z "$1" ]; then
    print_error "❌ Error: Environment parameter is required"
    echo "Usage: $0 <environment>"
    echo "Example: $0 qa10"
    exit 1
fi

TARGET_ENV="$1"
PROJECT_NAME="${PROJECT_NAME:-dpp}"

# Extract main environment (qa from qa10, dev from dev01, etc.)
MAIN_ENV=$(echo "$TARGET_ENV" | sed 's/[0-9]*$//')

print_status "🗑️ Starting dynamic cleanup for environment: ${TARGET_ENV}"
print_status "📋 Main environment: ${MAIN_ENV}, Sub-environment: ${TARGET_ENV}"
print_warning "⚠️  This will delete ALL resources for environment: ${TARGET_ENV}"
print_warning "⚠️  Resources will include: S3 buckets, Lambda functions, RDS clusters, etc."

# Confirmation prompt
if [ "${FORCE_CLEANUP:-false}" != "true" ]; then
    echo ""
    read -p "🔴 Are you sure you want to DELETE environment '${TARGET_ENV}'? Type 'DELETE ${TARGET_ENV}' to confirm: " CONFIRMATION
    
    if [ "$CONFIRMATION" != "DELETE ${TARGET_ENV}" ]; then
        print_error "❌ Cleanup cancelled by user"
        exit 1
    fi
fi

echo ""
print_status "🚀 Proceeding with cleanup for environment: ${TARGET_ENV}"

# 1. AWS Batch Resources (if they exist)
print_status "🧹 Cleaning up AWS Batch resources..."

# Disable and delete Job Queues
JOB_QUEUES=$(aws batch describe-job-queues \
  --query "jobQueues[?starts_with(jobQueueName, '${MAIN_ENV}-${TARGET_ENV}-${PROJECT_NAME}')].jobQueueName" \
  --output text)

for queue in $JOB_QUEUES; do
  if [ -n "$queue" ] && [ "$queue" != "None" ]; then
    print_status "🔄 Disabling job queue: $queue"
    aws batch update-job-queue --job-queue "$queue" --state DISABLED || echo "⚠️ Failed to disable: $queue"
    sleep 10
    print_status "🗑️ Deleting job queue: $queue"
    aws batch delete-job-queue --job-queue "$queue" || echo "⚠️ Failed to delete: $queue"
  fi
done

# Disable and delete Compute Environments
COMPUTE_ENVS=$(aws batch describe-compute-environments \
  --query "computeEnvironments[?starts_with(computeEnvironmentName, '${MAIN_ENV}-${TARGET_ENV}-${PROJECT_NAME}')].computeEnvironmentName" \
  --output text)

for env in $COMPUTE_ENVS; do
  if [ -n "$env" ] && [ "$env" != "None" ]; then
    print_status "🔄 Disabling compute environment: $env"
    aws batch update-compute-environment --compute-environment "$env" --state DISABLED || echo "⚠️ Failed to disable: $env"
    sleep 30
    print_status "🗑️ Deleting compute environment: $env"
    aws batch delete-compute-environment --compute-environment "$env" || echo "⚠️ Failed to delete: $env"
  fi
done

# 2. SQS Queues
print_status "🧹 Cleaning up SQS queues..."
SQS_QUEUES=$(aws sqs list-queues \
  --queue-name-prefix "${MAIN_ENV}-${TARGET_ENV}-${PROJECT_NAME}" \
  --query "QueueUrls" --output text)

for queue_url in $SQS_QUEUES; do
  if [ -n "$queue_url" ] && [ "$queue_url" != "None" ]; then
    print_status "🗑️ Deleting SQS queue: $queue_url"
    aws sqs delete-queue --queue-url "$queue_url" || echo "⚠️ Failed to delete: $queue_url"
  fi
done

# 3. Lambda Functions
print_status "🧹 Cleaning up Lambda functions..."
LAMBDA_FUNCTIONS=$(aws lambda list-functions \
  --query "Functions[?starts_with(FunctionName, '${MAIN_ENV}-${TARGET_ENV}-${PROJECT_NAME}')].FunctionName" \
  --output text)

for func in $LAMBDA_FUNCTIONS; do
  if [ -n "$func" ] && [ "$func" != "None" ]; then
    print_status "🗑️ Deleting Lambda function: $func"
    aws lambda delete-function --function-name "$func" || echo "⚠️ Failed to delete: $func"
  fi
done

# 4. RDS Resources (instances first, then clusters)
print_status "🧹 Cleaning up RDS resources..."

# 4.1 First delete RDS instances
print_status "🧹 Cleaning up RDS instances..."
RDS_INSTANCES=$(aws rds describe-db-instances \
  --query "DBInstances[?starts_with(DBInstanceIdentifier, '${MAIN_ENV}-${TARGET_ENV}-${PROJECT_NAME}')].DBInstanceIdentifier" \
  --output text)

for instance in $RDS_INSTANCES; do
  if [ -n "$instance" ] && [ "$instance" != "None" ]; then
    print_status "🗑️ Deleting RDS instance: $instance"
    aws rds delete-db-instance \
      --db-instance-identifier "$instance" \
      --skip-final-snapshot \
      --delete-automated-backups || echo "⚠️ Failed to delete RDS instance: $instance"
  fi
done

# Wait for instances to be deleted before proceeding to clusters
if [ -n "$RDS_INSTANCES" ] && [ "$RDS_INSTANCES" != "None" ]; then
  print_status "⏳ Waiting for RDS instances to be deleted (this may take a few minutes)..."
  sleep 60
fi

# 4.2 Then delete RDS clusters
print_status "🧹 Cleaning up RDS clusters..."
RDS_CLUSTERS=$(aws rds describe-db-clusters \
  --query "DBClusters[?starts_with(DBClusterIdentifier, '${MAIN_ENV}-${TARGET_ENV}-${PROJECT_NAME}')].DBClusterIdentifier" \
  --output text)

for cluster in $RDS_CLUSTERS; do
  if [ -n "$cluster" ] && [ "$cluster" != "None" ]; then
    print_status "🗑️ Deleting RDS cluster: $cluster"
    aws rds delete-db-cluster \
      --db-cluster-identifier "$cluster" \
      --skip-final-snapshot \
      --delete-automated-backups || echo "⚠️ Failed to delete: $cluster"
  fi
done

# Wait for RDS resources to be fully deleted before VPC cleanup
if [ -n "$RDS_CLUSTERS" ] && [ "$RDS_CLUSTERS" != "None" ]; then
  print_status "⏳ Waiting for RDS clusters to be deleted (this may take a few minutes)..."
  sleep 120  # RDS clusters can take longer to delete
fi

# 5. S3 Buckets (Empty first, then delete)
print_status "🧹 Cleaning up S3 buckets..."
S3_BUCKETS=$(aws s3api list-buckets \
  --query "Buckets[?starts_with(Name, '${MAIN_ENV}-${TARGET_ENV}-${PROJECT_NAME}')].Name" \
  --output text)

for bucket in $S3_BUCKETS; do
  if [ -n "$bucket" ] && [ "$bucket" != "None" ]; then
    print_status "📦 Emptying S3 bucket: $bucket"
    
    # Handle versioned objects and delete markers
    aws s3api list-object-versions --bucket "$bucket" \
      --query '{Objects: [Versions[].{Key:Key,VersionId:VersionId}, DeleteMarkers[].{Key:Key,VersionId:VersionId}][] | [0:1000]}' \
      --output json > "/tmp/${bucket}-versions.json" 2>/dev/null || echo "⚠️ No versions found for $bucket"
    
    # Delete versions if file exists and has content
    if [ -s "/tmp/${bucket}-versions.json" ]; then
      aws s3api delete-objects --bucket "$bucket" --delete "file:///tmp/${bucket}-versions.json" || echo "⚠️ Failed to delete versions for: $bucket"
    fi
    
    # Remove any remaining objects recursively
    aws s3 rm "s3://$bucket" --recursive || echo "⚠️ Failed to empty: $bucket"
    
    print_status "🗑️ Deleting S3 bucket: $bucket"
    aws s3 rb "s3://$bucket" || echo "⚠️ Failed to delete bucket: $bucket"
    
    # Cleanup temp file
    rm -f "/tmp/${bucket}-versions.json"
  fi
done

# 6. Route53 DNS Records
print_status "🧹 Cleaning up Route53 DNS records..."
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones \
  --query "HostedZones[?Name=='hibiji.com.'].Id" \
  --output text | sed 's|/hostedzone/||')

if [ -n "$HOSTED_ZONE_ID" ] && [ "$HOSTED_ZONE_ID" != "None" ]; then
  # Delete website and API records for this environment
  WEBSITE_RECORD="${TARGET_ENV}.hibiji.com"
  API_RECORD="${TARGET_ENV}-api.hibiji.com"
  
  for record in "$WEBSITE_RECORD" "$API_RECORD"; do
    RECORD_DATA=$(aws route53 list-resource-record-sets \
      --hosted-zone-id "$HOSTED_ZONE_ID" \
      --query "ResourceRecordSets[?Name=='${record}.']" \
      --output json | jq '.[0]')
    
    if [ "$RECORD_DATA" != "null" ]; then
      print_status "🗑️ Deleting Route53 record: $record"
      aws route53 change-resource-record-sets \
        --hosted-zone-id "$HOSTED_ZONE_ID" \
        --change-batch "{
          \"Changes\": [{
            \"Action\": \"DELETE\",
            \"ResourceRecordSet\": $RECORD_DATA
          }]
        }" || echo "⚠️ Failed to delete DNS record: $record"
    fi
  done
fi

# 7. VPC Infrastructure Cleanup (handle dependencies in correct order)
print_status "🧹 Cleaning up VPC infrastructure and dependencies..."

# First, find the VPC for this environment
VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=tag:Name,Values=${MAIN_ENV}-${TARGET_ENV}-${PROJECT_NAME}-vpc" \
  --query "Vpcs[0].VpcId" --output text)

if [ -n "$VPC_ID" ] && [ "$VPC_ID" != "None" ] && [ "$VPC_ID" != "null" ]; then
  print_status "🎯 Found VPC to cleanup: $VPC_ID"
  
  # 7.1 Clean up DB Subnet Groups first (they reference subnets)
  print_status "🧹 Cleaning up DB Subnet Groups..."
  DB_SUBNET_GROUPS=$(aws rds describe-db-subnet-groups \
    --query "DBSubnetGroups[?starts_with(DBSubnetGroupName, '${MAIN_ENV}-${TARGET_ENV}')].DBSubnetGroupName" \
    --output text)

  for subnet_group in $DB_SUBNET_GROUPS; do
    if [ -n "$subnet_group" ] && [ "$subnet_group" != "None" ]; then
      print_status "🗑️ Deleting DB subnet group: $subnet_group"
      aws rds delete-db-subnet-group --db-subnet-group-name "$subnet_group" || echo "⚠️ Failed to delete DB subnet group: $subnet_group"
    fi
  done

  # 7.2 Clean up RDS Proxy endpoints
  print_status "🧹 Cleaning up RDS Proxy endpoints..."
  RDS_PROXIES=$(aws rds describe-db-proxies \
    --query "DBProxies[?starts_with(DBProxyName, '${MAIN_ENV}-${TARGET_ENV}')].DBProxyName" \
    --output text)

  for proxy in $RDS_PROXIES; do
    if [ -n "$proxy" ] && [ "$proxy" != "None" ]; then
      print_status "🗑️ Deleting RDS Proxy: $proxy"
      aws rds delete-db-proxy --db-proxy-name "$proxy" || echo "⚠️ Failed to delete RDS proxy: $proxy"
    fi
  done

  # 7.3 Clean up Network Interfaces (ENIs) in this VPC
  print_status "🧹 Cleaning up Network Interfaces (ENIs)..."
  ENI_IDS=$(aws ec2 describe-network-interfaces \
    --filters "Name=vpc-id,Values=$VPC_ID" "Name=status,Values=available" \
    --query "NetworkInterfaces[].NetworkInterfaceId" --output text)

  for eni_id in $ENI_IDS; do
    if [ -n "$eni_id" ] && [ "$eni_id" != "None" ]; then
      print_status "🗑️ Deleting network interface: $eni_id"
      aws ec2 delete-network-interface --network-interface-id "$eni_id" || echo "⚠️ Failed to delete ENI: $eni_id"
    fi
  done

  # 7.4 Clean up VPC Endpoints
  print_status "🧹 Cleaning up VPC Endpoints..."
  VPC_ENDPOINTS=$(aws ec2 describe-vpc-endpoints \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query "VpcEndpoints[].VpcEndpointId" --output text)

  for endpoint_id in $VPC_ENDPOINTS; do
    if [ -n "$endpoint_id" ] && [ "$endpoint_id" != "None" ]; then
      print_status "🗑️ Deleting VPC endpoint: $endpoint_id"
      aws ec2 delete-vpc-endpoint --vpc-endpoint-id "$endpoint_id" || echo "⚠️ Failed to delete VPC endpoint: $endpoint_id"
    fi
  done

  # 7.5 Clean up NAT Gateways
  print_status "🧹 Cleaning up NAT Gateways..."
  NAT_GATEWAYS=$(aws ec2 describe-nat-gateways \
    --filter "Name=vpc-id,Values=$VPC_ID" "Name=state,Values=available" \
    --query "NatGateways[].NatGatewayId" --output text)

  for nat_id in $NAT_GATEWAYS; do
    if [ -n "$nat_id" ] && [ "$nat_id" != "None" ]; then
      print_status "🗑️ Deleting NAT Gateway: $nat_id"
      aws ec2 delete-nat-gateway --nat-gateway-id "$nat_id" || echo "⚠️ Failed to delete NAT Gateway: $nat_id"
    fi
  done

  # 7.6 Clean up Security Groups (except default) with retry
  print_status "🧹 Cleaning up Security Groups..."
  SECURITY_GROUPS=$(aws ec2 describe-security-groups \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query "SecurityGroups[?GroupName!='default'].GroupId" --output text)

  for sg_id in $SECURITY_GROUPS; do
    if [ -n "$sg_id" ] && [ "$sg_id" != "None" ]; then
      print_status "🗑️ Deleting security group: $sg_id"
      
      # Try up to 3 times with delays (dependencies may be clearing)
      for attempt in 1 2 3; do
        if aws ec2 delete-security-group --group-id "$sg_id" 2>/dev/null; then
          print_success "✅ Deleted security group: $sg_id"
          break
        else
          if [ $attempt -lt 3 ]; then
            print_warning "⚠️ Attempt $attempt failed for security group $sg_id, retrying in 30s..."
            sleep 30
          else
            print_warning "⚠️ Failed to delete security group: $sg_id after 3 attempts (may have dependencies)"
          fi
        fi
      done
    fi
  done

  # 7.7 Clean up Route Tables (except main route table)
  print_status "🧹 Cleaning up Route Tables..."
  ROUTE_TABLES=$(aws ec2 describe-route-tables \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query "RouteTables[?Associations[0].Main!=\`true\`].RouteTableId" --output text)

  for rt_id in $ROUTE_TABLES; do
    if [ -n "$rt_id" ] && [ "$rt_id" != "None" ]; then
      print_status "🗑️ Deleting route table: $rt_id"
      aws ec2 delete-route-table --route-table-id "$rt_id" || echo "⚠️ Failed to delete route table: $rt_id"
    fi
  done

  # 7.8 Clean up Subnets with retry
  print_status "🧹 Cleaning up Subnets..."
  SUBNETS=$(aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query "Subnets[].SubnetId" --output text)

  for subnet_id in $SUBNETS; do
    if [ -n "$subnet_id" ] && [ "$subnet_id" != "None" ]; then
      print_status "🗑️ Deleting subnet: $subnet_id"
      
      # Try up to 3 times with delays (dependencies may be clearing)
      for attempt in 1 2 3; do
        if aws ec2 delete-subnet --subnet-id "$subnet_id" 2>/dev/null; then
          print_success "✅ Deleted subnet: $subnet_id"
          break
        else
          if [ $attempt -lt 3 ]; then
            print_warning "⚠️ Attempt $attempt failed for subnet $subnet_id, retrying in 30s..."
            sleep 30
          else
            print_warning "⚠️ Failed to delete subnet: $subnet_id after 3 attempts (may have dependencies)"
          fi
        fi
      done
    fi
  done

  # 7.9 Clean up Internet Gateway (detach first, then delete)
  print_status "🧹 Cleaning up Internet Gateway..."
  IGW_ID=$(aws ec2 describe-internet-gateways \
    --filters "Name=attachment.vpc-id,Values=$VPC_ID" \
    --query "InternetGateways[0].InternetGatewayId" --output text)

  if [ -n "$IGW_ID" ] && [ "$IGW_ID" != "None" ] && [ "$IGW_ID" != "null" ]; then
    print_status "🔌 Detaching Internet Gateway: $IGW_ID from VPC: $VPC_ID"
    aws ec2 detach-internet-gateway --internet-gateway-id "$IGW_ID" --vpc-id "$VPC_ID" || echo "⚠️ Failed to detach IGW"
    
    print_status "🗑️ Deleting Internet Gateway: $IGW_ID"
    aws ec2 delete-internet-gateway --internet-gateway-id "$IGW_ID" || echo "⚠️ Failed to delete IGW: $IGW_ID"
  fi

  # 7.10 Finally, delete the VPC itself with retry
  print_status "🗑️ Deleting VPC: $VPC_ID"
  
  # Try up to 3 times with delays (all dependencies should be clearing)
  VPC_DELETED=false
  for attempt in 1 2 3; do
    if aws ec2 delete-vpc --vpc-id "$VPC_ID" 2>/dev/null; then
      print_success "✅ VPC $VPC_ID deleted successfully!"
      VPC_DELETED=true
      break
    else
      if [ $attempt -lt 3 ]; then
        print_warning "⚠️ Attempt $attempt failed for VPC $VPC_ID, retrying in 60s..."
        sleep 60
      else
        print_warning "⚠️ Failed to delete VPC: $VPC_ID after 3 attempts"
      fi
    fi
  done
  
  if [ "$VPC_DELETED" = "false" ]; then
    print_warning "⚠️ VPC deletion failed - may still have dependencies"
    print_status "🔍 Checking for remaining dependencies..."
    
    # List any remaining dependencies
    aws ec2 describe-vpc-attribute --vpc-id "$VPC_ID" --attribute enableDnsSupport 2>/dev/null && \
    print_warning "⚠️ VPC still exists. Check for remaining dependencies manually."
  fi
else
  print_status "ℹ️ No VPC found for environment ${TARGET_ENV}"
fi

# 8. Clean up Secrets Manager secrets
print_status "🧹 Cleaning up Secrets Manager secrets..."
SECRETS=$(aws secretsmanager list-secrets \
  --query "SecretList[?starts_with(Name, '${MAIN_ENV}-${TARGET_ENV}')].Name" \
  --output text)

for secret in $SECRETS; do
  if [ -n "$secret" ] && [ "$secret" != "None" ]; then
    print_status "🗑️ Deleting secret: $secret"
    aws secretsmanager delete-secret --secret-id "$secret" --force-delete-without-recovery || echo "⚠️ Failed to delete secret: $secret"
  fi
done

# 9. Clean up IAM Roles (environment-specific)
print_status "🧹 Cleaning up IAM Roles..."
IAM_ROLES=$(aws iam list-roles \
  --query "Roles[?starts_with(RoleName, '${MAIN_ENV}-${TARGET_ENV}')].RoleName" \
  --output text)

for role in $IAM_ROLES; do
  if [ -n "$role" ] && [ "$role" != "None" ]; then
    print_status "🗑️ Cleaning up IAM role: $role"
    
    # Detach policies first
    ATTACHED_POLICIES=$(aws iam list-attached-role-policies --role-name "$role" \
      --query "AttachedPolicies[].PolicyArn" --output text)
    for policy_arn in $ATTACHED_POLICIES; do
      if [ -n "$policy_arn" ] && [ "$policy_arn" != "None" ]; then
        aws iam detach-role-policy --role-name "$role" --policy-arn "$policy_arn" || echo "⚠️ Failed to detach policy: $policy_arn"
      fi
    done
    
    # Delete inline policies
    INLINE_POLICIES=$(aws iam list-role-policies --role-name "$role" \
      --query "PolicyNames" --output text)
    for policy_name in $INLINE_POLICIES; do
      if [ -n "$policy_name" ] && [ "$policy_name" != "None" ]; then
        aws iam delete-role-policy --role-name "$role" --policy-name "$policy_name" || echo "⚠️ Failed to delete inline policy: $policy_name"
      fi
    done
    
    # Delete instance profiles (with permission error handling)
    INSTANCE_PROFILES=$(aws iam list-instance-profiles-for-role --role-name "$role" \
      --query "InstanceProfiles[].InstanceProfileName" --output text 2>/dev/null)
    
    if [ $? -eq 0 ]; then
      for profile_name in $INSTANCE_PROFILES; do
        if [ -n "$profile_name" ] && [ "$profile_name" != "None" ]; then
          aws iam remove-role-from-instance-profile --instance-profile-name "$profile_name" --role-name "$role" || echo "⚠️ Failed to remove role from instance profile"
          aws iam delete-instance-profile --instance-profile-name "$profile_name" || echo "⚠️ Failed to delete instance profile: $profile_name"
        fi
      done
    else
      print_warning "⚠️ Insufficient permissions to list instance profiles for role: $role (skipping)"
    fi
    
    # Delete the role
    aws iam delete-role --role-name "$role" || echo "⚠️ Failed to delete IAM role: $role"
  fi
done

# 10. Clean up CloudWatch Log Groups
print_status "🧹 Cleaning up CloudWatch Log Groups..."
LOG_GROUPS=$(aws logs describe-log-groups \
  --query "logGroups[?contains(logGroupName, '${TARGET_ENV}')].logGroupName" \
  --output text)

for log_group in $LOG_GROUPS; do
  if [ -n "$log_group" ] && [ "$log_group" != "None" ]; then
    print_status "🗑️ Deleting log group: $log_group"
    aws logs delete-log-group --log-group-name "$log_group" || echo "⚠️ Failed to delete log group: $log_group"
  fi
done

# 11. Final verification
print_status "🔍 Final verification - checking for remaining resources..."

# Check remaining resources
REMAINING_S3=$(aws s3api list-buckets --query "Buckets[?starts_with(Name, '${MAIN_ENV}-${TARGET_ENV}-${PROJECT_NAME}')].Name" --output text)
REMAINING_LAMBDA=$(aws lambda list-functions --query "Functions[?starts_with(FunctionName, '${MAIN_ENV}-${TARGET_ENV}-${PROJECT_NAME}')].FunctionName" --output text)
REMAINING_RDS=$(aws rds describe-db-clusters --query "DBClusters[?starts_with(DBClusterIdentifier, '${MAIN_ENV}-${TARGET_ENV}-${PROJECT_NAME}')].DBClusterIdentifier" --output text)
REMAINING_VPC=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=${MAIN_ENV}-${TARGET_ENV}-${PROJECT_NAME}-vpc" --query "Vpcs[].VpcId" --output text)

if [ -n "$REMAINING_S3" ] || [ -n "$REMAINING_LAMBDA" ] || [ -n "$REMAINING_RDS" ] || [ -n "$REMAINING_VPC" ]; then
  print_warning "⚠️ Some resources may still exist:"
  [ -n "$REMAINING_S3" ] && echo "   S3: $REMAINING_S3"
  [ -n "$REMAINING_LAMBDA" ] && echo "   Lambda: $REMAINING_LAMBDA"  
  [ -n "$REMAINING_RDS" ] && echo "   RDS: $REMAINING_RDS"
  [ -n "$REMAINING_VPC" ] && echo "   VPC: $REMAINING_VPC"
else
  print_success "✅ Environment '${TARGET_ENV}' cleanup completed successfully!"
fi

print_status "🧹 Cleanup script finished for environment: ${TARGET_ENV}" 