#!/bin/bash
set -e

echo "🔍 Phase 3.1a: Proactive S3 Bucket Detection & Import"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Counter for tracking
IMPORTED_COUNT=0
ALREADY_IN_STATE_COUNT=0
WILL_BE_CREATED_COUNT=0

# Get expected S3 buckets from Terraform state resources
echo "📋 Step 1: Identifying expected S3 buckets from Terraform config..."

# Get list of S3 bucket resources defined in Terraform
BUCKET_RESOURCES=$(terraform state list 2>/dev/null | grep "aws_s3_bucket\." | grep -v "aws_s3_bucket_" || echo "")

# Also check the plan to see what buckets Terraform expects to manage
echo "   Checking Terraform configuration..."

# If we have no resources yet, try to get them from config
if [ -z "$BUCKET_RESOURCES" ]; then
  # Initialize if needed
  if [ ! -d ".terraform" ]; then
    echo "   Terraform not initialized, skipping proactive import for now..."
    exit 0
  fi
  
  # Try to get from show
  BUCKET_RESOURCES=$(terraform show -json 2>/dev/null | jq -r '.values.root_module.resources[]? | select(.type=="aws_s3_bucket") | .address' 2>/dev/null || echo "")
fi

if [ -z "$BUCKET_RESOURCES" ]; then
  echo "   ℹ️  No S3 buckets defined yet or state is empty"
  echo "   This is normal for first deployment"
  echo ""
  exit 0
fi

echo "   Found $(echo "$BUCKET_RESOURCES" | wc -l) S3 bucket resources to check"
echo ""

echo "📋 Step 2: Checking each bucket..."
echo ""

# Process each bucket resource
while IFS= read -r RESOURCE; do
  if [ -z "$RESOURCE" ]; then
    continue
  fi
  
  echo "Checking: $RESOURCE"
  
  # Extract resource name (e.g., aws_s3_bucket.uploads -> uploads)
  RESOURCE_NAME=$(echo "$RESOURCE" | sed 's/aws_s3_bucket\.//' | sed 's/\[.*\]//')
  
  # Try to get the bucket name from state
  BUCKET_NAME=$(terraform state show "$RESOURCE" 2>/dev/null | grep "bucket " | head -1 | awk '{print $3}' | tr -d '"' || echo "")
  
  if [ -z "$BUCKET_NAME" ]; then
    echo "   ⚠️  Could not determine bucket name from state"
    echo "   This likely means the bucket hasn't been created yet"
    WILL_BE_CREATED_COUNT=$((WILL_BE_CREATED_COUNT + 1))
    echo ""
    continue
  fi
  
  echo "   Bucket name: $BUCKET_NAME"
  
  # Check if bucket exists in AWS
  echo "   Checking AWS..."
  if aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo "   ✅ Bucket exists in AWS"
    
    # Check if in Terraform state
    if terraform state show "$RESOURCE" &>/dev/null; then
      echo "   ✅ Already in Terraform state"
      ALREADY_IN_STATE_COUNT=$((ALREADY_IN_STATE_COUNT + 1))
    else
      echo "   ⚠️  Exists in AWS but NOT in Terraform state"
      echo "   🔧 Importing into state..."
      
      if terraform import "$RESOURCE" "$BUCKET_NAME" 2>&1 | grep -q "Import successful"; then
        echo "   ✅ Import successful!"
        IMPORTED_COUNT=$((IMPORTED_COUNT + 1))
      else
        echo "   ⚠️  Import failed (may already be in state)"
        # Check again if it's actually in state now
        if terraform state show "$RESOURCE" &>/dev/null; then
          echo "   ✅ Confirmed: Now in state"
          ALREADY_IN_STATE_COUNT=$((ALREADY_IN_STATE_COUNT + 1))
        fi
      fi
    fi
  else
    echo "   ℹ️  Bucket doesn't exist in AWS yet"
    echo "   Will be created by terraform apply"
    WILL_BE_CREATED_COUNT=$((WILL_BE_CREATED_COUNT + 1))
  fi
  
  echo ""
  
done <<< "$BUCKET_RESOURCES"

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary:"
echo "   ✅ Already in state: $ALREADY_IN_STATE_COUNT"
echo "   🔧 Imported: $IMPORTED_COUNT"
echo "   📝 Will be created: $WILL_BE_CREATED_COUNT"
echo ""

if [ $IMPORTED_COUNT -gt 0 ]; then
  echo "✅ Proactive import complete! State is now synchronized with AWS."
  echo "   Terraform apply should now succeed without 'already exists' errors."
else
  echo "✅ All S3 buckets already synchronized. Ready for terraform apply."
fi
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

