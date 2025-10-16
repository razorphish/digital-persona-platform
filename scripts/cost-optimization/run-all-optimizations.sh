#!/bin/bash
# Master AWS Cost Optimization Script
# Runs all Phase 1 optimizations for immediate savings
# Expected Total Savings: ~$60-225/month

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================="
echo "🚀 AWS Cost Optimization Suite"
echo "========================================="
echo ""
echo "This script will run all Phase 1 optimizations:"
echo ""
echo "  1. Delete old RDS snapshots        → Save ~\$15/month"
echo "  2. Delete unused secrets           → Save ~\$4.40/month"
echo "  3. Reduce backup retention         → Save ~\$40/month"
echo ""
echo "Total Quick Wins: ~\$60/month (47% reduction)"
echo ""
echo "Phase 2 (RDS Scheduling) is available separately"
echo "and can save an additional ~\$165/month."
echo ""
echo "========================================="
echo ""

# Confirm execution
read -p "⚠️  Proceed with Phase 1 optimizations? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted. No changes were made."
    exit 0
fi

echo ""
echo "========================================="
echo "📋 Phase 1: Quick Wins"
echo "========================================="
echo ""

# Track results
TOTAL_SAVINGS=0
SUCCESSFUL=0
FAILED=0

# Step 1: Delete old RDS snapshots
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1/3: Delete Old RDS Snapshots"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if bash "$SCRIPT_DIR/cleanup-old-snapshots.sh"; then
    echo "✅ Snapshot cleanup completed"
    TOTAL_SAVINGS=$((TOTAL_SAVINGS + 15))
    ((SUCCESSFUL++))
else
    echo "❌ Snapshot cleanup failed"
    ((FAILED++))
fi

echo ""
sleep 2

# Step 2: Delete unused secrets
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2/3: Delete Unused Secrets"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if bash "$SCRIPT_DIR/cleanup-unused-secrets.sh"; then
    echo "✅ Secrets cleanup completed"
    TOTAL_SAVINGS=$((TOTAL_SAVINGS + 4))
    ((SUCCESSFUL++))
else
    echo "❌ Secrets cleanup failed"
    ((FAILED++))
fi

echo ""
sleep 2

# Step 3: Reduce backup retention
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3/3: Reduce Backup Retention"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if bash "$SCRIPT_DIR/reduce-backup-retention.sh"; then
    echo "✅ Backup retention updated"
    TOTAL_SAVINGS=$((TOTAL_SAVINGS + 40))
    ((SUCCESSFUL++))
else
    echo "❌ Backup retention update failed"
    ((FAILED++))
fi

echo ""
echo "========================================="
echo "🎉 Phase 1 Complete!"
echo "========================================="
echo ""
echo "Results:"
echo "  ✅ Successful: $SUCCESSFUL/3"
echo "  ❌ Failed: $FAILED/3"
echo "  💰 Est. Monthly Savings: ~\$$TOTAL_SAVINGS"
echo "  📅 Est. Annual Savings: ~\$$((TOTAL_SAVINGS * 12))"
echo ""

if [ $SUCCESSFUL -eq 3 ]; then
    echo "🌟 All optimizations completed successfully!"
    echo ""
    echo "Next Steps:"
    echo ""
    echo "Phase 2: RDS Scheduler (~\$165/month savings)"
    echo "  1. Package Lambda: ./scripts/cost-optimization/package-rds-scheduler-lambda.sh"
    echo "  2. Deploy Terraform: cd terraform/environments/dev && terraform apply"
    echo "  3. Verify schedule: aws events list-rules --name-prefix dev-"
    echo ""
    echo "Phase 3: Advanced Optimizations (~\$20/month savings)"
    echo "  - Apply ECR lifecycle policies"
    echo "  - Update RDS Terraform configuration"
    echo "  - Enable Cost Explorer caching"
    echo ""
    echo "Monitor savings:"
    echo "  ./scripts/cost-optimization/cache-cost-explorer.sh"
elif [ $SUCCESSFUL -gt 0 ]; then
    echo "⚠️  Some optimizations completed with errors"
    echo "   Review the output above for details"
    echo ""
    echo "You can re-run failed steps individually:"
    echo "  ./scripts/cost-optimization/cleanup-old-snapshots.sh"
    echo "  ./scripts/cost-optimization/cleanup-unused-secrets.sh"
    echo "  ./scripts/cost-optimization/reduce-backup-retention.sh"
else
    echo "❌ All optimizations failed"
    echo "   Please review errors and retry"
fi

echo ""
echo "========================================="


