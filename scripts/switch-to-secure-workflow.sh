#!/bin/bash
# switch-to-secure-workflow.sh - Switch to secure IAM role-based workflow

echo "🔄 Switching to Secure CI/CD Workflow..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "\n${YELLOW}Step 1: Backup current workflow${NC}"
cp .github/workflows/ci-cd-pipeline.yml .github/workflows/ci-cd-pipeline.yml.backup
echo -e "${GREEN}✅ Backup created: .github/workflows/ci-cd-pipeline.yml.backup${NC}"

echo -e "\n${YELLOW}Step 2: Replace with secure workflow${NC}"
cp .github/workflows/secure-ci-cd-pipeline.yml .github/workflows/ci-cd-pipeline.yml
echo -e "${GREEN}✅ Secure workflow installed${NC}"

echo -e "\n${YELLOW}Step 3: Verify GitHub secrets${NC}"
echo -e "${BLUE}Please ensure you have these secrets in your GitHub repository:${NC}"

# Get current AWS account ID dynamically
CURRENT_ACCOUNT=$(aws sts get-caller-identity --query 'Account' --output text 2>/dev/null || echo "YOUR_AWS_ACCOUNT_ID")
echo -e "  ✅ AWS_ROLE_ARN: arn:aws:iam::${CURRENT_ACCOUNT}:role/GitHubActionsRole"
echo -e "  ❌ Remove: AWS_ACCESS_KEY_ID (if exists)"
echo -e "  ❌ Remove: AWS_SECRET_ACCESS_KEY (if exists)"

echo -e "\n${YELLOW}Step 4: Test the workflow${NC}"
echo -e "${BLUE}To test the new workflow:${NC}"
echo -e "  1. Commit and push this change"
echo -e "  2. Go to Actions tab in GitHub"
echo -e "  3. Monitor the workflow execution"
echo -e "  4. Check that it uses role-based authentication"

echo -e "\n${GREEN}🎉 Workflow switch completed!${NC}"
echo -e "\n${BLUE}Summary of changes:${NC}"
echo -e "  ✅ Replaced access keys with IAM role authentication"
echo -e "  ✅ Maintained all existing CI/CD functionality"
echo -e "  ✅ Added security scanning and health checks"
echo -e "  ✅ Backup of original workflow created"

echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "  1. Commit and push these changes"
echo -e "  2. Monitor the first workflow run"
echo -e "  3. Remove old access key secrets from GitHub"
echo -e "  4. Test deployment to ensure everything works"

echo -e "\n${RED}⚠️  Important:${NC}"
echo -e "  - Keep the backup file until you confirm everything works"
echo -e "  - If issues occur, you can restore: cp .github/workflows/ci-cd-pipeline.yml.backup .github/workflows/ci-cd-pipeline.yml" 