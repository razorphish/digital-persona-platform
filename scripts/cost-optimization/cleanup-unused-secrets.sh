#!/bin/bash
# Cleanup Unused Secrets Manager Secrets
# Deletes legacy and duplicate secrets
# Expected Savings: ~$4.40/month

set -e

echo "🔐 AWS Secrets Manager Cleanup"
echo "====================================="
echo ""

# List of unused/legacy secrets to delete
UNUSED_SECRETS=(
    "hibiji-database-password"
    "hibiji-secret-key"
    "hibiji/dev01/database/password"
    "hibiji/dev01/app/secret-key"
    "dev01-dev01-dpp-jwt-secret"
    "dev01-dev01-dpp-database-password"
    "hibiji-dev01-secret-key-b7645c49"
    "hibiji-dev01-db-password-b4d122c0"
    "hibiji-qa03-db-password-1d7ca98f"
    "local-mars-dpp-jwt-secret"
    "local-mars-dpp-database-password"
)

echo "📋 Unused secrets to delete (11 total):"
for secret in "${UNUSED_SECRETS[@]}"; do
    echo "  - $secret"
done
echo ""

echo "✅ Active secrets to KEEP:"
echo "  - dev-dev01-dpp-jwt-secret"
echo "  - dev-dev01-dpp-database-password"
echo "  - prod-prod-dpp-jwt-secret"
echo "  - prod-prod-dpp-database-password"
echo ""

# Confirm deletion
read -p "⚠️  Are you sure you want to delete these secrets? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted. No secrets were deleted."
    exit 0
fi

echo ""
echo "🔄 Deleting unused secrets..."
echo ""

DELETED=0
FAILED=0

for secret in "${UNUSED_SECRETS[@]}"; do
    echo -n "Deleting $secret... "
    
    if aws secretsmanager delete-secret \
        --secret-id "$secret" \
        --force-delete-without-recovery \
        --output json > /dev/null 2>&1; then
        echo "✅ Deleted"
        ((DELETED++))
    else
        echo "❌ Failed or doesn't exist"
        ((FAILED++))
    fi
done

echo ""
echo "====================================="
echo "✅ Cleanup Complete!"
echo "   Deleted: $DELETED secrets"
echo "   Failed: $FAILED secrets"
echo "   Expected Savings: ~\$4.40/month"
echo "====================================="







