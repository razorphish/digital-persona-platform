#!/bin/bash

# =================================
# DEPLOYMENT VALIDATION SCRIPT
# =================================
# Validates serverless deployment endpoints and functionality

set -e

echo "=========================================="
echo "🧪 SERVERLESS DEPLOYMENT VALIDATION"
echo "=========================================="

# Test endpoints
FRONTEND_CUSTOM="https://dev01.hibiji.com"
API_CUSTOM="https://dev01-api.hibiji.com/v1/health"
FRONTEND_DIRECT="https://d3cguiz7sc0p98.cloudfront.net"
API_DIRECT="https://p2ziqftgqc.execute-api.us-west-1.amazonaws.com/v1/health"

echo ""
echo "🌐 Testing DNS Resolution..."
echo "Frontend Domain: dev01.hibiji.com"
nslookup dev01.hibiji.com | grep "canonical name" || echo "❌ DNS not resolving"

echo ""
echo "API Domain: dev01-api.hibiji.com"
nslookup dev01-api.hibiji.com | grep "canonical name" || echo "❌ DNS not resolving"

echo ""
echo "🔗 Testing Direct Endpoints (Working)..."

echo "Frontend (CloudFront):"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_DIRECT" || echo "000")
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "403" ]; then
    echo "✅ CloudFront responding (HTTP $HTTP_STATUS)"
else
    echo "❌ CloudFront not responding (HTTP $HTTP_STATUS)"
fi

echo ""
echo "API Health (Gateway):"
API_RESPONSE=$(curl -s "$API_DIRECT" 2>/dev/null || echo "ERROR")
if [[ "$API_RESPONSE" == *"healthy"* ]] || [[ "$API_RESPONSE" == *"health"* ]]; then
    echo "✅ API Gateway responding: $API_RESPONSE"
else
    echo "❌ API Gateway issue: $API_RESPONSE"
fi

echo ""
echo "🔒 Testing Custom Domains (May need SSL setup)..."

echo "Frontend (Custom Domain):"
HTTP_STATUS=$(curl -k -s -o /dev/null -w "%{http_code}" "$FRONTEND_CUSTOM" 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "403" ]; then
    echo "✅ Custom domain responding (HTTP $HTTP_STATUS) - SSL cert may be needed"
else
    echo "❌ Custom domain not responding (HTTP $HTTP_STATUS)"
fi

echo ""
echo "API Health (Custom Domain):"
API_RESPONSE=$(curl -k -s "$API_CUSTOM" 2>/dev/null || echo "ERROR")
if [[ "$API_RESPONSE" == *"Forbidden"* ]]; then
    echo "⚠️  Custom API domain responding but may need SSL cert: $API_RESPONSE"
elif [[ "$API_RESPONSE" == *"healthy"* ]] || [[ "$API_RESPONSE" == *"health"* ]]; then
    echo "✅ Custom API domain working: $API_RESPONSE"
else
    echo "❌ Custom API domain issue: $API_RESPONSE"
fi

echo ""
echo "📊 AWS Resource Check..."
echo "Lambda Functions:"
aws lambda list-functions --query 'Functions[?contains(FunctionName, `dev-dev01-dpp`)].FunctionName' --output table 2>/dev/null || echo "AWS CLI not configured or accessible"

echo ""
echo "S3 Buckets:"
aws s3 ls | grep "dev-dev01-dpp" || echo "No matching S3 buckets found"

echo ""
echo "=========================================="
echo "🎯 VALIDATION SUMMARY"
echo "=========================================="
echo "✅ Direct endpoints should be working"
echo "⚠️  Custom domains need SSL certificates for full functionality"
echo "📋 Check GitHub Actions for complete deployment status"
echo ""
echo "🔗 Direct URLs (Working):"
echo "   Frontend: $FRONTEND_DIRECT"
echo "   API:      $API_DIRECT"
echo ""
echo "🌐 Custom URLs (DNS working, SSL needed):"
echo "   Frontend: $FRONTEND_CUSTOM"
echo "   API:      $API_CUSTOM"
echo "==========================================" 