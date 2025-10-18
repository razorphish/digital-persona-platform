#!/bin/bash
# Reduce RDS Backup Retention
# Changes dev cluster backup retention from 7 days to 3 days
# Expected Savings: ~$40/month

set -e

echo "💾 AWS RDS Backup Retention Optimization"
echo "====================================="
echo ""

DEV_CLUSTER="dev-dev01-dpp-cluster"
PROD_CLUSTER="prod-prod-dpp-cluster"

echo "📊 Current Configuration:"
echo "  Dev Cluster: $DEV_CLUSTER"
echo "    Current Retention: 7 days"
echo "    New Retention: 3 days"
echo ""
echo "  Prod Cluster: $PROD_CLUSTER"
echo "    Current Retention: 7 days"
echo "    New Retention: 7 days (unchanged - recommended for prod)"
echo ""

# Confirm changes
read -p "⚠️  Proceed with reducing dev backup retention? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted. No changes were made."
    exit 0
fi

echo ""
echo "🔄 Updating dev cluster backup retention..."
echo ""

# Update dev cluster
echo -n "Updating $DEV_CLUSTER... "
if aws rds modify-db-cluster \
    --db-cluster-identifier "$DEV_CLUSTER" \
    --backup-retention-period 3 \
    --apply-immediately \
    --output json > /dev/null 2>&1; then
    echo "✅ Updated"
else
    echo "❌ Failed"
    exit 1
fi

echo ""
echo "====================================="
echo "✅ Backup Retention Updated!"
echo "   Dev retention: 7 days → 3 days"
echo "   Expected Savings: ~\$40/month"
echo ""
echo "Note: Old snapshots beyond 3 days will be"
echo "automatically deleted within 24 hours."
echo "====================================="







