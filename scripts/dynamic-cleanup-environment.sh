#!/bin/bash

# =============================================================================
# Dynamic Environment Cleanup Script (IAC Precedence - COMPREHENSIVE)
# =============================================================================
# Safely removes ALL AWS resources for any sub-environment
# Follows Infrastructure as Code precedence - handles all resource types
# that can cause "AlreadyExists" errors in Terraform deployments
# =============================================================================

set -e

TARGET_ENV="$1"
PROJECT_NAME="dpp"
AWS_REGION="us-west-1"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
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

# Usage check
if [ -z "$TARGET_ENV" ]; then
    print_error "❌ Usage: $0 <environment>"
    print_warning "📋 Examples:"
    echo "   $0 dev01    # Clean dev01 environment"
    echo "   $0 qa03     # Clean qa03 environment"
    echo "   $0 staging  # Clean staging environment"
    exit 1
fi

print_header "🧹 COMPREHENSIVE IAC Environment Cleanup: $TARGET_ENV"
print_warning "⚠️  Following Infrastructure as Code precedence"
print_warning "⚠️  Removing ALL resources that can cause AlreadyExists errors"
echo ""

# Determine main environment from sub-environment
case $TARGET_ENV in
    dev*)
        MAIN_ENV="dev"
        ;;
    qa*)
        MAIN_ENV="qa"
        ;;
    staging*)
        MAIN_ENV="staging"
        ;;
    prod*)
        MAIN_ENV="prod"
        ;;
    hotfix*)
        MAIN_ENV="hotfix"
        ;;
    *)
        MAIN_ENV="dev"  # Default fallback
        ;;
esac

RESOURCE_PREFIX="${MAIN_ENV}-${TARGET_ENV}-${PROJECT_NAME}"

print_header "🏷️  Resource Naming Pattern: $RESOURCE_PREFIX-*"
print_warning "📋 Target Environment: $TARGET_ENV (Main: $MAIN_ENV)"
echo ""

# Confirmation
read -p "🔴 This will DELETE ALL resources for $TARGET_ENV environment. Are you sure? (type 'yes'): " confirmation
if [ "$confirmation" != "yes" ]; then
    print_error "❌ Cleanup cancelled"
    exit 1
fi

print_success "✅ Starting comprehensive cleanup..."
echo ""

# 1. AWS Batch Resources (if they exist)
print_header "🧹 Cleaning up AWS Batch resources..."

# Disable and delete Job Queues
JOB_QUEUES=$(aws batch describe-job-queues \
  --query "jobQueues[?starts_with(jobQueueName, '${RESOURCE_PREFIX}-')].jobQueueName" \
  --output text)

for queue in $JOB_QUEUES; do
  if [ -n "$queue" ] && [ "$queue" != "None" ]; then
    print_header "🔄 Disabling job queue: $queue"
    aws batch update-job-queue --job-queue "$queue" --state DISABLED || echo "⚠️ Failed to disable: $queue"
    sleep 10
    print_header "🗑️ Deleting job queue: $queue"
    aws batch delete-job-queue --job-queue "$queue" || echo "⚠️ Failed to delete: $queue"
  fi
done

# Disable and delete Compute Environments
COMPUTE_ENVS=$(aws batch describe-compute-environments \
  --query "computeEnvironments[?starts_with(computeEnvironmentName, '${RESOURCE_PREFIX}-')].computeEnvironmentName" \
  --output text)

for env in $COMPUTE_ENVS; do
  if [ -n "$env" ] && [ "$env" != "None" ]; then
    print_header "🔄 Disabling compute environment: $env"
    aws batch update-compute-environment --compute-environment "$env" --state DISABLED || echo "⚠️ Failed to disable: $env"
    sleep 30
    print_header "🗑️ Deleting compute environment: $env"
    aws batch delete-compute-environment --compute-environment "$env" || echo "⚠️ Failed to delete: $env"
  fi
done

# 2. SQS Queues
print_header "🧹 Cleaning up SQS queues..."
SQS_QUEUES=$(aws sqs list-queues \
  --queue-name-prefix "${RESOURCE_PREFIX}-" \
  --query "QueueUrls" --output text)

for queue_url in $SQS_QUEUES; do
  if [ -n "$queue_url" ] && [ "$queue_url" != "None" ]; then
    print_header "🗑️ Deleting SQS queue: $queue_url"
    aws sqs delete-queue --queue-url "$queue_url" || echo "⚠️ Failed to delete: $queue_url"
  fi
done

# 3. Lambda Functions
print_header "🧹 Cleaning up Lambda functions..."
LAMBDA_FUNCTIONS=$(aws lambda list-functions \
  --query "Functions[?starts_with(FunctionName, '${RESOURCE_PREFIX}-')].FunctionName" \
  --output text)

for func in $LAMBDA_FUNCTIONS; do
  if [ -n "$func" ] && [ "$func" != "None" ]; then
    print_header "🗑️ Deleting Lambda function: $func"
    aws lambda delete-function --function-name "$func" || echo "⚠️ Failed to delete: $func"
  fi
done

# 4. RDS Resources (instances first, then clusters)
print_header "🧹 Cleaning up RDS resources..."

# 4.1 First delete RDS instances
print_header "🧹 Cleaning up RDS instances..."
RDS_INSTANCES=$(aws rds describe-db-instances \
  --query "DBInstances[?starts_with(DBInstanceIdentifier, '${RESOURCE_PREFIX}-')].DBInstanceIdentifier" \
  --output text)

for instance in $RDS_INSTANCES; do
  if [ -n "$instance" ] && [ "$instance" != "None" ]; then
    print_header "🗑️ Deleting RDS instance: $instance"
    aws rds delete-db-instance \
      --db-instance-identifier "$instance" \
      --skip-final-snapshot \
      --delete-automated-backups || echo "⚠️ Failed to delete RDS instance: $instance"
  fi
done

# Wait for instances to be deleted before proceeding to clusters
if [ -n "$RDS_INSTANCES" ] && [ "$RDS_INSTANCES" != "None" ]; then
  print_header "⏳ Waiting for RDS instances to be deleted (this may take a few minutes)..."
  sleep 60
fi

# 4.2 Then delete RDS clusters
print_header "🧹 Cleaning up RDS clusters..."
RDS_CLUSTERS=$(aws rds describe-db-clusters \
  --query "DBClusters[?starts_with(DBClusterIdentifier, '${RESOURCE_PREFIX}-')].DBClusterIdentifier" \
  --output text)

for cluster in $RDS_CLUSTERS; do
  if [ -n "$cluster" ] && [ "$cluster" != "None" ]; then
    print_header "🗑️ Deleting RDS cluster: $cluster"
    aws rds delete-db-cluster \
      --db-cluster-identifier "$cluster" \
      --skip-final-snapshot \
      --delete-automated-backups || echo "⚠️ Failed to delete: $cluster"
  fi
done

# Wait for RDS resources to be fully deleted before VPC cleanup
if [ -n "$RDS_CLUSTERS" ] && [ "$RDS_CLUSTERS" != "None" ]; then
  print_header "⏳ Waiting for RDS clusters to be deleted (this may take a few minutes)..."
  sleep 120  # RDS clusters can take longer to delete
fi

# 5. S3 Buckets (Empty first, then delete)
print_header "🧹 Cleaning up S3 buckets..."
S3_BUCKETS=$(aws s3api list-buckets \
  --query "Buckets[?starts_with(Name, '${RESOURCE_PREFIX}-')].Name" \
  --output text)

for bucket in $S3_BUCKETS; do
  if [ -n "$bucket" ] && [ "$bucket" != "None" ]; then
    print_header "📦 Emptying S3 bucket: $bucket"
    
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
    
    print_header "🗑️ Deleting S3 bucket: $bucket"
    aws s3 rb "s3://$bucket" || echo "⚠️ Failed to delete bucket: $bucket"
    
    # Cleanup temp file
    rm -f "/tmp/${bucket}-versions.json"
  fi
done

# 6. CloudFront Distributions (before SSL certificates)
print_header "🧹 Cleaning up CloudFront distributions..."
CLOUDFRONT_DISTRIBUTIONS=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?contains(Comment, '${RESOURCE_PREFIX}-') || (Origins.Items[0].DomainName && contains(Origins.Items[0].DomainName, '${RESOURCE_PREFIX}'))].Id" \
  --output text)

for dist_id in $CLOUDFRONT_DISTRIBUTIONS; do
  if [ -n "$dist_id" ] && [ "$dist_id" != "None" ]; then
    print_header "🔍 Checking CloudFront distribution: $dist_id"
    
    # Get distribution details
    DIST_STATUS=$(aws cloudfront get-distribution --id "$dist_id" --query 'Distribution.Status' --output text 2>/dev/null || echo "NotFound")
    DIST_ENABLED=$(aws cloudfront get-distribution --id "$dist_id" --query 'Distribution.DistributionConfig.Enabled' --output text 2>/dev/null || echo "false")
    
    if [ "$DIST_STATUS" = "NotFound" ]; then
      print_header "⚠️ Distribution $dist_id not found, skipping"
      continue
    fi
    
    if [ "$DIST_ENABLED" = "true" ]; then
      print_header "⏸️ Disabling CloudFront distribution: $dist_id"
      
      # Get current config
      aws cloudfront get-distribution-config --id "$dist_id" --output json > "/tmp/dist_config_${dist_id}.json"
      ETAG=$(jq -r '.ETag' "/tmp/dist_config_${dist_id}.json")
      
      # Disable distribution
      jq '.DistributionConfig | .Enabled = false' "/tmp/dist_config_${dist_id}.json" > "/tmp/dist_config_disabled_${dist_id}.json"
      
      aws cloudfront update-distribution \
        --id "$dist_id" \
        --distribution-config "file:///tmp/dist_config_disabled_${dist_id}.json" \
        --if-match "$ETAG" > /dev/null || echo "⚠️ Failed to disable distribution: $dist_id"
      
      print_header "⏳ Waiting for distribution to be disabled (this may take 10-15 minutes)..."
      
      # Wait for distribution to be disabled and deployed
      while true; do
        CURRENT_STATUS=$(aws cloudfront get-distribution --id "$dist_id" --query 'Distribution.Status' --output text)
        CURRENT_ENABLED=$(aws cloudfront get-distribution --id "$dist_id" --query 'Distribution.DistributionConfig.Enabled' --output text)
        
        if [ "$CURRENT_STATUS" = "Deployed" ] && [ "$CURRENT_ENABLED" = "false" ]; then
          break
        fi
        
        print_header "⏳ Distribution status: $CURRENT_STATUS, enabled: $CURRENT_ENABLED - waiting..."
        sleep 30
      done
      
      # Cleanup temp files
      rm -f "/tmp/dist_config_${dist_id}.json" "/tmp/dist_config_disabled_${dist_id}.json"
    fi
    
    if [ "$DIST_STATUS" = "Deployed" ] && [ "$DIST_ENABLED" = "false" ]; then
      print_header "🗑️ Deleting CloudFront distribution: $dist_id"
      
      # Get ETag for deletion
      ETAG=$(aws cloudfront get-distribution --id "$dist_id" --query 'ETag' --output text)
      
      aws cloudfront delete-distribution --id "$dist_id" --if-match "$ETAG" || echo "⚠️ Failed to delete distribution: $dist_id"
    else
      print_header "⚠️ Distribution $dist_id not ready for deletion (Status: $DIST_STATUS, Enabled: $DIST_ENABLED)"
    fi
  fi
done

# 7. SSL Certificates (ACM) - clean up after CloudFront distributions
print_header "🧹 Cleaning up SSL certificates..."

# Clean up both website and API SSL certificates
for cert_type in "website" "api"; do
  if [ "$cert_type" = "website" ]; then
    DOMAIN_PATTERN="${TARGET_ENV}.hibiji.com"
    print_header "🌐 Searching for website SSL certificates..."
  else
    DOMAIN_PATTERN="${TARGET_ENV}-api.hibiji.com"
    print_header "🔗 Searching for API SSL certificates..."
  fi
  
  SSL_CERTIFICATES=$(aws acm list-certificates --region us-east-1 \
    --query "CertificateSummaryList[?contains(DomainName, '${DOMAIN_PATTERN}')].CertificateArn" \
    --output text)

  for cert_arn in $SSL_CERTIFICATES; do
    if [ -n "$cert_arn" ] && [ "$cert_arn" != "None" ]; then
      print_header "🔍 Checking ${cert_type} SSL certificate: $cert_arn"
      
      # Check if certificate is in use by any CloudFront distributions
      CERT_IN_USE=$(aws cloudfront list-distributions \
        --query "DistributionList.Items[?DistributionConfig.ViewerCertificate.ACMCertificateArn=='${cert_arn}'].Id" \
        --output text)
      
      if [ -n "$CERT_IN_USE" ] && [ "$CERT_IN_USE" != "None" ]; then
        print_header "⚠️ SSL certificate still in use by CloudFront distributions: $CERT_IN_USE"
        print_header "💡 Skipping certificate deletion - will be cleaned up when distributions are removed"
      else
        print_header "🗑️ Deleting ${cert_type} SSL certificate: $cert_arn"
        aws acm delete-certificate --certificate-arn "$cert_arn" --region us-east-1 || echo "⚠️ Failed to delete certificate: $cert_arn"
      fi
    fi
  done
done

# 8. Route53 DNS Records
print_header "�� Cleaning up Route53 DNS records..."
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
      print_header "🗑️ Deleting Route53 record: $record"
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
  
  # Delete SSL certificate validation DNS records (CNAME records starting with _)
  print_header "🧹 Cleaning up SSL certificate validation DNS records..."
  
  # Clean up validation records for both website and API certificates
  for cert_domain in "${TARGET_ENV}.hibiji.com" "${TARGET_ENV}-api.hibiji.com"; do
    print_header "🔍 Looking for validation records for: $cert_domain"
    SSL_VALIDATION_RECORDS=$(aws route53 list-resource-record-sets \
      --hosted-zone-id "$HOSTED_ZONE_ID" \
      --query "ResourceRecordSets[?Type=='CNAME' && starts_with(Name, '_') && contains(Name, '${cert_domain}')]" \
      --output json)
    
    if [ "$SSL_VALIDATION_RECORDS" != "[]" ] && [ "$SSL_VALIDATION_RECORDS" != "null" ]; then
      echo "$SSL_VALIDATION_RECORDS" | jq -c '.[]' | while read -r record; do
        RECORD_NAME=$(echo "$record" | jq -r '.Name')
        print_header "🗑️ Deleting SSL validation record: $RECORD_NAME"
        aws route53 change-resource-record-sets \
          --hosted-zone-id "$HOSTED_ZONE_ID" \
          --change-batch "{
            \"Changes\": [{
              \"Action\": \"DELETE\",
              \"ResourceRecordSet\": $record
            }]
          }" || echo "⚠️ Failed to delete SSL validation record: $RECORD_NAME"
      done
    fi
  done
fi

# 7. VPC Infrastructure Cleanup (handle dependencies in correct order)
print_header "🧹 Cleaning up VPC infrastructure and dependencies..."

# First, find the VPC for this environment
VPC_ID=$(aws ec2 describe-vpcs \
  --filters "Name=tag:Name,Values=${RESOURCE_PREFIX}-vpc" \
  --query "Vpcs[0].VpcId" --output text)

if [ -n "$VPC_ID" ] && [ "$VPC_ID" != "None" ] && [ "$VPC_ID" != "null" ]; then
  print_header "🎯 Found VPC to cleanup: $VPC_ID"
  
  # 7.1 Clean up DB Subnet Groups first (they reference subnets)
  print_header "🧹 Cleaning up DB Subnet Groups..."
  DB_SUBNET_GROUPS=$(aws rds describe-db-subnet-groups \
    --query "DBSubnetGroups[?starts_with(DBSubnetGroupName, '${RESOURCE_PREFIX}')].DBSubnetGroupName" \
    --output text)

  for subnet_group in $DB_SUBNET_GROUPS; do
    if [ -n "$subnet_group" ] && [ "$subnet_group" != "None" ]; then
      print_header "🗑️ Deleting DB subnet group: $subnet_group"
      aws rds delete-db-subnet-group --db-subnet-group-name "$subnet_group" || echo "⚠️ Failed to delete DB subnet group: $subnet_group"
    fi
  done

  # 7.2 Clean up RDS Proxy endpoints
  print_header "🧹 Cleaning up RDS Proxy endpoints..."
  RDS_PROXIES=$(aws rds describe-db-proxies \
    --query "DBProxies[?starts_with(DBProxyName, '${RESOURCE_PREFIX}')].DBProxyName" \
    --output text)

  for proxy in $RDS_PROXIES; do
    if [ -n "$proxy" ] && [ "$proxy" != "None" ]; then
      print_header "🗑️ Deleting RDS Proxy: $proxy"
      aws rds delete-db-proxy --db-proxy-name "$proxy" || echo "⚠️ Failed to delete RDS proxy: $proxy"
    fi
  done

  # 7.3 Clean up Network Interfaces (ENIs) in this VPC
  print_header "🧹 Cleaning up Network Interfaces (ENIs)..."
  ENI_IDS=$(aws ec2 describe-network-interfaces \
    --filters "Name=vpc-id,Values=$VPC_ID" "Name=status,Values=available" \
    --query "NetworkInterfaces[].NetworkInterfaceId" --output text)

  for eni_id in $ENI_IDS; do
    if [ -n "$eni_id" ] && [ "$eni_id" != "None" ]; then
      print_header "🗑️ Deleting network interface: $eni_id"
      aws ec2 delete-network-interface --network-interface-id "$eni_id" || echo "⚠️ Failed to delete ENI: $eni_id"
    fi
  done

  # 7.4 Clean up VPC Endpoints
  print_header "🧹 Cleaning up VPC Endpoints..."
  VPC_ENDPOINTS=$(aws ec2 describe-vpc-endpoints \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query "VpcEndpoints[].VpcEndpointId" --output text)

  for endpoint_id in $VPC_ENDPOINTS; do
    if [ -n "$endpoint_id" ] && [ "$endpoint_id" != "None" ]; then
      print_header "🗑️ Deleting VPC endpoint: $endpoint_id"
      aws ec2 delete-vpc-endpoint --vpc-endpoint-id "$endpoint_id" || echo "⚠️ Failed to delete VPC endpoint: $endpoint_id"
    fi
  done

  # 7.5 Clean up NAT Gateways
  print_header "🧹 Cleaning up NAT Gateways..."
  NAT_GATEWAYS=$(aws ec2 describe-nat-gateways \
    --filter "Name=vpc-id,Values=$VPC_ID" "Name=state,Values=available" \
    --query "NatGateways[].NatGatewayId" --output text)

  for nat_id in $NAT_GATEWAYS; do
    if [ -n "$nat_id" ] && [ "$nat_id" != "None" ]; then
      print_header "🗑️ Deleting NAT Gateway: $nat_id"
      aws ec2 delete-nat-gateway --nat-gateway-id "$nat_id" || echo "⚠️ Failed to delete NAT Gateway: $nat_id"
    fi
  done

  # 7.6 Clean up Security Groups (except default) with retry
  print_header "🧹 Cleaning up Security Groups..."
  SECURITY_GROUPS=$(aws ec2 describe-security-groups \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query "SecurityGroups[?GroupName!='default'].GroupId" --output text)

  for sg_id in $SECURITY_GROUPS; do
    if [ -n "$sg_id" ] && [ "$sg_id" != "None" ]; then
      print_header "🗑️ Deleting security group: $sg_id"
      
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
  print_header "🧹 Cleaning up Route Tables..."
  ROUTE_TABLES=$(aws ec2 describe-route-tables \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query "RouteTables[?Associations[0].Main!=\`true\`].RouteTableId" --output text)

  for rt_id in $ROUTE_TABLES; do
    if [ -n "$rt_id" ] && [ "$rt_id" != "None" ]; then
      print_header "🗑️ Deleting route table: $rt_id"
      aws ec2 delete-route-table --route-table-id "$rt_id" || echo "⚠️ Failed to delete route table: $rt_id"
    fi
  done

  # 7.8 Clean up Subnets with retry
  print_header "🧹 Cleaning up Subnets..."
  SUBNETS=$(aws ec2 describe-subnets \
    --filters "Name=vpc-id,Values=$VPC_ID" \
    --query "Subnets[].SubnetId" --output text)

  for subnet_id in $SUBNETS; do
    if [ -n "$subnet_id" ] && [ "$subnet_id" != "None" ]; then
      print_header "🗑️ Deleting subnet: $subnet_id"
      
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
  print_header "🧹 Cleaning up Internet Gateway..."
  IGW_ID=$(aws ec2 describe-internet-gateways \
    --filters "Name=attachment.vpc-id,Values=$VPC_ID" \
    --query "InternetGateways[0].InternetGatewayId" --output text)

  if [ -n "$IGW_ID" ] && [ "$IGW_ID" != "None" ] && [ "$IGW_ID" != "null" ]; then
    print_header "🔌 Detaching Internet Gateway: $IGW_ID from VPC: $VPC_ID"
    aws ec2 detach-internet-gateway --internet-gateway-id "$IGW_ID" --vpc-id "$VPC_ID" || echo "⚠️ Failed to detach IGW"
    
    print_header "🗑️ Deleting Internet Gateway: $IGW_ID"
    aws ec2 delete-internet-gateway --internet-gateway-id "$IGW_ID" || echo "⚠️ Failed to delete IGW: $IGW_ID"
  fi

  # 7.10 Finally, delete the VPC itself with retry
  print_header "🗑️ Deleting VPC: $VPC_ID"
  
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
    print_header "🔍 Checking for remaining dependencies..."
    
    # List any remaining dependencies
    aws ec2 describe-vpc-attribute --vpc-id "$VPC_ID" --attribute enableDnsSupport 2>/dev/null && \
    print_warning "⚠️ VPC still exists. Check for remaining dependencies manually."
  fi
else
  print_header "ℹ️ No VPC found for environment ${TARGET_ENV}"
fi

# 8. Clean up Secrets Manager secrets
print_header "🧹 Cleaning up Secrets Manager secrets..."
SECRETS=$(aws secretsmanager list-secrets \
  --query "SecretList[?starts_with(Name, '${RESOURCE_PREFIX}')].Name" \
  --output text)

for secret in $SECRETS; do
  if [ -n "$secret" ] && [ "$secret" != "None" ]; then
    print_header "🗑️ Deleting secret: $secret"
    aws secretsmanager delete-secret --secret-id "$secret" --force-delete-without-recovery || echo "⚠️ Failed to delete secret: $secret"
  fi
done

# 9. Clean up IAM Roles (environment-specific)
print_header "🧹 Cleaning up IAM Roles..."
IAM_ROLES=$(aws iam list-roles \
  --query "Roles[?starts_with(RoleName, '${RESOURCE_PREFIX}')].RoleName" \
  --output text)

for role in $IAM_ROLES; do
  if [ -n "$role" ] && [ "$role" != "None" ]; then
    print_header "🗑️ Cleaning up IAM role: $role"
    
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
    
    # Delete instance profiles (with timeout and permission error handling)
    print_header "🔍 Checking instance profiles for role: $role"
    
    # Use timeout to prevent hanging on permission errors
    if timeout 30 aws iam list-instance-profiles-for-role --role-name "$role" \
      --query "InstanceProfiles[].InstanceProfileName" --output text > /tmp/instance_profiles_$$ 2>/dev/null; then
      
      INSTANCE_PROFILES=$(cat /tmp/instance_profiles_$$)
      rm -f /tmp/instance_profiles_$$
      
      if [ -n "$INSTANCE_PROFILES" ] && [ "$INSTANCE_PROFILES" != "None" ]; then
        for profile_name in $INSTANCE_PROFILES; do
          if [ -n "$profile_name" ] && [ "$profile_name" != "None" ]; then
            print_header "🗑️ Removing role from instance profile: $profile_name"
            aws iam remove-role-from-instance-profile --instance-profile-name "$profile_name" --role-name "$role" || echo "⚠️ Failed to remove role from instance profile"
            aws iam delete-instance-profile --instance-profile-name "$profile_name" || echo "⚠️ Failed to delete instance profile: $profile_name"
          fi
        done
      else
        print_header "✅ No instance profiles found for role: $role"
      fi
    else
      print_warning "⚠️ Insufficient permissions or timeout listing instance profiles for role: $role (skipping)"
      rm -f /tmp/instance_profiles_$$
    fi
    
    # Delete the role (with timeout to prevent hanging)
    print_header "🗑️ Deleting IAM role: $role"
    if timeout 30 aws iam delete-role --role-name "$role" 2>/dev/null; then
      print_success "✅ Deleted IAM role: $role"
    else
      print_warning "⚠️ Failed to delete IAM role: $role (timeout or permission denied)"
    fi
  fi
done

# 10. Clean up CloudWatch Log Groups
print_header "🧹 Cleaning up CloudWatch Log Groups..."
LOG_GROUPS=$(aws logs describe-log-groups \
  --query "logGroups[?contains(logGroupName, '${TARGET_ENV}')].logGroupName" \
  --output text)

for log_group in $LOG_GROUPS; do
  if [ -n "$log_group" ] && [ "$log_group" != "None" ]; then
    print_header "🗑️ Deleting log group: $log_group"
    aws logs delete-log-group --log-group-name "$log_group" || echo "⚠️ Failed to delete log group: $log_group"
  fi
done

# 11. Final verification
print_header "🔍 Final verification - checking for remaining resources..."

# Check remaining resources
REMAINING_S3=$(aws s3api list-buckets --query "Buckets[?starts_with(Name, '${RESOURCE_PREFIX}-')].Name" --output text)
REMAINING_LAMBDA=$(aws lambda list-functions --query "Functions[?starts_with(FunctionName, '${RESOURCE_PREFIX}-')].FunctionName" --output text)
REMAINING_RDS=$(aws rds describe-db-clusters --query "DBClusters[?starts_with(DBClusterIdentifier, '${RESOURCE_PREFIX}-')].DBClusterIdentifier" --output text)
REMAINING_VPC=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=${RESOURCE_PREFIX}-vpc" --query "Vpcs[].VpcId" --output text)

if [ -n "$REMAINING_S3" ] || [ -n "$REMAINING_LAMBDA" ] || [ -n "$REMAINING_RDS" ] || [ -n "$REMAINING_VPC" ]; then
  print_warning "⚠️ Some resources may still exist:"
  [ -n "$REMAINING_S3" ] && echo "   S3: $REMAINING_S3"
  [ -n "$REMAINING_LAMBDA" ] && echo "   Lambda: $REMAINING_LAMBDA"  
  [ -n "$REMAINING_RDS" ] && echo "   RDS: $REMAINING_RDS"
  [ -n "$REMAINING_VPC" ] && echo "   VPC: $REMAINING_VPC"
else
  print_success "✅ Environment '${TARGET_ENV}' cleanup completed successfully!"
fi

print_header "🧹 Cleanup script finished for environment: ${TARGET_ENV}" 