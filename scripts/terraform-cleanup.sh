#!/bin/bash
# terraform-cleanup.sh - Clean up Terraform state and resolve dependency issues
set -e

echo "🧹 Terraform Cleanup and State Resolution"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to run a command and check result
run_command() {
    local description="$1"
    local command="$2"
    
    echo -e "\n${BLUE}${description}...${NC}"
    if eval "$command"; then
        echo -e "${GREEN}✅ Success${NC}"
    else
        echo -e "${RED}❌ Failed${NC}"
        return 1
    fi
}

# Check if AWS CLI is configured
echo -e "\n${YELLOW}Checking AWS CLI configuration...${NC}"
if ! aws sts get-caller-identity >/dev/null 2>&1; then
    echo -e "${RED}❌ AWS CLI not configured or credentials invalid${NC}"
    exit 1
fi

echo -e "${GREEN}✅ AWS CLI configured${NC}"

# Get account ID and region
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=${AWS_REGION:-us-west-2}

echo -e "\n${YELLOW}Account: ${ACCOUNT_ID}${NC}"
echo -e "${YELLOW}Region: ${REGION}${NC}"

# Function to check if resource exists
resource_exists() {
    local resource_type="$1"
    local resource_id="$2"
    
    case $resource_type in
        "vpc")
            aws ec2 describe-vpcs --vpc-ids "$resource_id" --region "$REGION" >/dev/null 2>&1
            ;;
        "subnet")
            aws ec2 describe-subnets --subnet-ids "$resource_id" --region "$REGION" >/dev/null 2>&1
            ;;
        "rds")
            aws rds describe-db-instances --db-instance-identifier "$resource_id" --region "$REGION" >/dev/null 2>&1
            ;;
        *)
            return 1
            ;;
    esac
}

# Step 1: Check current Terraform state
echo -e "\n${YELLOW}Step 1: Checking current Terraform state...${NC}"
cd terraform/environments/main

if [ -f "terraform.tfstate" ]; then
    echo -e "${BLUE}Current state file exists${NC}"
    
    # Check for VPC in state
    VPC_ID=$(terraform output -raw vpc_id 2>/dev/null || echo "")
    if [ -n "$VPC_ID" ]; then
        echo -e "${BLUE}VPC ID in state: ${VPC_ID}${NC}"
        if resource_exists "vpc" "$VPC_ID"; then
            echo -e "${GREEN}✅ VPC exists in AWS${NC}"
        else
            echo -e "${RED}❌ VPC does not exist in AWS${NC}"
        fi
    fi
    
    # Check for subnets in state
    SUBNET_IDS=$(terraform output -json subnet_ids 2>/dev/null | jq -r '.[]' 2>/dev/null || echo "")
    if [ -n "$SUBNET_IDS" ]; then
        echo -e "${BLUE}Subnet IDs in state:${NC}"
        for subnet_id in $SUBNET_IDS; do
            if resource_exists "subnet" "$subnet_id"; then
                echo -e "  ${GREEN}✅ ${subnet_id} exists${NC}"
            else
                echo -e "  ${RED}❌ ${subnet_id} does not exist${NC}"
            fi
        done
    fi
else
    echo -e "${YELLOW}No local state file found${NC}"
fi

# Step 2: Check for existing resources that might conflict
echo -e "\n${YELLOW}Step 2: Checking for existing resources...${NC}"

# Check for existing VPCs with hibiji tags
EXISTING_VPCS=$(aws ec2 describe-vpcs --filters "Name=tag:Project,Values=hibiji" --query 'Vpcs[].VpcId' --output text --region "$REGION" 2>/dev/null || echo "")
if [ -n "$EXISTING_VPCS" ]; then
    echo -e "${BLUE}Existing hibiji VPCs:${NC}"
    for vpc_id in $EXISTING_VPCS; do
        echo -e "  ${YELLOW}${vpc_id}${NC}"
    done
fi

# Check for existing subnets with hibiji tags
EXISTING_SUBNETS=$(aws ec2 describe-subnets --filters "Name=tag:Project,Values=hibiji" --query 'Subnets[].SubnetId' --output text --region "$REGION" 2>/dev/null || echo "")
if [ -n "$EXISTING_SUBNETS" ]; then
    echo -e "${BLUE}Existing hibiji subnets:${NC}"
    for subnet_id in $EXISTING_SUBNETS; do
        echo -e "  ${YELLOW}${subnet_id}${NC}"
    done
fi

# Step 3: Check for RDS instances
echo -e "\n${YELLOW}Step 3: Checking for RDS instances...${NC}"
RDS_INSTANCES=$(aws rds describe-db-instances --query 'DBInstances[?contains(DBInstanceIdentifier, `hibiji`)].DBInstanceIdentifier' --output text --region "$REGION" 2>/dev/null || echo "")
if [ -n "$RDS_INSTANCES" ]; then
    echo -e "${BLUE}Existing hibiji RDS instances:${NC}"
    for instance in $RDS_INSTANCES; do
        echo -e "  ${YELLOW}${instance}${NC}"
    done
fi

# Step 4: Check for ECS resources
echo -e "\n${YELLOW}Step 4: Checking for ECS resources...${NC}"
ECS_CLUSTERS=$(aws ecs list-clusters --query 'clusterArns[?contains(@, `hibiji`)]' --output text --region "$REGION" 2>/dev/null || echo "")
if [ -n "$ECS_CLUSTERS" ]; then
    echo -e "${BLUE}Existing hibiji ECS clusters:${NC}"
    for cluster in $ECS_CLUSTERS; do
        echo -e "  ${YELLOW}${cluster}${NC}"
    done
fi

# Step 5: Provide cleanup options
echo -e "\n${YELLOW}Step 5: Cleanup Options${NC}"
echo -e "${BLUE}Choose an option:${NC}"
echo -e "  1. ${YELLOW}Force destroy existing resources (DANGEROUS)${NC}"
echo -e "  2. ${YELLOW}Import existing resources into Terraform state${NC}"
echo -e "  3. ${YELLOW}Remove resources from Terraform state (keep in AWS)${NC}"
echo -e "  4. ${YELLOW}Show detailed resource information${NC}"
echo -e "  5. ${YELLOW}Exit without changes${NC}"

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo -e "\n${RED}⚠️  WARNING: This will destroy all hibiji resources!${NC}"
        read -p "Are you sure? Type 'yes' to confirm: " confirm
        if [ "$confirm" = "yes" ]; then
            echo -e "\n${YELLOW}Destroying resources...${NC}"
            
            # Destroy RDS instances first
            if [ -n "$RDS_INSTANCES" ]; then
                for instance in $RDS_INSTANCES; do
                    echo -e "${BLUE}Deleting RDS instance: ${instance}${NC}"
                    aws rds delete-db-instance --db-instance-identifier "$instance" --skip-final-snapshot --region "$REGION" || echo "Failed to delete RDS instance"
                done
            fi
            
            # Destroy ECS resources
            if [ -n "$ECS_CLUSTERS" ]; then
                for cluster in $ECS_CLUSTERS; do
                    echo -e "${BLUE}Deleting ECS cluster: ${cluster}${NC}"
                    aws ecs delete-cluster --cluster "$cluster" --region "$REGION" || echo "Failed to delete ECS cluster"
                done
            fi
            
            # Force destroy with Terraform
            terraform destroy -auto-approve || echo "Terraform destroy failed"
        fi
        ;;
    2)
        echo -e "\n${YELLOW}Importing existing resources...${NC}"
        echo -e "${BLUE}This option requires manual intervention.${NC}"
        echo -e "You'll need to run terraform import commands for each resource."
        ;;
    3)
        echo -e "\n${YELLOW}Removing resources from state...${NC}"
        echo -e "${BLUE}This will keep resources in AWS but remove them from Terraform state.${NC}"
        read -p "Continue? (y/n): " confirm
        if [ "$confirm" = "y" ]; then
            terraform state rm aws_vpc.main 2>/dev/null || echo "VPC not in state"
            terraform state rm aws_subnet.public 2>/dev/null || echo "Public subnets not in state"
            terraform state rm aws_subnet.private 2>/dev/null || echo "Private subnets not in state"
            echo -e "${GREEN}✅ Resources removed from state${NC}"
        fi
        ;;
    4)
        echo -e "\n${YELLOW}Detailed resource information:${NC}"
        echo -e "${BLUE}Run these commands for more details:${NC}"
        echo -e "  aws ec2 describe-vpcs --filters 'Name=tag:Project,Values=hibiji' --region $REGION"
        echo -e "  aws ec2 describe-subnets --filters 'Name=tag:Project,Values=hibiji' --region $REGION"
        echo -e "  aws rds describe-db-instances --region $REGION"
        echo -e "  aws ecs list-clusters --region $REGION"
        ;;
    5)
        echo -e "\n${GREEN}Exiting without changes${NC}"
        exit 0
        ;;
    *)
        echo -e "\n${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}🎉 Cleanup completed!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "  1. Run 'terraform plan' to see what will be created"
echo -e "  2. Run 'terraform apply' to create new infrastructure"
echo -e "  3. Monitor the deployment process" 