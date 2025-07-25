#!/bin/bash

echo "🔧 COMPREHENSIVE TERRAFORM IMPORT SCRIPT"
echo "=========================================="
echo "Importing all existing AWS resources into Terraform state..."
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to run import with error handling
import_resource() {
    local resource=$1
    local aws_id=$2
    local description=$3
    
    echo -e "${YELLOW}Importing:${NC} $description"
    echo "  Resource: $resource"
    echo "  AWS ID: $aws_id"
    
    if terraform import "$resource" "$aws_id" 2>/dev/null; then
        echo -e "  ${GREEN}✅ SUCCESS${NC}"
    else
        echo -e "  ${RED}❌ FAILED${NC} (may already be imported or not exist)"
    fi
    echo ""
}

echo "🔍 STARTING TERRAFORM IMPORT PROCESS..."
echo ""

# 1. Secrets Manager
echo "📋 IMPORTING SECRETS MANAGER RESOURCES..."
import_resource "aws_secretsmanager_secret.jwt_secret" "dev-dev01-dpp-jwt-secret" "JWT Secret"
import_resource "aws_secretsmanager_secret.database_password" "dev-dev01-dpp-database-password" "Database Password Secret"

# 2. S3 Buckets
echo "📦 IMPORTING S3 BUCKET RESOURCES..."
import_resource "aws_s3_bucket.uploads" "dev-dev01-dpp-uploads" "Uploads S3 Bucket"
import_resource "module.lambda_backend.aws_s3_bucket.lambda_deployments" "dev-dev01-dpp-lambda-deployments" "Lambda Deployments S3 Bucket"
import_resource "module.s3_website.aws_s3_bucket.website" "dev-dev01-dpp-website" "Website S3 Bucket"
import_resource "module.s3_website.aws_s3_bucket.builds" "dev-dev01-dpp-builds" "Builds S3 Bucket"

# 3. IAM Roles
echo "🔐 IMPORTING IAM ROLE RESOURCES..."
import_resource "aws_iam_role.ecs_execution" "dev-dev01-dpp-ecs-execution" "ECS Execution Role"
import_resource "aws_iam_role.ecs_task" "dev-dev01-dpp-ecs-task" "ECS Task Role"
import_resource "module.lambda_backend.aws_iam_role.lambda_execution" "dev-dev01-dpp-lambda-execution" "Lambda Execution Role"

# 4. CloudWatch Log Groups
echo "📊 IMPORTING CLOUDWATCH LOG GROUP RESOURCES..."
import_resource "aws_cloudwatch_log_group.backend_ecs" "/ecs/hibiji-dev01-backend" "Backend ECS Log Group"
import_resource "aws_cloudwatch_log_group.frontend_ecs" "/ecs/hibiji-dev01-frontend" "Frontend ECS Log Group"
import_resource "module.api_gateway.aws_cloudwatch_log_group.api_gateway" "/aws/apigateway/dev-dev01-dpp" "API Gateway Log Group"

# 5. Database Resources
echo "🗄️ IMPORTING DATABASE RESOURCES..."
import_resource "aws_db_subnet_group.database" "dev-dev01-dpp-db-subnet-group" "Database Subnet Group"

# 6. CloudFront Resources (need to find the actual ID)
echo "🌐 FINDING AND IMPORTING CLOUDFRONT RESOURCES..."
echo "Looking up CloudFront Origin Access Control ID..."

# Get CloudFront OAC ID
OAC_ID=$(aws cloudfront list-origin-access-controls --query 'OriginAccessControlList.Items[?Name==`dev-dev01-dpp-oac`].Id' --output text 2>/dev/null | head -1)
if [ ! -z "$OAC_ID" ] && [ "$OAC_ID" != "None" ]; then
    import_resource "module.s3_website.aws_cloudfront_origin_access_control.website" "$OAC_ID" "CloudFront Origin Access Control"
else
    echo -e "  ${YELLOW}⚠️ CloudFront OAC not found or no permissions${NC}"
fi

# 7. Check for existing API Gateway
echo "🌐 CHECKING FOR EXISTING API GATEWAY..."
API_ID=$(aws apigatewayv2 get-apis --query 'Items[?Name==`dev-dev01-dpp-api`].ApiId' --output text 2>/dev/null | head -1)
if [ ! -z "$API_ID" ] && [ "$API_ID" != "None" ]; then
    echo -e "${YELLOW}Found existing API Gateway:${NC} $API_ID"
    import_resource "module.api_gateway.aws_apigatewayv2_api.main" "$API_ID" "API Gateway v2 API"
else
    echo -e "  ${YELLOW}⚠️ API Gateway not found - will be created${NC}"
fi

# 8. Check for existing Lambda function
echo "⚡ CHECKING FOR EXISTING LAMBDA FUNCTION..."
LAMBDA_EXISTS=$(aws lambda get-function --function-name dev-dev01-dpp-api --query 'Configuration.FunctionName' --output text 2>/dev/null)
if [ ! -z "$LAMBDA_EXISTS" ] && [ "$LAMBDA_EXISTS" != "None" ]; then
    echo -e "${YELLOW}Found existing Lambda function:${NC} $LAMBDA_EXISTS"
    import_resource "module.lambda_backend.aws_lambda_function.api" "$LAMBDA_EXISTS" "Lambda Function"
else
    echo -e "  ${YELLOW}⚠️ Lambda function not found - will be created${NC}"
fi

# 9. Check for VPC and related resources
echo "🌐 CHECKING FOR EXISTING VPC RESOURCES..."
VPC_ID=$(aws ec2 describe-vpcs --filters "Name=tag:Name,Values=dev-dev01-dpp-vpc" --query 'Vpcs[0].VpcId' --output text 2>/dev/null)
if [ ! -z "$VPC_ID" ] && [ "$VPC_ID" != "None" ]; then
    echo -e "${YELLOW}Found existing VPC:${NC} $VPC_ID"
    import_resource "aws_vpc.main" "$VPC_ID" "Main VPC"
    
    # Import subnets
    SUBNET_1=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=dev-dev01-dpp-private-1" --query 'Subnets[0].SubnetId' --output text 2>/dev/null)
    SUBNET_2=$(aws ec2 describe-subnets --filters "Name=tag:Name,Values=dev-dev01-dpp-private-2" --query 'Subnets[0].SubnetId' --output text 2>/dev/null)
    
    if [ ! -z "$SUBNET_1" ] && [ "$SUBNET_1" != "None" ]; then
        import_resource "aws_subnet.private[0]" "$SUBNET_1" "Private Subnet 1"
    fi
    
    if [ ! -z "$SUBNET_2" ] && [ "$SUBNET_2" != "None" ]; then
        import_resource "aws_subnet.private[1]" "$SUBNET_2" "Private Subnet 2"
    fi
    
    # Import Internet Gateway
    IGW_ID=$(aws ec2 describe-internet-gateways --filters "Name=tag:Name,Values=dev-dev01-dpp-igw" --query 'InternetGateways[0].InternetGatewayId' --output text 2>/dev/null)
    if [ ! -z "$IGW_ID" ] && [ "$IGW_ID" != "None" ]; then
        import_resource "aws_internet_gateway.main" "$IGW_ID" "Internet Gateway"
    fi
    
    # Import Security Groups
    DB_SG=$(aws ec2 describe-security-groups --filters "Name=tag:Name,Values=dev-dev01-dpp-db-sg" --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null)
    LAMBDA_SG=$(aws ec2 describe-security-groups --filters "Name=tag:Name,Values=dev-dev01-dpp-lambda-sg" --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null)
    
    if [ ! -z "$DB_SG" ] && [ "$DB_SG" != "None" ]; then
        import_resource "aws_security_group.database" "$DB_SG" "Database Security Group"
    fi
    
    if [ ! -z "$LAMBDA_SG" ] && [ "$LAMBDA_SG" != "None" ]; then
        import_resource "aws_security_group.lambda" "$LAMBDA_SG" "Lambda Security Group"
    fi
fi

echo ""
echo "🎉 IMPORT PROCESS COMPLETED!"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Run: terraform plan"
echo "2. Review the plan to see what changes are needed"
echo "3. Run: terraform apply"
echo ""
echo "✅ All existing resources should now be managed by Terraform!" 