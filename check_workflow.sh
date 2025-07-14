#!/bin/bash

# GitHub Workflow Status Checker with Continuous Monitoring
# Enhanced to support command-line parameters and continuous monitoring

REPO="razorphish/digital-persona-platform"
DEFAULT_INTERVAL=30  # Default polling interval in seconds
CONTINUOUS_MODE=false
INTERVAL=$DEFAULT_INTERVAL

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to show usage
show_usage() {
    echo -e "${BLUE}🔍 GitHub Workflow Status Checker${NC}"
    echo "Repository: $REPO"
    echo ""
    echo "Usage:"
    echo "  $0 [OPTION] [ARGUMENTS]"
    echo ""
    echo "Options:"
    echo "  1, --list                    List all workflows"
    echo "  2, --all                     Check all recent runs"
    echo "  3, --specific <name>         Check specific workflow (with continuous monitoring)"
    echo "  4, --recent                  Check most recent run (default, with continuous monitoring)"
    echo "  -w, --watch                  Enable continuous monitoring (for options 3 & 4)"
    echo "  -i, --interval <seconds>     Set polling interval (default: ${DEFAULT_INTERVAL}s)"
    echo "  -h, --help                   Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0                          # Check most recent run with continuous monitoring"
    echo "  $0 1                        # List all workflows"
    echo "  $0 --all                    # Check all recent runs"
    echo "  $0 3 \"CI/CD Pipeline\"       # Monitor specific workflow"
    echo "  $0 --specific \"CI/CD\" -i 15  # Monitor specific workflow every 15 seconds"
    echo "  $0 --watch --interval 10    # Monitor most recent run every 10 seconds"
}

# Function to list all workflows
list_workflows() {
    echo -e "${BLUE}📋 Available Workflows:${NC}"
    echo ""
    
    # Get all workflows
    WORKFLOWS=$(gh workflow list --json name,id,state,path --limit 10 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$WORKFLOWS" ]; then
        if command -v jq &> /dev/null; then
            echo "$WORKFLOWS" | jq -r '.[] | "  \(.name) (ID: \(.id)) - \(.state) - Path: \(.path)"'
        else
            echo "$WORKFLOWS"
        fi
    else
        echo -e "${RED}❌ Unable to fetch workflows${NC}"
        echo "   Make sure you're authenticated: gh auth login"
        return 1
    fi
}

# Function to check all recent runs
check_all_recent_runs() {
    echo -e "${BLUE}🔍 Checking all recent workflow runs...${NC}"
    echo ""
    
    # Get recent runs from all workflows
    RUNS=$(gh run list --json databaseId,status,conclusion,name,createdAt,updatedAt,url --limit 5 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$RUNS" ]; then
        if command -v jq &> /dev/null; then
            echo -e "${BLUE}📊 Recent Workflow Runs:${NC}"
            echo ""
            echo "$RUNS" | jq -r '.[] | "  \(.name) (ID: \(.databaseId)) - \(.status) (\(.conclusion // "running")) - \(.createdAt)"'
        else
            echo "$RUNS"
        fi
    else
        echo -e "${RED}❌ Unable to fetch recent runs${NC}"
    fi
}

# Function to get workflow status
get_workflow_status() {
    local workflow_name="$1"
    local run_id=""
    
    if [ -n "$workflow_name" ]; then
        # Get specific workflow
        RUN_INFO=$(gh run list --workflow="$workflow_name" --json databaseId,status,conclusion,name,createdAt,updatedAt,url --limit 1 2>/dev/null)
    else
        # Get most recent run
        RUN_INFO=$(gh run list --json databaseId,status,conclusion,name,createdAt,updatedAt,url --limit 1 2>/dev/null)
    fi
    
    if [ $? -eq 0 ] && [ -n "$RUN_INFO" ]; then
        echo "$RUN_INFO"
        return 0
    else
        return 1
    fi
}

# Function to display workflow status
display_workflow_status() {
    local run_info="$1"
    local show_timestamp="$2"
    
    if [ -z "$run_info" ]; then
        echo -e "${RED}❌ No workflow information available${NC}"
        return 1
    fi
    
    # Extract information
    RUN_ID=$(echo "$run_info" | jq -r '.[0].databaseId // "N/A"')
    STATUS=$(echo "$run_info" | jq -r '.[0].status // "N/A"')
    CONCLUSION=$(echo "$run_info" | jq -r '.[0].conclusion // "N/A"')
    NAME=$(echo "$run_info" | jq -r '.[0].name // "N/A"')
    CREATED=$(echo "$run_info" | jq -r '.[0].createdAt // "N/A"')
    URL=$(echo "$run_info" | jq -r '.[0].url // "N/A"')
    
    if [ "$show_timestamp" = "true" ]; then
        echo -e "${CYAN}[$(date '+%Y-%m-%d %H:%M:%S')] Checking workflow status...${NC}"
    fi
    
    echo -e "${BLUE}📋 Workflow:${NC} $NAME"
    echo -e "${BLUE}🆔 Run ID:${NC} $RUN_ID"
    echo -e "${BLUE}📊 Status:${NC} $STATUS"
    echo -e "${BLUE}✅ Conclusion:${NC} $CONCLUSION"
    echo -e "${BLUE}🕐 Created:${NC} $CREATED"
    echo -e "${BLUE}🔗 URL:${NC} $URL"
    
    # Show status emoji and determine if completed
    local is_completed=false
    case "$STATUS" in
        "completed")
            is_completed=true
            if [ "$CONCLUSION" = "success" ]; then
                echo -e "${GREEN}🎉 Status: COMPLETED SUCCESSFULLY${NC}"
            elif [ "$CONCLUSION" = "failure" ]; then
                echo -e "${RED}❌ Status: FAILED${NC}"
            elif [ "$CONCLUSION" = "cancelled" ]; then
                echo -e "${YELLOW}🚫 Status: CANCELLED${NC}"
            else
                echo -e "${YELLOW}⚠️  Status: COMPLETED WITH UNKNOWN CONCLUSION${NC}"
            fi
            ;;
        "in_progress")
            echo -e "${YELLOW}🔄 Status: IN PROGRESS${NC}"
            ;;
        "queued")
            echo -e "${CYAN}⏳ Status: QUEUED${NC}"
            ;;
        "waiting")
            echo -e "${CYAN}⏳ Status: WAITING${NC}"
            ;;
        *)
            echo -e "${RED}❓ Status: UNKNOWN ($STATUS)${NC}"
            ;;
    esac
    
    # Get job details if in progress
    if [ "$STATUS" = "in_progress" ] && [ "$RUN_ID" != "N/A" ]; then
        echo ""
        echo -e "${BLUE}📈 Job Details:${NC}"
        gh run view $RUN_ID --json jobs 2>/dev/null | jq -r '.jobs[] | "  \(.name): \(.status) (\(.conclusion // "running"))"' 2>/dev/null || echo "  Unable to get job details"
    fi
    
    # Return completion status
    if [ "$is_completed" = "true" ]; then
        return 0  # Completed
    else
        return 1  # Not completed
    fi
}

# Function to check workflow with continuous monitoring
monitor_workflow() {
    local workflow_name="$1"
    local first_run=true
    
    if [ -n "$workflow_name" ]; then
        echo -e "${BLUE}🔍 Monitoring workflow: ${workflow_name}${NC}"
    else
        echo -e "${BLUE}🔍 Monitoring most recent workflow run${NC}"
    fi
    
    if [ "$CONTINUOUS_MODE" = "true" ]; then
        echo -e "${CYAN}⏱️  Continuous monitoring enabled (interval: ${INTERVAL}s)${NC}"
        echo -e "${CYAN}📝 Will stop when workflow reaches completion status${NC}"
        echo -e "${CYAN}💡 Press Ctrl+C to stop monitoring${NC}"
    fi
    
    echo ""
    
    while true; do
        # Get workflow status
        RUN_INFO=$(get_workflow_status "$workflow_name")
        
        if [ $? -eq 0 ] && [ -n "$RUN_INFO" ]; then
            # Display status
            display_workflow_status "$RUN_INFO" "$CONTINUOUS_MODE"
            
            # Check if completed
            if [ $? -eq 0 ]; then
                echo ""
                echo -e "${GREEN}✅ Workflow completed! Monitoring stopped.${NC}"
                break
            fi
        else
            echo -e "${RED}❌ Unable to fetch workflow information${NC}"
            if [ -n "$workflow_name" ]; then
                echo "   Check if the workflow name is correct: $workflow_name"
            fi
        fi
        
        # Break if not in continuous mode
        if [ "$CONTINUOUS_MODE" = "false" ]; then
            break
        fi
        
        echo ""
        echo -e "${CYAN}⏳ Next check in ${INTERVAL} seconds...${NC}"
        echo "$(printf '%.0s=' {1..50})"
        echo ""
        
        sleep $INTERVAL
    done
    
    echo ""
    echo -e "${BLUE}📊 Full details: https://github.com/$REPO/actions${NC}"
}

# Parse command line arguments
OPTION=""
WORKFLOW_NAME=""

while [[ $# -gt 0 ]]; do
    case $1 in
        1|--list|-l)
            OPTION="list"
            shift
            ;;
        2|--all|-a)
            OPTION="all"
            shift
            ;;
        3|--specific|-s)
            OPTION="specific"
            if [ -n "$2" ] && [[ $2 != -* ]]; then
                WORKFLOW_NAME="$2"
                shift 2
            else
                echo -e "${RED}❌ Error: --specific requires a workflow name${NC}"
                show_usage
                exit 1
            fi
            ;;
        4|--recent|-r)
            OPTION="recent"
            shift
            ;;
        -w|--watch)
            CONTINUOUS_MODE=true
            shift
            ;;
        -i|--interval)
            if [ -n "$2" ] && [[ $2 =~ ^[0-9]+$ ]]; then
                INTERVAL="$2"
                shift 2
            else
                echo -e "${RED}❌ Error: --interval requires a numeric value${NC}"
                show_usage
                exit 1
            fi
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            # If it's a number, treat as option
            if [[ $1 =~ ^[1-4]$ ]]; then
                case $1 in
                    1) OPTION="list" ;;
                    2) OPTION="all" ;;
                    3) OPTION="specific"
                       if [ -n "$2" ] && [[ $2 != -* ]]; then
                           WORKFLOW_NAME="$2"
                           shift
                       fi
                       ;;
                    4) OPTION="recent" ;;
                esac
                shift
            else
                echo -e "${RED}❌ Unknown option: $1${NC}"
                show_usage
                exit 1
            fi
            ;;
    esac
done

# Default to option 4 (recent) with continuous monitoring if no option specified
if [ -z "$OPTION" ]; then
    OPTION="recent"
    CONTINUOUS_MODE=true
fi

# Enable continuous monitoring for options 3 and 4 by default
if [ "$OPTION" = "specific" ] || [ "$OPTION" = "recent" ]; then
    CONTINUOUS_MODE=true
fi

# Execute based on option
echo -e "${BLUE}🔍 GitHub Workflow Status Checker${NC}"
echo "Repository: $REPO"
echo ""

case "$OPTION" in
    "list")
        list_workflows
        ;;
    "all")
        check_all_recent_runs
        ;;
    "specific")
        if [ -z "$WORKFLOW_NAME" ]; then
            echo -e "${YELLOW}📋 Available Workflows:${NC}"
            list_workflows
            echo ""
            read -p "Enter workflow name: " WORKFLOW_NAME
            if [ -z "$WORKFLOW_NAME" ]; then
                echo -e "${RED}❌ No workflow name provided${NC}"
                exit 1
            fi
        fi
        monitor_workflow "$WORKFLOW_NAME"
        ;;
    "recent"|*)
        monitor_workflow
        ;;
esac

echo ""
echo -e "${BLUE}💡 Usage tips:${NC}"
echo "  ./check_workflow.sh                    # Monitor most recent run continuously"
echo "  ./check_workflow.sh --list             # List all workflows"
echo "  ./check_workflow.sh --all              # Check all recent runs"
echo "  ./check_workflow.sh --specific \"name\"  # Monitor specific workflow"
echo "  ./check_workflow.sh --interval 15      # Custom polling interval" 