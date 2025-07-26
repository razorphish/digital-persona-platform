#!/bin/bash
# quick-cleanup-workflow-runs.sh - Quick cleanup of recent workflow runs
set -e

echo "🧹 Quick GitHub Actions Workflow Runs Cleanup"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Quick cleanup of the most recent runs
echo -e "${BLUE}Deleting the 100 most recent workflow runs...${NC}"

# Get recent runs and delete them
RUNS=$(gh run list --json databaseId --limit 100 | jq -r '.[].databaseId')

if [ -z "$RUNS" ]; then
    echo -e "${GREEN}✅ No workflow runs found to delete${NC}"
    exit 0
fi

COUNT=0
DELETED=0
FAILED=0

for RUN_ID in $RUNS; do
    COUNT=$((COUNT + 1))
    echo -n -e "\r${BLUE}Processing run $COUNT/100...${NC}"
    
    if gh run delete "$RUN_ID" 2>/dev/null; then
        DELETED=$((DELETED + 1))
    else
        FAILED=$((FAILED + 1))
    fi
done

echo -e "\n\n${GREEN}✅ Quick cleanup completed!${NC}"
echo -e "${YELLOW}Summary:${NC}"
echo -e "  🗑️  Deleted: $DELETED runs"
echo -e "  ❌ Failed: $FAILED runs"

echo -e "\n${BLUE}To delete more runs, run this script again or use:${NC}"
echo -e "  ./scripts/cleanup-all-workflow-runs.sh"

echo -e "\n${BLUE}Current remaining runs:${NC}"
gh run list --limit 5 