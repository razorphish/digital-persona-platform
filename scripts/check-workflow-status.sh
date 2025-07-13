#!/bin/bash

# Simple workflow status checker
# This script checks the status of workflows without using problematic GitHub CLI commands

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

WORKFLOW=${1:-"deploy.yml"}
BRANCH=${2:-"dev01"}

echo -e "${BLUE}🔍 Checking workflow status: $WORKFLOW on branch: $BRANCH${NC}"
echo ""

# Get the latest run for the workflow
echo -e "${YELLOW}Getting latest $WORKFLOW run...${NC}"

# Try to get the run ID using a simpler approach
RUN_ID=$(gh run list --workflow="$WORKFLOW" --branch="$BRANCH" --limit 1 --json databaseId --jq '.[0].databaseId' 2>/dev/null || echo "")

if [ -z "$RUN_ID" ]; then
    echo -e "${RED}❌ Could not get run ID for $WORKFLOW${NC}"
    echo -e "${YELLOW}Please check manually at: https://github.com/razorphish/digital-persona-platform/actions${NC}"
    exit 1
fi

echo -e "${YELLOW}Run ID: $RUN_ID${NC}"

# Get the status
STATUS=$(gh run view "$RUN_ID" --json status,conclusion --jq '.status' 2>/dev/null || echo "unknown")
CONCLUSION=$(gh run view "$RUN_ID" --json status,conclusion --jq '.conclusion' 2>/dev/null || echo "unknown")

echo -e "${YELLOW}Status: $STATUS${NC}"
echo -e "${YELLOW}Conclusion: $CONCLUSION${NC}"

if [ "$STATUS" = "completed" ]; then
    if [ "$CONCLUSION" = "success" ]; then
        echo -e "${GREEN}✅ Workflow completed successfully!${NC}"
    else
        echo -e "${RED}❌ Workflow failed with conclusion: $CONCLUSION${NC}"
    fi
elif [ "$STATUS" = "in_progress" ]; then
    echo -e "${YELLOW}⏳ Workflow is still running...${NC}"
else
    echo -e "${YELLOW}❓ Workflow status: $STATUS${NC}"
fi

echo ""
echo -e "${BLUE}📋 Workflow URL:${NC}"
echo "https://github.com/razorphish/digital-persona-platform/actions/runs/$RUN_ID" 