#!/bin/bash
# troubleshoot-deployment.sh
# Troubleshoot ECS deployment issues

set -e

echo "🔍 Troubleshooting ECS Deployment..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check ECS cluster status
print_status "Checking ECS cluster status..."
aws ecs describe-clusters --clusters hibiji-dev-cluster --region us-west-1 --query 'clusters[0].{Status:status,ActiveServicesCount:activeServicesCount,RunningTasksCount:runningTasksCount}' --output table

# Check ECS services
print_status "Checking ECS services..."
aws ecs list-services --cluster hibiji-dev-cluster --region us-west-1

# Check frontend service details
print_status "Checking frontend service details..."
aws ecs describe-services --cluster hibiji-dev-cluster --services hibiji-dev-frontend --region us-west-1 --query 'services[0].{Status:status,DesiredCount:desiredCount,RunningCount:runningCount,PendingCount:pendingCount}' --output table

# Check if there are any tasks
print_status "Checking for tasks..."
TASKS=$(aws ecs list-tasks --cluster hibiji-dev-cluster --service-name hibiji-dev-frontend --region us-west-1 --query 'taskArns' --output text)

if [ -n "$TASKS" ] && [ "$TASKS" != "None" ]; then
    print_status "Found tasks: $TASKS"
    
    # Get task details
    print_status "Getting task details..."
    aws ecs describe-tasks --cluster hibiji-dev-cluster --tasks $TASKS --region us-west-1 --query 'tasks[0].{LastStatus:lastStatus,DesiredStatus:desiredStatus,HealthStatus:healthStatus}' --output table
    
    # Check task definition
    TASK_DEF=$(aws ecs describe-tasks --cluster hibiji-dev-cluster --tasks $TASKS --region us-west-1 --query 'tasks[0].taskDefinitionArn' --output text)
    print_status "Task definition: $TASK_DEF"
    
    # Check container status
    print_status "Checking container status..."
    aws ecs describe-tasks --cluster hibiji-dev-cluster --tasks $TASKS --region us-west-1 --query 'tasks[0].containers[0].{Name:name,LastStatus:lastStatus,ExitCode:exitCode}' --output table
    
    # Check for stopped tasks
    print_status "Checking stopped tasks..."
    aws ecs describe-tasks --cluster hibiji-dev-cluster --tasks $TASKS --region us-west-1 --query 'tasks[0].stoppedReason' --output text
else
    print_warning "No tasks found for frontend service"
fi

# Check backend service
print_status "Checking backend service..."
aws ecs describe-services --cluster hibiji-dev-cluster --services hibiji-dev-backend --region us-west-1 --query 'services[0].{Status:status,DesiredCount:desiredCount,RunningCount:runningCount,PendingCount:pendingCount}' --output table

# Check ALB status
print_status "Checking ALB status..."
aws elbv2 describe-load-balancers --names hibiji-dev01-alb --region us-west-1 --query 'LoadBalancers[0].{State:State.Code,DNSName:DNSName}' --output table

# Check target groups
print_status "Checking target groups..."
aws elbv2 describe-target-groups --region us-west-1 --query 'TargetGroups[?contains(TargetGroupName, `hibiji-dev`)].{Name:TargetGroupName,Protocol:Protocol,Port:Port,HealthCheckPath:HealthCheckPath}' --output table

# Check target health
print_status "Checking target health..."
TARGET_GROUPS=$(aws elbv2 describe-target-groups --region us-west-1 --query 'TargetGroups[?contains(TargetGroupName, `hibiji-dev`)].TargetGroupArn' --output text)

for TG_ARN in $TARGET_GROUPS; do
    print_status "Target group: $TG_ARN"
    aws elbv2 describe-target-health --target-group-arn $TG_ARN --region us-west-1 --query 'TargetHealthDescriptions[0].{Target:Target.Id,Port:Target.Port,Health:TargetHealth.State}' --output table
done

# Check ECR repositories
print_status "Checking ECR repositories..."
aws ecr describe-repositories --repository-names hibiji-backend hibiji-frontend --region us-west-1 --query 'repositories[].{Name:repositoryName,URI:repositoryUri}' --output table

# Check recent events
print_status "Checking recent ECS events..."
aws ecs describe-services --cluster hibiji-dev-cluster --services hibiji-dev-frontend --region us-west-1 --query 'services[0].events[0:3].{CreatedAt:createdAt,Message:message}' --output table

print_status "Troubleshooting complete!" 