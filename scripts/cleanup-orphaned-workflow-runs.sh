#!/bin/bash
# cleanup-orphaned-workflow-runs.sh - Clean up runs from deleted/renamed workflows
set -e

echo "🧹 Orphaned Workflow Runs Cleanup"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Analyzing orphaned workflow runs...${NC}"

# Get all runs and their workflow names
echo -e "${YELLOW}Finding runs from non-existent workflows...${NC}"

# Get current active workflow names
ACTIVE_WORKFLOWS=$(gh workflow list --json name | jq -r '.[].name')

echo -e "${BLUE}Active workflows:${NC}"
echo "$ACTIVE_WORKFLOWS" | while read -r workflow; do
    echo -e "  ✅ $workflow"
done

echo -e "\n${YELLOW}Checking for orphaned runs...${NC}"

# Get all runs and check if their workflows still exist
ORPHANED_RUNS=()
while IFS= read -r line; do
    RUN_ID=$(echo "$line" | cut -d: -f1)
    WORKFLOW_NAME=$(echo "$line" | cut -d: -f2- | sed 's/^ *//')
    
    # Check if this workflow name exists in active workflows
    if ! echo "$ACTIVE_WORKFLOWS" | grep -q "^$WORKFLOW_NAME$"; then
        ORPHANED_RUNS+=("$RUN_ID")
        echo -e "  🗑️  Run $RUN_ID from deleted workflow: $WORKFLOW_NAME"
    fi
done < <(gh run list --json databaseId,workflowName --limit 100 | jq -r '.[] | "\(.databaseId): \(.workflowName)"')

if [ ${#ORPHANED_RUNS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ No orphaned runs found!${NC}"
    exit 0
fi

echo -e "\n${YELLOW}Found ${#ORPHANED_RUNS[@]} orphaned runs to delete${NC}"

echo -e "\n${RED}⚠️  These runs are from workflows that no longer exist${NC}"
read -p "Delete these orphaned runs? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cleanup cancelled${NC}"
    exit 0
fi

echo -e "\n${BLUE}Deleting orphaned runs...${NC}"

DELETED=0
FAILED=0

for RUN_ID in "${ORPHANED_RUNS[@]}"; do
    echo -n -e "\r${BLUE}Deleting run $RUN_ID...${NC}"
    
    if gh run delete "$RUN_ID" 2>/dev/null; then
        DELETED=$((DELETED + 1))
    else
        FAILED=$((FAILED + 1))
        echo -e "\n${RED}Failed to delete run $RUN_ID${NC}"
    fi
done

echo -e "\n\n${GREEN}🎉 Orphaned runs cleanup completed!${NC}"
echo -e "${YELLOW}Summary:${NC}"
echo -e "  🗑️  Deleted: $DELETED runs"
echo -e "  ❌ Failed: $FAILED runs"

echo -e "\n${BLUE}Remaining runs:${NC}"
gh run list --limit 5 