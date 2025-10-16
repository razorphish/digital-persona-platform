#!/bin/bash
# Manual RDS Scheduler Deployment
# Use this when Terraform deployment fails due to IAM permission constraints
# This script uses AWS CLI to deploy the RDS scheduler without requiring full IAM permissions

set -e

echo "🚀 Manual RDS Scheduler Deployment"
echo "====================================="
echo ""

# Configuration
ENVIRONMENT="${1:-dev}"
CLUSTER_ID="${2:-dev-dev01-dpp-cluster}"
START_SCHEDULE="${3:-cron(0 15 ? * MON-FRI *)}"  # 8 AM PST = 3 PM UTC
STOP_SCHEDULE="${4:-cron(0 2 ? * TUE-SAT *)}"    # 6 PM PST next day = 2 AM UTC
AWS_REGION="${AWS_REGION:-us-west-1}"

echo "📋 Configuration:"
echo "   Environment: $ENVIRONMENT"
echo "   Cluster ID: $CLUSTER_ID"
echo "   Start Schedule: $START_SCHEDULE"
echo "   Stop Schedule: $STOP_SCHEDULE"
echo "   AWS Region: $AWS_REGION"
echo ""

# Prompt for confirmation
read -p "Continue with deployment? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODULE_DIR="$SCRIPT_DIR/../../terraform/modules/rds-scheduler"

# Step 1: Package Lambda function
echo ""
echo "📦 Step 1: Packaging Lambda function..."
cd "$MODULE_DIR"
if [ -f "lambda.zip" ]; then
    rm lambda.zip
fi

# Try multiple methods to create zip file (Windows compatibility)
if command -v zip &> /dev/null; then
    # Method 1: Use zip command (Linux/Mac)
    zip -q lambda.zip lambda.py
elif command -v powershell.exe &> /dev/null; then
    # Method 2: Use PowerShell (Windows)
    powershell.exe -Command "Compress-Archive -Path 'lambda.py' -DestinationPath 'lambda.zip' -Force"
elif command -v python &> /dev/null; then
    # Method 3: Use Python (cross-platform)
    python -c "import zipfile; z = zipfile.ZipFile('lambda.zip', 'w'); z.write('lambda.py'); z.close()"
else
    echo "❌ Error: No zip utility found (zip, powershell, or python required)"
    exit 1
fi

echo "✅ Lambda package created"

# Step 2: Create IAM role (requires permissions)
echo ""
echo "🔐 Step 2: Creating IAM role..."
ROLE_NAME="${ENVIRONMENT}-rds-scheduler-role"

# Check if role exists
if aws iam get-role --role-name "$ROLE_NAME" --region "$AWS_REGION" 2>/dev/null; then
    echo "⚠️  Role $ROLE_NAME already exists, skipping creation"
else
    # Create trust policy
    TRUST_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Service": "lambda.amazonaws.com"
    },
    "Action": "sts:AssumeRole"
  }]
}
EOF
)
    
    echo "Creating IAM role: $ROLE_NAME"
    aws iam create-role \
        --role-name "$ROLE_NAME" \
        --assume-role-policy-document "$TRUST_POLICY" \
        --description "RDS Scheduler Lambda role for $ENVIRONMENT" \
        --region "$AWS_REGION" \
        --no-cli-pager
    
    echo "✅ IAM role created"
fi

# Step 3: Attach policies
echo ""
echo "📎 Step 3: Attaching policies..."

# Create inline policy
POLICY_DOC=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds:DescribeDBClusters",
        "rds:StartDBCluster",
        "rds:StopDBCluster"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
EOF
)

POLICY_NAME="${ENVIRONMENT}-rds-scheduler-policy"
aws iam put-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-name "$POLICY_NAME" \
    --policy-document "$POLICY_DOC" \
    --region "$AWS_REGION" \
    --no-cli-pager

echo "✅ Policy attached"

# Wait for role to propagate
echo "⏳ Waiting for IAM role to propagate (10 seconds)..."
sleep 10

# Step 4: Create Lambda function
echo ""
echo "🔨 Step 4: Creating Lambda function..."
FUNCTION_NAME="${ENVIRONMENT}-rds-scheduler"

# Get account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${ROLE_NAME}"

# Check if function exists
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$AWS_REGION" 2>/dev/null; then
    echo "⚠️  Lambda function $FUNCTION_NAME already exists, updating code..."
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file "fileb://lambda.zip" \
        --region "$AWS_REGION" \
        --no-cli-pager > /dev/null
    
    aws lambda update-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --environment "Variables={CLUSTER_ID=$CLUSTER_ID}" \
        --region "$AWS_REGION" \
        --no-cli-pager > /dev/null
    
    echo "✅ Lambda function updated"
else
    aws lambda create-function \
        --function-name "$FUNCTION_NAME" \
        --runtime python3.11 \
        --role "$ROLE_ARN" \
        --handler lambda.lambda_handler \
        --zip-file "fileb://lambda.zip" \
        --timeout 60 \
        --memory-size 128 \
        --environment "Variables={CLUSTER_ID=$CLUSTER_ID}" \
        --description "Automated RDS cluster start/stop scheduler for cost optimization" \
        --region "$AWS_REGION" \
        --no-cli-pager > /dev/null
    
    echo "✅ Lambda function created"
fi

# Step 5: Create CloudWatch Log Group
echo ""
echo "📊 Step 5: Creating CloudWatch log group..."
LOG_GROUP="/aws/lambda/$FUNCTION_NAME"
if aws logs describe-log-groups --log-group-name-prefix "$LOG_GROUP" --region "$AWS_REGION" 2>/dev/null | grep -q "$LOG_GROUP"; then
    echo "⚠️  Log group already exists"
else
    aws logs create-log-group \
        --log-group-name "$LOG_GROUP" \
        --region "$AWS_REGION" \
        --no-cli-pager
    
    aws logs put-retention-policy \
        --log-group-name "$LOG_GROUP" \
        --retention-in-days 7 \
        --region "$AWS_REGION" \
        --no-cli-pager
    
    echo "✅ Log group created"
fi

# Step 6: Create EventBridge rules
echo ""
echo "⏰ Step 6: Creating EventBridge schedules..."

# Start rule
START_RULE_NAME="${ENVIRONMENT}-start-rds"
if aws events describe-rule --name "$START_RULE_NAME" --region "$AWS_REGION" 2>/dev/null; then
    echo "⚠️  Start rule already exists, updating..."
    aws events put-rule \
        --name "$START_RULE_NAME" \
        --schedule-expression "$START_SCHEDULE" \
        --state ENABLED \
        --description "Start RDS cluster on schedule" \
        --region "$AWS_REGION" \
        --no-cli-pager > /dev/null
else
    aws events put-rule \
        --name "$START_RULE_NAME" \
        --schedule-expression "$START_SCHEDULE" \
        --state ENABLED \
        --description "Start RDS cluster on schedule" \
        --region "$AWS_REGION" \
        --no-cli-pager > /dev/null
fi
echo "✅ Start schedule created: $START_SCHEDULE"

# Stop rule
STOP_RULE_NAME="${ENVIRONMENT}-stop-rds"
if aws events describe-rule --name "$STOP_RULE_NAME" --region "$AWS_REGION" 2>/dev/null; then
    echo "⚠️  Stop rule already exists, updating..."
    aws events put-rule \
        --name "$STOP_RULE_NAME" \
        --schedule-expression "$STOP_SCHEDULE" \
        --state ENABLED \
        --description "Stop RDS cluster on schedule" \
        --region "$AWS_REGION" \
        --no-cli-pager > /dev/null
else
    aws events put-rule \
        --name "$STOP_RULE_NAME" \
        --schedule-expression "$STOP_SCHEDULE" \
        --state ENABLED \
        --description "Stop RDS cluster on schedule" \
        --region "$AWS_REGION" \
        --no-cli-pager > /dev/null
fi
echo "✅ Stop schedule created: $STOP_SCHEDULE"

# Step 7: Add Lambda permissions
echo ""
echo "🔓 Step 7: Adding Lambda permissions..."

LAMBDA_ARN="arn:aws:lambda:${AWS_REGION}:${ACCOUNT_ID}:function:${FUNCTION_NAME}"
START_RULE_ARN="arn:aws:events:${AWS_REGION}:${ACCOUNT_ID}:rule/${START_RULE_NAME}"
STOP_RULE_ARN="arn:aws:events:${AWS_REGION}:${ACCOUNT_ID}:rule/${STOP_RULE_NAME}"

# Add permission for start rule
aws lambda add-permission \
    --function-name "$FUNCTION_NAME" \
    --statement-id "AllowEventBridgeStart" \
    --action "lambda:InvokeFunction" \
    --principal events.amazonaws.com \
    --source-arn "$START_RULE_ARN" \
    --region "$AWS_REGION" \
    --no-cli-pager 2>/dev/null || echo "⚠️  Permission already exists for start rule"

# Add permission for stop rule
aws lambda add-permission \
    --function-name "$FUNCTION_NAME" \
    --statement-id "AllowEventBridgeStop" \
    --action "lambda:InvokeFunction" \
    --principal events.amazonaws.com \
    --source-arn "$STOP_RULE_ARN" \
    --region "$AWS_REGION" \
    --no-cli-pager 2>/dev/null || echo "⚠️  Permission already exists for stop rule"

echo "✅ Permissions configured"

# Step 8: Add EventBridge targets
echo ""
echo "🎯 Step 8: Configuring EventBridge targets..."

# Start target
START_INPUT=$(cat <<EOF
{
  "action": "start",
  "cluster_identifier": "$CLUSTER_ID"
}
EOF
)

aws events put-targets \
    --rule "$START_RULE_NAME" \
    --targets "Id=StartRDS,Arn=$LAMBDA_ARN,Input='$START_INPUT'" \
    --region "$AWS_REGION" \
    --no-cli-pager > /dev/null

echo "✅ Start target configured"

# Stop target
STOP_INPUT=$(cat <<EOF
{
  "action": "stop",
  "cluster_identifier": "$CLUSTER_ID"
}
EOF
)

aws events put-targets \
    --rule "$STOP_RULE_NAME" \
    --targets "Id=StopRDS,Arn=$LAMBDA_ARN,Input='$STOP_INPUT'" \
    --region "$AWS_REGION" \
    --no-cli-pager > /dev/null

echo "✅ Stop target configured"

# Step 9: Test Lambda function
echo ""
echo "🧪 Step 9: Testing Lambda function..."
echo "Testing with describe action (won't start/stop RDS)..."

TEST_EVENT=$(cat <<EOF
{
  "action": "describe",
  "cluster_identifier": "$CLUSTER_ID"
}
EOF
)

TEST_RESULT=$(aws lambda invoke \
    --function-name "$FUNCTION_NAME" \
    --payload "$TEST_EVENT" \
    --region "$AWS_REGION" \
    --no-cli-pager \
    /dev/stdout 2>/dev/null | head -1)

echo "Test result: $TEST_RESULT"

# Summary
echo ""
echo "====================================="
echo "✅ RDS Scheduler Deployed Successfully!"
echo "====================================="
echo ""
echo "📋 Summary:"
echo "   Function: $FUNCTION_NAME"
echo "   Cluster: $CLUSTER_ID"
echo "   Start: $START_SCHEDULE (UTC)"
echo "   Stop: $STOP_SCHEDULE (UTC)"
echo ""
echo "🔍 Monitoring:"
echo "   CloudWatch Logs: $LOG_GROUP"
echo "   AWS Console: https://console.aws.amazon.com/lambda/home?region=$AWS_REGION#/functions/$FUNCTION_NAME"
echo ""
echo "💡 Manual Control:"
echo "   Start RDS: aws rds start-db-cluster --db-cluster-identifier $CLUSTER_ID"
echo "   Stop RDS:  aws rds stop-db-cluster --db-cluster-identifier $CLUSTER_ID"
echo "   Status:    aws rds describe-db-clusters --db-cluster-identifier $CLUSTER_ID --query 'DBClusters[0].Status'"
echo ""
echo "📝 Note: This deployment is independent of Terraform."
echo "   To manage via Terraform in the future, ensure IAM permissions are granted"
echo "   as documented in IAM_PERMISSION_REQUEST.md"
echo ""

