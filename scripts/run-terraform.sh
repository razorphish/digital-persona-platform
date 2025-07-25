#!/bin/bash
# run-terraform.sh - Run Terraform commands in the correct directory
set -e

echo "🚀 Terraform Command Runner"
echo "==========================="

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

# Set environment variables for Terraform
export TF_VAR_environment="prod"
export TF_VAR_ecr_repository_url="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/dpp-backend"
export TF_VAR_image_tag="latest"

echo -e "\n${BLUE}Environment variables set:${NC}"
echo -e "  TF_VAR_environment: ${TF_VAR_environment}"
echo -e "  TF_VAR_ecr_repository_url: ${TF_VAR_ecr_repository_url}"

# Show available commands
echo -e "\n${YELLOW}Available Terraform commands:${NC}"
echo -e "  1. ${BLUE}terraform init${NC} - Initialize Terraform"
echo -e "  2. ${BLUE}terraform plan${NC} - Show what will be created"
echo -e "  3. ${BLUE}terraform apply${NC} - Apply the configuration"
echo -e "  4. ${BLUE}terraform destroy${NC} - Destroy all resources"
echo -e "  5. ${BLUE}terraform state list${NC} - List resources in state"
echo -e "  6. ${BLUE}terraform output${NC} - Show outputs"
echo -e "  7. ${BLUE}Custom command${NC} - Run a custom Terraform command"

# Get user input
read -p "Enter your choice (1-7): " choice

case $choice in
    1)
        echo -e "\n${YELLOW}Running terraform init...${NC}"
        terraform init
        ;;
    2)
        echo -e "\n${YELLOW}Running terraform plan...${NC}"
        terraform plan
        ;;
    3)
        echo -e "\n${YELLOW}Running terraform apply...${NC}"
        echo -e "${RED}⚠️  This will create/modify infrastructure. Are you sure? (y/n):${NC}"
        read -p "" confirm
        if [ "$confirm" = "y" ]; then
            terraform apply -auto-approve
        else
            echo -e "${YELLOW}Cancelled${NC}"
        fi
        ;;
    4)
        echo -e "\n${RED}⚠️  WARNING: This will destroy ALL resources!${NC}"
        echo -e "${RED}Are you sure? Type 'yes' to confirm:${NC}"
        read -p "" confirm
        if [ "$confirm" = "yes" ]; then
            terraform destroy -auto-approve
        else
            echo -e "${YELLOW}Cancelled${NC}"
        fi
        ;;
    5)
        echo -e "\n${YELLOW}Listing resources in state...${NC}"
        terraform state list
        ;;
    6)
        echo -e "\n${YELLOW}Showing outputs...${NC}"
        terraform output
        ;;
    7)
        echo -e "\n${YELLOW}Enter custom Terraform command:${NC}"
        read -p "terraform " custom_command
        echo -e "\n${BLUE}Running: terraform ${custom_command}${NC}"
        terraform $custom_command
        ;;
    *)
        echo -e "\n${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}🎉 Command completed!${NC}" 