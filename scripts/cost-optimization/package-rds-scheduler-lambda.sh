#!/bin/bash
# Package RDS Scheduler Lambda Function
# Creates lambda.zip for Terraform deployment

set -e

echo "📦 Packaging RDS Scheduler Lambda"
echo "====================================="
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$SCRIPT_DIR/../../terraform/modules/rds-scheduler"

cd "$MODULE_DIR"

echo "📁 Working directory: $MODULE_DIR"
echo ""

# Remove old package if exists
if [ -f "lambda.zip" ]; then
    echo "🗑️  Removing old lambda.zip..."
    rm lambda.zip
fi

# Create new package
echo "📦 Creating lambda.zip..."
zip -q lambda.zip lambda.py

# Verify package
if [ -f "lambda.zip" ]; then
    echo "✅ Package created successfully!"
    echo ""
    echo "📊 Package details:"
    ls -lh lambda.zip
    echo ""
    echo "📋 Package contents:"
    unzip -l lambda.zip
else
    echo "❌ Failed to create package"
    exit 1
fi

echo ""
echo "====================================="
echo "✅ Lambda function packaged!"
echo "   Location: terraform/modules/rds-scheduler/lambda.zip"
echo ""
echo "Next steps:"
echo "  1. Review terraform/modules/rds-scheduler/main.tf"
echo "  2. Add module to your environment config"
echo "  3. Run: terraform init && terraform apply"
echo "====================================="







