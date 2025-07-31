#!/bin/bash

# GitHub Workflow Monitor Script
# Monitors the progress of workflow runs with enhanced features

REPO="razorphish/digital-persona-platform"
INTERVAL=30  # Check every 30 seconds
MAX_ATTEMPTS=120  # 60 minutes max (120 * 30 seconds)

echo "🔍 GitHub Workflow Monitor"
echo "Repository: $REPO"
echo "⏱️  Checking every $INTERVAL seconds..."
echo "Press Ctrl+C to stop monitoring"
echo ""

# Show available workflows first
echo "📋 Available Workflows:"
./scripts/check_workflow.sh --list
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
        ./scripts/check_workflow.sh --list
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
echo "⏰ Maximum monitoring time: $((MAX_ATTEMPTS * INTERVAL / 60)) minutes"
echo ""

attempt=0
while [ $attempt -lt $MAX_ATTEMPTS ]; do
    attempt=$((attempt + 1))
    echo "=== $(date '+%Y-%m-%d %H:%M:%S') ==="
    
    if [ "$WORKFLOW_NAME" = "--all" ]; then
        # Monitor all recent runs
        ./scripts/check_workflow.sh --all
    elif [ -n "$WORKFLOW_NAME" ]; then
        # Monitor specific workflow
        ./scripts/check_workflow.sh "$WORKFLOW_NAME"
    else
        # Monitor most recent run
        ./scripts/check_workflow.sh
    fi
    
    # Check if any workflow is completed
    if [ "$WORKFLOW_NAME" = "--all" ]; then
        # For all runs, check if the most recent one is completed
        RECENT_STATUS=$(./scripts/check_workflow.sh 2>/dev/null | grep "Status:" | head -1)
        if echo "$RECENT_STATUS" | grep -q "COMPLETED\|FAILED\|CANCELLED\|SUCCESS\|✅ SUCCESS\|❌ FAILED"; then
            echo ""
            echo "🏁 A workflow has completed. Stopping monitoring."
            break
        fi
    else
        # For specific workflow or most recent, check completion
        if [ -n "$WORKFLOW_NAME" ]; then
            STATUS=$(./scripts/check_workflow.sh "$WORKFLOW_NAME" 2>/dev/null | grep "Status:" | head -1)
        else
            STATUS=$(./scripts/check_workflow.sh 2>/dev/null | grep "Status:" | head -1)
        fi
        
        if echo "$STATUS" | grep -q "COMPLETED\|FAILED\|CANCELLED\|SUCCESS\|✅ SUCCESS\|❌ FAILED"; then
            echo ""
            echo "🏁 Workflow completed. Stopping monitoring."
            break
        fi
    fi
    
    echo ""
    echo "⏳ Waiting $INTERVAL seconds before next check... (Attempt $attempt/$MAX_ATTEMPTS)"
    echo "----------------------------------------"
    
    # Wait before next check (unless this is the last attempt)
    if [ $attempt -lt $MAX_ATTEMPTS ]; then
        sleep $INTERVAL
    fi
done

# Check if we reached max attempts
if [ $attempt -ge $MAX_ATTEMPTS ]; then
    echo ""
    echo "⏰ Maximum monitoring time reached. Workflow may still be running."
    echo "Check manually at: https://github.com/$REPO/actions"
fi

echo ""
echo "🏁 Workflow monitoring completed!"
echo "📊 View full details at: https://github.com/$REPO/actions" 