#!/bin/bash
# scripts/test-secrets-creation.sh
# Test script for secrets creation

set -e

echo "Testing secrets creation..."

# Check if openssl is available
echo "Checking openssl..."
if ! command -v openssl &> /dev/null; then
    echo "ERROR: openssl is not installed"
    exit 1
fi
echo "✓ openssl is available"

# Test openssl command
echo "Testing openssl rand command..."
DB_PASSWORD=$(openssl rand -base64 32)
echo "✓ Database password generated (length: ${#DB_PASSWORD})"

SECRET_KEY=$(openssl rand -base64 64)
echo "✓ Secret key generated (length: ${#SECRET_KEY})"

# Test AWS Secrets Manager
echo "Testing AWS Secrets Manager access..."
if aws secretsmanager list-secrets --max-items 1 --no-cli-pager &> /dev/null; then
    echo "✓ AWS Secrets Manager access works"
else
    echo "✗ AWS Secrets Manager access failed"
    exit 1
fi

# Test creating a secret
echo "Testing secret creation..."
TEST_SECRET_NAME="hibiji-test-secret-$(date +%s)"

aws secretsmanager create-secret \
    --name "$TEST_SECRET_NAME" \
    --description "Test secret for debugging" \
    --secret-string "{\"test\":\"value\"}" \
    --no-cli-pager

echo "✓ Test secret created: $TEST_SECRET_NAME"

# Clean up test secret
echo "Cleaning up test secret..."
aws secretsmanager delete-secret \
    --secret-id "$TEST_SECRET_NAME" \
    --force-delete-without-recovery \
    --no-cli-pager

echo "✓ Test secret cleaned up"

echo "All tests passed! The secrets creation should work." 