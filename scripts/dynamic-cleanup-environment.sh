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

# 4. RDS Clusters
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

# 7. Final verification
print_status "🔍 Final verification - checking for remaining resources..."

# Check remaining resources
REMAINING_S3=$(aws s3api list-buckets --query "Buckets[?starts_with(Name, '${MAIN_ENV}-${TARGET_ENV}-${PROJECT_NAME}')].Name" --output text)
REMAINING_LAMBDA=$(aws lambda list-functions --query "Functions[?starts_with(FunctionName, '${MAIN_ENV}-${TARGET_ENV}-${PROJECT_NAME}')].FunctionName" --output text)
REMAINING_RDS=$(aws rds describe-db-clusters --query "DBClusters[?starts_with(DBClusterIdentifier, '${MAIN_ENV}-${TARGET_ENV}-${PROJECT_NAME}')].DBClusterIdentifier" --output text)

if [ -n "$REMAINING_S3" ] || [ -n "$REMAINING_LAMBDA" ] || [ -n "$REMAINING_RDS" ]; then
  print_warning "⚠️ Some resources may still exist:"
  [ -n "$REMAINING_S3" ] && echo "   S3: $REMAINING_S3"
  [ -n "$REMAINING_LAMBDA" ] && echo "   Lambda: $REMAINING_LAMBDA"  
  [ -n "$REMAINING_RDS" ] && echo "   RDS: $REMAINING_RDS"
else
  print_success "✅ Environment '${TARGET_ENV}' cleanup completed successfully!"
fi

print_status "🧹 Cleanup script finished for environment: ${TARGET_ENV}" 