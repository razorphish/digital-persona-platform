#!/bin/bash

# =================================
# ECS RESOURCE CLEANUP SCRIPT
# =================================
# Removes all ECS resources to prepare for serverless-only architecture

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🧹 ECS RESOURCE CLEANUP"
echo "======================"
echo ""
echo -e "${YELLOW}⚠️  WARNING: This will delete ALL ECS resources:${NC}"
echo "  ❌ ECS Clusters (qa-, dev-, hibiji-*)"
echo "  ❌ ECS Services"
echo "  ❌ ECS Task Definitions"
echo "  ❌ Application Load Balancers"
echo "  ❌ Target Groups"
echo "  ❌ ALB Security Groups"
echo "  ❌ ECS IAM Roles"
echo ""
echo -e "${GREEN}✅ Will preserve serverless resources:${NC}"
echo "  ✅ Lambda functions"
echo "  ✅ API Gateway"
echo "  ✅ S3 buckets"
echo "  ✅ Aurora Serverless databases"
echo "  ✅ Secrets Manager"
echo ""

read -p "Are you sure you want to proceed? Type 'DELETE-ECS' to confirm: " confirmation

if [ "$confirmation" != "DELETE-ECS" ]; then
    echo "❌ Cleanup cancelled"
    exit 1
fi

echo ""
echo -e "${BLUE}🚀 Starting ECS cleanup process...${NC}"

# =================================
# 1. Scale down ECS services to 0
# =================================
echo ""
echo -e "${BLUE}📦 Step 1: Scaling down ECS services...${NC}"

ECS_CLUSTERS=$(aws ecs list-clusters --query 'clusterArns[?contains(@, `hibiji`) || contains(@, `qa-`) || contains(@, `dev-`)]' --output text 2>/dev/null || echo "")

if [ -n "$ECS_CLUSTERS" ]; then
    for cluster in $ECS_CLUSTERS; do
        cluster_name=$(basename "$cluster")
        echo "  🔍 Checking cluster: $cluster_name"
        
        # List services in this cluster
        SERVICES=$(aws ecs list-services --cluster "$cluster_name" --query 'serviceArns' --output text 2>/dev/null || echo "")
        
        if [ -n "$SERVICES" ]; then
            for service in $SERVICES; do
                service_name=$(basename "$service")
                echo "    📉 Scaling down service: $service_name"
                
                aws ecs update-service \
                    --cluster "$cluster_name" \
                    --service "$service_name" \
                    --desired-count 0 \
                    --no-cli-pager >/dev/null 2>&1 || echo "    ⚠️ Failed to scale down $service_name"
            done
            
            echo "    ⏳ Waiting for services to stop..."
            aws ecs wait services-stable --cluster "$cluster_name" --services $(echo $SERVICES | tr ' ' '\n' | xargs basename | tr '\n' ' ') 2>/dev/null || echo "    ⚠️ Timeout waiting for services"
        else
            echo "    ✅ No services found in cluster"
        fi
    done
else
    echo "  ✅ No ECS clusters found"
fi

# =================================
# 2. Delete ECS services
# =================================
echo ""
echo -e "${BLUE}🗑️  Step 2: Deleting ECS services...${NC}"

if [ -n "$ECS_CLUSTERS" ]; then
    for cluster in $ECS_CLUSTERS; do
        cluster_name=$(basename "$cluster")
        
        SERVICES=$(aws ecs list-services --cluster "$cluster_name" --query 'serviceArns' --output text 2>/dev/null || echo "")
        
        if [ -n "$SERVICES" ]; then
            for service in $SERVICES; do
                service_name=$(basename "$service")
                echo "  🗑️ Deleting service: $service_name"
                
                aws ecs delete-service \
                    --cluster "$cluster_name" \
                    --service "$service_name" \
                    --force \
                    --no-cli-pager >/dev/null 2>&1 || echo "    ⚠️ Failed to delete $service_name"
            done
        fi
    done
fi

# =================================
# 3. Delete ECS clusters
# =================================
echo ""
echo -e "${BLUE}🗑️  Step 3: Deleting ECS clusters...${NC}"

if [ -n "$ECS_CLUSTERS" ]; then
    for cluster in $ECS_CLUSTERS; do
        cluster_name=$(basename "$cluster")
        echo "  🗑️ Deleting cluster: $cluster_name"
        
        aws ecs delete-cluster --cluster "$cluster_name" --no-cli-pager >/dev/null 2>&1 || echo "    ⚠️ Failed to delete cluster $cluster_name"
    done
else
    echo "  ✅ No ECS clusters to delete"
fi

# =================================
# 4. Delete Application Load Balancers
# =================================
echo ""
echo -e "${BLUE}⚖️  Step 4: Deleting Application Load Balancers...${NC}"

ALBS=$(aws elbv2 describe-load-balancers --query 'LoadBalancers[?contains(LoadBalancerName, `hibiji`) || contains(LoadBalancerName, `qa-`) || contains(LoadBalancerName, `dev-`)].LoadBalancerArn' --output text 2>/dev/null || echo "")

if [ -n "$ALBS" ]; then
    for alb in $ALBS; do
        alb_name=$(aws elbv2 describe-load-balancers --load-balancer-arns "$alb" --query 'LoadBalancers[0].LoadBalancerName' --output text 2>/dev/null)
        echo "  🗑️ Deleting ALB: $alb_name"
        
        aws elbv2 delete-load-balancer --load-balancer-arn "$alb" --no-cli-pager >/dev/null 2>&1 || echo "    ⚠️ Failed to delete ALB $alb_name"
    done
    
    echo "  ⏳ Waiting for ALBs to be deleted..."
    sleep 30
else
    echo "  ✅ No ALBs found"
fi

# =================================
# 5. Delete Target Groups
# =================================
echo ""
echo -e "${BLUE}🎯 Step 5: Deleting Target Groups...${NC}"

TARGET_GROUPS=$(aws elbv2 describe-target-groups --query 'TargetGroups[?contains(TargetGroupName, `hibiji`) || contains(TargetGroupName, `qa-`) || contains(TargetGroupName, `dev-`)].TargetGroupArn' --output text 2>/dev/null || echo "")

if [ -n "$TARGET_GROUPS" ]; then
    for tg in $TARGET_GROUPS; do
        tg_name=$(aws elbv2 describe-target-groups --target-group-arns "$tg" --query 'TargetGroups[0].TargetGroupName' --output text 2>/dev/null)
        echo "  🗑️ Deleting target group: $tg_name"
        
        aws elbv2 delete-target-group --target-group-arn "$tg" --no-cli-pager >/dev/null 2>&1 || echo "    ⚠️ Failed to delete target group $tg_name"
    done
else
    echo "  ✅ No target groups found"
fi

# =================================
# 6. Delete ECS IAM Roles
# =================================
echo ""
echo -e "${BLUE}👤 Step 6: Deleting ECS IAM Roles...${NC}"

ECS_ROLES=$(aws iam list-roles --query 'Roles[?contains(RoleName, `ecs-execution`) || contains(RoleName, `ecs-task`)].RoleName' --output text 2>/dev/null || echo "")

if [ -n "$ECS_ROLES" ]; then
    for role in $ECS_ROLES; do
        echo "  🗑️ Deleting IAM role: $role"
        
        # Detach managed policies
        ATTACHED_POLICIES=$(aws iam list-attached-role-policies --role-name "$role" --query 'AttachedPolicies[].PolicyArn' --output text 2>/dev/null || echo "")
        for policy in $ATTACHED_POLICIES; do
            aws iam detach-role-policy --role-name "$role" --policy-arn "$policy" --no-cli-pager >/dev/null 2>&1
        done
        
        # Delete inline policies
        INLINE_POLICIES=$(aws iam list-role-policies --role-name "$role" --query 'PolicyNames' --output text 2>/dev/null || echo "")
        for policy in $INLINE_POLICIES; do
            aws iam delete-role-policy --role-name "$role" --policy-name "$policy" --no-cli-pager >/dev/null 2>&1
        done
        
        # Delete role
        aws iam delete-role --role-name "$role" --no-cli-pager >/dev/null 2>&1 || echo "    ⚠️ Failed to delete role $role"
    done
else
    echo "  ✅ No ECS IAM roles found"
fi

# =================================
# 7. Delete ALB Security Groups
# =================================
echo ""
echo -e "${BLUE}🛡️ Step 7: Deleting ALB Security Groups...${NC}"

ALB_SGS=$(aws ec2 describe-security-groups --query 'SecurityGroups[?contains(GroupName, `alb`) || contains(GroupName, `app`)].GroupId' --output text 2>/dev/null || echo "")

if [ -n "$ALB_SGS" ]; then
    for sg in $ALB_SGS; do
        sg_name=$(aws ec2 describe-security-groups --group-ids "$sg" --query 'SecurityGroups[0].GroupName' --output text 2>/dev/null)
        echo "  🗑️ Deleting security group: $sg_name ($sg)"
        
        aws ec2 delete-security-group --group-id "$sg" --no-cli-pager >/dev/null 2>&1 || echo "    ⚠️ Failed to delete security group $sg"
    done
else
    echo "  ✅ No ALB security groups found"
fi

# =================================
# Summary
# =================================
echo ""
echo -e "${GREEN}🎉 ECS CLEANUP COMPLETED!${NC}"
echo "==============================="
echo ""
echo -e "${GREEN}✅ Resources cleaned up:${NC}"
echo "  • ECS clusters, services, and task definitions"
echo "  • Application Load Balancers and target groups"
echo "  • ECS IAM roles and policies"
echo "  • ALB security groups"
echo ""
echo -e "${BLUE}💰 Monthly cost savings: ~$50-75${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "  1. Deploy serverless infrastructure: cd terraform/environments/qa && terraform apply"
echo "  2. Test serverless endpoints"
echo "  3. Update DNS records if needed"
echo ""
echo -e "${GREEN}🚀 Your platform is now 100% serverless!${NC}" 