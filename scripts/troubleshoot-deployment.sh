#!/bin/bash

# Digital Persona Platform Troubleshooting Script
# Backend-only troubleshooting system

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "success") echo -e "${GREEN}✅ $message${NC}" ;;
        "error") echo -e "${RED}❌ $message${NC}" ;;
        "warning") echo -e "${YELLOW}⚠️  $message${NC}" ;;
        "info") echo -e "${BLUE}ℹ️  $message${NC}" ;;
    esac
}

echo -e "${BLUE}🔍 Digital Persona Platform - Backend Troubleshooting${NC}"
echo ""

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    print_status "error" "AWS CLI not configured. Run 'aws configure' first."
    exit 1
fi

print_status "info" "AWS CLI configured successfully"

# Get AWS account info
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION="us-west-1"

print_status "info" "AWS Account: $ACCOUNT_ID"
print_status "info" "Region: $REGION"

# Check backend service details
print_status "info" "Checking backend service details..."
aws ecs describe-services --cluster hibiji-dev-cluster --services hibiji-dev-backend --region us-west-1 --query 'services[0].{Status:status,DesiredCount:desiredCount,RunningCount:runningCount,PendingCount:pendingCount}' --output table

# Get backend task details
print_status "info" "Getting backend task details..."
TASKS=$(aws ecs list-tasks --cluster hibiji-dev-cluster --service-name hibiji-dev-backend --region us-west-1 --query 'taskArns' --output text)

if [ -n "$TASKS" ]; then
    print_status "info" "Backend task ARNs:"
    echo "$TASKS"
    
    # Get task details
    print_status "info" "Backend task details:"
    aws ecs describe-tasks --cluster hibiji-dev-cluster --tasks $TASKS --region us-west-1 --query 'tasks[0].{LastStatus:lastStatus,HealthStatus:healthStatus,TaskDefinitionArn:taskDefinitionArn,CreatedAt:createdAt}' --output table
    
    # Get container details
    print_status "info" "Backend container status:"
    aws ecs describe-tasks --cluster hibiji-dev-cluster --tasks $TASKS --region us-west-1 --query 'tasks[0].containers[0].{Name:name,LastStatus:lastStatus,HealthStatus:healthStatus,Reason:reason}' --output table
    
    # Check task logs
    print_status "info" "Recent backend logs:"
    TASK_ID=$(echo $TASKS | awk -F'/' '{print $NF}')
    aws logs get-log-events --log-group-name /ecs/hibiji-dev-app --log-stream-name ecs/backend/$TASK_ID --limit 20 --region us-west-1 --query 'events[].message' --output text 2>/dev/null || print_status "warning" "Could not retrieve backend logs"
else
    print_status "warning" "No tasks found for backend service"
fi

# Check ALB details
print_status "info" "Checking Application Load Balancer..."
aws elbv2 describe-load-balancers --names hibiji-dev-alb --region us-west-1 --query 'LoadBalancers[0].{State:State.Code,Scheme:Scheme,DNSName:DNSName}' --output table

# Check target groups
print_status "info" "Checking target groups..."
aws elbv2 describe-target-groups --load-balancer-arn $(aws elbv2 describe-load-balancers --names hibiji-dev-alb --region us-west-1 --query 'LoadBalancers[0].LoadBalancerArn' --output text) --region us-west-1 --query 'TargetGroups[].{Name:TargetGroupName,Protocol:Protocol,Port:Port,HealthyThresholdCount:HealthyThresholdCount}' --output table

# Check target health
print_status "info" "Checking target health..."
TARGET_GROUP_ARN=$(aws elbv2 describe-target-groups --load-balancer-arn $(aws elbv2 describe-load-balancers --names hibiji-dev-alb --region us-west-1 --query 'LoadBalancers[0].LoadBalancerArn' --output text) --region us-west-1 --query 'TargetGroups[0].TargetGroupArn' --output text)

if [ -n "$TARGET_GROUP_ARN" ]; then
    aws elbv2 describe-target-health --target-group-arn $TARGET_GROUP_ARN --region us-west-1 --query 'TargetHealthDescriptions[].{Target:Target.Id,Port:Target.Port,TargetHealth:TargetHealth.State,Reason:TargetHealth.Reason}' --output table
else
    print_status "warning" "Could not find target group ARN"
fi

# Check RDS status
print_status "info" "Checking RDS database..."
aws rds describe-db-instances --db-instance-identifier hibiji-dev-db --region us-west-1 --query 'DBInstances[0].{Status:DBInstanceStatus,Engine:Engine,Class:DBInstanceClass,AllocatedStorage:AllocatedStorage}' --output table 2>/dev/null || print_status "warning" "Could not find RDS instance"

# Check ECR repositories
print_status "info" "Checking ECR repositories..."
aws ecr describe-repositories --repository-names hibiji-backend --region us-west-1 --query 'repositories[].{Name:repositoryName,URI:repositoryUri}' --output table 2>/dev/null || print_status "warning" "Could not find ECR repositories"

# Check recent ECS events
print_status "info" "Recent backend service events:"
aws ecs describe-services --cluster hibiji-dev-cluster --services hibiji-dev-backend --region us-west-1 --query 'services[0].events[0:3].{CreatedAt:createdAt,Message:message}' --output table

# Network diagnostics
print_status "info" "Running network diagnostics..."

# Check if services are accessible
print_status "info" "Testing backend connectivity..."
if curl -f -m 10 http://localhost:8000/health > /dev/null 2>&1; then
    print_status "success" "Backend is accessible locally"
else
    print_status "warning" "Backend is not accessible locally"
fi

# Check security groups
print_status "info" "Checking security groups..."
SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=hibiji-dev-alb-sg" --region us-west-1 --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null)

if [ "$SG_ID" != "None" ] && [ -n "$SG_ID" ]; then
    print_status "info" "ALB Security Group Rules:"
    aws ec2 describe-security-groups --group-ids $SG_ID --region us-west-1 --query 'SecurityGroups[0].IpPermissions[].{Protocol:IpProtocol,Port:FromPort,Source:IpRanges[0].CidrIp}' --output table
else
    print_status "warning" "Could not find ALB security group"
fi

# Check backend service security group
BACKEND_SG_ID=$(aws ec2 describe-security-groups --filters "Name=group-name,Values=hibiji-dev-backend-sg" --region us-west-1 --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null)

if [ "$BACKEND_SG_ID" != "None" ] && [ -n "$BACKEND_SG_ID" ]; then
    print_status "info" "Backend Security Group Rules:"
    aws ec2 describe-security-groups --group-ids $BACKEND_SG_ID --region us-west-1 --query 'SecurityGroups[0].IpPermissions[].{Protocol:IpProtocol,Port:FromPort,Source:IpRanges[0].CidrIp}' --output table
else
    print_status "warning" "Could not find backend security group"
fi

# Resource summary
print_status "info" "Resource Summary:"
echo "=========================================="
print_status "info" "ECS Cluster: hibiji-dev-cluster"
print_status "info" "Backend Service: hibiji-dev-backend"
print_status "info" "Load Balancer: hibiji-dev-alb"
print_status "info" "Database: hibiji-dev-db"
print_status "info" "ECR Repository: hibiji-backend"

print_status "success" "Troubleshooting completed!"
print_status "info" "If issues persist, check:"
print_status "info" "1. ECS task logs in CloudWatch"
print_status "info" "2. Target group health in ALB console"
print_status "info" "3. Security group rules for proper port access"
print_status "info" "4. RDS connectivity and database status" 