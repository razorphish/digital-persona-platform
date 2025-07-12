#!/bin/bash

echo "🔍 Checking GitHub workflow status..."
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
    echo "   Check manually at: https://github.com/razorphish/digital-persona-platform/actions"
fi

echo ""
echo "📊 Full details: https://github.com/razorphish/digital-persona-platform/actions" 