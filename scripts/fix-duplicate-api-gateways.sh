#!/bin/bash

# =================================
# Fix Duplicate API Gateways Script
# =================================
# This script identifies and cleans up duplicate API Gateways
# that are causing the health check to fail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

echo ""
echo "=========================================="
echo "🔧 FIX DUPLICATE API GATEWAYS"
echo "=========================================="
echo ""

# =================================
# Step 1: List all API Gateways (using JSON to avoid table formatting issues)
# =================================
print_status "Step 1: Listing all API Gateways..."

echo ""
echo "All API Gateways:"
# Use JSON output to avoid potential table formatting issues
ALL_APIS=$(aws apigatewayv2 get-apis --output json 2>/dev/null)
if [ $? -eq 0 ] && [ -n "$ALL_APIS" ]; then
    echo "$ALL_APIS" | jq -r '.Items[] | "  🔹 Name: \(.Name), ID: \(.ApiId), Created: \(.CreatedDate)"' 2>/dev/null || {
        # Fallback if jq is not available
        echo "$ALL_APIS" | grep -E '"Name"|"ApiId"|"CreatedDate"' | sed 's/[",]//g' | sed 's/^[[:space:]]*/  /'
    }
else
    print_error "Failed to get API Gateway list. Please check your AWS credentials and permissions."
    exit 1
fi

# =================================
# Step 2: Find DPP-related API Gateways
# =================================
print_status "Step 2: Finding DPP-related API Gateways..."

echo ""
echo "DPP API Gateways:"
DPP_APIS=$(aws apigatewayv2 get-apis --query 'Items[?contains(Name, `dpp`) || contains(Name, `dev`)]' --output json 2>/dev/null)
if [ -n "$DPP_APIS" ] && [ "$DPP_APIS" != "[]" ]; then
    echo "$DPP_APIS" | jq -r '.[] | "  📋 Name: \(.Name), ID: \(.ApiId), Created: \(.CreatedDate)"' 2>/dev/null || {
        # Fallback if jq is not available
        echo "$DPP_APIS" | grep -E '"Name"|"ApiId"|"CreatedDate"' | sed 's/[",]//g' | sed 's/^[[:space:]]*/  /'
    }
else
    print_warning "No DPP-related API Gateways found."
    echo ""
    print_status "This suggests the infrastructure deployment may not have completed successfully."
    exit 1
fi

# =================================
# Step 3: Find exact name matches
# =================================
EXPECTED_NAME="dev-dev01-dpp-api"
print_status "Step 3: Looking for API Gateways named: $EXPECTED_NAME"

echo ""
MATCHING_APIS=$(aws apigatewayv2 get-apis --query "Items[?Name=='$EXPECTED_NAME']" --output json 2>/dev/null)
if [ -n "$MATCHING_APIS" ]; then
    MATCH_COUNT=$(echo "$MATCHING_APIS" | jq '. | length' 2>/dev/null || echo "0")
else
    MATCH_COUNT=0
fi

echo "Found $MATCH_COUNT API Gateway(s) with name '$EXPECTED_NAME':"
if [ "$MATCH_COUNT" -gt 0 ]; then
    echo "$MATCHING_APIS" | jq -r '.[] | "  🎯 ID: \(.ApiId), Created: \(.CreatedDate)"' 2>/dev/null || {
        # Fallback if jq is not available
        echo "$MATCHING_APIS" | grep -E '"ApiId"|"CreatedDate"' | sed 's/[",]//g' | sed 's/^[[:space:]]*/  /'
    }
fi

# =================================
# Step 4: Determine the correct API Gateway
# =================================
if [ "$MATCH_COUNT" -eq 0 ]; then
    print_error "❌ No API Gateway found with name '$EXPECTED_NAME'"
    echo ""
    print_status "This means the infrastructure deployment failed."
    print_status "You need to run Terraform apply to create the API Gateway."
    echo ""
    print_status "Try running: cd terraform/environments/dev && terraform apply"
    exit 1
    
elif [ "$MATCH_COUNT" -eq 1 ]; then
    CORRECT_API_ID=$(echo "$MATCHING_APIS" | jq -r '.[0].ApiId' 2>/dev/null)
    if [ -z "$CORRECT_API_ID" ] || [ "$CORRECT_API_ID" = "null" ]; then
        print_error "Failed to extract API Gateway ID"
        exit 1
    fi
    
    print_success "✅ Found exactly one API Gateway: $CORRECT_API_ID"
    
    # Test this API Gateway
    print_status "Testing the API Gateway..."
    API_URL="https://${CORRECT_API_ID}.execute-api.us-west-1.amazonaws.com/v1/health"
    echo "Testing: $API_URL"
    
    # Test with timeout and better error handling
    if timeout 10 curl -s -f "$API_URL" > /dev/null 2>&1; then
        print_success "✅ API Gateway is working!"
        echo ""
        echo "🎉 SUCCESS: The API Gateway is properly configured."
        echo "The health check should work now."
        exit 0
    else
        print_warning "⚠️  API Gateway exists but health endpoint is not responding"
        echo "This could be due to:"
        echo "1. Lambda function not deployed yet"
        echo "2. Routes not properly configured" 
        echo "3. Lambda function has errors"
        echo ""
        echo "You can still proceed with the deployment - the Lambda deployment might fix this."
    fi
    
else
    print_error "❌ Found $MATCH_COUNT duplicate API Gateways with the same name!"
    echo ""
    print_warning "This is causing the health check to fail because the AWS query"
    print_warning "returns multiple API IDs, creating a malformed URL."
    echo ""
    
    # Show all duplicates with details
    echo "Duplicate API Gateways:"
    echo "$MATCHING_APIS" | jq -r '.[] | "  🔹 ID: \(.ApiId), Created: \(.CreatedDate)"' 2>/dev/null || {
        # Fallback if jq is not available
        echo "$MATCHING_APIS" | grep -E '"ApiId"|"CreatedDate"' | sed 's/[",]//g' | sed 's/^[[:space:]]*/  /'
    }
    
    # Find the most recent one
    NEWEST_API_ID=$(echo "$MATCHING_APIS" | jq -r 'sort_by(.CreatedDate) | .[-1].ApiId' 2>/dev/null)
    NEWEST_DATE=$(echo "$MATCHING_APIS" | jq -r 'sort_by(.CreatedDate) | .[-1].CreatedDate' 2>/dev/null)
    
    if [ -n "$NEWEST_API_ID" ] && [ "$NEWEST_API_ID" != "null" ]; then
        print_status "Recommended: Keep the newest API Gateway: $NEWEST_API_ID (created: $NEWEST_DATE)"
    else
        print_error "Failed to determine the newest API Gateway"
        exit 1
    fi
    
    echo ""
    
    # =================================
    # Step 5: Offer to delete duplicates
    # =================================
    print_warning "CLEANUP OPTIONS:"
    echo ""
    echo "1. 🔧 AUTOMATIC CLEANUP (recommended)"
    echo "   Delete all older API Gateways, keep the newest one"
    echo ""
    echo "2. 🔍 MANUAL CLEANUP"
    echo "   Show commands to delete specific API Gateways"
    echo ""
    echo "3. ❌ SKIP CLEANUP"
    echo "   Exit without making changes"
    echo ""
    
    read -p "Choose option (1/2/3): " choice
    
    case $choice in
        1)
            print_status "🔧 Starting automatic cleanup..."
            echo ""
            
            # Delete all API Gateways except the newest one
            DELETED_COUNT=0
            echo "$MATCHING_APIS" | jq -r '.[] | select(.ApiId != "'$NEWEST_API_ID'") | .ApiId' 2>/dev/null | while read api_id; do
                if [ -n "$api_id" ] && [ "$api_id" != "null" ]; then
                    print_status "Deleting API Gateway: $api_id"
                    if aws apigatewayv2 delete-api --api-id "$api_id" >/dev/null 2>&1; then
                        print_success "✅ Deleted API Gateway: $api_id"
                        DELETED_COUNT=$((DELETED_COUNT + 1))
                    else
                        print_error "❌ Failed to delete API Gateway: $api_id"
                    fi
                fi
            done
            
            # Wait a moment for deletions to propagate
            sleep 2
            
            echo ""
            print_success "🎉 Cleanup complete! Kept API Gateway: $NEWEST_API_ID"
            
            # Test the remaining API Gateway
            print_status "Testing the remaining API Gateway..."
            API_URL="https://${NEWEST_API_ID}.execute-api.us-west-1.amazonaws.com/v1/health"
            echo "Testing: $API_URL"
            
            if timeout 10 curl -s -f "$API_URL" > /dev/null 2>&1; then
                print_success "✅ API Gateway is working!"
                echo ""
                echo "🎉 SUCCESS: Ready to retry the deployment!"
            else
                print_warning "⚠️  API Gateway health endpoint not yet responding"
                echo "This is normal if Lambda deployment hasn't completed yet."
            fi
            ;;
            
        2)
            print_status "🔍 Manual cleanup commands:"
            echo ""
            echo "To delete specific API Gateways, run these commands:"
            echo ""
            
            echo "$MATCHING_APIS" | jq -r '.[] | "# Delete API Gateway \(.ApiId) (created: \(.CreatedDate))\naws apigatewayv2 delete-api --api-id \(.ApiId)\n"' 2>/dev/null || {
                echo "$MATCHING_APIS" | grep '"ApiId"' | sed 's/.*"ApiId": "\([^"]*\)".*/aws apigatewayv2 delete-api --api-id \1/'
            }
            
            echo ""
            print_status "💡 Recommendation: Keep the newest one ($NEWEST_API_ID) and delete the others."
            ;;
            
        3)
            print_warning "⚠️  Skipping cleanup. The health check will continue to fail"
            print_warning "until duplicate API Gateways are removed."
            exit 1
            ;;
            
        *)
            print_error "Invalid choice. Exiting."
            exit 1
            ;;
    esac
fi

echo ""
print_status "🔧 Next steps:"
echo "1. Re-run the GitHub Actions workflow"
echo "2. The health check should now work correctly"
echo "3. If issues persist, check Lambda function deployment" 