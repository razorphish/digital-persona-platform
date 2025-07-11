#!/bin/bash
# terraform-state-reset.sh - Reset Terraform state to handle dependency issues
set -e

echo "🔄 Terraform State Reset"
echo "======================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Navigate to Terraform directory
cd terraform/environments/main

# Verify we're in the right directory
if [ ! -f "main.tf" ]; then
    echo -e "${RED}❌ Error: main.tf not found. Please run this script from the project root.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Found Terraform configuration in $(pwd)${NC}"

echo -e "\n${YELLOW}Step 1: Backing up current state...${NC}"
if [ -f "terraform.tfstate" ]; then
    cp terraform.tfstate terraform.tfstate.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✅ State backed up${NC}"
else
    echo -e "${YELLOW}No state file found${NC}"
fi

echo -e "\n${YELLOW}Step 2: Removing problematic resources from state...${NC}"

# Remove resources that are causing issues
echo -e "${BLUE}Removing VPC from state...${NC}"
terraform state rm aws_vpc.main 2>/dev/null || echo "VPC not in state"

echo -e "${BLUE}Removing public subnets from state...${NC}"
terraform state rm aws_subnet.public[0] 2>/dev/null || echo "Public subnet 0 not in state"
terraform state rm aws_subnet.public[1] 2>/dev/null || echo "Public subnet 1 not in state"

echo -e "${BLUE}Removing private subnets from state...${NC}"
terraform state rm aws_subnet.private[0] 2>/dev/null || echo "Private subnet 0 not in state"
terraform state rm aws_subnet.private[1] 2>/dev/null || echo "Private subnet 1 not in state"

echo -e "${BLUE}Removing route tables from state...${NC}"
terraform state rm aws_route_table.public 2>/dev/null || echo "Public route table not in state"
terraform state rm aws_route_table.private 2>/dev/null || echo "Private route table not in state"

echo -e "${BLUE}Removing route table associations from state...${NC}"
terraform state rm aws_route_table_association.public[0] 2>/dev/null || echo "Public route table association 0 not in state"
terraform state rm aws_route_table_association.public[1] 2>/dev/null || echo "Public route table association 1 not in state"
terraform state rm aws_route_table_association.private[0] 2>/dev/null || echo "Private route table association 0 not in state"
terraform state rm aws_route_table_association.private[1] 2>/dev/null || echo "Private route table association 1 not in state"

echo -e "${BLUE}Removing internet gateway from state...${NC}"
terraform state rm aws_internet_gateway.main 2>/dev/null || echo "Internet gateway not in state"

echo -e "${BLUE}Removing NAT gateway from state...${NC}"
terraform state rm aws_nat_gateway.main 2>/dev/null || echo "NAT gateway not in state"

echo -e "${BLUE}Removing EIP from state...${NC}"
terraform state rm aws_eip.nat 2>/dev/null || echo "EIP not in state"

echo -e "${BLUE}Removing security groups from state...${NC}"
terraform state rm aws_security_group.alb 2>/dev/null || echo "ALB security group not in state"
terraform state rm aws_security_group.app 2>/dev/null || echo "App security group not in state"

echo -e "${BLUE}Removing load balancer from state...${NC}"
terraform state rm aws_lb.main 2>/dev/null || echo "Load balancer not in state"

echo -e "${BLUE}Removing target groups from state...${NC}"
terraform state rm aws_lb_target_group.backend 2>/dev/null || echo "Backend target group not in state"
terraform state rm aws_lb_target_group.frontend 2>/dev/null || echo "Frontend target group not in state"

echo -e "${BLUE}Removing listeners from state...${NC}"
terraform state rm aws_lb_listener.backend 2>/dev/null || echo "Backend listener not in state"
terraform state rm aws_lb_listener.frontend 2>/dev/null || echo "Frontend listener not in state"

echo -e "${BLUE}Removing RDS instance from state...${NC}"
terraform state rm aws_db_instance.main 2>/dev/null || echo "RDS instance not in state"

echo -e "${BLUE}Removing RDS subnet group from state...${NC}"
terraform state rm aws_db_subnet_group.main 2>/dev/null || echo "RDS subnet group not in state"

echo -e "${BLUE}Removing IAM roles from state...${NC}"
terraform state rm aws_iam_role.ecs_execution 2>/dev/null || echo "ECS execution role not in state"
terraform state rm aws_iam_role.ecs_task 2>/dev/null || echo "ECS task role not in state"

echo -e "${BLUE}Removing IAM role policy attachments from state...${NC}"
terraform state rm aws_iam_role_policy_attachment.ecs_execution 2>/dev/null || echo "ECS execution role policy attachment not in state"
terraform state rm aws_iam_role_policy_attachment.ecs_task_application 2>/dev/null || echo "ECS task role policy attachment not in state"

echo -e "${BLUE}Removing secrets from state...${NC}"
terraform state rm aws_secretsmanager_secret.secret_key 2>/dev/null || echo "Secret key secret not in state"
terraform state rm aws_secretsmanager_secret_version.secret_key 2>/dev/null || echo "Secret key version not in state"
terraform state rm aws_secretsmanager_secret.database_password 2>/dev/null || echo "Database password secret not in state"
terraform state rm aws_secretsmanager_secret_version.database_password 2>/dev/null || echo "Database password version not in state"

echo -e "${BLUE}Removing Route53 resources from state...${NC}"
terraform state rm aws_route53_zone.main 2>/dev/null || echo "Route53 zone not in state"
terraform state rm aws_route53_record.wildcard 2>/dev/null || echo "Route53 record not in state"

echo -e "${BLUE}Removing ACM certificate from state...${NC}"
terraform state rm aws_acm_certificate.main 2>/dev/null || echo "ACM certificate not in state"

echo -e "${BLUE}Removing CloudFront distribution from state...${NC}"
terraform state rm aws_cloudfront_distribution.main 2>/dev/null || echo "CloudFront distribution not in state"

echo -e "${BLUE}Removing ECS module from state...${NC}"
terraform state rm module.ecs 2>/dev/null || echo "ECS module not in state"

echo -e "${GREEN}✅ Resources removed from state${NC}"

echo -e "\n${YELLOW}Step 3: Running terraform plan...${NC}"
echo -e "${BLUE}This will show what resources will be created...${NC}"

# Set environment variables for Terraform
export TF_VAR_environment="prod"
export TF_VAR_ecr_repository_url="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/dpp-backend"
export TF_VAR_frontend_ecr_repository_url="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/dpp-frontend"
export TF_VAR_image_tag="latest"
export TF_VAR_frontend_image_tag="latest"

echo -e "\n${BLUE}Environment variables set:${NC}"
echo -e "  TF_VAR_environment: ${TF_VAR_environment}"
echo -e "  TF_VAR_ecr_repository_url: ${TF_VAR_ecr_repository_url}"
echo -e "  TF_VAR_frontend_ecr_repository_url: ${TF_VAR_frontend_ecr_repository_url}"

echo -e "\n${YELLOW}Running terraform plan...${NC}"
terraform plan

echo -e "\n${GREEN}🎉 State reset completed!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "  1. Review the terraform plan output above"
echo -e "  2. If the plan looks good, run: terraform apply"
echo -e "  3. Monitor the deployment process"
echo -e "  4. If you need to restore the old state, use the backup file" 