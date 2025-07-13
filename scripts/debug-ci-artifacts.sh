#!/bin/bash

# Debug CI artifacts and check what's being uploaded
# This script helps diagnose artifact upload/download issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BRANCH=${1:-"dev01"}

echo -e "${BLUE}🔍 Debugging CI artifacts for branch: $BRANCH${NC}"
echo ""

# Get the latest CI run
echo -e "${YELLOW}Getting latest CI run for branch $BRANCH...${NC}"
CI_RUN=$(gh run list --workflow "Continuous Integration (Optimized)" --branch "$BRANCH" --json databaseId,status,conclusion,headBranch,url --limit 1 --jq '.[0] | [.databaseId, .status, .conclusion, .headBranch, .url] | @tsv' 2>/dev/null || echo "")

if [ -z "$CI_RUN" ]; then
    echo -e "${RED}❌ No CI runs found for branch $BRANCH${NC}"
    exit 1
fi

CI_RUN_ID=$(echo "$CI_RUN" | cut -f1)
CI_STATUS=$(echo "$CI_RUN" | cut -f2)
CI_CONCLUSION=$(echo "$CI_RUN" | cut -f3)
CI_BRANCH=$(echo "$CI_RUN" | cut -f4)
CI_URL=$(echo "$CI_RUN" | cut -f5)

echo -e "${YELLOW}CI Run ID: $CI_RUN_ID${NC}"
echo -e "${YELLOW}CI Status: $CI_STATUS${NC}"
echo -e "${YELLOW}CI Conclusion: $CI_CONCLUSION${NC}"
echo -e "${YELLOW}CI Branch: $CI_BRANCH${NC}"
echo -e "${YELLOW}CI URL: $CI_URL${NC}"
echo ""

if [ "$CI_STATUS" != "completed" ] || [ "$CI_CONCLUSION" != "success" ]; then
    echo -e "${RED}❌ CI run did not complete successfully${NC}"
    echo -e "${YELLOW}Please check the CI run at: $CI_URL${NC}"
    exit 1
fi

echo -e "${GREEN}✅ CI run completed successfully${NC}"
echo ""

# Check what artifacts were uploaded
echo -e "${YELLOW}Checking artifacts for CI run $CI_RUN_ID...${NC}"
ARTIFACTS=$(gh run download --repo razorphish/digital-persona-platform --dir /tmp/ci-artifacts --run-id "$CI_RUN_ID" 2>&1 || echo "FAILED")

if [ "$ARTIFACTS" = "FAILED" ]; then
    echo -e "${RED}❌ Failed to download artifacts${NC}"
    echo -e "${YELLOW}This might mean no artifacts were uploaded${NC}"
else
    echo -e "${GREEN}✅ Artifacts downloaded to /tmp/ci-artifacts${NC}"
    echo ""
    echo -e "${YELLOW}Listing artifacts:${NC}"
    ls -la /tmp/ci-artifacts/ || echo "No artifacts directory found"
    echo ""
    
    # Check for Terraform plan artifacts
    echo -e "${YELLOW}Looking for Terraform plan artifacts:${NC}"
    find /tmp/ci-artifacts/ -name "*terraform*" -o -name "*tfplan*" 2>/dev/null || echo "No Terraform artifacts found"
    echo ""
    
    # Check for environment-specific artifacts
    echo -e "${YELLOW}Looking for environment-specific artifacts:${NC}"
    find /tmp/ci-artifacts/ -name "*dev01*" -o -name "*dev*" 2>/dev/null || echo "No environment-specific artifacts found"
fi

echo ""
echo -e "${BLUE}🔍 Environment Analysis${NC}"
echo ""

# Determine what environment the CI workflow should have generated
if [[ "$BRANCH" =~ ^dev[0-9]+$ ]]; then
    EXPECTED_ENV="$BRANCH"
    EXPECTED_ARTIFACT="terraform-plan-$EXPECTED_ENV"
elif [[ "$BRANCH" =~ ^qa[0-9]+$ ]]; then
    EXPECTED_ENV="$BRANCH"
    EXPECTED_ARTIFACT="terraform-plan-$EXPECTED_ENV"
elif [[ "$BRANCH" =~ ^staging[0-9]+$ ]]; then
    EXPECTED_ENV="$BRANCH"
    EXPECTED_ARTIFACT="terraform-plan-$EXPECTED_ENV"
elif [[ "$BRANCH" =~ ^hotfix[0-9]+$ ]]; then
    EXPECTED_ENV="$BRANCH"
    EXPECTED_ARTIFACT="terraform-plan-$EXPECTED_ENV"
elif [ "$BRANCH" = "main" ]; then
    EXPECTED_ENV="prod"
    EXPECTED_ARTIFACT="terraform-plan-$EXPECTED_ENV"
else
    EXPECTED_ENV="dev"
    EXPECTED_ARTIFACT="terraform-plan-$EXPECTED_ENV"
fi

echo -e "${YELLOW}Branch: $BRANCH${NC}"
echo -e "${YELLOW}Expected Environment: $EXPECTED_ENV${NC}"
echo -e "${YELLOW}Expected Artifact: $EXPECTED_ARTIFACT${NC}"
echo ""

# Check if the expected artifact exists
if [ -d "/tmp/ci-artifacts/$EXPECTED_ARTIFACT" ]; then
    echo -e "${GREEN}✅ Expected artifact found: $EXPECTED_ARTIFACT${NC}"
    echo -e "${YELLOW}Contents:${NC}"
    ls -la "/tmp/ci-artifacts/$EXPECTED_ARTIFACT/"
else
    echo -e "${RED}❌ Expected artifact not found: $EXPECTED_ARTIFACT${NC}"
    echo -e "${YELLOW}Available artifacts:${NC}"
    ls -la /tmp/ci-artifacts/ 2>/dev/null || echo "No artifacts found"
fi

echo ""
echo -e "${BLUE}📋 Summary${NC}"
echo "1. CI Run ID: $CI_RUN_ID"
echo "2. CI Status: $CI_STATUS ($CI_CONCLUSION)"
echo "3. Expected Artifact: $EXPECTED_ARTIFACT"
echo "4. CI URL: $CI_URL"
echo ""
echo -e "${YELLOW}If the expected artifact is missing, check the CI run logs for the Terraform plan step.${NC}" 