#!/bin/bash

# =================================
# DEPLOYMENT VALIDATION SCRIPT
# =================================
# Validates serverless deployment endpoints and functionality

set -e

# Load dynamic configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config/environment.sh"

echo "=========================================="
echo "🧪 SERVERLESS DEPLOYMENT VALIDATION"
echo "=========================================="

# Display environment information
print_environment_info

# Validate configuration
if ! validate_configuration; then
    echo "❌ Configuration validation failed"
    exit 1
fi

echo ""
echo "🌐 Testing DNS Resolution..."
echo "Frontend Domain: $WEBSITE_DOMAIN"
nslookup "$WEBSITE_DOMAIN" | grep "canonical name" || echo "❌ DNS not resolving"

echo ""
echo "API Domain: $API_DOMAIN"
nslookup "$API_DOMAIN" | grep "canonical name" || echo "❌ DNS not resolving"

echo ""
echo "🔗 Testing Direct Endpoints (Working)..."

# Test direct CloudFront if we can discover it
if [[ -n "$WEBSITE_CLOUDFRONT_ID" && "$WEBSITE_CLOUDFRONT_ID" != "None" ]]; then
    FRONTEND_DIRECT_URL=$(aws cloudfront get-distribution --id "$WEBSITE_CLOUDFRONT_ID" \
        --query 'Distribution.DomainName' --output text 2>/dev/null || echo "")
    
    if [[ -n "$FRONTEND_DIRECT_URL" ]]; then
        echo "Frontend (CloudFront Direct):"
        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$FRONTEND_DIRECT_URL" || echo "000")
        if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "403" ]; then
            echo "✅ CloudFront responding (HTTP $HTTP_STATUS)"
        else
            echo "❌ CloudFront not responding (HTTP $HTTP_STATUS)"
        fi
    fi
fi

echo ""
echo "API Health (Gateway):"
if [[ -n "$API_DIRECT_URL" ]]; then
    API_RESPONSE=$(curl -s "$API_DIRECT_URL" 2>/dev/null || echo "ERROR")
    if [[ "$API_RESPONSE" == *"healthy"* ]] || [[ "$API_RESPONSE" == *"health"* ]]; then
        echo "✅ API Gateway responding: $API_RESPONSE"
    else
        echo "❌ API Gateway issue: $API_RESPONSE"
    fi
else
    echo "⚠️ Could not determine direct API Gateway URL"
fi

echo ""
echo "🔒 Testing Custom Domains (May need SSL setup)..."

echo "Frontend (Custom Domain):"
HTTP_STATUS=$(curl -k -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "403" ]; then
    echo "✅ Custom domain responding (HTTP $HTTP_STATUS) - SSL cert may be needed"
else
    echo "❌ Custom domain not responding (HTTP $HTTP_STATUS)"
fi

echo ""
echo "API Health (Custom Domain):"
API_RESPONSE=$(curl -k -s "$API_HEALTH_URL" 2>/dev/null || echo "ERROR")
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
aws lambda list-functions --query "Functions[?contains(FunctionName, \`${RESOURCE_PREFIX}\`)].FunctionName" \
    --output table 2>/dev/null || echo "AWS CLI not configured or accessible"

echo ""
echo "S3 Buckets:"
aws s3 ls | grep "$S3_BUCKET_PREFIX" || echo "No matching S3 buckets found"

echo ""
echo "CloudFront Distributions:"
if [[ -n "$WEBSITE_CLOUDFRONT_ID" && "$WEBSITE_CLOUDFRONT_ID" != "None" ]]; then
    echo "✅ Website CloudFront: $WEBSITE_CLOUDFRONT_ID"
else
    echo "❌ Website CloudFront: Not found"
fi

if [[ -n "$API_CLOUDFRONT_ID" && "$API_CLOUDFRONT_ID" != "None" ]]; then
    echo "✅ API CloudFront: $API_CLOUDFRONT_ID"
else
    echo "❌ API CloudFront: Not found"
fi

echo ""
echo "=========================================="
echo "🎯 VALIDATION SUMMARY"
echo "=========================================="
echo "✅ Direct endpoints should be working"
echo "⚠️  Custom domains need SSL certificates for full functionality"
echo "📋 Check GitHub Actions for complete deployment status"
echo ""
echo "🔗 URLs for $ENVIRONMENT environment:"
echo "   Frontend: $FRONTEND_URL"
echo "   API:      $API_URL"
echo "   API Health: $API_HEALTH_URL"

if [[ -n "$API_DIRECT_URL" ]]; then
    echo ""
    echo "🔧 Direct API Gateway URL:"
    echo "   $API_DIRECT_URL"
fi

echo "==========================================" 