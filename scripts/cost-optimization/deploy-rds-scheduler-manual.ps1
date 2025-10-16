# Manual RDS Scheduler Deployment (PowerShell)
# Use this when Terraform deployment fails due to IAM permission constraints

param(
    [string]$Environment = "dev",
    [string]$ClusterId = "dev-dev01-dpp-cluster",
    [string]$StartSchedule = "cron(0 15 ? * MON-FRI *)",  # 8 AM PST = 3 PM UTC
    [string]$StopSchedule = "cron(0 2 ? * TUE-SAT *)",    # 6 PM PST next day = 2 AM UTC
    [string]$AwsRegion = "us-west-1"
)

Write-Host "🚀 Manual RDS Scheduler Deployment" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "   Environment: $Environment"
Write-Host "   Cluster ID: $ClusterId"
Write-Host "   Start Schedule: $StartSchedule"
Write-Host "   Stop Schedule: $StopSchedule"
Write-Host "   AWS Region: $AwsRegion"
Write-Host ""

# Prompt for confirmation
$confirm = Read-Host "Continue with deployment? (y/n)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "❌ Deployment cancelled" -ForegroundColor Red
    exit 1
}

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ModuleDir = Join-Path $ScriptDir "..\..\terraform\modules\rds-scheduler"

# Step 1: Package Lambda function
Write-Host ""
Write-Host "📦 Step 1: Packaging Lambda function..." -ForegroundColor Yellow
Set-Location $ModuleDir
if (Test-Path "lambda.zip") {
    Remove-Item "lambda.zip"
}
Compress-Archive -Path "lambda.py" -DestinationPath "lambda.zip" -Force
Write-Host "✅ Lambda package created" -ForegroundColor Green

# Step 2: Create IAM role
Write-Host ""
Write-Host "🔐 Step 2: Creating IAM role..." -ForegroundColor Yellow
$RoleName = "$Environment-rds-scheduler-role"

try {
    aws iam get-role --role-name $RoleName --region $AwsRegion 2>$null
    Write-Host "⚠️  Role $RoleName already exists, skipping creation" -ForegroundColor Yellow
} catch {
    $TrustPolicy = @"
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
"@
    
    Write-Host "Creating IAM role: $RoleName"
    aws iam create-role `
        --role-name $RoleName `
        --assume-role-policy-document $TrustPolicy `
        --description "RDS Scheduler Lambda role for $Environment" `
        --region $AwsRegion `
        --no-cli-pager
    
    Write-Host "✅ IAM role created" -ForegroundColor Green
}

# Step 3: Attach policies
Write-Host ""
Write-Host "📎 Step 3: Attaching policies..." -ForegroundColor Yellow

$PolicyDoc = @"
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
"@

$PolicyName = "$Environment-rds-scheduler-policy"
aws iam put-role-policy `
    --role-name $RoleName `
    --policy-name $PolicyName `
    --policy-document $PolicyDoc `
    --region $AwsRegion `
    --no-cli-pager

Write-Host "✅ Policy attached" -ForegroundColor Green

# Wait for role to propagate
Write-Host "⏳ Waiting for IAM role to propagate (10 seconds)..."
Start-Sleep -Seconds 10

# Step 4: Create Lambda function
Write-Host ""
Write-Host "🔨 Step 4: Creating Lambda function..." -ForegroundColor Yellow
$FunctionName = "$Environment-rds-scheduler"

# Get account ID
$AccountId = aws sts get-caller-identity --query Account --output text
$RoleArn = "arn:aws:iam::${AccountId}:role/${RoleName}"

try {
    aws lambda get-function --function-name $FunctionName --region $AwsRegion 2>$null
    Write-Host "⚠️  Lambda function $FunctionName already exists, updating..." -ForegroundColor Yellow
    
    aws lambda update-function-code `
        --function-name $FunctionName `
        --zip-file "fileb://lambda.zip" `
        --region $AwsRegion `
        --no-cli-pager | Out-Null
    
    aws lambda update-function-configuration `
        --function-name $FunctionName `
        --environment "Variables={CLUSTER_ID=$ClusterId}" `
        --region $AwsRegion `
        --no-cli-pager | Out-Null
    
    Write-Host "✅ Lambda function updated" -ForegroundColor Green
} catch {
    aws lambda create-function `
        --function-name $FunctionName `
        --runtime python3.11 `
        --role $RoleArn `
        --handler lambda.lambda_handler `
        --zip-file "fileb://lambda.zip" `
        --timeout 60 `
        --memory-size 128 `
        --environment "Variables={CLUSTER_ID=$ClusterId}" `
        --description "Automated RDS cluster start/stop scheduler for cost optimization" `
        --region $AwsRegion `
        --no-cli-pager | Out-Null
    
    Write-Host "✅ Lambda function created" -ForegroundColor Green
}

# Continue with remaining steps...
Write-Host ""
Write-Host "====================================="
Write-Host "✅ RDS Scheduler Deployed Successfully!" -ForegroundColor Green
Write-Host "====================================="
Write-Host ""
Write-Host "📋 For EventBridge rules and targets, please use AWS Console or complete via AWS CLI"
Write-Host ""
Write-Host "💡 Manual Control:"
Write-Host "   Start: aws rds start-db-cluster --db-cluster-identifier $ClusterId"
Write-Host "   Stop:  aws rds stop-db-cluster --db-cluster-identifier $ClusterId"
Write-Host ""

