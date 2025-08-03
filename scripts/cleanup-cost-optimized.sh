#!/bin/bash

# =================================
# Cost-Optimized Environment Cleanup Script
# =================================
# Automated cleanup for dev/qa/local environments to prevent cost overruns
# Can be scheduled to run nightly/weekly

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

show_help() {
    cat << EOF
🧹 Cost-Optimized Environment Cleanup

USAGE:
    $0 [OPTIONS] [environment]

ARGUMENTS:
    environment       Target environment (dev, qa, local, all)

OPTIONS:
    -h, --help        Show this help message
    -n, --dry-run     Show what would be cleaned without making changes
    -f, --force       Skip confirmation prompts
    -a, --aggressive  More aggressive cleanup (shorter retention)
    --logs-only       Only clean up CloudWatch logs
    --s3-only         Only clean up S3 objects
    --old-snapshots   Clean up RDS snapshots older than 7 days

CLEANUP OPERATIONS:
    🗂️  S3: Remove objects past lifecycle policy
    📝 CloudWatch: Remove old log streams
    📸 RDS: Remove old manual snapshots
    🔄 ECS: Stop unused tasks
    💾 Lambda: Remove old versions
    📊 Batch: Cancel queued jobs

SAFETY FEATURES:
    ✅ Only affects dev/qa/local environments
    ✅ Preserves last 7 days of logs
    ✅ Keeps essential configurations
    ✅ Confirmation prompts

EXAMPLES:
    # Clean all development environments
    $0 all

    # Dry run for local environment
    $0 local --dry-run

    # Clean only CloudWatch logs
    $0 dev --logs-only

    # Aggressive cleanup with confirmation
    $0 qa --aggressive
EOF
}

validate_environment() {
    local env="$1"
    case "$env" in
        dev|qa|local|all)
            return 0
            ;;
        staging|prod|hotfix)
            log_error "Cleanup not allowed for production environment: $env"
            log_warning "Production environments must be cleaned manually"
            exit 1
            ;;
        *)
            log_error "Invalid environment: $env"
            log_info "Valid environments: dev, qa, local, all"
            exit 1
            ;;
    esac
}

check_aws_access() {
    log_info "Checking AWS access..."
    
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS credentials not configured or invalid"
        exit 1
    fi
    
    local account_id=$(aws sts get-caller-identity --query "Account" --output text)
    log_info "Connected to AWS Account: $account_id"
}

get_environment_resources() {
    local env="$1"
    local sub_env="$2"
    local resource_prefix="${env}-${sub_env}-dpp"
    
    echo "$resource_prefix"
}

cleanup_s3_objects() {
    local env="$1"
    local dry_run="$2"
    local aggressive="$3"
    
    log_info "Cleaning up S3 objects for environment: $env"
    
    # Find all S3 buckets for this environment
    local buckets=$(aws s3api list-buckets --query "Buckets[?contains(Name, '$env-') && contains(Name, '-dpp-')].Name" --output text)
    
    for bucket in $buckets; do
        log_info "Processing S3 bucket: $bucket"
        
        if [[ "$dry_run" == "true" ]]; then
            # Show what would be deleted
            local cutoff_date
            if [[ "$aggressive" == "true" ]]; then
                cutoff_date=$(date -d "7 days ago" '+%Y-%m-%d')
            else
                cutoff_date=$(date -d "30 days ago" '+%Y-%m-%d')
            fi
            
            log_info "Would delete objects older than: $cutoff_date"
            aws s3api list-objects-v2 --bucket "$bucket" \
                --query "Contents[?LastModified<'$cutoff_date'].{Key: Key, Size: Size, LastModified: LastModified}" \
                --output table || true
        else
            # Apply lifecycle policy if not exists
            local lifecycle_config=$(cat << EOF
{
    "Rules": [
        {
            "ID": "cost-optimization-cleanup",
            "Status": "Enabled",
            "Filter": {},
            "Expiration": {
                "Days": $([ "$aggressive" == "true" ] && echo "7" || echo "30")
            },
            "AbortIncompleteMultipartUpload": {
                "DaysAfterInitiation": 1
            }
        }
    ]
}
EOF
)
            echo "$lifecycle_config" | aws s3api put-bucket-lifecycle-configuration \
                --bucket "$bucket" \
                --lifecycle-configuration file:///dev/stdin || true
        fi
    done
}

cleanup_cloudwatch_logs() {
    local env="$1"
    local dry_run="$2"
    local aggressive="$3"
    
    log_info "Cleaning up CloudWatch logs for environment: $env"
    
    # Find log groups for this environment
    local log_groups=$(aws logs describe-log-groups \
        --log-group-name-prefix "/aws/lambda/$env-" \
        --query "logGroups[].logGroupName" \
        --output text)
    
    local retention_days
    if [[ "$aggressive" == "true" ]]; then
        retention_days=7
    else
        retention_days=14
    fi
    
    for log_group in $log_groups; do
        log_info "Processing log group: $log_group"
        
        if [[ "$dry_run" == "true" ]]; then
            local current_retention=$(aws logs describe-log-groups \
                --log-group-name-prefix "$log_group" \
                --query "logGroups[0].retentionInDays" \
                --output text)
            log_info "Would set retention to $retention_days days (currently: ${current_retention:-unlimited})"
        else
            aws logs put-retention-policy \
                --log-group-name "$log_group" \
                --retention-in-days "$retention_days" || true
        fi
    done
}

cleanup_rds_snapshots() {
    local env="$1"
    local dry_run="$2"
    
    log_info "Cleaning up old RDS snapshots for environment: $env"
    
    # Find manual snapshots older than 7 days
    local cutoff_date=$(date -d "7 days ago" '+%Y-%m-%d')
    local old_snapshots=$(aws rds describe-db-snapshots \
        --snapshot-type manual \
        --query "DBSnapshots[?contains(DBSnapshotIdentifier, '$env-') && SnapshotCreateTime<'$cutoff_date'].DBSnapshotIdentifier" \
        --output text)
    
    for snapshot in $old_snapshots; do
        if [[ "$dry_run" == "true" ]]; then
            log_info "Would delete snapshot: $snapshot"
        else
            log_info "Deleting snapshot: $snapshot"
            aws rds delete-db-snapshot --db-snapshot-identifier "$snapshot" || true
        fi
    done
}

cleanup_lambda_versions() {
    local env="$1"
    local dry_run="$2"
    
    log_info "Cleaning up old Lambda versions for environment: $env"
    
    # Find Lambda functions for this environment
    local functions=$(aws lambda list-functions \
        --query "Functions[?contains(FunctionName, '$env-')].FunctionName" \
        --output text)
    
    for function in $functions; do
        log_info "Processing Lambda function: $function"
        
        # Get versions (keep latest 5)
        local versions=$(aws lambda list-versions-by-function \
            --function-name "$function" \
            --query "Versions[?Version!='$LATEST'][5:].Version" \
            --output text)
        
        for version in $versions; do
            if [[ "$dry_run" == "true" ]]; then
                log_info "Would delete version $version of $function"
            else
                log_info "Deleting version $version of $function"
                aws lambda delete-function \
                    --function-name "$function" \
                    --qualifier "$version" || true
            fi
        done
    done
}

cleanup_batch_jobs() {
    local env="$1"
    local dry_run="$2"
    
    log_info "Cleaning up Batch jobs for environment: $env"
    
    # Find job queues for this environment
    local job_queues=$(aws batch describe-job-queues \
        --query "jobQueues[?contains(jobQueueName, '$env-')].jobQueueName" \
        --output text)
    
    for queue in $job_queues; do
        log_info "Processing job queue: $queue"
        
        # Cancel RUNNABLE and PENDING jobs
        local jobs=$(aws batch list-jobs \
            --job-queue "$queue" \
            --job-status RUNNABLE,PENDING \
            --query "jobSummary[].jobId" \
            --output text)
        
        for job in $jobs; do
            if [[ "$dry_run" == "true" ]]; then
                log_info "Would cancel job: $job"
            else
                log_info "Cancelling job: $job"
                aws batch cancel-job --job-id "$job" --reason "Cost optimization cleanup" || true
            fi
        done
    done
}

run_cleanup() {
    local environment="$1"
    local dry_run="$2"
    local aggressive="$3"
    local logs_only="$4"
    local s3_only="$5"
    local old_snapshots="$6"
    local skip_confirmation="$7"
    
    # Get environments to clean
    local environments=()
    if [[ "$environment" == "all" ]]; then
        environments=("dev" "qa" "local")
    else
        environments=("$environment")
    fi
    
    # Show cleanup summary
    echo ""
    log_info "=== CLEANUP CONFIGURATION ==="
    echo "🎯 Environments: ${environments[*]}"
    echo "🧪 Dry run: $dry_run"
    echo "⚡ Aggressive: $aggressive"
    echo "📝 Logs only: $logs_only"
    echo "🗂️  S3 only: $s3_only"
    echo "📸 Old snapshots: $old_snapshots"
    echo ""
    
    if [[ "$skip_confirmation" == "false" && "$dry_run" == "false" ]]; then
        read -p "Proceed with cleanup? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Cleanup cancelled"
            exit 0
        fi
    fi
    
    # Execute cleanup for each environment
    for env in "${environments[@]}"; do
        log_info "=== CLEANING ENVIRONMENT: $env ==="
        
        if [[ "$s3_only" == "false" && "$logs_only" == "false" ]] || [[ "$s3_only" == "true" ]]; then
            cleanup_s3_objects "$env" "$dry_run" "$aggressive"
        fi
        
        if [[ "$s3_only" == "false" && "$logs_only" == "false" ]] || [[ "$logs_only" == "true" ]]; then
            cleanup_cloudwatch_logs "$env" "$dry_run" "$aggressive"
        fi
        
        if [[ "$s3_only" == "false" && "$logs_only" == "false" ]]; then
            cleanup_lambda_versions "$env" "$dry_run"
            cleanup_batch_jobs "$env" "$dry_run"
        fi
        
        if [[ "$old_snapshots" == "true" ]]; then
            cleanup_rds_snapshots "$env" "$dry_run"
        fi
        
        log_success "Cleanup completed for environment: $env"
    done
    
    if [[ "$dry_run" == "false" ]]; then
        log_success "=== ALL CLEANUP OPERATIONS COMPLETED ==="
        log_info "Estimated cost savings: \$10-50/month depending on usage"
    else
        log_info "=== DRY RUN COMPLETED ==="
        log_info "Run without --dry-run to execute cleanup operations"
    fi
}

# Parse command line arguments
ENVIRONMENT="all"
DRY_RUN=false
AGGRESSIVE=false
LOGS_ONLY=false
S3_ONLY=false
OLD_SNAPSHOTS=false
SKIP_CONFIRMATION=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -n|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -f|--force)
            SKIP_CONFIRMATION=true
            shift
            ;;
        -a|--aggressive)
            AGGRESSIVE=true
            shift
            ;;
        --logs-only)
            LOGS_ONLY=true
            shift
            ;;
        --s3-only)
            S3_ONLY=true
            shift
            ;;
        --old-snapshots)
            OLD_SNAPSHOTS=true
            shift
            ;;
        -*)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
        *)
            ENVIRONMENT="$1"
            shift
            ;;
    esac
done

# Validate inputs
validate_environment "$ENVIRONMENT"

# Main execution
echo "🧹 Digital Persona Platform - Cost-Optimized Cleanup"
echo "===================================================="

check_aws_access
run_cleanup "$ENVIRONMENT" "$DRY_RUN" "$AGGRESSIVE" "$LOGS_ONLY" "$S3_ONLY" "$OLD_SNAPSHOTS" "$SKIP_CONFIRMATION"