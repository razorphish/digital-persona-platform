#!/bin/bash

# =================================
# API Gateway Health Check Diagnostic Script
# =================================
# This script helps diagnose issues with API Gateway health checks during deployment

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

# Default values (can be overridden by environment variables)
ENVIRONMENT=${ENVIRONMENT:-"dev"}
SUB_ENVIRONMENT=${SUB_ENVIRONMENT:-"dev01"}
EXPECTED_API_NAME="dev-dev01-dpp-api"

echo ""
echo "=========================================="
echo "🔍 API GATEWAY HEALTH CHECK DIAGNOSTICS"
echo "=========================================="
echo ""
print_status "Environment: ${ENVIRONMENT}"
print_status "Sub-environment: ${SUB_ENVIRONMENT}"
print_status "Expected API Gateway name: ${EXPECTED_API_NAME}"
echo ""

# =================================
# Step 1: Check AWS CLI and credentials
# =================================
print_status "Step 1: Checking AWS CLI and credentials..."

if ! command -v aws &> /dev/null; then
    print_error "AWS CLI is not installed"
    exit 1
fi

if ! aws sts get-caller-identity &> /dev/null; then
    print_error "AWS credentials not configured or invalid"
    exit 1
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=$(aws configure get region || echo "us-west-1")
print_success "AWS CLI configured - Account: ${ACCOUNT_ID}, Region: ${REGION}"

# =================================
# Step 2: List all API Gateways
# =================================
print_status "Step 2: Listing all API Gateways..."

echo ""
echo "All API Gateways in ${REGION}:"
aws apigatewayv2 get-apis --query 'Items[*].{Name:Name,Id:ApiId,CreatedDate:CreatedDate}' --output table

# =================================
# Step 3: Check for expected API Gateway
# =================================
print_status "Step 3: Looking for expected API Gateway: ${EXPECTED_API_NAME}"

API_ID=$(aws apigatewayv2 get-apis --query "Items[?Name=='${EXPECTED_API_NAME}'].ApiId" --output text)

if [ -z "$API_ID" ] || [ "$API_ID" = "None" ]; then
    print_error "Expected API Gateway '${EXPECTED_API_NAME}' not found!"
    
    # Suggest possible alternatives
    echo ""
    print_status "Checking for similar API Gateway names..."
    aws apigatewayv2 get-apis --query "Items[?contains(Name, 'dpp') || contains(Name, 'dev')].{Name:Name,Id:ApiId}" --output table
    
    echo ""
    print_warning "Possible solutions:"
    echo "1. Check if Terraform infrastructure deployment completed successfully"
    echo "2. Verify the API Gateway module is correctly configured"
    echo "3. Check for naming convention mismatches"
    echo "4. Review CloudFormation/Terraform logs for errors"
    
    exit 1
else
    print_success "Found API Gateway: ${API_ID}"
fi

# =================================
# Step 4: Check API Gateway details
# =================================
print_status "Step 4: Checking API Gateway details..."

echo ""
echo "API Gateway Details:"
aws apigatewayv2 get-api --api-id "$API_ID" --query '{Name:Name,Id:ApiId,ProtocolType:ProtocolType,ApiEndpoint:ApiEndpoint,CreatedDate:CreatedDate}' --output table

# =================================
# Step 5: Check API Gateway stages
# =================================
print_status "Step 5: Checking API Gateway stages..."

echo ""
echo "API Gateway Stages:"
aws apigatewayv2 get-stages --api-id "$API_ID" --query 'Items[*].{StageName:StageName,DeploymentId:DeploymentId,CreatedDate:CreatedDate,LastUpdatedDate:LastUpdatedDate}' --output table

# =================================
# Step 6: Check API Gateway routes
# =================================
print_status "Step 6: Checking API Gateway routes..."

echo ""
echo "API Gateway Routes:"
aws apigatewayv2 get-routes --api-id "$API_ID" --query 'Items[*].{RouteKey:RouteKey,Target:Target,RouteId:RouteId}' --output table

# Check specifically for health route
HEALTH_ROUTE=$(aws apigatewayv2 get-routes --api-id "$API_ID" --query "Items[?RouteKey=='GET /health'].RouteId" --output text)

if [ -z "$HEALTH_ROUTE" ] || [ "$HEALTH_ROUTE" = "None" ]; then
    print_warning "No 'GET /health' route found!"
    echo "Available routes:"
    aws apigatewayv2 get-routes --api-id "$API_ID" --query 'Items[*].RouteKey' --output text
else
    print_success "Health route found: ${HEALTH_ROUTE}"
fi

# =================================
# Step 7: Check API Gateway integrations
# =================================
print_status "Step 7: Checking API Gateway integrations..."

echo ""
echo "API Gateway Integrations:"
aws apigatewayv2 get-integrations --api-id "$API_ID" --query 'Items[*].{IntegrationId:IntegrationId,IntegrationType:IntegrationType,IntegrationUri:IntegrationUri,ConnectionType:ConnectionType}' --output table

# =================================
# Step 8: Test the API endpoint
# =================================
print_status "Step 8: Testing API endpoint..."

API_URL="https://${API_ID}.execute-api.${REGION}.amazonaws.com/v1"
HEALTH_URL="${API_URL}/health"

print_status "Testing API URL: ${HEALTH_URL}"

# Test with verbose output
echo ""
echo "Health check test results:"
for attempt in {1..3}; do
    echo "🔄 Attempt $attempt/3..."
    
    # Use curl with detailed output
    RESPONSE=$(curl -s -w "\nHTTP_STATUS:%{http_code}\nTIME_TOTAL:%{time_total}\nTIME_NAMELOOKUP:%{time_namelookup}\nTIME_CONNECT:%{time_connect}" "$HEALTH_URL" 2>&1)
    
    HTTP_STATUS=$(echo "$RESPONSE" | grep "HTTP_STATUS:" | cut -d: -f2)
    TIME_TOTAL=$(echo "$RESPONSE" | grep "TIME_TOTAL:" | cut -d: -f2)
    TIME_NAMELOOKUP=$(echo "$RESPONSE" | grep "TIME_NAMELOOKUP:" | cut -d: -f2)
    TIME_CONNECT=$(echo "$RESPONSE" | grep "TIME_CONNECT:" | cut -d: -f2)
    RESPONSE_BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS:/d' | sed '/TIME_/d')
    
    echo "  Status: ${HTTP_STATUS:-'ERROR'}"
    echo "  DNS Lookup: ${TIME_NAMELOOKUP:-'N/A'}s"
    echo "  Connect: ${TIME_CONNECT:-'N/A'}s"
    echo "  Total: ${TIME_TOTAL:-'N/A'}s"
    echo "  Response: ${RESPONSE_BODY:0:100}"
    
    if [ "$HTTP_STATUS" = "200" ]; then
        print_success "Health check passed!"
        break
    elif [ -n "$HTTP_STATUS" ]; then
        print_warning "Health check returned HTTP $HTTP_STATUS"
    else
        print_error "Health check failed with curl error"
    fi
    
    if [ $attempt -lt 3 ]; then
        echo "  ⏳ Waiting 10 seconds before retry..."
        sleep 10
    fi
done

# =================================
# Step 9: Check Lambda function
# =================================
print_status "Step 9: Checking associated Lambda function..."

LAMBDA_FUNCTION_NAME="dev-dev01-dpp-api"
echo ""
echo "Lambda Function Status:"
aws lambda get-function --function-name "$LAMBDA_FUNCTION_NAME" --query '{FunctionName:Configuration.FunctionName,State:Configuration.State,LastModified:Configuration.LastModified,Runtime:Configuration.Runtime}' --output table 2>/dev/null || {
    print_warning "Lambda function '${LAMBDA_FUNCTION_NAME}' not found or not accessible"
    echo "Available Lambda functions:"
    aws lambda list-functions --query 'Functions[?contains(FunctionName, `dpp`)].{FunctionName:FunctionName,State:State,Runtime:Runtime}' --output table
}

# =================================
# Summary
# =================================
echo ""
echo "=========================================="
echo "📋 DIAGNOSTIC SUMMARY"
echo "=========================================="

if [ "$HTTP_STATUS" = "200" ]; then
    print_success "✅ API Gateway health check is working!"
    echo ""
    echo "🔗 Working endpoints:"
    echo "   API Base: $API_URL"
    echo "   Health:   $HEALTH_URL"
else
    print_error "❌ API Gateway health check is failing"
    echo ""
    echo "🔧 Troubleshooting steps:"
    echo "1. Check if Lambda function is deployed and active"
    echo "2. Verify API Gateway routes are properly configured"
    echo "3. Check Lambda function permissions for API Gateway"
    echo "4. Review CloudWatch logs for Lambda function errors"
    echo "5. Ensure the health endpoint is implemented in your Lambda function"
fi

echo ""
print_status "Diagnostic complete!" 