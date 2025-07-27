#!/bin/bash

# Deploy Serverless Workflow Trigger Script
# 
# PURPOSE: Trigger the "Deploy Serverless Architecture" GitHub Actions workflow
# 
# USAGE: 
#   ./scripts/trigger-deploy.sh [branch]
#   ./scripts/trigger-deploy.sh dev01
#   ./scripts/trigger-deploy.sh main
#
# If no branch is provided, uses current branch

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}$1${NC}"
}

print_warning() {
    echo -e "${YELLOW}$1${NC}"
}

print_error() {
    echo -e "${RED}$1${NC}"
}

# Check if GitHub CLI is available
if ! command -v gh &> /dev/null; then
    print_error "❌ GitHub CLI (gh) is not installed or not in PATH"
    print_error "   Install: brew install gh"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    print_error "❌ Not authenticated with GitHub CLI"
    print_error "   Run: gh auth login"
    exit 1
fi

# Determine branch
if [ $# -eq 0 ]; then
    BRANCH=$(git branch --show-current)
    print_status "🌿 No branch specified, using current branch: $BRANCH"
else
    BRANCH="$1"
    print_status "🌿 Using specified branch: $BRANCH"
fi

# Verify branch exists
if ! git show-ref --verify --quiet refs/heads/$BRANCH 2>/dev/null && ! git show-ref --verify --quiet refs/remotes/origin/$BRANCH 2>/dev/null; then
    print_error "❌ Branch '$BRANCH' does not exist locally or remotely"
    print_error "   Available branches:"
    git branch -a | head -10
    exit 1
fi

print_status "🚀 Triggering Deploy Serverless Architecture workflow..."
print_status "   📋 Workflow: Deploy Serverless Architecture"
print_status "   🌿 Branch: $BRANCH"
print_status "   ⚡ Event: workflow_dispatch"

# Trigger the workflow
if gh workflow run "Deploy Serverless Architecture" --ref "$BRANCH"; then
    print_success "✅ Workflow triggered successfully!"
    echo ""
    
    print_status "🔍 Checking workflow status..."
    sleep 2
    
    # Show recent runs
    gh run list --workflow="deploy-serverless.yml" --limit 3
    
    echo ""
    print_status "📊 Monitor workflow progress:"
    print_success "   🌐 GitHub UI: https://github.com/$(gh repo view --json owner,name -q '.owner.login + \"/\" + .name')/actions"
    print_success "   💻 Terminal: gh run list --workflow='deploy-serverless.yml'"
    print_success "   🔗 Watch: gh run watch"
    
else
    print_error "❌ Failed to trigger workflow"
    exit 1
fi 