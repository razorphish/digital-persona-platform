#!/bin/bash
# scripts/troubleshoot-deployment.sh
# Troubleshooting script for deployment issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Get AWS account ID
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "🔍 Troubleshooting Hibiji Platform Deployment"
echo "=============================================="
echo ""

# Check ECS Cluster
print_status "Checking ECS Cluster..."
CLUSTER_STATUS=$(aws ecs describe-clusters \
  --clusters hibiji-dev-cluster \
  --region us-west-1 \
  --query 'clusters[0].status' \
  --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$CLUSTER_STATUS" = "ACTIVE" ]; then
    print_success "ECS Cluster is active"
else
    print_error "ECS Cluster status: $CLUSTER_STATUS"
    exit 1
fi

# List ECS Services
print_status "Listing ECS Services..."
SERVICES=$(aws ecs list-services \
  --cluster hibiji-dev-cluster \
  --region us-west-1 \
  --query 'serviceArns' \
  --output text 2>/dev/null || echo "")

if [ -n "$SERVICES" ]; then
    print_success "Found services: $SERVICES"
    
    # Extract service names
    SERVICE_NAMES=$(echo $SERVICES | sed 's/.*\///g')
    print_status "Service names: $SERVICE_NAMES"
    
    # Check each service
    for SERVICE in $SERVICE_NAMES; do
        echo ""
        print_status "Checking service: $SERVICE"
        
        # Get service details
        SERVICE_DETAILS=$(aws ecs describe-services \
          --cluster hibiji-dev-cluster \
          --services $SERVICE \
          --region us-west-1)
        
        # Check service status
        SERVICE_STATUS=$(echo "$SERVICE_DETAILS" | jq -r '.services[0].status')
        DESIRED_COUNT=$(echo "$SERVICE_DETAILS" | jq -r '.services[0].desiredCount')
        RUNNING_COUNT=$(echo "$SERVICE_DETAILS" | jq -r '.services[0].runningCount')
        
        echo "  Status: $SERVICE_STATUS"
        echo "  Desired: $DESIRED_COUNT, Running: $RUNNING_COUNT"
        
        # Check recent events
        echo "  Recent events:"
        echo "$SERVICE_DETAILS" | jq -r '.services[0].events[0:3][] | "    - \(.message)"'
        
        # Check tasks
        TASKS=$(aws ecs list-tasks \
          --cluster hibiji-dev-cluster \
          --service-name $SERVICE \
          --region us-west-1 \
          --query 'taskArns' \
          --output text 2>/dev/null || echo "")
        
        if [ -n "$TASKS" ]; then
            echo "  Tasks: $TASKS"
            
            # Get task details
            TASK_ARN=$(echo $TASKS | awk '{print $1}')
            TASK_DETAILS=$(aws ecs describe-tasks \
              --cluster hibiji-dev-cluster \
              --tasks $TASK_ARN \
              --region us-west-1)
            
            TASK_STATUS=$(echo "$TASK_DETAILS" | jq -r '.tasks[0].lastStatus')
            echo "  Latest task status: $TASK_STATUS"
            
            # Get container logs if task is running
            if [ "$TASK_STATUS" = "RUNNING" ]; then
                CONTAINER_NAME=$(echo "$TASK_DETAILS" | jq -r '.tasks[0].containers[0].name')
                LOG_GROUP=$(echo "$TASK_DETAILS" | jq -r '.tasks[0].containers[0].logConfiguration.options."awslogs-group"')
                
                echo "  Container: $CONTAINER_NAME"
                echo "  Log group: $LOG_GROUP"
                
                # Get recent logs
                print_status "  Recent logs:"
                aws logs get-log-events \
                  --log-group-name "$LOG_GROUP" \
                  --log-stream-name "ecs/$CONTAINER_NAME/$TASK_ARN" \
                  --region us-west-1 \
                  --query 'events[0:5].message' \
                  --output text 2>/dev/null || echo "    No logs available"
            fi
        else
            echo "  No tasks found"
        fi
    done
else
    print_error "No ECS services found"
fi

# Check ALB
echo ""
print_status "Checking Application Load Balancer..."
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --names hibiji-dev-alb \
  --region us-west-1 \
  --query 'LoadBalancers[0].DNSName' \
  --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$ALB_DNS" != "NOT_FOUND" ]; then
    print_success "ALB DNS: $ALB_DNS"
    
    # Check target groups
    TARGET_GROUPS=$(aws elbv2 describe-target-groups \
      --region us-west-1 \
      --query 'TargetGroups[?contains(TargetGroupName, `hibiji`)].TargetGroupName' \
      --output text)
    
    echo "Target groups: $TARGET_GROUPS"
    
    # Check target health
    for TG in $TARGET_GROUPS; do
        echo ""
        print_status "Checking target group: $TG"
        TG_ARN=$(aws elbv2 describe-target-groups \
          --names $TG \
          --region us-west-1 \
          --query 'TargetGroups[0].TargetGroupArn' \
          --output text)
        
        HEALTH=$(aws elbv2 describe-target-health \
          --target-group-arn $TG_ARN \
          --region us-west-1 \
          --query 'TargetHealthDescriptions[0].TargetHealth.State' \
          --output text)
        
        echo "  Health: $HEALTH"
    done
else
    print_error "ALB not found"
fi

# Check RDS
echo ""
print_status "Checking RDS Database..."
RDS_STATUS=$(aws rds describe-db-instances \
  --db-instance-identifier hibiji-dev-db \
  --region us-west-1 \
  --query 'DBInstances[0].DBInstanceStatus' \
  --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$RDS_STATUS" = "available" ]; then
    print_success "RDS is available"
    RDS_ENDPOINT=$(aws rds describe-db-instances \
      --db-instance-identifier hibiji-dev-db \
      --region us-west-1 \
      --query 'DBInstances[0].Endpoint.Address' \
      --output text)
    echo "  Endpoint: $RDS_ENDPOINT"
else
    print_error "RDS status: $RDS_STATUS"
fi

echo ""
print_status "Troubleshooting complete!"
echo ""
echo "Next steps:"
echo "1. Check the service events above for error messages"
echo "2. Review container logs for application errors"
echo "3. Verify target group health"
echo "4. Check security group rules"
echo "5. Verify environment variables and secrets" 