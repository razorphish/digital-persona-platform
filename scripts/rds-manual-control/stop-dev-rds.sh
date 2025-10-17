#!/bin/bash
#
# Stop Dev RDS Cluster - Manual Cost Control
# Saves ~$165/month when stopped after hours
#
# Usage: ./stop-dev-rds.sh
#

set -e

CLUSTER_ID="dev-dev01-dpp-cluster"
REGION="us-west-1"

echo ""
echo "========================================="
echo "Stopping Dev RDS Cluster"
echo "========================================="
echo "Cluster: $CLUSTER_ID"
echo "Region:  $REGION"
echo ""

# Check current status
echo "Checking current status..."
STATUS=$(aws rds describe-db-clusters \
    --db-cluster-identifier "$CLUSTER_ID" \
    --region "$REGION" \
    --query "DBClusters[0].Status" \
    --output text)

echo "Current status: $STATUS"
echo ""

if [ "$STATUS" = "stopped" ]; then
    echo "[SKIP] Cluster is already stopped!"
    echo ""
    echo "No action needed. Have a great evening!"
    echo ""
    exit 0
fi

if [ "$STATUS" = "stopping" ]; then
    echo "[WAIT] Cluster is already stopping..."
    echo ""
    echo "Wait a few minutes for it to complete."
    echo ""
    exit 0
fi

if [ "$STATUS" != "available" ]; then
    echo "[ERROR] Cluster is in '$STATUS' state"
    echo "Can only stop clusters that are 'available'"
    echo ""
    exit 1
fi

# Stop the cluster
echo "Stopping cluster..."
aws rds stop-db-cluster \
    --db-cluster-identifier "$CLUSTER_ID" \
    --region "$REGION" \
    --output json > /dev/null

echo ""
echo "[SUCCESS] Stop command sent!"
echo ""
echo "Cluster will be fully stopped in 2-5 minutes."
echo "Estimated savings: \$165/month when stopped after hours"
echo ""

echo "========================================="
echo "To start it again tomorrow, run:"
echo "  ./start-dev-rds.sh"
echo "========================================="
echo ""




