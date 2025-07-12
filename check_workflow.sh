#!/bin/bash

# GitHub Workflow Status Checker
# Lists all workflows and allows selection for detailed status

REPO="razorphish/digital-persona-platform"

echo "🔍 GitHub Workflow Status Checker"
echo "Repository: $REPO"
echo ""

# Function to list all workflows
list_workflows() {
    echo "📋 Available Workflows:"
    echo ""
    
    # Get all workflows
    WORKFLOWS=$(gh workflow list --json name,id,state,path --limit 10 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$WORKFLOWS" ]; then
        if command -v jq &> /dev/null; then
            # Use jq to format the output nicely
            echo "$WORKFLOWS" | jq -r '.[] | "  \(.name) (ID: \(.id)) - \(.state) - Path: \(.path)"'
        else
            # Fallback to basic output
            echo "$WORKFLOWS"
        fi
    else
        echo "❌ Unable to fetch workflows"
        echo "   Make sure you're authenticated: gh auth login"
        return 1
    fi
}

# Function to check specific workflow status
check_workflow_status() {
    local workflow_name="$1"
    
    echo ""
    echo "🔍 Checking status for workflow: $workflow_name"
    echo ""
    
    # Get the most recent run for this workflow
    RUN_INFO=$(gh run list --workflow="$workflow_name" --json databaseId,status,conclusion,name,createdAt,updatedAt,url --limit 1 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$RUN_INFO" ]; then
        # Extract information
        RUN_ID=$(echo "$RUN_INFO" | jq -r '.[0].databaseId // "N/A"')
        STATUS=$(echo "$RUN_INFO" | jq -r '.[0].status // "N/A"')
        CONCLUSION=$(echo "$RUN_INFO" | jq -r '.[0].conclusion // "N/A"')
        NAME=$(echo "$RUN_INFO" | jq -r '.[0].name // "N/A"')
        CREATED=$(echo "$RUN_INFO" | jq -r '.[0].createdAt // "N/A"')
        URL=$(echo "$RUN_INFO" | jq -r '.[0].url // "N/A"')
        
        echo "📋 Workflow: $NAME"
        echo "🆔 Run ID: $RUN_ID"
        echo "📊 Status: $STATUS"
        echo "✅ Conclusion: $CONCLUSION"
        echo "🕐 Created: $CREATED"
        echo "🔗 URL: $URL"
        
        # Show status emoji
        case "$STATUS" in
            "completed")
                if [ "$CONCLUSION" = "success" ]; then
                    echo "🎉 Status: COMPLETED SUCCESSFULLY"
                elif [ "$CONCLUSION" = "failure" ]; then
                    echo "❌ Status: FAILED"
                elif [ "$CONCLUSION" = "cancelled" ]; then
                    echo "🚫 Status: CANCELLED"
                else
                    echo "⚠️  Status: COMPLETED WITH UNKNOWN CONCLUSION"
                fi
                ;;
            "in_progress")
                echo "🔄 Status: IN PROGRESS"
                ;;
            "queued")
                echo "⏳ Status: QUEUED"
                ;;
            "waiting")
                echo "⏳ Status: WAITING"
                ;;
            *)
                echo "❓ Status: UNKNOWN ($STATUS)"
                ;;
        esac
        
        # Get job details if in progress
        if [ "$STATUS" = "in_progress" ] && [ "$RUN_ID" != "N/A" ]; then
            echo ""
            echo "📈 Job Details:"
            gh run view $RUN_ID --json jobs 2>/dev/null | jq -r '.jobs[] | "  \(.name): \(.status) (\(.conclusion // "running"))"' 2>/dev/null || echo "  Unable to get job details"
        fi
        
    else
        echo "❌ Unable to fetch workflow information for: $workflow_name"
        echo "   Check if the workflow name is correct"
    fi
}

# Function to check all recent runs
check_all_recent_runs() {
    echo ""
    echo "🔍 Checking all recent workflow runs..."
    echo ""
    
    # Get recent runs from all workflows
    RUNS=$(gh run list --json databaseId,status,conclusion,name,createdAt,updatedAt,url --limit 5 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$RUNS" ]; then
        if command -v jq &> /dev/null; then
            echo "📊 Recent Workflow Runs:"
            echo ""
            echo "$RUNS" | jq -r '.[] | "  \(.name) (ID: \(.databaseId)) - \(.status) (\(.conclusion // "running")) - \(.createdAt)"'
        else
            echo "$RUNS"
        fi
    else
        echo "❌ Unable to fetch recent runs"
    fi
}

# Main script logic
if [ "$1" = "--list" ] || [ "$1" = "-l" ]; then
    # Just list workflows
    list_workflows
    exit 0
elif [ "$1" = "--all" ] || [ "$1" = "-a" ]; then
    # Check all recent runs
    check_all_recent_runs
    exit 0
elif [ -n "$1" ]; then
    # Check specific workflow
    check_workflow_status "$1"
    exit 0
else
    # Interactive mode
    echo "Choose an option:"
    echo "1. List all workflows"
    echo "2. Check all recent runs"
    echo "3. Check specific workflow"
    echo "4. Check most recent run (default)"
    echo ""
    read -p "Enter your choice (1-4) [4]: " choice
    
    case "${choice:-4}" in
        1)
            list_workflows
            ;;
        2)
            check_all_recent_runs
            ;;
        3)
            echo ""
            list_workflows
            echo ""
            read -p "Enter workflow name: " workflow_name
            if [ -n "$workflow_name" ]; then
                check_workflow_status "$workflow_name"
            else
                echo "❌ No workflow name provided"
            fi
            ;;
        4|*)
            # Default: check most recent run
            echo ""
            echo "🔍 Checking most recent workflow run..."
            echo ""
            
            # Get the most recent workflow run
            RUN_INFO=$(gh run list --json databaseId,status,conclusion,name,createdAt,updatedAt,url --limit 1 2>/dev/null)
            
            if [ $? -eq 0 ] && [ -n "$RUN_INFO" ]; then
                # Extract information
                RUN_ID=$(echo "$RUN_INFO" | jq -r '.[0].databaseId // "N/A"')
                STATUS=$(echo "$RUN_INFO" | jq -r '.[0].status // "N/A"')
                CONCLUSION=$(echo "$RUN_INFO" | jq -r '.[0].conclusion // "N/A"')
                NAME=$(echo "$RUN_INFO" | jq -r '.[0].name // "N/A"')
                CREATED=$(echo "$RUN_INFO" | jq -r '.[0].createdAt // "N/A"')
                URL=$(echo "$RUN_INFO" | jq -r '.[0].url // "N/A"')
                
                echo "📋 Workflow: $NAME"
                echo "🆔 Run ID: $RUN_ID"
                echo "📊 Status: $STATUS"
                echo "✅ Conclusion: $CONCLUSION"
                echo "🕐 Created: $CREATED"
                echo "🔗 URL: $URL"
                
                # Show status emoji
                case "$STATUS" in
                    "completed")
                        if [ "$CONCLUSION" = "success" ]; then
                            echo "🎉 Status: COMPLETED SUCCESSFULLY"
                        elif [ "$CONCLUSION" = "failure" ]; then
                            echo "❌ Status: FAILED"
                        elif [ "$CONCLUSION" = "cancelled" ]; then
                            echo "🚫 Status: CANCELLED"
                        else
                            echo "⚠️  Status: COMPLETED WITH UNKNOWN CONCLUSION"
                        fi
                        ;;
                    "in_progress")
                        echo "🔄 Status: IN PROGRESS"
                        ;;
                    "queued")
                        echo "⏳ Status: QUEUED"
                        ;;
                    "waiting")
                        echo "⏳ Status: WAITING"
                        ;;
                    *)
                        echo "❓ Status: UNKNOWN ($STATUS)"
                        ;;
                esac
                
                # Get job details if in progress
                if [ "$STATUS" = "in_progress" ] && [ "$RUN_ID" != "N/A" ]; then
                    echo ""
                    echo "📈 Job Details:"
                    gh run view $RUN_ID --json jobs 2>/dev/null | jq -r '.jobs[] | "  \(.name): \(.status) (\(.conclusion // "running"))"' 2>/dev/null || echo "  Unable to get job details"
                fi
                
            else
                echo "❌ Unable to fetch workflow information"
                echo "   Check manually at: https://github.com/$REPO/actions"
            fi
            ;;
    esac
fi

echo ""
echo "📊 Full details: https://github.com/$REPO/actions"
echo ""
echo "💡 Usage tips:"
echo "  ./check_workflow.sh                    # Interactive mode"
echo "  ./check_workflow.sh --list             # List all workflows"
echo "  ./check_workflow.sh --all              # Check all recent runs"
echo "  ./check_workflow.sh \"workflow name\"   # Check specific workflow" 