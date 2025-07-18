#!/bin/bash

# =================================
# LEGACY RESOURCE CLEANUP SCRIPT
# =================================
# Removes old hibiji-dev01 architecture resources
# that are running in parallel with new serverless architecture

set -e

echo "===========================================" 
echo "🧹 LEGACY RESOURCE CLEANUP"
echo "==========================================="
echo ""
echo "⚠️  WARNING: This will delete legacy hibiji-dev01 resources:"
echo "  ❌ Database: hibiji-dev01-db"
echo "  ❌ ECS Cluster: hibiji-dev01-cluster"  
echo "  ❌ ECS Services: hibiji-dev01-frontend, hibiji-dev01-backend"
echo "  ❌ Load Balancer: hibiji-dev01-alb"
echo ""
echo "💰 Estimated Monthly Savings: $50-75"
echo ""
read -p "Are you sure you want to proceed? Type 'DELETE' to confirm: " confirmation

if [ "$confirmation" != "DELETE" ]; then
    echo "❌ Cleanup cancelled"
    exit 1
fi

echo ""
echo "🧹 Starting cleanup process..."

# 1. Scale down ECS services to 0
echo "📦 Scaling down ECS services..."
aws ecs update-service \
    --cluster hibiji-dev01-cluster \
    --service hibiji-dev01-frontend \
    --desired-count 0

aws ecs update-service \
    --cluster hibiji-dev01-cluster \
    --service hibiji-dev01-backend \
    --desired-count 0

echo "⏳ Waiting for ECS services to stop..."
aws ecs wait services-stable \
    --cluster hibiji-dev01-cluster \
    --services hibiji-dev01-frontend hibiji-dev01-backend

# 2. Delete ECS services
echo "🗑️  Deleting ECS services..."
aws ecs delete-service \
    --cluster hibiji-dev01-cluster \
    --service hibiji-dev01-frontend \
    --force

aws ecs delete-service \
    --cluster hibiji-dev01-cluster \
    --service hibiji-dev01-backend \
    --force

# 3. Delete ECS cluster
echo "🗑️  Deleting ECS cluster..."
aws ecs delete-cluster --cluster hibiji-dev01-cluster

# 4. Delete Application Load Balancer
echo "⚖️  Deleting Application Load Balancer..."
ALB_ARN=$(aws elbv2 describe-load-balancers --names hibiji-dev01-alb --query 'LoadBalancers[0].LoadBalancerArn' --output text)
if [ "$ALB_ARN" != "None" ]; then
    aws elbv2 delete-load-balancer --load-balancer-arn "$ALB_ARN"
    echo "⏳ Waiting for ALB deletion..."
    aws elbv2 wait load-balancers-deleted --load-balancer-arns "$ALB_ARN"
fi

# 4.5. Delete Target Groups
echo "🎯 Deleting legacy target groups..."
for tg_name in hibiji-bk-21ea8e73 hibiji-fr-21ea8e73; do
    TG_ARN=$(aws elbv2 describe-target-groups --names "$tg_name" --query 'TargetGroups[0].TargetGroupArn' --output text 2>/dev/null || echo "None")
    if [ "$TG_ARN" != "None" ]; then
        echo "🗑️  Deleting target group: $tg_name"
        aws elbv2 delete-target-group --target-group-arn "$TG_ARN"
    fi
done

# 4.6. Delete ECR Repositories  
echo "📦 Deleting legacy ECR repositories..."
for repo_name in hibiji-backend hibiji-frontend; do
    echo "🗑️  Deleting ECR repository: $repo_name"
    aws ecr delete-repository --repository-name "$repo_name" --force 2>/dev/null || echo "  Repository $repo_name not found or already deleted"
done

# 5. Delete legacy database (with confirmation)
echo ""
echo "🗄️  Deleting legacy database..."
echo "⚠️  FINAL WARNING: About to delete hibiji-dev01-db database"
read -p "Type 'DELETE_DATABASE' to confirm database deletion: " db_confirmation

if [ "$db_confirmation" = "DELETE_DATABASE" ]; then
    aws rds delete-db-instance \
        --db-instance-identifier hibiji-dev01-db \
        --skip-final-snapshot \
        --delete-automated-backups
    
    echo "⏳ Database deletion initiated (this may take 5-10 minutes)..."
else
    echo "⏸️  Skipping database deletion"
fi

echo ""
echo "✅ Legacy resource cleanup completed!"
echo ""
echo "💰 Estimated monthly savings: $50-75"
echo "🚀 Your new serverless architecture is now the only running system"
echo ""
echo "New infrastructure endpoints:"
echo "  🌐 API: https://p2ziqftgqc.execute-api.us-west-1.amazonaws.com/v1"
echo "  🌐 Website: https://d3cguiz7sc0p98.cloudfront.net" 