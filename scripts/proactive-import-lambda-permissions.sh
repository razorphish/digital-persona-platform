#!/bin/bash
# Note: NOT using 'set -e' to allow graceful error handling
# We want to continue even if some operations fail

echo "🔍 Phase 3.1c: Proactive Lambda Permission Detection & Import"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Counter for tracking
IMPORTED_COUNT=0
ALREADY_IN_STATE_COUNT=0
WILL_BE_CREATED_COUNT=0
ERROR_COUNT=0

# Get expected Lambda permissions from Terraform state
echo "📋 Step 1: Identifying expected Lambda Permissions from Terraform config..."

# Get list of Lambda permission resources defined in Terraform
LAMBDA_PERM_RESOURCES=$(terraform state list 2>/dev/null | grep "^aws_lambda_permission\." || echo "")

# Also check if we need to get from config
if [ -z "$LAMBDA_PERM_RESOURCES" ]; then
  # Initialize check
  if [ ! -d ".terraform" ]; then
    echo "   Terraform not initialized, skipping proactive import for now..."
    exit 0
  fi
  
  # Try to get from show
  LAMBDA_PERM_RESOURCES=$(terraform show -json 2>/dev/null | jq -r '.values.root_module.resources[]? | select(.type=="aws_lambda_permission") | .address' 2>/dev/null || echo "")
fi

if [ -z "$LAMBDA_PERM_RESOURCES" ]; then
  echo "   ℹ️  No Lambda Permissions defined yet or state is empty"
  echo "   This is normal for first deployment"
  echo ""
  exit 0
fi

echo "   Found $(echo "$LAMBDA_PERM_RESOURCES" | wc -l | xargs) Lambda Permission resources to check"
echo ""

echo "📋 Step 2: Checking each Lambda Permission..."
echo ""

# Process each Lambda permission resource
while IFS= read -r RESOURCE; do
  if [ -z "$RESOURCE" ]; then
    continue
  fi
  
  echo "Checking: $RESOURCE"
  
  # Extract the resource name (e.g., aws_lambda_permission.allow_apigateway -> allow_apigateway)
  RESOURCE_NAME=$(echo "$RESOURCE" | sed 's/aws_lambda_permission\.//')
  
  # Check if already in state
  if terraform state show "$RESOURCE" &>/dev/null; then
    # Get the Lambda permission details from state
    FUNCTION_NAME=$(terraform state show "$RESOURCE" 2>/dev/null | grep -E "^\s+function_name\s+=" | head -1 | awk -F'"' '{print $2}' || echo "")
    STATEMENT_ID=$(terraform state show "$RESOURCE" 2>/dev/null | grep -E "^\s+statement_id\s+=" | head -1 | awk -F'"' '{print $2}' || echo "")
    
    if [ -n "$FUNCTION_NAME" ] && [ -n "$STATEMENT_ID" ]; then
      echo "   Function: $FUNCTION_NAME"
      echo "   Statement ID: $STATEMENT_ID"
      echo "   ✅ Already in Terraform state"
      ((ALREADY_IN_STATE_COUNT++))
    else
      echo "   ⚠️  In state but could not extract details"
      ((ALREADY_IN_STATE_COUNT++))
    fi
  else
    # Not in state yet - need to check if it exists in AWS
    echo "   ⚠️  Not in Terraform state yet"
    
    # Try to determine expected function name and statement ID from Terraform config
    # We'll use terraform show to get the planned values
    FUNCTION_NAME=""
    STATEMENT_ID=""
    
    # Try to extract from terraform show
    if [ -f "terraform.tfstate" ] || terraform state list &>/dev/null; then
      # Get from planned configuration
      SHOW_OUTPUT=$(terraform show -json 2>/dev/null)
      
      if [ -n "$SHOW_OUTPUT" ]; then
        FUNCTION_NAME=$(echo "$SHOW_OUTPUT" | jq -r ".planned_values.root_module.resources[]? | select(.address==\"$RESOURCE\") | .values.function_name?" 2>/dev/null || echo "")
        STATEMENT_ID=$(echo "$SHOW_OUTPUT" | jq -r ".planned_values.root_module.resources[]? | select(.address==\"$RESOURCE\") | .values.statement_id?" 2>/dev/null || echo "")
        
        # If not in planned_values, try configuration
        if [ -z "$FUNCTION_NAME" ] || [ "$FUNCTION_NAME" = "null" ]; then
          FUNCTION_NAME=$(echo "$SHOW_OUTPUT" | jq -r ".configuration.root_module.resources[]? | select(.address==\"$RESOURCE\") | .expressions.function_name.constant_value?" 2>/dev/null || echo "")
        fi
        
        if [ -z "$STATEMENT_ID" ] || [ "$STATEMENT_ID" = "null" ]; then
          STATEMENT_ID=$(echo "$SHOW_OUTPUT" | jq -r ".configuration.root_module.resources[]? | select(.address==\"$RESOURCE\") | .expressions.statement_id.constant_value?" 2>/dev/null || echo "")
        fi
      fi
    fi
    
    # Clean up null values
    if [ "$FUNCTION_NAME" = "null" ]; then FUNCTION_NAME=""; fi
    if [ "$STATEMENT_ID" = "null" ]; then STATEMENT_ID=""; fi
    
    if [ -z "$FUNCTION_NAME" ] || [ -z "$STATEMENT_ID" ]; then
      echo "   ℹ️  Cannot determine function name or statement ID from config"
      echo "   Will be created by Terraform apply"
      ((WILL_BE_CREATED_COUNT++))
      echo ""
      continue
    fi
    
    echo "   Expected Function: $FUNCTION_NAME"
    echo "   Expected Statement ID: $STATEMENT_ID"
    
    # Check if permission exists in AWS Lambda policy
    POLICY_CHECK=$(aws lambda get-policy --function-name "$FUNCTION_NAME" 2>/dev/null || echo "")
    
    if [ -z "$POLICY_CHECK" ]; then
      echo "   ℹ️  Lambda function doesn't exist or has no policy yet"
      echo "   Will be created by Terraform apply"
      ((WILL_BE_CREATED_COUNT++))
    else
      # Check if this specific statement ID exists in the policy
      STATEMENT_EXISTS=$(echo "$POLICY_CHECK" | jq -r '.Policy' 2>/dev/null | jq -r ".Statement[]? | select(.Sid==\"$STATEMENT_ID\") | .Sid" 2>/dev/null || echo "")
      
      if [ -n "$STATEMENT_EXISTS" ] && [ "$STATEMENT_EXISTS" = "$STATEMENT_ID" ]; then
        echo "   ✅ Permission exists in Lambda policy"
        echo "   🔧 Importing into Terraform state..."
        
        # Import the Lambda permission
        # Import format: function_name/statement_id
        IMPORT_ID="${FUNCTION_NAME}/${STATEMENT_ID}"
        
        import_output=$(terraform import "$RESOURCE" "$IMPORT_ID" 2>&1 || true)
        import_exit_code=$?
        
        if [ $import_exit_code -eq 0 ]; then
          echo "   ✅ Successfully imported: $IMPORT_ID"
          ((IMPORTED_COUNT++))
        else
          # Check for various recoverable errors
          if echo "$import_output" | grep -qi "Resource already managed\|already exists in state"; then
            echo "   ✅ Already in state (detected during import)"
            ((ALREADY_IN_STATE_COUNT++))
          elif echo "$import_output" | grep -qi "ValidationException\|validation error\|invalid.*format"; then
            echo "   ⚠️  Validation error - resource may need manual attention"
            echo "   💡 Skipping import - continuing with deployment"
            ((ERROR_COUNT++))
          elif echo "$import_output" | grep -qi "ResourceNotFoundException\|not found"; then
            echo "   ℹ️  Permission not found in AWS - will be created"
            ((WILL_BE_CREATED_COUNT++))
          elif echo "$import_output" | grep -qi "permission\|Access.*Denied\|not authorized"; then
            echo "   ⚠️  Permission error - may need additional IAM permissions"
            echo "   💡 Skipping import - continuing with deployment"
            ((ERROR_COUNT++))
          else
            echo "   ⚠️  Import failed, but continuing with deployment..."
            echo "   Error details (first 3 lines):"
            echo "$import_output" | head -n 3 | sed 's/^/      /'
            ((ERROR_COUNT++))
          fi
        fi
      else
        echo "   ℹ️  Statement ID not found in Lambda policy"
        echo "   Will be created by Terraform apply"
        ((WILL_BE_CREATED_COUNT++))
      fi
    fi
  fi
  
  echo ""
done <<< "$LAMBDA_PERM_RESOURCES"

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary:"
echo "   ✅ Already in state: $ALREADY_IN_STATE_COUNT"
echo "   🔧 Imported: $IMPORTED_COUNT"
echo "   📝 Will be created: $WILL_BE_CREATED_COUNT"
if [ $ERROR_COUNT -gt 0 ]; then
  echo "   ⚠️  Errors (non-blocking): $ERROR_COUNT"
fi
echo ""

if [ $IMPORTED_COUNT -gt 0 ]; then
  echo "✅ Imported $IMPORTED_COUNT Lambda permission(s). State synchronized!"
elif [ $ALREADY_IN_STATE_COUNT -gt 0 ]; then
  echo "✅ All Lambda permissions already synchronized. Ready for terraform apply."
else
  echo "✅ No Lambda permissions to import. Ready for terraform apply."
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Always exit 0 - we handle errors gracefully
exit 0

