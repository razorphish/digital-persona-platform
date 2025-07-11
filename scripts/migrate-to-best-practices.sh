#!/bin/bash
# migrate-to-best-practices.sh - Migrate to GitHub Actions best practices

set -e

echo "🔄 GitHub Actions Best Practices Migration"
echo "=========================================="

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

echo -e "\n${YELLOW}Step 1: Creating backup of current workflows...${NC}"
BACKUP_DIR=".github/workflows/backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup all current workflows
cp .github/workflows/*.yml "$BACKUP_DIR/"
echo -e "${GREEN}✅ Workflows backed up to: $BACKUP_DIR${NC}"

echo -e "\n${YELLOW}Step 2: Verifying new workflows exist...${NC}"
NEW_WORKFLOWS=("ci.yml" "deploy.yml" "emergency-deploy.yml")

for workflow in "${NEW_WORKFLOWS[@]}"; do
    if [ -f ".github/workflows/$workflow" ]; then
        echo -e "${GREEN}✅ Found $workflow${NC}"
    else
        echo -e "${RED}❌ Missing $workflow${NC}"
        echo -e "${YELLOW}Please ensure the new workflows are created before running this migration.${NC}"
        exit 1
    fi
done

echo -e "\n${YELLOW}Step 3: Checking GitHub secrets...${NC}"
echo -e "${BLUE}Required secrets:${NC}"
echo -e "  ✅ AWS_ROLE_ARN: arn:aws:iam::ACCOUNT_ID:role/GitHubActionsRole"
echo -e "  ❌ Remove: AWS_ACCESS_KEY_ID (if exists)"
echo -e "  ❌ Remove: AWS_SECRET_ACCESS_KEY (if exists)"

echo -e "\n${YELLOW}Step 4: Listing current workflows...${NC}"
echo -e "${BLUE}Current workflows:${NC}"
ls -la .github/workflows/*.yml | while read -r line; do
    echo -e "  📄 $line"
done

echo -e "\n${YELLOW}Step 5: Ready to remove old workflows?${NC}"
echo -e "${BLUE}The following workflows will be removed:${NC}"

OLD_WORKFLOWS=(
    "ci-cd-pipeline.yml"
    "secure-ci-cd-pipeline.yml"
    "deploy-with-iam-role.yml"
    "essential-ci.yml"
    "efficient-ci-cd.yml"
    "simple-deploy.yml"
    "simple-secure-deploy.yml"
    "terraform-deploy.yml"
    "multi-sub-environment-deploy.yml"
    "deploy-only.yml"
)

for workflow in "${OLD_WORKFLOWS[@]}"; do
    if [ -f ".github/workflows/$workflow" ]; then
        echo -e "  🗑️  $workflow"
    fi
done

echo -e "\n${YELLOW}Workflows that will be kept:${NC}"
echo -e "  ✅ ci.yml (new)"
echo -e "  ✅ deploy.yml (new)"
echo -e "  ✅ emergency-deploy.yml (new)"
echo -e "  ✅ debug-workflow.yml (for troubleshooting)"

echo -e "\n${RED}⚠️  WARNING: This will permanently remove the old workflow files!${NC}"
echo -e "${YELLOW}Make sure you have tested the new workflows before proceeding.${NC}"

read -p "Do you want to proceed with the migration? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Migration cancelled. Workflows are backed up in: $BACKUP_DIR${NC}"
    exit 0
fi

echo -e "\n${YELLOW}Step 6: Removing old workflows...${NC}"
for workflow in "${OLD_WORKFLOWS[@]}"; do
    if [ -f ".github/workflows/$workflow" ]; then
        rm ".github/workflows/$workflow"
        echo -e "${GREEN}✅ Removed $workflow${NC}"
    else
        echo -e "${BLUE}ℹ️  $workflow not found (already removed)${NC}"
    fi
done

echo -e "\n${YELLOW}Step 7: Verifying final state...${NC}"
echo -e "${BLUE}Remaining workflows:${NC}"
ls -la .github/workflows/*.yml | while read -r line; do
    echo -e "  ✅ $line"
done

echo -e "\n${GREEN}🎉 Migration completed successfully!${NC}"

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "  1. Commit and push these changes"
echo -e "  2. Test the new CI workflow by pushing to a feature branch"
echo -e "  3. Test the deploy workflow by merging to main"
echo -e "  4. Test the emergency deploy workflow manually"
echo -e "  5. Monitor the workflows in GitHub Actions tab"

echo -e "\n${BLUE}Backup location: $BACKUP_DIR${NC}"
echo -e "${BLUE}If you need to restore old workflows, copy them from the backup directory.${NC}"

echo -e "\n${YELLOW}Important reminders:${NC}"
echo -e "  ✅ Ensure AWS_ROLE_ARN secret is configured in GitHub"
echo -e "  ✅ Remove old AWS access key secrets if they exist"
echo -e "  ✅ Test all environments (dev, staging, prod)"
echo -e "  ✅ Update team documentation about new workflow process"

echo -e "\n${GREEN}✅ Migration script completed!${NC}" 