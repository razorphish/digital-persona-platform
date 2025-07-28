#!/bin/bash

# =============================================================================
# Cleanup Orphaned Resources Script (Ad-hoc Fix for Specific Remnants)
# =============================================================================
# Handles specific orphaned resources that can't be deleted through normal
# cleanup due to permission issues from previous failed cleanup attempts
# =============================================================================

set -e

TARGET_ENV="$1"

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
    echo "   $0 dev01     # Clean orphaned resources in dev01"
    echo "   $0 qa03      # Clean orphaned resources in qa03"
    exit 1
fi

print_header "🧹 CLEANING ORPHANED RESOURCES: $TARGET_ENV"
print_warning "⚠️  This handles specific resources that can't be deleted normally"
print_warning "⚠️  Due to permission issues from previous cleanup attempts"
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

RESOURCE_PREFIX="${MAIN_ENV}-${TARGET_ENV}-dpp"

print_header "🏷️  Resource Pattern: $RESOURCE_PREFIX-*"
echo ""

# Function to safely attempt resource operations
attempt_operation() {
    local operation="$1"
    local resource_type="$2"
    local resource_name="$3"
    
    print_header "🔧 $operation $resource_type: $resource_name"
    
    case "$operation" in
        "Delete"|"Disable")
            case "$resource_type" in
                "Batch Compute Environment")
                    if [ "$operation" = "Disable" ]; then
                        if aws batch update-compute-environment --compute-environment "$resource_name" --state DISABLED >/dev/null 2>&1; then
                            print_success "  ✅ Successfully disabled"
                            return 0
                        else
                            print_warning "  ⚠️ Failed to disable (may not exist or lack permissions)"
                            return 1
                        fi
                    else
                        if aws batch delete-compute-environment --compute-environment "$resource_name" >/dev/null 2>&1; then
                            print_success "  ✅ Successfully deleted"
                            return 0
                        else
                            print_warning "  ⚠️ Failed to delete (may not exist or lack permissions)"
                            return 1
                        fi
                    fi
                    ;;
                "Lambda Function")
                    if aws lambda delete-function --function-name "$resource_name" >/dev/null 2>&1; then
                        print_success "  ✅ Successfully deleted"
                        return 0
                    else
                        print_warning "  ⚠️ Failed to delete (may not exist or lack permissions)"
                        return 1
                    fi
                    ;;
                "CloudWatch Log Group")
                    if aws logs delete-log-group --log-group-name "$resource_name" >/dev/null 2>&1; then
                        print_success "  ✅ Successfully deleted"
                        return 0
                    else
                        print_warning "  ⚠️ Failed to delete (may not exist or lack permissions)"
                        return 1
                    fi
                    ;;
            esac
            ;;
        "Rename")
            case "$resource_type" in
                "Batch Compute Environment")
                    print_warning "  ⚠️ Batch Compute Environments cannot be renamed"
                    print_warning "  💡 Consider disabling instead"
                    return 1
                    ;;
                "Lambda Function")
                    print_warning "  ⚠️ Lambda Functions cannot be renamed directly"
                    print_warning "  💡 Consider creating new with different name"
                    return 1
                    ;;
                "CloudWatch Log Group")
                    print_warning "  ⚠️ CloudWatch Log Groups cannot be renamed"
                    print_warning "  💡 Consider deleting and recreating"
                    return 1
                    ;;
            esac
            ;;
    esac
    
    return 1
}

print_header "🔍 Checking for orphaned resources..."
echo ""

# 1. Handle AWS Batch Compute Environment
BATCH_COMPUTE_ENV="${RESOURCE_PREFIX}-ml-compute"
print_header "1️⃣ AWS Batch Compute Environment: $BATCH_COMPUTE_ENV"

if aws batch describe-compute-environments --compute-environments "$BATCH_COMPUTE_ENV" >/dev/null 2>&1; then
    print_warning "   📋 Resource exists in AWS"
    
    # Get current state
    COMPUTE_ENV_STATE=$(aws batch describe-compute-environments --compute-environments "$BATCH_COMPUTE_ENV" --query "computeEnvironments[0].state" --output text 2>/dev/null || echo "UNKNOWN")
    print_header "   📊 Current state: $COMPUTE_ENV_STATE"
    
    if [ "$COMPUTE_ENV_STATE" = "ENABLED" ]; then
        print_header "   🔄 Attempting to disable..."
        attempt_operation "Disable" "Batch Compute Environment" "$BATCH_COMPUTE_ENV"
        sleep 10  # Wait for state change
    fi
    
    print_header "   🗑️ Attempting to delete..."
    attempt_operation "Delete" "Batch Compute Environment" "$BATCH_COMPUTE_ENV"
else
    print_success "   ✅ Resource does not exist"
fi

echo ""

# 2. Handle Lambda Function
LAMBDA_FUNCTION="${RESOURCE_PREFIX}-api"
print_header "2️⃣ Lambda Function: $LAMBDA_FUNCTION"

if aws lambda get-function --function-name "$LAMBDA_FUNCTION" >/dev/null 2>&1; then
    print_warning "   📋 Resource exists in AWS"
    print_header "   🗑️ Attempting to delete..."
    attempt_operation "Delete" "Lambda Function" "$LAMBDA_FUNCTION"
else
    print_success "   ✅ Resource does not exist"
fi

echo ""

# 3. Handle RDS Proxy CloudWatch Log Group
RDS_PROXY_LOG_GROUP="/aws/rds-proxy/${RESOURCE_PREFIX}-rds-proxy"
print_header "3️⃣ CloudWatch Log Group: $RDS_PROXY_LOG_GROUP"

if aws logs describe-log-groups --log-group-name-prefix "$RDS_PROXY_LOG_GROUP" --query "logGroups[?logGroupName=='$RDS_PROXY_LOG_GROUP']" --output text | grep -q "$RDS_PROXY_LOG_GROUP"; then
    print_warning "   📋 Resource exists in AWS"
    print_header "   🗑️ Attempting to delete..."
    attempt_operation "Delete" "CloudWatch Log Group" "$RDS_PROXY_LOG_GROUP"
else
    print_success "   ✅ Resource does not exist"
fi

echo ""
print_header "🎯 ORPHANED RESOURCE CLEANUP COMPLETED"
print_warning "💡 If resources couldn't be deleted due to permissions:"
print_warning "   • The enhanced IAC workflow will now import them automatically"
print_warning "   • They will be managed by Terraform going forward"
print_warning "   • No manual intervention needed for future deployments" 