#!/bin/bash

# GitHub Workflow Monitor Script
# Monitors the progress of workflow runs with enhanced features

REPO="razorphish/digital-persona-platform"
INTERVAL=30  # Check every 30 seconds

echo "🔍 GitHub Workflow Monitor"
echo "Repository: $REPO"
echo "⏱️  Checking every $INTERVAL seconds..."
echo "Press Ctrl+C to stop monitoring"
echo ""

# Show available workflows first
echo "📋 Available Workflows:"
./check_workflow.sh --list
echo ""

# Ask user which workflow to monitor
echo "Choose monitoring option:"
echo "1. Monitor most recent run (default)"
echo "2. Monitor specific workflow"
echo "3. Monitor all recent runs"
echo ""
read -p "Enter your choice (1-3) [1]: " monitor_choice

case "${monitor_choice:-1}" in
    1)
        echo "🔄 Monitoring most recent workflow run..."
        WORKFLOW_NAME=""
        ;;
    2)
        echo ""
        ./check_workflow.sh --list
        echo ""
        read -p "Enter workflow name to monitor: " WORKFLOW_NAME
        if [ -z "$WORKFLOW_NAME" ]; then
            echo "❌ No workflow name provided, monitoring most recent run"
            WORKFLOW_NAME=""
        else
            echo "🔄 Monitoring workflow: $WORKFLOW_NAME"
        fi
        ;;
    3)
        echo "🔄 Monitoring all recent workflow runs..."
        WORKFLOW_NAME="--all"
        ;;
    *)
        echo "🔄 Monitoring most recent workflow run..."
        WORKFLOW_NAME=""
        ;;
esac

echo ""
echo "Starting monitoring... (Press Ctrl+C to stop)"
echo ""

while true; do
    echo "=== $(date '+%Y-%m-%d %H:%M:%S') ==="
    
    if [ "$WORKFLOW_NAME" = "--all" ]; then
        # Monitor all recent runs
        ./check_workflow.sh --all
    elif [ -n "$WORKFLOW_NAME" ]; then
        # Monitor specific workflow
        ./check_workflow.sh "$WORKFLOW_NAME"
    else
        # Monitor most recent run
        ./check_workflow.sh
    fi
    
    # Check if any workflow is completed
    if [ "$WORKFLOW_NAME" = "--all" ]; then
        # For all runs, check if the most recent one is completed
        RECENT_STATUS=$(./check_workflow.sh 2>/dev/null | grep "Status:" | head -1)
        if echo "$RECENT_STATUS" | grep -q "COMPLETED\|FAILED\|CANCELLED"; then
            echo ""
            echo "🏁 A workflow has completed. Stopping monitoring."
            break
        fi
    else
        # For specific workflow or most recent, check completion
        if [ -n "$WORKFLOW_NAME" ]; then
            STATUS=$(./check_workflow.sh "$WORKFLOW_NAME" 2>/dev/null | grep "Status:" | head -1)
        else
            STATUS=$(./check_workflow.sh 2>/dev/null | grep "Status:" | head -1)
        fi
        
        if echo "$STATUS" | grep -q "COMPLETED\|FAILED\|CANCELLED"; then
            echo ""
            echo "🏁 Workflow completed. Stopping monitoring."
            break
        fi
    fi
    
    echo ""
    echo "⏳ Waiting $INTERVAL seconds before next check..."
    echo "----------------------------------------"
    sleep $INTERVAL
done

echo ""
echo "🏁 Workflow monitoring completed!"
echo "📊 View full details at: https://github.com/$REPO/actions" 