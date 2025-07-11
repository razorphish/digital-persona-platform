#!/bin/bash
# cleanup-old-workflows.sh - Remove redundant GitHub Actions workflows

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
    echo -e "${RED}❌ Error: .github/workflows directory not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Step 1: Creating backup of all workflows...${NC}"
BACKUP_DIR=".github/workflows/backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup all current workflows
cp .github/workflows/*.yml "$BACKUP_DIR/"
echo -e "${GREEN}✅ All workflows backed up to: $BACKUP_DIR${NC}"

echo -e "\n${YELLOW}Step 2: Verifying new workflows exist...${NC}"
NEW_WORKFLOWS=("ci.yml" "deploy.yml" "emergency-deploy.yml")

for workflow in "${NEW_WORKFLOWS[@]}"; do
    if [ -f ".github/workflows/$workflow" ]; then
        echo -e "${GREEN}✅ Found $workflow${NC}"
    else
        echo -e "${RED}❌ Missing $workflow${NC}"
        echo -e "${YELLOW}Please ensure the new workflows are created before running this cleanup.${NC}"
        exit 1
    fi
done

echo -e "\n${YELLOW}Step 3: Workflows to be removed (redundant with new ones):${NC}"

OLD_WORKFLOWS=(
    # Redundant CI/CD workflows
    "ci-cd-pipeline.yml"
    "secure-ci-cd-pipeline.yml"
    "efficient-ci-cd.yml"
    
    # Redundant deployment workflows
    "deploy-with-iam-role.yml"
    "deploy-only.yml"
    "simple-deploy.yml"
    "simple-secure-deploy.yml"
    
    # Redundant CI workflows
    "essential-ci.yml"
    
    # Redundant specialized workflows
    "terraform-deploy.yml"
    "multi-sub-environment-deploy.yml"
    
    # Backup files
    "ci-cd-pipeline.yml.backup"
)

for workflow in "${OLD_WORKFLOWS[@]}"; do
    if [ -f ".github/workflows/$workflow" ]; then
        echo -e "  🗑️  $workflow"
    else
        echo -e "  ⚪ $workflow (not found)"
    fi
done

echo -e "\n${YELLOW}Step 4: Workflows that will be kept:${NC}"
echo -e "  ✅ ci.yml (new best practices CI)"
echo -e "  ✅ deploy.yml (new best practices deployment)"
echo -e "  ✅ emergency-deploy.yml (new emergency deployment)"
echo -e "  ✅ debug-workflow.yml (for troubleshooting)"

echo -e "\n${BLUE}Summary:${NC}"
echo -e "  📊 Total workflows before: $(ls .github/workflows/*.yml | wc -l)"
echo -e "  📊 Workflows to remove: ${#OLD_WORKFLOWS[@]}"
echo -e "  📊 Workflows to keep: 4"
echo -e "  📊 Total workflows after: 4"

echo -e "\n${RED}⚠️  WARNING: This will permanently remove the old workflow files!${NC}"
echo -e "${YELLOW}Make sure you have tested the new workflows before proceeding.${NC}"

read -p "Do you want to proceed with the cleanup? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Cleanup cancelled. Workflows are backed up in: $BACKUP_DIR${NC}"
    exit 0
fi

echo -e "\n${YELLOW}Step 5: Removing old workflows...${NC}"
REMOVED_COUNT=0

for workflow in "${OLD_WORKFLOWS[@]}"; do
    if [ -f ".github/workflows/$workflow" ]; then
        rm ".github/workflows/$workflow"
        echo -e "${GREEN}✅ Removed $workflow${NC}"
        ((REMOVED_COUNT++))
    else
        echo -e "${BLUE}ℹ️  $workflow not found (already removed)${NC}"
    fi
done

echo -e "\n${YELLOW}Step 6: Verifying final state...${NC}"
echo -e "${BLUE}Remaining workflows:${NC}"
ls -la .github/workflows/*.yml | while read -r line; do
    echo -e "  ✅ $line"
done

echo -e "\n${GREEN}🎉 Cleanup completed successfully!${NC}"
echo -e "${BLUE}Removed $REMOVED_COUNT workflows${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "  1. Commit and push these changes"
echo -e "  2. Test the remaining workflows"
echo -e "  3. Update team documentation about the simplified workflow structure"

echo -e "\n${BLUE}Backup location: $BACKUP_DIR${NC}"
echo -e "${BLUE}If you need to restore any workflows, copy them from the backup directory.${NC}"

echo -e "\n${YELLOW}Benefits of cleanup:${NC}"
echo -e "  ✅ Reduced maintenance overhead"
echo -e "  ✅ Eliminated confusion about which workflow to use"
echo -e "  ✅ Consistent deployment process"
echo -e "  ✅ Better security with IAM role authentication"
echo -e "  ✅ Simplified workflow structure"

echo -e "\n${GREEN}✅ Cleanup script completed!${NC}" 