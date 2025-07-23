#!/bin/bash

echo "🔧 API GATEWAY INTEGRATION CONFLICT RESOLVER"
echo "============================================="
echo ""

# Configuration
API_ID="p2ziqftgqc"
REGION="us-west-1"
HEALTH_ROUTE_ID="c9rldpu"
OLD_INTEGRATION_ID="mj59f58"
MAIN_INTEGRATION_ID="dl0yc04"

echo "📊 CURRENT SITUATION:"
echo "  API ID: $API_ID"
echo "  Health Route: $HEALTH_ROUTE_ID"
echo "  Old Integration: $OLD_INTEGRATION_ID (health Lambda - to be removed)"
echo "  Main Integration: $MAIN_INTEGRATION_ID (main API Lambda)"
echo ""

echo "🔍 STEP 1: Check current route configuration..."
aws apigatewayv2 get-route \
  --api-id $API_ID \
  --route-id $HEALTH_ROUTE_ID \
  --region $REGION \
  --query '{RouteKey: RouteKey, Target: Target}' \
  --output table

echo ""
echo "🔧 STEP 2: Update health route to use main integration..."
aws apigatewayv2 update-route \
  --api-id $API_ID \
  --route-id $HEALTH_ROUTE_ID \
  --target "integrations/$MAIN_INTEGRATION_ID" \
  --region $REGION \
  --output table

if [ $? -eq 0 ]; then
  echo "✅ Route updated successfully!"
  echo ""
  
  echo "🔍 STEP 3: Verify route update..."
  aws apigatewayv2 get-route \
    --api-id $API_ID \
    --route-id $HEALTH_ROUTE_ID \
    --region $REGION \
    --query '{RouteKey: RouteKey, Target: Target}' \
    --output table
  
  echo ""
  echo "🗑️ STEP 4: Now safe to delete old integration..."
  echo "Terraform should now be able to proceed without conflicts."
  echo ""
  echo "🚀 NEXT STEPS:"
  echo "  1. Run: terraform plan -target=module.api_gateway"
  echo "  2. Verify no conflicts in plan"
  echo "  3. Run: terraform apply"
  echo ""
  echo "✅ MANUAL FIX COMPLETED SUCCESSFULLY!"
else
  echo "❌ Failed to update route. Check AWS permissions and try again."
  echo ""
  echo "🔍 ALTERNATIVE SOLUTION:"
  echo "  1. Go to AWS Console → API Gateway → $API_ID"
  echo "  2. Find Routes → GET /health"
  echo "  3. Change integration from $OLD_INTEGRATION_ID to $MAIN_INTEGRATION_ID"
  echo "  4. Save and retry Terraform deployment"
fi 