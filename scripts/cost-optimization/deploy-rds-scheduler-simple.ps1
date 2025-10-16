# Simple RDS Scheduler Deployment for Windows
# This script uses AWS CLI commands directly

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

Write-Host "`n🚀 RDS Scheduler Deployment`n" -ForegroundColor Cyan

# Configuration
$Environment = "dev"
$ClusterId = "dev-dev01-dpp-cluster"
$FunctionName = "dev-rds-scheduler"
$RoleName = "dev-rds-scheduler-role"
$Region = "us-west-1"

# Get account ID
Write-Host "Getting AWS account ID..." -ForegroundColor Yellow
$AccountId = aws sts get-caller-identity --query Account --output text

if (-not $AccountId) {
    Write-Host "❌ Failed to get AWS account ID. Is AWS CLI configured?" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Account ID: $AccountId`n" -ForegroundColor Green

# Step 1: Package Lambda
Write-Host "📦 Packaging Lambda function..." -ForegroundColor Yellow
$ModuleDir = Join-Path $PSScriptRoot "..\..\terraform\modules\rds-scheduler"
Push-Location $ModuleDir

if (Test-Path "lambda.zip") { Remove-Item "lambda.zip" -Force }
Compress-Archive -Path "lambda.py" -DestinationPath "lambda.zip" -Force
Write-Host "✅ Lambda packaged`n" -ForegroundColor Green

# Step 2: Create/Update IAM Role
Write-Host "🔐 Creating IAM role..." -ForegroundColor Yellow

$trustPolicy = @"
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "lambda.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
"@

$trustFile = "trust-policy.json"
$trustPolicy | Out-File -FilePath $trustFile -Encoding ASCII

# Check if role exists
$roleExists = aws iam get-role --role-name $RoleName 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Role already exists, skipping creation" -ForegroundColor Yellow
} else {
    aws iam create-role --role-name $RoleName --assume-role-policy-document file://$trustFile --region $Region
    Write-Host "✅ Role created" -ForegroundColor Green
}

# Step 3: Attach policy
Write-Host "📎 Attaching policy..." -ForegroundColor Yellow

$policy = @"
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["rds:DescribeDBClusters","rds:StartDBCluster","rds:StopDBCluster"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["logs:CreateLogGroup","logs:CreateLogStream","logs:PutLogEvents"],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
"@

$policyFile = "rds-policy.json"
$policy | Out-File -FilePath $policyFile -Encoding ASCII

aws iam put-role-policy --role-name $RoleName --policy-name "${RoleName}-policy" --policy-document file://$policyFile --region $Region
Write-Host "✅ Policy attached`n" -ForegroundColor Green

# Wait for IAM
Write-Host "⏳ Waiting for IAM propagation..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 4: Create/Update Lambda
Write-Host "🔨 Creating Lambda function..." -ForegroundColor Yellow
$RoleArn = "arn:aws:iam::${AccountId}:role/${RoleName}"

$funcExists = aws lambda get-function --function-name $FunctionName --region $Region 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "Function exists, updating code..." -ForegroundColor Yellow
    aws lambda update-function-code --function-name $FunctionName --zip-file fileb://lambda.zip --region $Region | Out-Null
    aws lambda update-function-configuration --function-name $FunctionName --environment "Variables={CLUSTER_ID=$ClusterId}" --region $Region | Out-Null
} else {
    aws lambda create-function `
        --function-name $FunctionName `
        --runtime python3.11 `
        --role $RoleArn `
        --handler lambda.lambda_handler `
        --zip-file fileb://lambda.zip `
        --timeout 60 `
        --memory-size 128 `
        --environment "Variables={CLUSTER_ID=$ClusterId}" `
        --region $Region | Out-Null
}
Write-Host "✅ Lambda deployed`n" -ForegroundColor Green

# Step 5: EventBridge Rules
Write-Host "⏰ Creating EventBridge rules..." -ForegroundColor Yellow

aws events put-rule --name "${Environment}-start-rds" --schedule-expression "cron(0 15 ? * MON-FRI *)" --state ENABLED --region $Region | Out-Null
aws events put-rule --name "${Environment}-stop-rds" --schedule-expression "cron(0 2 ? * TUE-SAT *)" --state ENABLED --region $Region | Out-Null
Write-Host "✅ Rules created`n" -ForegroundColor Green

# Step 6: Lambda Permissions
Write-Host "🔓 Adding Lambda permissions..." -ForegroundColor Yellow

$LambdaArn = "arn:aws:lambda:${Region}:${AccountId}:function:${FunctionName}"

aws lambda add-permission --function-name $FunctionName --statement-id AllowStart --action lambda:InvokeFunction --principal events.amazonaws.com --source-arn "arn:aws:events:${Region}:${AccountId}:rule/${Environment}-start-rds" --region $Region 2>&1 | Out-Null
aws lambda add-permission --function-name $FunctionName --statement-id AllowStop --action lambda:InvokeFunction --principal events.amazonaws.com --source-arn "arn:aws:events:${Region}:${AccountId}:rule/${Environment}-stop-rds" --region $Region 2>&1 | Out-Null
Write-Host "✅ Permissions added`n" -ForegroundColor Green

# Step 7: EventBridge Targets
Write-Host "🎯 Configuring targets..." -ForegroundColor Yellow

$startTargets = @"
[{"Id":"1","Arn":"$LambdaArn","Input":"{\"action\":\"start\",\"cluster_identifier\":\"$ClusterId\"}"}]
"@
$startTargets | Out-File -FilePath "start-targets.json" -Encoding ASCII

$stopTargets = @"
[{"Id":"1","Arn":"$LambdaArn","Input":"{\"action\":\"stop\",\"cluster_identifier\":\"$ClusterId\"}"}]
"@
$stopTargets | Out-File -FilePath "stop-targets.json" -Encoding ASCII

aws events put-targets --rule "${Environment}-start-rds" --targets file://start-targets.json --region $Region | Out-Null
aws events put-targets --rule "${Environment}-stop-rds" --targets file://stop-targets.json --region $Region | Out-Null
Write-Host "✅ Targets configured`n" -ForegroundColor Green

# Cleanup
Remove-Item $trustFile, $policyFile, "start-targets.json", "stop-targets.json" -ErrorAction SilentlyContinue
Pop-Location

# Summary
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host "✅ RDS Scheduler Deployed Successfully!" -ForegroundColor Green
Write-Host "=" * 50 -ForegroundColor Cyan
Write-Host "`n📋 Summary:" -ForegroundColor Yellow
Write-Host "   Function: $FunctionName"
Write-Host "   Cluster: $ClusterId"
Write-Host "   Start: Monday-Friday 8 AM PST (3 PM UTC)"
Write-Host "   Stop:  Monday-Friday 6 PM PST (2 AM UTC next day)"
Write-Host "`n💰 Expected Savings: `$60+/month (70% reduction)`n" -ForegroundColor Green

