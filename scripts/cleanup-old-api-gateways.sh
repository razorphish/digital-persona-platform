#!/bin/bash

# =================================
# Clean Up Old API Gateway Resources
# =================================
# This script identifies and helps clean up old/duplicate API Gateway resources

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Configuration
API_NAME="dev-dev01-dpp-api"
CURRENT_API_ID="5usrrmhphl"  # Update this if you get a new API Gateway

print_status "Checking for duplicate/old API Gateway resources..."

# Get all APIs with the same name
print_status "APIs with name '$API_NAME':"
aws apigatewayv2 get-apis --query "Items[?Name=='$API_NAME'].{Id:ApiId,Created:CreatedDate,Name:Name}" --output table

# Get the list of API IDs to check
API_IDS=$(aws apigatewayv2 get-apis --query "Items[?Name=='$API_NAME'].ApiId" --output text)

if [ -z "$API_IDS" ]; then
    print_status "No API Gateways found with name '$API_NAME'"
    exit 0
fi

print_status "Found API Gateway IDs: $API_IDS"

# Identify old APIs (not the current one)
OLD_API_IDS=""
for api_id in $API_IDS; do
    if [ "$api_id" != "$CURRENT_API_ID" ]; then
        OLD_API_IDS="$OLD_API_IDS $api_id"
    fi
done

if [ -z "$OLD_API_IDS" ]; then
    print_success "✅ No old API Gateways found - only current API exists"
    exit 0
fi

print_warning "Found old API Gateway IDs: $OLD_API_IDS"

echo ""
print_status "🔍 Detailed information about old APIs:"
for old_api in $OLD_API_IDS; do
    echo "📋 API ID: $old_api"
    aws apigatewayv2 get-api --api-id "$old_api" --query '{Name:Name,CreatedDate:CreatedDate,ProtocolType:ProtocolType}' --output table
    
    # Check if it has any routes
    ROUTES=$(aws apigatewayv2 get-routes --api-id "$old_api" --query 'Items[*].RouteKey' --output text 2>/dev/null || echo "")
    if [ -n "$ROUTES" ]; then
        echo "  Routes: $ROUTES"
    else
        echo "  Routes: None"
    fi
    
    # Check if it has any stages
    STAGES=$(aws apigatewayv2 get-stages --api-id "$old_api" --query 'Items[*].StageName' --output text 2>/dev/null || echo "")
    if [ -n "$STAGES" ]; then
        echo "  Stages: $STAGES"
    else
        echo "  Stages: None"
    fi
    echo ""
done

echo ""
print_warning "⚠️ CLEANUP RECOMMENDATIONS:"
echo ""
echo "To clean up old API Gateways and prevent conflicts:"
echo ""

for old_api in $OLD_API_IDS; do
    echo "# Delete old API Gateway: $old_api"
    echo "aws apigatewayv2 delete-api --api-id $old_api"
    echo ""
done

echo "After cleanup, run:"
echo "1. terraform plan  # Should show no changes for API Gateway"
echo "2. terraform apply # To ensure state is consistent"
echo ""

print_warning "⚠️ CAUTION: Only delete APIs that are confirmed to be old/unused!"
print_status "Review the creation dates and current usage before deleting."

# Interactive cleanup option
read -p "Would you like to automatically delete old API Gateways? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Deleting old API Gateways..."
    for old_api in $OLD_API_IDS; do
        if aws apigatewayv2 delete-api --api-id "$old_api"; then
            print_success "✅ Deleted API Gateway: $old_api"
        else
            print_error "❌ Failed to delete API Gateway: $old_api"
        fi
    done
    
    print_success "Cleanup completed!"
else
    print_status "Cleanup skipped. Use the commands above to manually clean up when ready."
fi 