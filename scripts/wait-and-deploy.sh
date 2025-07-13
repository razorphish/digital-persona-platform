#!/bin/bash

# Wait for CI to complete and then trigger deploy
# This script continuously monitors CI status and automatically deploys when ready

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BRANCH=${1:-"dev01"}
INTERVAL=${2:-30}  # Check every 30 seconds

echo -e "${BLUE}🔄 Waiting for CI to complete on branch: $BRANCH${NC}"
echo -e "${YELLOW}Checking every $INTERVAL seconds...${NC}"
echo ""

attempt=0
max_attempts=60  # 30 minutes max

while [ $attempt -lt $max_attempts ]; do
    attempt=$((attempt + 1))
    
    echo -e "${YELLOW}--- Check #$attempt at $(date '+%H:%M:%S') ---${NC}"
    
    # Get CI status
    CI_STATUS=$(gh run list --workflow "Continuous Integration (Optimized)" --branch "$BRANCH" --json status,conclusion,headBranch --limit 1 --jq '.[0] | [.status, .conclusion] | @tsv' 2>/dev/null || echo "")
    
    if [ -z "$CI_STATUS" ]; then
        echo -e "${RED}❌ No CI runs found for branch $BRANCH${NC}"
        echo -e "${YELLOW}Waiting for CI to start...${NC}"
    else
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
            exit 0
            
        elif [ "$CI_STATUS_VALUE" = "completed" ] && [ "$CI_CONCLUSION" = "failure" ]; then
            echo -e "${RED}❌ CI failed!${NC}"
            echo -e "${YELLOW}Please fix CI issues before deploying.${NC}"
            exit 1
            
        elif [ "$CI_STATUS_VALUE" = "in_progress" ]; then
            echo -e "${BLUE}⏳ CI is still running...${NC}"
        else
            echo -e "${YELLOW}⏳ CI status: $CI_STATUS_VALUE${NC}"
        fi
    fi
    
    echo ""
    
    # Wait before next check (unless this is the last attempt)
    if [ $attempt -lt $max_attempts ]; then
        echo -e "${YELLOW}Waiting $INTERVAL seconds before next check...${NC}"
        sleep $INTERVAL
    fi
done

echo -e "${RED}⏰ Timeout reached. CI did not complete within the expected time.${NC}"
echo -e "${YELLOW}Please check CI workflow manually.${NC}"
exit 1 