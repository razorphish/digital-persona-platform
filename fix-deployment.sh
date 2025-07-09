#!/bin/bash
# fix-deployment.sh
# Fix ECS deployment issues

set -e

echo "🔧 Fixing ECS Deployment..."

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

# Step 1: Check if infrastructure exists
print_status "Step 1: Checking infrastructure..."

# Check ECS cluster
CLUSTER_EXISTS=$(aws ecs describe-clusters --clusters hibiji-dev-cluster --region us-west-1 --query 'clusters[0].status' --output text 2>/dev/null || echo "MISSING")

if [ "$CLUSTER_EXISTS" = "ACTIVE" ]; then
    print_success "ECS cluster exists"
else
    print_error "ECS cluster not found. Run Terraform deployment first."
    exit 1
fi

# Check ALB
ALB_EXISTS=$(aws elbv2 describe-load-balancers --region us-west-1 --query 'LoadBalancers[?contains(LoadBalancerName, `hibiji-dev`)].LoadBalancerName' --output text 2>/dev/null || echo "MISSING")

if [ "$ALB_EXISTS" != "MISSING" ] && [ -n "$ALB_EXISTS" ]; then
    print_success "ALB exists: $ALB_EXISTS"
else
    print_error "ALB not found. Run Terraform deployment first."
    exit 1
fi

# Step 2: Force new deployment
print_status "Step 2: Forcing new deployment..."

# Force new deployment for frontend
print_status "Forcing new deployment for frontend..."
aws ecs update-service \
    --cluster hibiji-dev-cluster \
    --service hibiji-dev-frontend \
    --force-new-deployment \
    --region us-west-1

# Force new deployment for backend
print_status "Forcing new deployment for backend..."
aws ecs update-service \
    --cluster hibiji-dev-cluster \
    --service hibiji-dev-backend \
    --force-new-deployment \
    --region us-west-1

print_success "Forced new deployments"

# Step 3: Wait for services with timeout
print_status "Step 3: Waiting for services to stabilize (with timeout)..."

# Wait for frontend with timeout (macOS compatible)
print_status "Waiting for frontend service..."
(
    for i in {1..30}; do
        STATUS=$(aws ecs describe-services --cluster hibiji-dev-cluster --services hibiji-dev-frontend --region us-west-1 --query "services[0].status" --output text 2>/dev/null)
        RUNNING=$(aws ecs describe-services --cluster hibiji-dev-cluster --services hibiji-dev-frontend --region us-west-1 --query "services[0].runningCount" --output text 2>/dev/null)
        
        echo "Frontend status: $STATUS, Running: $RUNNING"
        
        if [ "$STATUS" = "ACTIVE" ] && [ "$RUNNING" -gt 0 ]; then
            echo "Frontend service is stable"
            break
        fi
        
        sleep 10
    done
)

# Wait for backend with timeout (macOS compatible)
print_status "Waiting for backend service..."
(
    for i in {1..30}; do
        STATUS=$(aws ecs describe-services --cluster hibiji-dev-cluster --services hibiji-dev-backend --region us-west-1 --query "services[0].status" --output text 2>/dev/null)
        RUNNING=$(aws ecs describe-services --cluster hibiji-dev-cluster --services hibiji-dev-backend --region us-west-1 --query "services[0].runningCount" --output text 2>/dev/null)
        
        echo "Backend status: $STATUS, Running: $RUNNING"
        
        if [ "$STATUS" = "ACTIVE" ] && [ "$RUNNING" -gt 0 ]; then
            echo "Backend service is stable"
            break
        fi
        
        sleep 10
    done
)

print_success "Services should be stable now"

# Step 4: Get ALB DNS
print_status "Step 4: Getting ALB DNS..."
ALB_DNS=$(aws elbv2 describe-load-balancers --region us-west-1 --query 'LoadBalancers[?contains(LoadBalancerName, `hibiji-dev`)].DNSName' --output text)

if [ -n "$ALB_DNS" ]; then
    print_success "ALB DNS: $ALB_DNS"
    echo ""
    echo "🌐 Application URLs:"
    echo "   Main: http://$ALB_DNS"
    echo "   Health: http://$ALB_DNS/health"
    echo "   API: http://$ALB_DNS/api"
    echo ""
else
    print_error "Could not get ALB DNS"
fi

print_success "Deployment fix completed!" 