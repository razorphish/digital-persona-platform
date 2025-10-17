#!/bin/bash
#
# Start Dev RDS Cluster - Manual Cost Control
#
# Usage: ./start-dev-rds.sh
#

set -e

CLUSTER_ID="dev-dev01-dpp-cluster"
REGION="us-west-1"

echo ""
echo "========================================="
echo "Starting Dev RDS Cluster"
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

if [ "$STATUS" = "available" ]; then
    echo "[OK] Cluster is already running!"
    echo ""
    echo "Ready to use. Good morning!"
    echo ""
    exit 0
fi

if [ "$STATUS" = "starting" ]; then
    echo "[WAIT] Cluster is already starting..."
    echo ""
    echo "Wait a few minutes for it to complete."
    echo ""
    exit 0
fi

if [ "$STATUS" != "stopped" ]; then
    echo "[ERROR] Cluster is in '$STATUS' state"
    echo "Can only start clusters that are 'stopped'"
    echo ""
    exit 1
fi

# Start the cluster
echo "Starting cluster..."
aws rds start-db-cluster \
    --db-cluster-identifier "$CLUSTER_ID" \
    --region "$REGION" \
    --output json > /dev/null

echo ""
echo "[SUCCESS] Start command sent!"
echo ""
echo "Cluster will be fully available in 2-5 minutes."
echo "You can check status with: aws rds describe-db-clusters --db-cluster-identifier $CLUSTER_ID"
echo ""

echo "========================================="
echo "To stop it tonight, run:"
echo "  ./stop-dev-rds.sh"
echo "========================================="
echo ""




