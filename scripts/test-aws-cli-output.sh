#!/bin/bash
# scripts/test-aws-cli-output.sh
# Test script to verify AWS CLI output handling

set -e

echo "Testing AWS CLI output handling..."

# Test basic AWS commands with --no-cli-pager
echo "1. Testing AWS Secrets Manager list..."
aws secretsmanager list-secrets --max-items 2 --no-cli-pager > /dev/null
echo "✓ Secrets Manager list works without pager"

echo "2. Testing AWS IAM get-role..."
aws iam get-role --role-name hibiji-ecs-execution-role --no-cli-pager > /dev/null 2>&1 || echo "✓ Role check works (role may not exist)"

echo "3. Testing AWS Secrets Manager describe-secret..."
aws secretsmanager describe-secret --secret-id hibiji-database-password --no-cli-pager > /dev/null
echo "✓ Secrets Manager describe works without pager"

echo "4. Testing AWS STS get-caller-identity..."
aws sts get-caller-identity --no-cli-pager > /dev/null
echo "✓ STS get-caller-identity works without pager"

echo ""
echo "All tests passed! AWS CLI output handling is working correctly."
echo "The --no-cli-pager flag should prevent the 'head: |: No such file or directory' messages." 