#!/bin/bash
set -e

echo "🔍 Phase 3.1b: Proactive Security Group Detection & Import"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Counter for tracking
IMPORTED_COUNT=0
ALREADY_IN_STATE_COUNT=0
WILL_BE_CREATED_COUNT=0

# Get expected Security Groups from Terraform state
echo "📋 Step 1: Identifying expected Security Groups from Terraform config..."

# Get list of Security Group resources defined in Terraform
SG_RESOURCES=$(terraform state list 2>/dev/null | grep "^aws_security_group\." | grep -v "aws_security_group_rule\." || echo "")

# Also check if we need to get from config
if [ -z "$SG_RESOURCES" ]; then
  # Initialize check
  if [ ! -d ".terraform" ]; then
    echo "   Terraform not initialized, skipping proactive import for now..."
    exit 0
  fi
  
  # Try to get from show
  SG_RESOURCES=$(terraform show -json 2>/dev/null | jq -r '.values.root_module.resources[]? | select(.type=="aws_security_group") | .address' 2>/dev/null || echo "")
fi

if [ -z "$SG_RESOURCES" ]; then
  echo "   ℹ️  No Security Groups defined yet or state is empty"
  echo "   This is normal for first deployment"
  echo ""
  exit 0
fi

echo "   Found $(echo "$SG_RESOURCES" | wc -l | xargs) Security Group resources to check"
echo ""

echo "📋 Step 2: Checking each Security Group..."
echo ""

# Get VPC ID for context (most SGs will be in the same VPC)
VPC_ID=$(terraform state show aws_vpc.main 2>/dev/null | grep -E "^\s+id\s+=" | awk '{print $3}' | tr -d '"' || echo "")

# Process each SG resource
while IFS= read -r RESOURCE; do
  if [ -z "$RESOURCE" ]; then
    continue
  fi
  
  echo "Checking: $RESOURCE"
  
  # Extract the resource name (e.g., aws_security_group.lambda_sg -> lambda_sg)
  RESOURCE_NAME=$(echo "$RESOURCE" | sed 's/aws_security_group\.//')
  
  # Check if already in state
  if terraform state show "$RESOURCE" &>/dev/null; then
    # Get the SG details from state
    SG_NAME=$(terraform state show "$RESOURCE" 2>/dev/null | grep -E "^\s+name\s+=" | awk '{print $3}' | tr -d '"' || echo "")
    SG_ID=$(terraform state show "$RESOURCE" 2>/dev/null | grep -E "^\s+id\s+=" | awk '{print $3}' | tr -d '"' || echo "")
    
    if [ -n "$SG_ID" ]; then
      echo "   Security Group: $SG_NAME (ID: $SG_ID)"
      echo "   ✅ Exists in AWS"
      echo "   ✅ Already in Terraform state"
      ((ALREADY_IN_STATE_COUNT++))
    else
      echo "   ⚠️  Could not extract SG details from state"
    fi
  else
    # Not in state yet - need to check if it exists in AWS
    echo "   ⚠️  Not in Terraform state yet"
    
    # Try to determine expected SG name from Terraform config
    # This is tricky - we need to look at the planned configuration
    SG_NAME_PATTERN=""
    
    # Common patterns based on resource name
    case "$RESOURCE_NAME" in
      "lambda_sg")
        SG_NAME_PATTERN="${ENVIRONMENT}-${PROJECT_NAME}-lambda-sg"
        ;;
      "rds_sg")
        SG_NAME_PATTERN="${ENVIRONMENT}-${PROJECT_NAME}-rds-sg"
        ;;
      "alb_sg")
        SG_NAME_PATTERN="${ENVIRONMENT}-${PROJECT_NAME}-alb-sg"
        ;;
      *)
        # Try to extract from terraform show or plan
        SG_NAME_PATTERN=$(terraform show -json 2>/dev/null | jq -r ".values.root_module.resources[]? | select(.address==\"$RESOURCE\") | .values.name?" 2>/dev/null || echo "")
        ;;
    esac
    
    if [ -z "$SG_NAME_PATTERN" ]; then
      echo "   ℹ️  Cannot determine expected SG name, will be created by Terraform"
      ((WILL_BE_CREATED_COUNT++))
      echo ""
      continue
    fi
    
    echo "   Expected SG name: $SG_NAME_PATTERN"
    
    # Check if SG exists in AWS
    if [ -n "$VPC_ID" ]; then
      SG_ID=$(aws ec2 describe-security-groups \
        --filters "Name=group-name,Values=$SG_NAME_PATTERN" "Name=vpc-id,Values=$VPC_ID" \
        --query 'SecurityGroups[0].GroupId' \
        --output text 2>/dev/null || echo "None")
    else
      SG_ID=$(aws ec2 describe-security-groups \
        --filters "Name=group-name,Values=$SG_NAME_PATTERN" \
        --query 'SecurityGroups[0].GroupId' \
        --output text 2>/dev/null || echo "None")
    fi
    
    if [ "$SG_ID" = "None" ] || [ -z "$SG_ID" ]; then
      echo "   ℹ️  Security Group doesn't exist in AWS yet (will be created)"
      ((WILL_BE_CREATED_COUNT++))
    else
      echo "   ✅ Security Group exists in AWS (ID: $SG_ID)"
      echo "   🔧 Importing into Terraform state..."
      
      # Import the security group
      if terraform import "$RESOURCE" "$SG_ID" 2>&1 | tee /tmp/sg_import.log; then
        echo "   ✅ Successfully imported: $SG_NAME_PATTERN"
        ((IMPORTED_COUNT++))
      else
        # Check if it was actually already imported
        if grep -q "Resource already managed" /tmp/sg_import.log; then
          echo "   ✅ Already in state (detected during import)"
          ((ALREADY_IN_STATE_COUNT++))
        else
          echo "   ⚠️  Import failed, but continuing..."
          cat /tmp/sg_import.log
        fi
      fi
    fi
  fi
  
  echo ""
done <<< "$SG_RESOURCES"

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary:"
echo "   ✅ Already in state: $ALREADY_IN_STATE_COUNT"
echo "   🔧 Imported: $IMPORTED_COUNT"
echo "   📝 Will be created: $WILL_BE_CREATED_COUNT"
echo ""

if [ $IMPORTED_COUNT -gt 0 ]; then
  echo "✅ Imported $IMPORTED_COUNT Security Group(s). State synchronized!"
elif [ $ALREADY_IN_STATE_COUNT -gt 0 ]; then
  echo "✅ All Security Groups already synchronized. Ready for terraform apply."
else
  echo "✅ No Security Groups to import. Ready for terraform apply."
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

exit 0

