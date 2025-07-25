#!/bin/bash

# Validate Workflow-AWS Synchronization
set -e

echo "🔍 Validating Workflow-AWS Synchronization..."

# Check region consistency
echo "📍 Checking region consistency..."
if grep -q "us-west-2" .github/workflows/*.yml; then
    echo "❌ Found us-west-2 references in workflows"
    grep -n "us-west-2" .github/workflows/*.yml
    exit 1
else
    echo "✅ All workflows use us-west-1"
fi

# Check service name patterns
echo "🔧 Checking service name patterns..."
if grep -q "dpp-cluster\|dpp-backend-service\|dpp-frontend-service" .github/workflows/*.yml; then
    echo "❌ Found old service name patterns"
    grep -n "dpp-cluster\|dpp-backend-service\|dpp-frontend-service" .github/workflows/*.yml
    exit 1
else
    echo "✅ Service names use environment variables"
fi

# Check Terraform backend regions
echo "🏗️ Checking Terraform backend regions..."
if grep -q "region = \"us-west-2\"" terraform/**/*.tf; then
    echo "❌ Found us-west-2 in Terraform backends"
    grep -n "region = \"us-west-2\"" terraform/**/*.tf
    exit 1
else
    echo "✅ Terraform backends use us-west-1"
fi

echo "✅ All synchronization checks passed!"
