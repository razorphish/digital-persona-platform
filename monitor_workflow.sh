#!/bin/bash

# GitHub Workflow Monitor Script
# Monitors the progress of the most recent workflow run

REPO="razorphish/digital-persona-platform"
INTERVAL=30  # Check every 30 seconds

echo "🔍 Monitoring GitHub workflow for repository: $REPO"
echo "⏱️  Checking every $INTERVAL seconds..."
echo "Press Ctrl+C to stop monitoring"
echo ""

while true; do
    echo "=== $(date '+%Y-%m-%d %H:%M:%S') ==="
    
    # Get the most recent workflow run
    RUN_INFO=$(gh run list --json databaseId,status,conclusion,name,createdAt,updatedAt,url --limit 1 2>/dev/null)
    
    if [ $? -eq 0 ] && [ -n "$RUN_INFO" ]; then
        # Extract information using jq if available, otherwise use grep
        if command -v jq &> /dev/null; then
            RUN_ID=$(echo "$RUN_INFO" | jq -r '.[0].databaseId // "N/A"')
            STATUS=$(echo "$RUN_INFO" | jq -r '.[0].status // "N/A"')
            CONCLUSION=$(echo "$RUN_INFO" | jq -r '.[0].conclusion // "N/A"')
            NAME=$(echo "$RUN_INFO" | jq -r '.[0].name // "N/A"')
            CREATED=$(echo "$RUN_INFO" | jq -r '.[0].createdAt // "N/A"')
            URL=$(echo "$RUN_INFO" | jq -r '.[0].url // "N/A"')
        else
            # Fallback to grep if jq is not available
            RUN_ID=$(echo "$RUN_INFO" | grep -o '"databaseId":[0-9]*' | cut -d':' -f2 || echo "N/A")
            STATUS=$(echo "$RUN_INFO" | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "N/A")
            CONCLUSION=$(echo "$RUN_INFO" | grep -o '"conclusion":"[^"]*"' | cut -d'"' -f4 || echo "N/A")
            NAME=$(echo "$RUN_INFO" | grep -o '"name":"[^"]*"' | cut -d'"' -f4 || echo "N/A")
            CREATED=$(echo "$RUN_INFO" | grep -o '"createdAt":"[^"]*"' | cut -d'"' -f4 || echo "N/A")
            URL=$(echo "$RUN_INFO" | grep -o '"url":"[^"]*"' | cut -d'"' -f4 || echo "N/A")
        fi
        
        echo "📋 Workflow: $NAME"
        echo "🆔 Run ID: $RUN_ID"
        echo "📊 Status: $STATUS"
        echo "✅ Conclusion: $CONCLUSION"
        echo "🕐 Created: $CREATED"
        echo "🔗 URL: $URL"
        
        # Check if workflow is completed
        if [ "$STATUS" = "completed" ]; then
            if [ "$CONCLUSION" = "success" ]; then
                echo "🎉 Workflow completed successfully!"
                break
            elif [ "$CONCLUSION" = "failure" ]; then
                echo "❌ Workflow failed!"
                break
            elif [ "$CONCLUSION" = "cancelled" ]; then
                echo "🚫 Workflow was cancelled!"
                break
            fi
        fi
        
        # Get detailed job status if workflow is in progress
        if [ "$STATUS" = "in_progress" ]; then
            echo ""
            echo "📈 Job Status:"
            gh run view $RUN_ID --json jobs 2>/dev/null | jq -r '.jobs[] | "  \(.name): \(.status) (\(.conclusion // "running"))"' 2>/dev/null || echo "  Unable to get job details"
        fi
        
    else
        echo "❌ Unable to fetch workflow information"
        echo "   Make sure you're authenticated: gh auth login"
        echo "   Or check the repository URL: https://github.com/$REPO/actions"
    fi
    
    echo ""
    echo "⏳ Waiting $INTERVAL seconds before next check..."
    echo "----------------------------------------"
    sleep $INTERVAL
done

echo ""
echo "🏁 Workflow monitoring completed!"
echo "📊 View full details at: https://github.com/$REPO/actions" 