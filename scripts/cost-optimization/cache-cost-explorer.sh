#!/bin/bash
# Cached Cost Explorer Script
# Reduces API calls to Cost Explorer by caching results locally
# Expected Savings: ~$5-8/month

set -e

CACHE_DIR="${HOME}/.aws-cost-cache"
CACHE_FILE="${CACHE_DIR}/cost-data.json"
CACHE_MAX_AGE_HOURS=24

echo "📊 AWS Cost Explorer (Cached)"
echo "====================================="
echo ""

# Create cache directory if it doesn't exist
mkdir -p "$CACHE_DIR"

# Function to check if cache is valid
is_cache_valid() {
    if [ ! -f "$CACHE_FILE" ]; then
        return 1
    fi
    
    local cache_age=$(( $(date +%s) - $(stat -f %m "$CACHE_FILE" 2>/dev/null || stat -c %Y "$CACHE_FILE" 2>/dev/null || echo 0) ))
    local max_age_seconds=$((CACHE_MAX_AGE_HOURS * 3600))
    
    if [ "$cache_age" -lt "$max_age_seconds" ]; then
        return 0
    else
        return 1
    fi
}

# Function to fetch fresh data
fetch_cost_data() {
    echo "🔄 Fetching fresh cost data from AWS..."
    
    local end_date=$(date +%Y-%m-%d)
    local start_date=$(date -d "30 days ago" +%Y-%m-%d 2>/dev/null || date -v-30d +%Y-%m-%d 2>/dev/null)
    
    aws ce get-cost-and-usage \
        --time-period Start="$start_date",End="$end_date" \
        --granularity MONTHLY \
        --metrics BlendedCost \
        --group-by Type=DIMENSION,Key=SERVICE \
        --output json > "$CACHE_FILE"
    
    echo "✅ Data cached successfully"
}

# Check if we should use cache
if is_cache_valid; then
    echo "✅ Using cached data (age: $(($(( $(date +%s) - $(stat -f %m "$CACHE_FILE" 2>/dev/null || stat -c %Y "$CACHE_FILE" 2>/dev/null) )) / 3600)) hours old)"
else
    echo "⏰ Cache expired or missing"
    fetch_cost_data
fi

echo ""
echo "📈 Cost Summary (Last 30 Days)"
echo "-------------------------------------"

# Parse and display top services
jq -r '.ResultsByTime[0].Groups[] | 
    select(.Metrics.BlendedCost.Amount | tonumber > 0.01) |
    "\(.Keys[0]): $\(.Metrics.BlendedCost.Amount | tonumber | . * 100 | round / 100)"' \
    "$CACHE_FILE" | \
    sort -t'$' -k2 -rn | \
    head -10

# Calculate total
echo "-------------------------------------"
TOTAL=$(jq -r '[.ResultsByTime[0].Groups[].Metrics.BlendedCost.Amount | tonumber] | add' "$CACHE_FILE")
printf "TOTAL: \$%.2f\n" "$TOTAL"

echo ""
echo "====================================="
echo "💾 Cache Info:"
echo "  Location: $CACHE_FILE"
echo "  Max Age: ${CACHE_MAX_AGE_HOURS}h"
echo "  Next Refresh: $(date -d "@$(($(stat -f %m "$CACHE_FILE" 2>/dev/null || stat -c %Y "$CACHE_FILE" 2>/dev/null) + CACHE_MAX_AGE_HOURS * 3600))" 2>/dev/null || echo "N/A")"
echo ""
echo "Force refresh: $0 --refresh"
echo "====================================="

# Handle --refresh flag
if [ "$1" = "--refresh" ]; then
    echo ""
    echo "🔄 Forcing refresh..."
    fetch_cost_data
fi


