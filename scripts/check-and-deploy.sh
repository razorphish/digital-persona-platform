#!/bin/bash

# Check CI status and trigger deploy if successful
# This script ensures we only deploy when CI has completed successfully

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BRANCH=${1:-"dev01"}

echo -e "${BLUE}🔍 Checking CI status for branch: $BRANCH${NC}"

# Check if CI workflow completed successfully
echo -e "${YELLOW}Checking CI workflow status...${NC}"

# Get the latest CI run for the branch
CI_STATUS=$(gh run list --workflow "Continuous Integration (Optimized)" --branch "$BRANCH" --json status,conclusion,headBranch --limit 1 --jq '.[0] | [.status, .conclusion] | @tsv' 2>/dev/null || echo "")

if [ -z "$CI_STATUS" ]; then
    echo -e "${RED}❌ No CI runs found for branch $BRANCH${NC}"
    echo -e "${YELLOW}Please run CI workflow first:${NC}"
    echo "1. Make a commit and push to $BRANCH"
    echo "2. Wait for CI to complete successfully"
    echo "3. Then run this script again"
    exit 1
fi

CI_STATUS_VALUE=$(echo "$CI_STATUS" | cut -f1)
CI_CONCLUSION=$(echo "$CI_STATUS" | cut -f2)

echo -e "${YELLOW}CI Status: $CI_STATUS_VALUE${NC}"
echo -e "${YELLOW}CI Conclusion: $CI_CONCLUSION${NC}"

if [ "$CI_STATUS_VALUE" = "completed" ] && [ "$CI_CONCLUSION" = "success" ]; then
    echo -e "${GREEN}✅ CI completed successfully!${NC}"
    echo -e "${YELLOW}Triggering deploy workflow...${NC}"
    
    # Trigger deploy workflow
    gh workflow run deploy.yml --ref "$BRANCH"
    
    echo -e "${GREEN}✅ Deploy workflow triggered successfully!${NC}"
    echo -e "${YELLOW}Monitor the deploy workflow at:${NC}"
    echo "https://github.com/razorphish/digital-persona-platform/actions"
    
elif [ "$CI_STATUS_VALUE" = "in_progress" ]; then
    echo -e "${YELLOW}⏳ CI is still running...${NC}"
    echo -e "${YELLOW}Please wait for CI to complete and try again.${NC}"
    exit 1
    
elif [ "$CI_STATUS_VALUE" = "completed" ] && [ "$CI_CONCLUSION" = "failure" ]; then
    echo -e "${RED}❌ CI failed!${NC}"
    echo -e "${YELLOW}Please fix CI issues before deploying.${NC}"
    exit 1
    
else
    echo -e "${YELLOW}❓ CI status unclear: $CI_STATUS_VALUE / $CI_CONCLUSION${NC}"
    echo -e "${YELLOW}Please check CI workflow manually.${NC}"
    exit 1
fi 