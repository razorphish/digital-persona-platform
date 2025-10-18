#!/bin/bash
# Cleanup Old RDS Snapshots
# Deletes old manual snapshots from deleted clusters
# Expected Savings: ~$15/month

set -e

echo "🗑️  AWS RDS Snapshot Cleanup"
echo "====================================="
echo ""

# List of old manual snapshots to delete
OLD_SNAPSHOTS=(
    "dev01-dev01-dpp-cluster-final-snapshot"
    "dev-dev01-dpp-cluster-manual-backup-20250723-233658"
    "local-mars-dpp-cluster-final-snapshot"
)

echo "📋 Old snapshots to delete:"
for snapshot in "${OLD_SNAPSHOTS[@]}"; do
    echo "  - $snapshot"
done
echo ""

# Confirm deletion
read -p "⚠️  Are you sure you want to delete these snapshots? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted. No snapshots were deleted."
    exit 0
fi

echo ""
echo "🔄 Deleting old snapshots..."
echo ""

DELETED=0
FAILED=0

for snapshot in "${OLD_SNAPSHOTS[@]}"; do
    echo -n "Deleting $snapshot... "
    
    if aws rds delete-db-cluster-snapshot \
        --db-cluster-snapshot-identifier "$snapshot" \
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
echo "   Deleted: $DELETED snapshots"
echo "   Failed: $FAILED snapshots"
echo "   Expected Savings: ~\$15/month"
echo "====================================="







