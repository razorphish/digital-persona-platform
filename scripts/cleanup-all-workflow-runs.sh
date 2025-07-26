#!/bin/bash
# cleanup-all-workflow-runs.sh - Remove ALL GitHub Actions workflow runs
set -e

echo "🧹 GitHub Actions Workflow Runs Cleanup"
echo "======================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_progress() {
    echo -e "${PURPLE}[PROGRESS]${NC} $1"
}

# Check if gh CLI is installed and authenticated
check_prerequisites() {
    if ! command -v gh &> /dev/null; then
        print_error "GitHub CLI is not installed. Please install it first:"
        echo "  macOS: brew install gh"
        echo "  Ubuntu: sudo apt-get install gh"
        echo "  Windows: winget install GitHub.cli"
        exit 1
    fi
    
    if ! gh auth status &> /dev/null; then
        print_error "GitHub CLI not authenticated. Please run:"
        echo "  gh auth login"
        exit 1
    fi
    
    print_success "GitHub CLI is ready"
}

# Get repository info
get_repo_info() {
    REPO_INFO=$(gh repo view --json owner,name)
    REPO_OWNER=$(echo "$REPO_INFO" | jq -r '.owner.login')
    REPO_NAME=$(echo "$REPO_INFO" | jq -r '.name')
    
    print_status "Repository: $REPO_OWNER/$REPO_NAME"
}

# Get workflow statistics
get_workflow_stats() {
    print_status "Analyzing current workflow runs..."
    
    # Get all workflows
    WORKFLOWS=$(gh workflow list --json name,id,state --limit 100)
    WORKFLOW_COUNT=$(echo "$WORKFLOWS" | jq '. | length')
    
    if [ "$WORKFLOW_COUNT" -eq 0 ]; then
        print_warning "No workflows found in this repository"
        exit 0
    fi
    
    print_status "Found $WORKFLOW_COUNT workflows"
    
    # Count total runs across all workflows
    TOTAL_RUNS=0
    echo -e "\n${BLUE}Workflow run counts:${NC}"
    
    while IFS= read -r workflow; do
        WORKFLOW_NAME=$(echo "$workflow" | jq -r '.name')
        WORKFLOW_ID=$(echo "$workflow" | jq -r '.id')
        
        # Get run count for this workflow (using a reasonable limit)
        RUN_COUNT=$(gh run list --workflow="$WORKFLOW_ID" --json databaseId --limit 1000 | jq '. | length')
        TOTAL_RUNS=$((TOTAL_RUNS + RUN_COUNT))
        
        if [ "$RUN_COUNT" -gt 0 ]; then
            echo -e "  📊 ${WORKFLOW_NAME}: ${RUN_COUNT} runs"
        else
            echo -e "  📊 ${WORKFLOW_NAME}: ${RUN_COUNT} runs (empty)"
        fi
    done <<< "$(echo "$WORKFLOWS" | jq -c '.[]')"
    
    echo -e "\n${YELLOW}📊 Total workflow runs to delete: ${TOTAL_RUNS}${NC}"
}

# Confirm deletion
confirm_deletion() {
    echo -e "\n${RED}⚠️  WARNING: This will permanently delete ALL workflow run history!${NC}"
    echo -e "${YELLOW}This action cannot be undone.${NC}"
    echo -e "${BLUE}The workflow files (.github/workflows/*.yml) will NOT be affected.${NC}"
    
    echo -e "\n${YELLOW}What will be deleted:${NC}"
    echo -e "  🗑️  All workflow execution logs"
    echo -e "  🗑️  All workflow run artifacts"
    echo -e "  🗑️  All workflow run status history"
    echo -e "  🗑️  All build/deployment history"
    
    echo -e "\n${GREEN}What will be preserved:${NC}"
    echo -e "  ✅ Workflow definition files"
    echo -e "  ✅ Repository code and commits"
    echo -e "  ✅ Issues and pull requests"
    
    echo -e "\n${BLUE}Benefits of cleanup:${NC}"
    echo -e "  🚀 Cleaner Actions tab interface"
    echo -e "  📊 Reduced storage usage"
    echo -e "  🔍 Easier to find new workflow runs"
    echo -e "  🧹 Fresh start for workflow monitoring"
    
    echo ""
    read -p "Do you want to proceed with deleting ALL workflow runs? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Operation cancelled by user"
        exit 0
    fi
}

# Delete all workflow runs
delete_all_runs() {
    print_status "Starting workflow run deletion..."
    
    DELETED_COUNT=0
    FAILED_COUNT=0
    WORKFLOW_PROCESSED=0
    
    while IFS= read -r workflow; do
        WORKFLOW_NAME=$(echo "$workflow" | jq -r '.name')
        WORKFLOW_ID=$(echo "$workflow" | jq -r '.id')
        WORKFLOW_PROCESSED=$((WORKFLOW_PROCESSED + 1))
        
        print_progress "[$WORKFLOW_PROCESSED/$WORKFLOW_COUNT] Processing: $WORKFLOW_NAME"
        
        # Get all runs for this workflow (batch processing)
        BATCH_SIZE=50
        PAGE=1
        
        while true; do
            # Get a batch of runs
            RUNS=$(gh run list --workflow="$WORKFLOW_ID" --json databaseId --limit $BATCH_SIZE | jq -r '.[].databaseId')
            
            if [ -z "$RUNS" ]; then
                print_success "  ✅ No more runs for: $WORKFLOW_NAME"
                break
            fi
            
            RUN_COUNT=$(echo "$RUNS" | wc -w)
            print_progress "  🗑️  Deleting batch of $RUN_COUNT runs..."
            
            # Delete each run in the batch
            for RUN_ID in $RUNS; do
                if gh run delete "$RUN_ID" 2>/dev/null; then
                    DELETED_COUNT=$((DELETED_COUNT + 1))
                    # Show progress every 10 deletions
                    if [ $((DELETED_COUNT % 10)) -eq 0 ]; then
                        print_progress "    Deleted $DELETED_COUNT runs so far..."
                    fi
                else
                    FAILED_COUNT=$((FAILED_COUNT + 1))
                    print_warning "    Failed to delete run $RUN_ID"
                fi
            done
            
            PAGE=$((PAGE + 1))
            
            # Rate limiting protection
            sleep 0.1
        done
        
        print_success "  ✅ Completed: $WORKFLOW_NAME"
        echo ""
    done <<< "$(echo "$WORKFLOWS" | jq -c '.[]')"
}

# Final verification
verify_cleanup() {
    print_status "Verifying cleanup..."
    
    # Check remaining runs
    REMAINING_TOTAL=0
    
    while IFS= read -r workflow; do
        WORKFLOW_ID=$(echo "$workflow" | jq -r '.id')
        REMAINING_COUNT=$(gh run list --workflow="$WORKFLOW_ID" --json databaseId --limit 10 | jq '. | length')
        REMAINING_TOTAL=$((REMAINING_TOTAL + REMAINING_COUNT))
    done <<< "$(echo "$WORKFLOWS" | jq -c '.[]')"
    
    echo -e "\n${GREEN}🎉 Cleanup completed!${NC}"
    echo -e "\n${YELLOW}Summary:${NC}"
    echo -e "  ✅ Workflows processed: $WORKFLOW_COUNT"
    echo -e "  🗑️  Runs deleted: $DELETED_COUNT"
    echo -e "  ❌ Failed deletions: $FAILED_COUNT"
    echo -e "  📊 Remaining runs: $REMAINING_TOTAL"
    
    if [ "$REMAINING_TOTAL" -eq 0 ]; then
        print_success "🎯 Perfect! All workflow runs have been removed!"
    elif [ "$REMAINING_TOTAL" -lt 10 ]; then
        print_warning "⚠️  $REMAINING_TOTAL runs remaining (might be recent or protected)"
    else
        print_warning "⚠️  $REMAINING_TOTAL runs remaining (consider re-running the script)"
    fi
}

# Display next steps
show_next_steps() {
    echo -e "\n${YELLOW}Next steps:${NC}"
    echo -e "  1. 🔍 Check the Actions tab to see the clean interface"
    echo -e "  2. 🚀 Run your workflows to create fresh execution history"
    echo -e "  3. 📋 Update any monitoring that referenced old run IDs"
    echo -e "  4. 🗂️  Consider cleaning up workflow files if needed:"
    echo -e "      ./scripts/cleanup-old-workflows.sh"
    
    echo -e "\n${BLUE}To view the current clean state:${NC}"
    echo -e "  gh run list --limit 10"
    
    echo -e "\n${GREEN}✨ Your GitHub Actions tab should now be much cleaner!${NC}"
}

# Main execution
main() {
    check_prerequisites
    get_repo_info
    get_workflow_stats
    
    if [ "$TOTAL_RUNS" -eq 0 ]; then
        print_success "🎉 No workflow runs to delete - your repository is already clean!"
        exit 0
    fi
    
    confirm_deletion
    delete_all_runs
    verify_cleanup
    show_next_steps
}

# Run the script
main "$@" 