# Phase 3.1c: Lambda Permissions - Implementation Plan

**Date**: October 17, 2025  
**Status**: 📋 Ready to Implement (after 3.1b succeeds)  
**Estimated Time**: ~45 minutes  
**Coverage Impact**: +15% (65% → 80%)

---

## 🎯 **Objective**

Add proactive detection and import for Lambda permissions (aws_lambda_permission resources) before terraform apply runs.

---

## 📊 **Why Lambda Permissions?**

### **Current Situation**
- Lambda permissions can exist from previous deployments
- Common error: "ResourceConflictException: The statement id (...) provided already exists"
- Currently handled reactively (Phase 1.2) - detect after error, then import
- Represents ~15% of resource conflicts

### **After Phase 3.1c**
- Detect Lambda permissions proactively
- Import before terraform apply
- No more ResourceConflictException errors
- **Total proactive coverage: 80%**

---

## 🔍 **Technical Analysis**

### **Lambda Permission Resource Structure**

```hcl
resource "aws_lambda_permission" "allow_apigateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.my_function.function_name
  principal     = "apigateway.amazonaws.com"
}
```

### **Import Syntax**
```bash
terraform import aws_lambda_permission.allow_apigateway \
  my-function/AllowAPIGatewayInvoke
```

**Key**: `<function_name>/<statement_id>`

---

## 🛠️ **Implementation Strategy**

### **Step 1: Resource Detection**
```bash
# Get Lambda permission resources from Terraform
terraform state list | grep "aws_lambda_permission\."

# Or from configuration
terraform show -json | jq -r '.values.root_module.resources[]? | 
  select(.type=="aws_lambda_permission") | .address'
```

### **Step 2: Extract Details**
For each Lambda permission resource:
1. **Function Name**: Which Lambda function
2. **Statement ID**: The permission identifier

### **Step 3: Check AWS**
```bash
# Get Lambda function policy
aws lambda get-policy --function-name my-function

# Check if statement ID exists in policy
# Output is JSON with policy statements
```

### **Step 4: Import If Needed**
```bash
# Import format: function_name/statement_id
terraform import aws_lambda_permission.allow_apigateway \
  my-function/AllowAPIGatewayInvoke
```

---

## 📝 **Script Structure**

### **File**: `scripts/proactive-import-lambda-permissions.sh`

```bash
#!/bin/bash
set -e

echo "🔍 Phase 3.1c: Proactive Lambda Permission Detection & Import"

# Counters
IMPORTED_COUNT=0
ALREADY_IN_STATE_COUNT=0
WILL_BE_CREATED_COUNT=0

# Get Lambda permission resources
LAMBDA_PERMS=$(terraform state list 2>/dev/null | \
  grep "^aws_lambda_permission\." || echo "")

if [ -z "$LAMBDA_PERMS" ]; then
  echo "   ℹ️  No Lambda permissions defined yet"
  exit 0
fi

# Process each permission
while IFS= read -r RESOURCE; do
  # Check if already in state
  if terraform state show "$RESOURCE" &>/dev/null; then
    FUNCTION_NAME=$(terraform state show "$RESOURCE" | \
      grep "function_name" | awk '{print $3}' | tr -d '"')
    STATEMENT_ID=$(terraform state show "$RESOURCE" | \
      grep "statement_id" | awk '{print $3}' | tr -d '"')
    
    echo "✅ Already in state: $FUNCTION_NAME/$STATEMENT_ID"
    ((ALREADY_IN_STATE_COUNT++))
  else
    # Not in state - check if exists in AWS
    # Extract expected values from Terraform config
    
    # Try to determine function name and statement ID
    # (This requires parsing terraform show or plan output)
    
    # Check if permission exists
    aws lambda get-policy --function-name "$FUNCTION_NAME" 2>/dev/null | \
      jq -r '.Policy' | jq -r '.Statement[] | select(.Sid=="'"$STATEMENT_ID"'")'
    
    if [ $? -eq 0 ]; then
      # Permission exists, import it
      terraform import "$RESOURCE" "$FUNCTION_NAME/$STATEMENT_ID"
      ((IMPORTED_COUNT++))
    else
      # Doesn't exist, will be created
      ((WILL_BE_CREATED_COUNT++))
    fi
  fi
done <<< "$LAMBDA_PERMS"

# Summary
echo "📊 Summary:"
echo "   ✅ Already in state: $ALREADY_IN_STATE_COUNT"
echo "   🔧 Imported: $IMPORTED_COUNT"
echo "   📝 Will be created: $WILL_BE_CREATED_COUNT"
```

---

## 🎯 **Implementation Checklist**

### **Phase 1: Create Script** (~20 minutes)
- [ ] Create `scripts/proactive-import-lambda-permissions.sh`
- [ ] Implement Lambda permission detection logic
- [ ] Add AWS Lambda policy query
- [ ] Handle statement ID matching
- [ ] Test locally (if possible)

### **Phase 2: Update Workflow** (~10 minutes)
- [ ] Add Lambda permission detection to workflow
- [ ] Place after SG detection, before terraform apply
- [ ] Add appropriate environment variables
- [ ] Test graceful failure handling

### **Phase 3: Documentation** (~10 minutes)
- [ ] Create `PHASE_3.1c_IMPLEMENTED.md`
- [ ] Document Lambda permission patterns
- [ ] Add testing plan
- [ ] Update progress summary

### **Phase 4: Testing** (~15 minutes)
- [ ] Commit and push changes
- [ ] Monitor deployment
- [ ] Verify Lambda permission detection
- [ ] Confirm no regression

---

## 🔧 **Technical Challenges**

### **Challenge 1: Extracting Function Name**
**Problem**: Need to know which Lambda function the permission belongs to  
**Solution**: 
- If in state: Extract from `terraform state show`
- If not in state: Parse from Terraform config or naming patterns

### **Challenge 2: Statement ID Extraction**
**Problem**: Need statement ID to check and import  
**Solution**:
- Common patterns: "AllowAPIGatewayInvoke", "AllowS3Invoke", etc.
- Extract from Terraform config using jq or grep

### **Challenge 3: Policy Parsing**
**Problem**: Lambda policy is JSON, need to check if statement exists  
**Solution**: Use `jq` to parse policy and check for statement ID

---

## 📋 **Workflow Integration**

### **Update deploy-serverless.yml**

```yaml
- name: Proactive Resource Detection & Import (Phase 3.1a + 3.1b + 3.1c)
  working-directory: terraform/environments/${{ needs.detect-environment.outputs.main_env }}
  env:
    ENVIRONMENT: ${{ needs.detect-environment.outputs.environment }}
    AWS_REGION: ${{ env.AWS_REGION }}
    PROJECT_NAME: ${{ env.PROJECT_NAME }}
  run: |
    echo "🔍 Step 3.5: Proactive Resource Detection (Phase 3.1a + 3.1b + 3.1c)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # S3 Buckets (Phase 3.1a)
    if [ -f "../../../scripts/proactive-import-s3.sh" ]; then
      echo "📦 Running proactive S3 bucket detection..."
      bash ../../../scripts/proactive-import-s3.sh
    fi
    
    # Security Groups (Phase 3.1b)
    if [ -f "../../../scripts/proactive-import-sg.sh" ]; then
      echo "🔒 Running proactive Security Group detection..."
      bash ../../../scripts/proactive-import-sg.sh
    fi
    
    # Lambda Permissions (Phase 3.1c) [NEW]
    if [ -f "../../../scripts/proactive-import-lambda-permissions.sh" ]; then
      echo "⚡ Running proactive Lambda Permission detection..."
      bash ../../../scripts/proactive-import-lambda-permissions.sh
    fi
    
    echo "✅ Proactive detection complete!"
```

---

## 📊 **Expected Results**

### **Test 1: Normal Deployment**
```
⚡ Running proactive Lambda Permission detection (Phase 3.1c)...

Checking: aws_lambda_permission.allow_apigateway
   Function: dev-dev01-dpp-backend-api
   Statement ID: AllowAPIGatewayInvoke
   ✅ Already in Terraform state

Checking: aws_lambda_permission.allow_s3
   Function: dev-dev01-dpp-backend-api
   Statement ID: AllowS3Invoke
   ✅ Already in Terraform state

📊 Summary:
   ✅ Already in state: 2
   🔧 Imported: 0
   📝 Will be created: 0

✅ All Lambda permissions already synchronized.
```

### **Test 2: With Missing Permission in State**
```
⚡ Running proactive Lambda Permission detection (Phase 3.1c)...

Checking: aws_lambda_permission.allow_apigateway
   ⚠️  Not in Terraform state yet
   Function: dev-dev01-dpp-backend-api
   Statement ID: AllowAPIGatewayInvoke
   ✅ Permission exists in Lambda policy
   🔧 Importing into Terraform state...
   ✅ Successfully imported

📊 Summary:
   ✅ Already in state: 1
   🔧 Imported: 1
   📝 Will be created: 0

✅ Imported 1 Lambda permission(s). State synchronized!
```

---

## 🎯 **Success Criteria**

After implementation and testing:

- [ ] Script detects Lambda permission resources
- [ ] Script checks AWS Lambda policies
- [ ] Script checks Terraform state
- [ ] Script imports missing permissions
- [ ] Workflow runs script before terraform apply
- [ ] No "ResourceConflictException" errors
- [ ] Deployment time unchanged (~15-16 min)
- [ ] Coverage reaches 80%

---

## 📈 **Coverage Impact**

```
Before Phase 3.1c:
S3 Buckets (40%) + Security Groups (25%) = 65%
█████████████━━━━━━━

After Phase 3.1c:
S3 (40%) + SG (25%) + Lambda Permissions (15%) = 80%
████████████████━━━━
```

**Only 20% of conflicts remaining!**

---

## 🔄 **After Phase 3.1c**

### **What's Left**
Only RDS resources (Phase 3.1d):
- RDS Clusters
- RDS Instances  
- RDS Proxy
- RDS Subnet Groups
- ~10% of conflicts

### **Alternative Next Steps**
1. **Phase 3.1d**: Complete the series with RDS (90% total coverage)
2. **Optimization**: Speed up detection scripts (parallel execution)
3. **Deprecation**: Remove old reactive import logic
4. **Monitoring**: Add metrics/logging for detection effectiveness

---

## 💡 **Simplification Opportunities**

Lambda permissions might be simpler than Security Groups because:

1. ✅ **Clearer naming**: Statement IDs are explicit
2. ✅ **Direct API**: `get-policy` is straightforward
3. ✅ **Less context needed**: Don't need VPC filtering
4. ✅ **Well-defined format**: Function/StatementID is standard

**Estimated implementation time might be even less than 45 minutes!**

---

## 🚀 **Ready to Implement**

Once Phase 3.1b test succeeds, we can:

1. **Create the Lambda permissions script** (~20 min)
2. **Update the workflow** (~10 min)
3. **Document** (~10 min)
4. **Test** (~15 min)

**Total: ~55 minutes** (conservative estimate)

---

## 📝 **Notes**

- Lambda permissions are relatively straightforward
- Main complexity is parsing policy JSON
- Should be easier than Security Groups
- Will bring us to 80% proactive coverage
- Only one more phase (RDS) to reach 90%

---

**This plan is ready to execute once Phase 3.1b succeeds!** ✅



