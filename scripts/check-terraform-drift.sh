#!/bin/bash

# =================================
# Terraform Plan Drift Checker
# =================================
# Uses terraform plan to detect configuration drift

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_status "🔍 Checking Terraform drift using plan output..."

cd terraform/environments/dev

# Run terraform plan and capture output
print_status "Running terraform plan..."
if PLAN_OUTPUT=$(terraform plan -detailed-exitcode 2>&1); then
    PLAN_EXIT_CODE=$?
else
    PLAN_EXIT_CODE=$?
fi

echo "Exit code: $PLAN_EXIT_CODE"

case $PLAN_EXIT_CODE in
    0)
        print_success "✅ No changes needed - infrastructure matches configuration"
        ;;
    1)
        print_error "❌ Terraform plan failed with errors:"
        echo "$PLAN_OUTPUT"
        ;;
    2)
        print_warning "⚠️ DRIFT DETECTED - Terraform wants to make changes:"
        echo ""
        echo "$PLAN_OUTPUT"
        echo ""
        print_warning "This indicates drift between AWS reality and Terraform expectations"
        
        # Analyze the plan output for common drift patterns
        print_status "🔍 Analyzing drift patterns..."
        
        if echo "$PLAN_OUTPUT" | grep -q "aws_lambda_permission"; then
            print_warning "📍 Lambda permission changes detected"
        fi
        
        if echo "$PLAN_OUTPUT" | grep -q "aws_iam_role"; then
            print_warning "📍 IAM role changes detected"
        fi
        
        if echo "$PLAN_OUTPUT" | grep -q "aws_apigatewayv2"; then
            print_warning "📍 API Gateway changes detected"
        fi
        
        if echo "$PLAN_OUTPUT" | grep -q "inline_policy"; then
            print_warning "📍 Inline policy changes detected (likely from manual modifications)"
        fi
        
        # Check for resource recreation vs updates
        if echo "$PLAN_OUTPUT" | grep -q "must be replaced"; then
            print_error "🚨 Some resources will be RECREATED - review carefully!"
        fi
        
        # Count changes
        ADD_COUNT=$(echo "$PLAN_OUTPUT" | grep -c "# .* will be created" || echo "0")
        CHANGE_COUNT=$(echo "$PLAN_OUTPUT" | grep -c "# .* will be updated" || echo "0")  
        DESTROY_COUNT=$(echo "$PLAN_OUTPUT" | grep -c "# .* will be destroyed" || echo "0")
        
        echo ""
        print_status "📊 Summary of changes:"
        echo "  • To add: $ADD_COUNT"
        echo "  • To change: $CHANGE_COUNT"  
        echo "  • To destroy: $DESTROY_COUNT"
        
        ;;
    *)
        print_error "❌ Unexpected exit code: $PLAN_EXIT_CODE"
        echo "$PLAN_OUTPUT"
        ;;
esac

cd - >/dev/null

print_status "💡 Next steps:"
echo "• Run './scripts/audit-terraform-drift.sh' for detailed AWS resource analysis"
echo "• If drift is expected, document it"
echo "• If drift is unwanted, run 'terraform apply' to fix it"
echo "• Consider running cleanup scripts first if manual changes were made" 