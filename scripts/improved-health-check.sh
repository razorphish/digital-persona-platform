#!/bin/bash

# =================================
# Improved Health Check for GitHub Actions
# =================================
# This script provides better diagnostics when API Gateway health checks fail

set -e

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

# Required parameters
FUNCTION_NAME="${1:-}"
LOG_GROUP_NAME="${2:-}"

if [ -z "$FUNCTION_NAME" ]; then
    print_error "Usage: $0 <function-name> [log-group-name]"
    print_error "Example: $0 dev-dev01-dpp-api /aws/lambda/dev-dev01-dpp-api"
    exit 1
fi

echo "🔍 Improved API Gateway Health Check"
echo "===================================="
print_status "Expected API Gateway: $FUNCTION_NAME"
print_status "Log Group: ${LOG_GROUP_NAME:-'Not specified'}"
echo ""

# =================================
# Step 1: List all API Gateways for debugging
# =================================
print_status "Step 1: Listing all available API Gateways..."
echo ""
echo "Available API Gateways:"
aws apigatewayv2 get-apis --query 'Items[*].{Name:Name,Id:ApiId,CreatedDate:CreatedDate}' --output table

# =================================
# Step 2: Look for the expected API Gateway
# =================================
print_status "Step 2: Looking for API Gateway: $FUNCTION_NAME"

# Get the API ID
API_ID=$(aws apigatewayv2 get-apis --query "Items[?Name=='$FUNCTION_NAME'].ApiId" --output text)

# Clean the API ID (remove any whitespace or special characters)
API_ID=$(echo "$API_ID" | tr -d '[:space:]')

if [ -z "$API_ID" ] || [ "$API_ID" = "None" ]; then
    print_error "❌ No API Gateway found with name: $FUNCTION_NAME"
    
    echo ""
    print_status "Checking for similar names..."
    # Look for API Gateways with similar names
    SIMILAR_APIS=$(aws apigatewayv2 get-apis --query "Items[?contains(Name, 'dpp') || contains(Name, 'dev')].{Name:Name,Id:ApiId}" --output table)
    
    if [ -n "$SIMILAR_APIS" ]; then
        echo "Similar API Gateways found:"
        echo "$SIMILAR_APIS"
    else
        echo "No similar API Gateways found."
    fi
    
    echo ""
    print_error "POSSIBLE CAUSES:"
    echo "1. 🏗️  Infrastructure deployment failed or didn't complete"
    echo "2. 📝 Naming convention mismatch between workflow and Terraform"
    echo "3. 🌍 Wrong AWS region (currently: $(aws configure get region || echo 'not set'))"
    echo "4. 🔐 IAM permissions issue preventing API Gateway creation"
    echo "5. ⏰ Terraform apply was partially successful but API Gateway creation failed"
    
    echo ""
    print_status "TROUBLESHOOTING STEPS:"
    echo "1. Check GitHub Actions logs for 'Deploy Infrastructure' step errors"
    echo "2. Verify Terraform outputs show the API Gateway was created"
    echo "3. Check AWS Console → API Gateway → HTTP APIs"
    echo "4. Run: ./scripts/debug-api-health.sh"
    
    exit 1
fi

print_success "✅ Found API Gateway: $API_ID"

# =================================
# Step 3: Check API Gateway configuration
# =================================
print_status "Step 3: Checking API Gateway configuration..."

# Get API details
API_ENDPOINT=$(aws apigatewayv2 get-api --api-id "$API_ID" --query 'ApiEndpoint' --output text)
print_status "API Endpoint: $API_ENDPOINT"

# Check for v1 stage
STAGE_EXISTS=$(aws apigatewayv2 get-stages --api-id "$API_ID" --query "Items[?StageName=='v1'].StageName" --output text)
if [ -z "$STAGE_EXISTS" ] || [ "$STAGE_EXISTS" = "None" ]; then
    print_warning "⚠️  Stage 'v1' not found!"
    echo "Available stages:"
    aws apigatewayv2 get-stages --api-id "$API_ID" --query 'Items[*].StageName' --output text
else
    print_success "✅ Stage 'v1' exists"
fi

# Check for health route
HEALTH_ROUTE=$(aws apigatewayv2 get-routes --api-id "$API_ID" --query "Items[?RouteKey=='GET /health'].RouteId" --output text)
if [ -z "$HEALTH_ROUTE" ] || [ "$HEALTH_ROUTE" = "None" ]; then
    print_warning "⚠️  Health route 'GET /health' not found!"
    echo "Available routes:"
    aws apigatewayv2 get-routes --api-id "$API_ID" --query 'Items[*].RouteKey' --output text
else
    print_success "✅ Health route exists"
fi

# =================================
# Step 4: Test the health endpoint
# =================================
print_status "Step 4: Testing health endpoint..."

# Construct the API URL
API_URL="https://${API_ID}.execute-api.$(aws configure get region || echo 'us-west-1').amazonaws.com/v1"
HEALTH_URL="${API_URL}/health"

# Clean the URL to remove any whitespace or special characters
HEALTH_URL=$(echo "$HEALTH_URL" | tr -d '[:space:]')

print_status "Testing: $HEALTH_URL"
print_status "URL length: ${#HEALTH_URL} characters"

# Test with detailed error capture
for attempt in {1..5}; do
    echo ""
    echo "🔄 Health check attempt $attempt/5..."
    
    # Capture full response
    RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}\nTIME:%{time_total}\nDNS_TIME:%{time_namelookup}\nCONNECT_TIME:%{time_connect}" "$HEALTH_URL" 2>&1)
    
    HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
    RESPONSE_TIME=$(echo "$RESPONSE" | grep "TIME:" | cut -d: -f2)
    DNS_TIME=$(echo "$RESPONSE" | grep "DNS_TIME:" | cut -d: -f2)
    CONNECT_TIME=$(echo "$RESPONSE" | grep "CONNECT_TIME:" | cut -d: -f2)
    RESPONSE_BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d' | sed '/TIME:/d' | sed '/DNS_TIME:/d' | sed '/CONNECT_TIME:/d')
    
    echo "  📊 Status: ${HTTP_STATUS:-'ERROR'}"
    echo "  🌐 DNS Lookup: ${DNS_TIME:-'N/A'}s"
    echo "  🔗 Connect: ${CONNECT_TIME:-'N/A'}s"
    echo "  ⏱️  Total: ${RESPONSE_TIME:-'N/A'}s"
    echo "  📄 Response: ${RESPONSE_BODY:0:200}..."
    
    if [ "$HTTP_STATUS" = "200" ]; then
        print_success "✅ Health check passed!"
        echo ""
        echo "🎉 SUCCESS! API Gateway is responding correctly."
        exit 0
    elif [ "$HTTP_STATUS" = "403" ]; then
        print_error "❌ HTTP 403 Forbidden - Lambda function permissions issue"
        break
    elif [ "$HTTP_STATUS" = "404" ]; then
        print_error "❌ HTTP 404 Not Found - Route or integration not configured"
        break
    elif [ "$HTTP_STATUS" = "500" ] || [ "$HTTP_STATUS" = "502" ] || [ "$HTTP_STATUS" = "503" ]; then
        print_error "❌ HTTP $HTTP_STATUS - Lambda function error"
        break
    elif [ -z "$HTTP_STATUS" ]; then
        print_error "❌ Network/DNS error - URL may be malformed or unreachable"
        
        # Additional DNS diagnostics
        echo "  🔍 DNS diagnostics:"
        HOSTNAME=$(echo "$HEALTH_URL" | sed 's|https\?://||' | cut -d/ -f1)
        nslookup "$HOSTNAME" 2>/dev/null || echo "    DNS lookup failed"
    else
        print_warning "⚠️  Unexpected HTTP status: $HTTP_STATUS"
    fi
    
    if [ $attempt -lt 5 ]; then
        echo "  ⏳ Waiting 30 seconds before retry..."
        sleep 30
    fi
done

# =================================
# Step 5: Capture Lambda logs for debugging
# =================================
if [ -n "$LOG_GROUP_NAME" ]; then
    print_status "Step 5: Capturing recent Lambda logs..."
    
    # Get the latest log stream
    LOG_STREAM=$(aws logs describe-log-streams \
        --log-group-name "$LOG_GROUP_NAME" \
        --order-by LastEventTime \
        --descending \
        --max-items 1 \
        --query 'logStreams[0].logStreamName' \
        --output text 2>/dev/null || echo "")
    
    if [ -n "$LOG_STREAM" ] && [ "$LOG_STREAM" != "None" ]; then
        echo ""
        echo "📋 Recent Lambda logs (last 10 minutes):"
        aws logs get-log-events \
            --log-group-name "$LOG_GROUP_NAME" \
            --log-stream-name "$LOG_STREAM" \
            --start-time $(date -d '10 minutes ago' +%s)000 \
            --query 'events[*].message' \
            --output text 2>/dev/null || echo "No recent logs found"
    else
        print_warning "No log streams found in $LOG_GROUP_NAME"
    fi
fi

# =================================
# Final diagnosis
# =================================
echo ""
echo "=========================================="
echo "❌ HEALTH CHECK FAILED"
echo "=========================================="
echo ""
print_error "The API Gateway health check failed after 5 attempts."
echo ""
echo "🔧 NEXT STEPS:"
echo "1. Check Lambda function logs in CloudWatch"
echo "2. Verify Lambda function is deployed and active"
echo "3. Check API Gateway → Routes → GET /health integration"
echo "4. Verify Lambda function has correct permissions"
echo "5. Test Lambda function directly in AWS Console"
echo ""
echo "🛠️  USEFUL COMMANDS:"
echo "aws lambda get-function --function-name $FUNCTION_NAME"
echo "aws logs tail $LOG_GROUP_NAME --follow"
echo "./scripts/debug-api-health.sh"

exit 1 