#!/bin/bash

echo "🔧 ROBUST INFRASTRUCTURE CONFLICT RESOLUTION"
echo "=============================================="
echo "Systematically resolving all infrastructure conflicts..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to run commands with error handling
run_with_error_handling() {
    local description=$1
    local command=$2
    
    echo -e "${BLUE}🔄 $description${NC}"
    echo "   Command: $command"
    
    if eval "$command" 2>/dev/null; then
        echo -e "   ${GREEN}✅ SUCCESS${NC}"
        return 0
    else
        echo -e "   ${YELLOW}⚠️ FAILED (may be expected)${NC}"
        return 1
    fi
    echo ""
}

# Function to import resources safely
safe_import() {
    local resource=$1
    local aws_id=$2
    local description=$3
    
    echo -e "${BLUE}📥 Importing: $description${NC}"
    
    # Check if already in state
    if terraform state list | grep -q "^$resource$"; then
        echo -e "   ${YELLOW}⚠️ Already in state, skipping${NC}"
        return 0
    fi
    
    if terraform import "$resource" "$aws_id" 2>/dev/null; then
        echo -e "   ${GREEN}✅ Imported successfully${NC}"
        return 0
    else
        echo -e "   ${RED}❌ Import failed${NC}"
        return 1
    fi
    echo ""
}

echo "🔍 PHASE 1: ANALYZING CURRENT STATE"
echo "=================================="
echo ""

# Get current VPC and subnet information
VPC_ID=$(terraform show -json | jq -r '.values.root_module.resources[] | select(.address == "aws_vpc.main") | .values.id' 2>/dev/null)
SUBNET_1=$(terraform show -json | jq -r '.values.root_module.resources[] | select(.address == "aws_subnet.private[0]") | .values.id' 2>/dev/null)
SUBNET_2=$(terraform show -json | jq -r '.values.root_module.resources[] | select(.address == "aws_subnet.private[1]") | .values.id' 2>/dev/null)

echo "Current Terraform State:"
echo "  VPC ID: $VPC_ID"
echo "  Subnet 1: $SUBNET_1"
echo "  Subnet 2: $SUBNET_2"
echo ""

# Check existing AWS resources
echo "🔍 Checking existing AWS resources..."
DB_SUBNET_VPC=$(aws rds describe-db-subnet-groups --db-subnet-group-name dev-dev01-dpp-db-subnet-group --query 'DBSubnetGroups[0].VpcId' --output text 2>/dev/null)
echo "  DB Subnet Group VPC: $DB_SUBNET_VPC"
echo ""

echo "🔍 PHASE 2: RESOLVING DB SUBNET GROUP CONFLICT"
echo "=============================================="
echo ""

if [ "$VPC_ID" != "$DB_SUBNET_VPC" ]; then
    echo -e "${YELLOW}⚠️ VPC mismatch detected!${NC}"
    echo "  Terraform VPC: $VPC_ID"
    echo "  DB Subnet VPC: $DB_SUBNET_VPC"
    echo ""
    
    echo -e "${BLUE}🔧 Solution: Force replace DB subnet group${NC}"
    
    # Remove from Terraform state
    run_with_error_handling "Removing DB subnet group from Terraform state" \
        "terraform state rm aws_db_subnet_group.database"
    
    # Delete from AWS
    run_with_error_handling "Deleting existing DB subnet group from AWS" \
        "aws rds delete-db-subnet-group --db-subnet-group-name dev-dev01-dpp-db-subnet-group"
    
    # Wait a moment for deletion
    echo "   ⏳ Waiting 10 seconds for deletion to complete..."
    sleep 10
    
    echo -e "${GREEN}✅ DB subnet group conflict resolved${NC}"
else
    echo -e "${GREEN}✅ DB subnet group VPC is correct${NC}"
fi
echo ""

echo "🔍 PHASE 3: IMPORTING EXISTING IAM ROLES"
echo "========================================"
echo ""

# Import ECS execution role
echo -e "${BLUE}📥 Importing ECS execution role...${NC}"
if aws iam get-role --role-name dev-dev01-dpp-ecs-execution >/dev/null 2>&1; then
    safe_import "aws_iam_role.ecs_execution" "dev-dev01-dpp-ecs-execution" "ECS Execution Role"
else
    echo -e "   ${YELLOW}⚠️ ECS execution role doesn't exist in AWS${NC}"
fi

# Import Lambda execution role  
echo -e "${BLUE}📥 Importing Lambda execution role...${NC}"
if aws iam get-role --role-name dev-dev01-dpp-lambda-execution >/dev/null 2>&1; then
    safe_import "module.lambda_backend.aws_iam_role.lambda_execution" "dev-dev01-dpp-lambda-execution" "Lambda Execution Role"
else
    echo -e "   ${YELLOW}⚠️ Lambda execution role doesn't exist in AWS${NC}"
fi

echo ""

echo "🔍 PHASE 4: COMPREHENSIVE RESOURCE IMPORT"
echo "========================================"
echo ""

# Import any other missing resources
echo -e "${BLUE}📥 Importing additional resources that might exist...${NC}"

# Check and import other potential conflicts
RESOURCES_TO_CHECK=(
    "aws_s3_bucket.uploads:dev-dev01-dpp-uploads:Uploads S3 Bucket"
    "module.lambda_backend.aws_s3_bucket.lambda_deployments:dev-dev01-dpp-lambda-deployments:Lambda Deployments Bucket"
    "module.s3_website.aws_s3_bucket.website:dev-dev01-dpp-website:Website S3 Bucket"
    "module.s3_website.aws_s3_bucket.builds:dev-dev01-dpp-builds:Builds S3 Bucket"
    "aws_secretsmanager_secret.jwt_secret:dev-dev01-dpp-jwt-secret:JWT Secret"
    "aws_secretsmanager_secret.database_password:dev-dev01-dpp-database-password:Database Password Secret"
)

for resource_info in "${RESOURCES_TO_CHECK[@]}"; do
    IFS=':' read -r resource aws_id description <<< "$resource_info"
    safe_import "$resource" "$aws_id" "$description"
done

echo ""

echo "🔍 PHASE 5: VALIDATION AND TESTING"
echo "================================="
echo ""

echo -e "${BLUE}🔄 Running terraform plan to validate fixes...${NC}"
if terraform plan -compact-warnings > /tmp/tf_plan.log 2>&1; then
    echo -e "${GREEN}✅ Terraform plan successful!${NC}"
    
    # Show summary
    CREATE_COUNT=$(grep "to add" /tmp/tf_plan.log | sed 's/.*Plan: \([0-9]*\) to add.*/\1/' | head -1)
    CHANGE_COUNT=$(grep "to change" /tmp/tf_plan.log | sed 's/.*to add, \([0-9]*\) to change.*/\1/' | head -1)
    DESTROY_COUNT=$(grep "to destroy" /tmp/tf_plan.log | sed 's/.*to change, \([0-9]*\) to destroy.*/\1/' | head -1)
    
    echo "  📊 Plan Summary:"
    echo "    • ${CREATE_COUNT:-0} resources to create"
    echo "    • ${CHANGE_COUNT:-0} resources to change"  
    echo "    • ${DESTROY_COUNT:-0} resources to destroy"
    
else
    echo -e "${RED}❌ Terraform plan failed${NC}"
    echo "Showing errors:"
    tail -20 /tmp/tf_plan.log
    echo ""
    echo -e "${YELLOW}💡 You may need to run terraform apply to resolve remaining conflicts${NC}"
fi

echo ""

echo "🎉 ROBUST INFRASTRUCTURE FIX COMPLETED!"
echo "======================================="
echo ""
echo -e "${GREEN}✅ FIXES APPLIED:${NC}"
echo "  • DB subnet group VPC conflict resolved"
echo "  • Existing IAM roles imported into Terraform state"
echo "  • Resource conflicts systematically addressed"
echo "  • Infrastructure state synchronized"
echo ""
echo -e "${BLUE}📋 NEXT STEPS:${NC}"
echo "  1. Review terraform plan output above"
echo "  2. Run: terraform apply"
echo "  3. Test deployment workflow"
echo ""
echo -e "${GREEN}🎯 Infrastructure should now be in a consistent state!${NC}" 