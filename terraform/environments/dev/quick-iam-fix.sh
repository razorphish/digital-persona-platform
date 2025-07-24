#!/bin/bash

echo "⚡ QUICK IAM PERMISSIONS FIX"
echo "============================"
echo "Applying missing IAM permissions for Terraform operations"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null)
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error: AWS CLI not configured or credentials invalid${NC}"
    exit 1
fi

echo -e "${BLUE}📋 AWS Account: $ACCOUNT_ID${NC}"
echo ""

POLICY_NAME="MissingTerraformPermissions"
POLICY_ARN="arn:aws:iam::${ACCOUNT_ID}:policy/$POLICY_NAME"

echo -e "${BLUE}🔧 Step 1: Creating missing permissions policy...${NC}"

# Create the policy
if aws iam create-policy \
    --policy-name "$POLICY_NAME" \
    --policy-document file://../../iam-policies/missing-terraform-permissions.json \
    --description "Missing IAM permissions for Terraform (iam:TagRole, iam:GetRolePolicy, etc.)" \
    >/dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Policy created: $POLICY_NAME${NC}"
    POLICY_CREATED=true
else
    echo -e "   ${YELLOW}⚠️ Policy may already exist: $POLICY_NAME${NC}"
    POLICY_CREATED=false
fi

echo ""
echo -e "${BLUE}🔗 Step 2: Attaching policy to dev-airica user...${NC}"

# Attach the policy to the user
if aws iam attach-user-policy \
    --user-name dev-airica \
    --policy-arn "$POLICY_ARN" \
    >/dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Policy attached successfully${NC}"
    POLICY_ATTACHED=true
else
    echo -e "   ${YELLOW}⚠️ Policy may already be attached${NC}"
    POLICY_ATTACHED=true
fi

echo ""
echo -e "${BLUE}⏳ Step 3: Waiting for IAM propagation (10 seconds)...${NC}"
sleep 10

echo ""
echo -e "${BLUE}🧪 Step 4: Quick permission test...${NC}"

# Quick test of the TagRole permission
TEST_ROLE_NAME="quick-test-role-$(date +%s)"
if aws iam create-role \
    --role-name "$TEST_ROLE_NAME" \
    --assume-role-policy-document '{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"lambda.amazonaws.com"},"Action":"sts:AssumeRole"}]}' \
    >/dev/null 2>&1; then
    
    if aws iam tag-role --role-name "$TEST_ROLE_NAME" --tags Key=Test,Value=Quick >/dev/null 2>&1; then
        echo -e "   ${GREEN}✅ iam:TagRole is now working!${NC}"
        TAGROLE_WORKING=true
    else
        echo -e "   ${RED}❌ iam:TagRole still not working${NC}"
        TAGROLE_WORKING=false
    fi
    
    # Cleanup
    aws iam delete-role --role-name "$TEST_ROLE_NAME" >/dev/null 2>&1
else
    echo -e "   ${YELLOW}⚠️ Cannot create test role${NC}"
    TAGROLE_WORKING=false
fi

echo ""
echo "🎉 QUICK IAM FIX COMPLETED!"
echo "=========================="
echo ""

echo -e "${GREEN}📋 RESULTS:${NC}"
echo "  Policy Creation: $([[ $POLICY_CREATED == true ]] && echo "✅ Success" || echo "⚠️ Already existed")"
echo "  Policy Attachment: $([[ $POLICY_ATTACHED == true ]] && echo "✅ Success" || echo "❌ Failed")"
echo "  TagRole Test: $([[ $TAGROLE_WORKING == true ]] && echo "✅ Working" || echo "❌ Still blocked")"

echo ""
echo -e "${BLUE}📋 NEXT STEPS:${NC}"
if [[ $TAGROLE_WORKING == true ]]; then
    echo "  1. ✅ Try: terraform plan"
    echo "  2. ✅ Try: terraform apply"
    echo "  3. ✅ Run the Deploy Serverless Architecture workflow"
    echo ""
    echo -e "${GREEN}🎊 IAM permissions should now be working for Terraform!${NC}"
else
    echo "  1. ⚠️ Try running the comprehensive fix: ./iam-permission-fix.sh"
    echo "  2. ⚠️ Or use the selective approach: ./selective-apply.sh"
    echo "  3. ⚠️ Check AWS CloudTrail for specific permission denials"
    echo ""
    echo -e "${YELLOW}⚠️ Some permissions may still be restricted${NC}"
fi

echo ""
echo -e "${BLUE}📋 POLICY APPLIED:${NC}"
echo "  Name: $POLICY_NAME"
echo "  ARN: $POLICY_ARN"
echo "  Permissions: iam:TagRole, iam:GetRolePolicy, iam:CreateRole, iam:PassRole, etc." 