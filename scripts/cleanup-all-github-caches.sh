#!/bin/bash
# cleanup-all-github-caches.sh - Remove ALL GitHub Actions caches
set -e

# Add bc to PATH if it's keg-only installed
export PATH="/opt/homebrew/opt/bc/bin:$PATH"

echo "🧹 GitHub Actions Cache Cleanup"
echo "==============================="

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

# Analyze current caches
analyze_caches() {
    print_status "Analyzing current GitHub Actions caches..."
    
    # Get cache information
    CACHE_DATA=$(gh cache list --json id,key,sizeInBytes,createdAt,lastAccessedAt --limit 1000)
    CACHE_COUNT=$(echo "$CACHE_DATA" | jq '. | length')
    
    if [ "$CACHE_COUNT" -eq 0 ]; then
        print_success "🎉 No caches found - repository is already clean!"
        exit 0
    fi
    
    print_status "Found $CACHE_COUNT caches"
    
    # Calculate total size
    TOTAL_SIZE_BYTES=$(echo "$CACHE_DATA" | jq '[.[].sizeInBytes] | add')
    
    # Use bc if available, otherwise use basic math
    if command -v bc &> /dev/null; then
        TOTAL_SIZE_MB=$(echo "scale=2; $TOTAL_SIZE_BYTES / 1024 / 1024" | bc)
        TOTAL_SIZE_GB=$(echo "scale=3; $TOTAL_SIZE_BYTES / 1024 / 1024 / 1024" | bc)
    else
        TOTAL_SIZE_MB=$((TOTAL_SIZE_BYTES / 1024 / 1024))
        TOTAL_SIZE_GB=$((TOTAL_SIZE_BYTES / 1024 / 1024 / 1024))
    fi
    
    echo -e "\n${BLUE}Cache Analysis:${NC}"
    echo -e "  📊 Total caches: $CACHE_COUNT"
    echo -e "  💾 Total size: ${TOTAL_SIZE_MB} MB (${TOTAL_SIZE_GB} GB)"
    
    # Show cache breakdown by type
    echo -e "\n${BLUE}Cache Types:${NC}"
    echo "$CACHE_DATA" | jq -r '.[].key' | sed 's/-.*//' | sort | uniq -c | sort -nr | while read -r count type; do
        echo -e "  📦 $type: $count caches"
    done
    
    # Show largest caches
    echo -e "\n${BLUE}Largest caches:${NC}"
    echo "$CACHE_DATA" | jq -r '.[] | "\(.sizeInBytes) \(.key)"' | sort -nr | head -5 | while read -r size key; do
        if command -v bc &> /dev/null; then
            size_mb=$(echo "scale=2; $size / 1024 / 1024" | bc)
        else
            size_mb=$((size / 1024 / 1024))
        fi
        echo -e "  💾 ${size_mb} MB - ${key:0:60}..."
    done
    
    # Show oldest caches
    echo -e "\n${BLUE}Oldest caches:${NC}"
    echo "$CACHE_DATA" | jq -r '.[] | "\(.createdAt) \(.key)"' | sort | head -5 | while read -r date key; do
        echo -e "  📅 $date - ${key:0:50}..."
    done
}

# Confirm deletion
confirm_deletion() {
    echo -e "\n${RED}⚠️  WARNING: This will permanently delete ALL GitHub Actions caches!${NC}"
    echo -e "${YELLOW}This action cannot be undone.${NC}"
    
    echo -e "\n${YELLOW}What will be deleted:${NC}"
    echo -e "  🗑️  All build caches (npm, pip, terraform, etc.)"
    echo -e "  🗑️  All dependency caches"
    echo -e "  🗑️  All tool caches (trivy, etc.)"
    echo -e "  🗑️  All custom workflow caches"
    
    echo -e "\n${GREEN}What will be preserved:${NC}"
    echo -e "  ✅ Repository code and commits"
    echo -e "  ✅ Workflow definitions"
    echo -e "  ✅ Issues and pull requests"
    echo -e "  ✅ All other repository data"
    
    echo -e "\n${BLUE}Benefits of cleanup:${NC}"
    echo -e "  🚀 Reduced storage usage (~${TOTAL_SIZE_GB} GB freed)"
    echo -e "  💰 Lower GitHub storage costs"
    echo -e "  🧹 Fresh cache state for builds"
    echo -e "  🔄 Forces fresh dependency downloads"
    
    echo -e "\n${YELLOW}Note: Next workflow runs will be slower as caches rebuild${NC}"
    
    echo ""
    read -p "Do you want to proceed with deleting ALL caches? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Operation cancelled by user"
        exit 0
    fi
}

# Delete all caches
delete_all_caches() {
    print_status "Starting cache deletion..."
    
    print_progress "Executing: gh cache delete --all"
    
    # Use GitHub CLI's built-in delete all command
    if gh cache delete --all 2>/dev/null; then
        print_success "✅ All caches deleted successfully!"
    else
        # Fallback: delete individual caches if --all doesn't work
        print_warning "Bulk delete failed, trying individual deletion..."
        
        CACHE_IDS=$(gh cache list --json id --limit 1000 | jq -r '.[].id')
        
        if [ -z "$CACHE_IDS" ]; then
            print_success "✅ No caches to delete"
            return
        fi
        
        DELETED_COUNT=0
        FAILED_COUNT=0
        TOTAL_TO_DELETE=$(echo "$CACHE_IDS" | wc -w)
        
        for CACHE_ID in $CACHE_IDS; do
            print_progress "Deleting cache $CACHE_ID ($((DELETED_COUNT + FAILED_COUNT + 1))/$TOTAL_TO_DELETE)..."
            
            if gh cache delete "$CACHE_ID" 2>/dev/null; then
                DELETED_COUNT=$((DELETED_COUNT + 1))
            else
                FAILED_COUNT=$((FAILED_COUNT + 1))
                print_warning "Failed to delete cache $CACHE_ID"
            fi
            
            # Show progress every 5 deletions
            if [ $((DELETED_COUNT % 5)) -eq 0 ]; then
                print_progress "Deleted $DELETED_COUNT caches so far..."
            fi
        done
        
        print_success "Individual deletion completed: $DELETED_COUNT deleted, $FAILED_COUNT failed"
    fi
}

# Verify cleanup
verify_cleanup() {
    print_status "Verifying cache cleanup..."
    
    REMAINING_CACHES=$(gh cache list --json id --limit 10 | jq '. | length')
    
    if [ "$REMAINING_CACHES" -eq 0 ]; then
        print_success "🎯 Perfect! All caches have been removed!"
    else
        print_warning "⚠️  $REMAINING_CACHES caches still remain"
        echo -e "\n${BLUE}Remaining caches:${NC}"
        gh cache list --limit 5
    fi
}

# Show next steps
show_next_steps() {
    echo -e "\n${GREEN}🎉 Cache cleanup completed!${NC}"
    
    echo -e "\n${YELLOW}Summary:${NC}"
    echo -e "  📦 Repository: $REPO_OWNER/$REPO_NAME"
    echo -e "  🗑️  Caches deleted: $CACHE_COUNT"
    echo -e "  💾 Storage freed: ~${TOTAL_SIZE_GB} GB"
    echo -e "  📊 Remaining caches: $REMAINING_CACHES"
    
    echo -e "\n${YELLOW}Next steps:${NC}"
    echo -e "  1. 🔍 Check repository settings for storage usage reduction"
    echo -e "  2. 🚀 Run workflows - first runs will be slower as caches rebuild"
    echo -e "  3. 📊 Monitor new cache accumulation over time"
    echo -e "  4. 🔄 Consider running this script periodically for maintenance"
    
    echo -e "\n${BLUE}To view current cache state:${NC}"
    echo -e "  gh cache list"
    
    echo -e "\n${BLUE}To run this cleanup again in the future:${NC}"
    echo -e "  ./scripts/cleanup-all-github-caches.sh"
    
    echo -e "\n${GREEN}✨ Your repository cache storage should now be much cleaner!${NC}"
}

# Main execution
main() {
    check_prerequisites
    get_repo_info
    analyze_caches
    
    if [ "$CACHE_COUNT" -eq 0 ]; then
        exit 0
    fi
    
    confirm_deletion
    delete_all_caches
    verify_cleanup
    show_next_steps
}

# Run the script
main "$@" 