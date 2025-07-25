#!/bin/bash
# cleanup-redundant-workflows.sh - Remove redundant GitHub Actions workflows
set -e

echo "🧹 GitHub Actions Workflow Cleanup"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d ".github/workflows" ]; then
    echo -e "${RED}❌ Error: .github/workflows directory not found${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Step 1: Analyzing current workflows...${NC}"

# List current workflows
echo -e "${BLUE}Current workflows in .github/workflows/:${NC}"
ls -la .github/workflows/*.yml 2>/dev/null || echo "No .yml files found"

echo -e "\n${YELLOW}Step 2: Identifying redundant workflows...${NC}"

# Define redundant workflows to remove
REDUNDANT_WORKFLOWS=(
    "ci-optimized.yml"      # Optimized version (keep original ci.yml)
    "deploy-optimized.yml"  # Optimized version (keep original deploy.yml)
    "debug-workflow.yml"    # Debug workflow (not needed in production)
)

# Define workflows to keep
KEEP_WORKFLOWS=(
    "ci.yml"                # Main CI workflow
    "deploy.yml"            # Main deploy workflow
    "emergency-deploy.yml"  # Emergency deployment workflow
)

echo -e "${BLUE}Workflows to keep:${NC}"
for workflow in "${KEEP_WORKFLOWS[@]}"; do
    if [ -f ".github/workflows/$workflow" ]; then
        echo -e "  ✅ $workflow"
    else
        echo -e "  ❌ $workflow (missing)"
    fi
done

echo -e "\n${BLUE}Redundant workflows to remove:${NC}"
for workflow in "${REDUNDANT_WORKFLOWS[@]}"; do
    if [ -f ".github/workflows/$workflow" ]; then
        echo -e "  🗑️  $workflow"
    else
        echo -e "  ⚠️  $workflow (not found)"
    fi
done

echo -e "\n${YELLOW}Step 3: Creating final backup...${NC}"

# Create a final backup of everything before cleanup
FINAL_BACKUP=".github/workflows/backup-final-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$FINAL_BACKUP"

# Backup all current workflows
cp .github/workflows/*.yml "$FINAL_BACKUP/" 2>/dev/null || true
echo -e "${GREEN}✅ Final backup created: $FINAL_BACKUP${NC}"

echo -e "\n${YELLOW}Step 4: Removing redundant workflows...${NC}"

REMOVED_COUNT=0
for workflow in "${REDUNDANT_WORKFLOWS[@]}"; do
    if [ -f ".github/workflows/$workflow" ]; then
        echo -e "${BLUE}Removing $workflow...${NC}"
        rm ".github/workflows/$workflow"
        echo -e "${GREEN}✅ Removed $workflow${NC}"
        ((REMOVED_COUNT++))
    else
        echo -e "${YELLOW}⚠️  $workflow not found (already removed?)${NC}"
    fi
done

echo -e "\n${YELLOW}Step 5: Cleaning up old backup directories...${NC}"

# Remove old backup directories (keep the final one)
BACKUP_DIRS=$(find .github/workflows -maxdepth 1 -type d -name "backup-*" | grep -v "$FINAL_BACKUP" | sort)

if [ -n "$BACKUP_DIRS" ]; then
    echo -e "${BLUE}Old backup directories found:${NC}"
    for dir in $BACKUP_DIRS; do
        echo -e "  🗑️  $dir"
    done
    
    echo -e "\n${YELLOW}Removing old backup directories...${NC}"
    for dir in $BACKUP_DIRS; do
        echo -e "${BLUE}Removing $dir...${NC}"
        rm -rf "$dir"
        echo -e "${GREEN}✅ Removed $dir${NC}"
    done
else
    echo -e "${GREEN}✅ No old backup directories found${NC}"
fi

echo -e "\n${YELLOW}Step 6: Verifying cleanup...${NC}"

# List remaining workflows
echo -e "${BLUE}Remaining workflows:${NC}"
REMAINING_WORKFLOWS=$(ls .github/workflows/*.yml 2>/dev/null | wc -l)
if [ "$REMAINING_WORKFLOWS" -gt 0 ]; then
    ls -la .github/workflows/*.yml
else
    echo -e "${YELLOW}⚠️  No workflows remaining${NC}"
fi

# List remaining directories
echo -e "\n${BLUE}Remaining directories:${NC}"
REMAINING_DIRS=$(find .github/workflows -maxdepth 1 -type d | grep -v "^\.github/workflows$" | wc -l)
if [ "$REMAINING_DIRS" -gt 0 ]; then
    find .github/workflows -maxdepth 1 -type d | grep -v "^\.github/workflows$"
else
    echo -e "${GREEN}✅ No extra directories remaining${NC}"
fi

echo -e "\n${GREEN}🎉 Cleanup completed successfully!${NC}"

echo -e "\n${YELLOW}Summary:${NC}"
echo -e "  📊 Workflows removed: $REMOVED_COUNT"
echo -e "  📁 Final backup: $FINAL_BACKUP"
echo -e "  📊 Remaining workflows: $REMAINING_WORKFLOWS"
echo -e "  📁 Remaining directories: $REMAINING_DIRS"

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "  1. Verify the remaining workflows work correctly"
echo -e "  2. Test CI/CD pipeline on a feature branch"
echo -e "  3. Update documentation if needed"
echo -e "  4. Remove the final backup directory when confident"

echo -e "\n${BLUE}To remove the final backup when ready:${NC}"
echo -e "  rm -rf $FINAL_BACKUP"

echo -e "\n${GREEN}✅ Cleanup script completed${NC}" 