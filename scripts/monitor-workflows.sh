#!/bin/bash

# Monitor GitHub Actions Workflows with Interval
# This script monitors CI and deploy workflows with regular status updates

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
INTERVAL=${1:-30}  # Default 30 seconds
MAX_ATTEMPTS=${2:-60}  # Default 60 attempts (30 minutes)
BRANCH=${3:-"dev01"}  # Default branch

echo -e "${CYAN}🚀 GitHub Actions Workflow Monitor${NC}"
echo -e "${YELLOW}Monitoring workflows on branch: $BRANCH${NC}"
echo -e "${YELLOW}Check interval: ${INTERVAL}s | Max attempts: ${MAX_ATTEMPTS}${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop monitoring${NC}"
echo ""

# Function to get workflow status
get_workflow_status() {
    local workflow_name="$1"
    local branch="$2"
    
    # Get the latest run for the specified workflow and branch
    gh run list --workflow "$workflow_name" --json status,conclusion,headBranch,createdAt,url --limit 10 | \
    jq -r ".[] | select(.headBranch == \"$branch\") | [.status, .conclusion, .url] | @tsv" | \
    head -1
}

# Function to format status with colors
format_status() {
    local status="$1"
    local conclusion="$2"
    local url="$3"
    
    case "$status" in
        "completed")
            case "$conclusion" in
                "success")
                    echo -e "${GREEN}✅ SUCCESS${NC}"
                    ;;
                "failure")
                    echo -e "${RED}❌ FAILED${NC}"
                    ;;
                "cancelled")
                    echo -e "${YELLOW}⚠️  CANCELLED${NC}"
                    ;;
                *)
                    echo -e "${YELLOW}❓ UNKNOWN ($conclusion)${NC}"
                    ;;
            esac
            ;;
        "in_progress")
            echo -e "${BLUE}🔄 RUNNING${NC}"
            ;;
        "queued")
            echo -e "${PURPLE}⏳ QUEUED${NC}"
            ;;
        "waiting")
            echo -e "${PURPLE}⏳ WAITING${NC}"
            ;;
        *)
            echo -e "${YELLOW}❓ UNKNOWN ($status)${NC}"
            ;;
    esac
}

# Function to display workflow info
display_workflow() {
    local workflow_name="$1"
    local branch="$2"
    
    echo -e "${CYAN}📋 $workflow_name${NC}"
    
    local result=$(get_workflow_status "$workflow_name" "$branch")
    if [ -z "$result" ]; then
        echo -e "  ${YELLOW}No runs found for branch $branch${NC}"
        return
    fi
    
    local status=$(echo "$result" | cut -f1)
    local conclusion=$(echo "$result" | cut -f2)
    local url=$(echo "$result" | cut -f3)
    
    local formatted_status=$(format_status "$status" "$conclusion" "$url")
    echo -e "  Status: $formatted_status"
    echo -e "  URL: ${BLUE}$url${NC}"
}

# Function to check if we should trigger deploy
should_trigger_deploy() {
    local ci_status=$(get_workflow_status "Continuous Integration (Optimized)" "$BRANCH")
    if [ -n "$ci_status" ]; then
        local ci_conclusion=$(echo "$ci_status" | cut -f2)
        if [ "$ci_conclusion" = "success" ]; then
            return 0  # true
        fi
    fi
    return 1  # false
}

# Function to trigger deploy workflow
trigger_deploy() {
    echo -e "${GREEN}🎯 CI completed successfully! Triggering deploy workflow...${NC}"
    gh workflow run deploy.yml --ref "$BRANCH"
    echo -e "${GREEN}✅ Deploy workflow triggered${NC}"
}

# Main monitoring loop
attempt=0
deploy_triggered=false

while [ $attempt -lt $MAX_ATTEMPTS ]; do
    attempt=$((attempt + 1))
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}📊 Check #$attempt at $timestamp${NC}"
    echo ""
    
    # Display CI workflow status
    display_workflow "Continuous Integration (Optimized)" "$BRANCH"
    echo ""
    
    # Display deploy workflow status
    display_workflow "deploy.yml" "$BRANCH"
    echo ""
    
    # Check if we should trigger deploy
    if [ "$deploy_triggered" = false ] && should_trigger_deploy; then
        trigger_deploy
        deploy_triggered=true
        echo ""
    fi
    
    # Check if both workflows are complete
    ci_status=$(get_workflow_status "Continuous Integration (Optimized)" "$BRANCH")
    deploy_status=$(get_workflow_status "deploy.yml" "$BRANCH")
    
    if [ -n "$ci_status" ] && [ -n "$deploy_status" ]; then
        ci_conclusion=$(echo "$ci_status" | cut -f2)
        deploy_conclusion=$(echo "$deploy_status" | cut -f2)
        
        if [ "$ci_conclusion" = "success" ] && [ "$deploy_conclusion" = "success" ]; then
            echo -e "${GREEN}🎉 SUCCESS! Both CI and Deploy workflows completed successfully!${NC}"
            exit 0
        elif [ "$ci_conclusion" = "failure" ] || [ "$deploy_conclusion" = "failure" ]; then
            echo -e "${RED}💥 FAILURE! One or more workflows failed.${NC}"
            echo -e "${YELLOW}Check the workflow URLs above for details.${NC}"
            exit 1
        fi
    fi
    
    # Show next check time (macOS compatible)
    next_check=$(date -v+${INTERVAL}S '+%H:%M:%S' 2>/dev/null || date -d "+$INTERVAL seconds" '+%H:%M:%S' 2>/dev/null || echo "in $INTERVAL seconds")
    echo -e "${YELLOW}⏰ Next check at: $next_check${NC}"
    echo ""
    
    # Wait for next interval (unless this is the last attempt)
    if [ $attempt -lt $MAX_ATTEMPTS ]; then
        sleep $INTERVAL
    fi
done

echo -e "${YELLOW}⏰ Maximum attempts reached. Monitoring stopped.${NC}"
echo -e "${YELLOW}Check the workflow URLs above for final status.${NC}" 