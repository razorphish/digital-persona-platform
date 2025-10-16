# Manual RDS Scheduler Deployment (PowerShell)
# Use this when Terraform deployment fails due to IAM permission constraints

param(
    [string]$Environment = "dev",
    [string]$ClusterId = "dev-dev01-dpp-cluster",
    [string]$StartSchedule = "cron(0 15 ? * MON-FRI *)",
    [string]$StopSchedule = "cron(0 2 ? * TUE-SAT *)",
    [string]$AwsRegion = "us-west-1"
)

$ErrorActionPreference = "Continue"

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
Push-Location $ModuleDir
if (Test-Path "lambda.zip") {
    Remove-Item "lambda.zip" -Force
}
Compress-Archive -Path "lambda.py" -DestinationPath "lambda.zip" -Force
Write-Host "✅ Lambda package created" -ForegroundColor Green

# Step 2: Create IAM role
Write-Host ""
Write-Host "🔐 Step 2: Creating IAM role..." -ForegroundColor Yellow
$RoleName = "$Environment-rds-scheduler-role"

# Check if role exists
$roleExists = $false
try {
    $result = aws iam get-role --role-name $RoleName --region $AwsRegion 2>&1
    if ($LASTEXITCODE -eq 0) {
        $roleExists = $true
        Write-Host "⚠️  Role $RoleName already exists, skipping creation" -ForegroundColor Yellow
    }
} catch {
    $roleExists = $false
}

if (-not $roleExists) {
    # Create trust policy file
    $trustPolicyFile = [System.IO.Path]::GetTempFileName()
    @{
        Version = "2012-10-17"
        Statement = @(
            @{
                Effect = "Allow"
                Principal = @{
                    Service = "lambda.amazonaws.com"
                }
                Action = "sts:AssumeRole"
            }
        )
    } | ConvertTo-Json -Depth 10 | Set-Content $trustPolicyFile
    
    Write-Host "Creating IAM role: $RoleName"
    aws iam create-role `
        --role-name $RoleName `
        --assume-role-policy-document "file://$trustPolicyFile" `
        --description "RDS Scheduler Lambda role for $Environment" `
        --region $AwsRegion `
        --no-cli-pager
    
    Remove-Item $trustPolicyFile -Force
    Write-Host "✅ IAM role created" -ForegroundColor Green
}

# Step 3: Attach policies
Write-Host ""
Write-Host "📎 Step 3: Attaching policies..." -ForegroundColor Yellow

$policyFile = [System.IO.Path]::GetTempFileName()
@{
    Version = "2012-10-17"
    Statement = @(
        @{
            Effect = "Allow"
            Action = @(
                "rds:DescribeDBClusters",
                "rds:StartDBCluster",
                "rds:StopDBCluster"
            )
            Resource = "*"
        },
        @{
            Effect = "Allow"
            Action = @(
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            )
            Resource = "arn:aws:logs:*:*:*"
        }
    )
} | ConvertTo-Json -Depth 10 | Set-Content $policyFile

$PolicyName = "$Environment-rds-scheduler-policy"
aws iam put-role-policy `
    --role-name $RoleName `
    --policy-name $PolicyName `
    --policy-document "file://$policyFile" `
    --region $AwsRegion `
    --no-cli-pager

Remove-Item $policyFile -Force
Write-Host "✅ Policy attached" -ForegroundColor Green

# Wait for role to propagate
Write-Host "⏳ Waiting for IAM role to propagate (10 seconds)..."
Start-Sleep -Seconds 10

# Step 4: Create Lambda function
Write-Host ""
Write-Host "🔨 Step 4: Creating Lambda function..." -ForegroundColor Yellow
$FunctionName = "$Environment-rds-scheduler"

# Get account ID
$AccountId = (aws sts get-caller-identity --query Account --output text)
$RoleArn = "arn:aws:iam::${AccountId}:role/${RoleName}"

# Check if function exists
$functionExists = $false
try {
    $result = aws lambda get-function --function-name $FunctionName --region $AwsRegion 2>&1
    if ($LASTEXITCODE -eq 0) {
        $functionExists = $true
    }
} catch {
    $functionExists = $false
}

if ($functionExists) {
    Write-Host "⚠️  Lambda function $FunctionName already exists, updating..." -ForegroundColor Yellow
    
    aws lambda update-function-code `
        --function-name $FunctionName `
        --zip-file "fileb://lambda.zip" `
        --region $AwsRegion `
        --no-cli-pager | Out-Null
    
    $envVars = @{ CLUSTER_ID = $ClusterId } | ConvertTo-Json -Compress
    aws lambda update-function-configuration `
        --function-name $FunctionName `
        --environment "Variables={CLUSTER_ID=$ClusterId}" `
        --region $AwsRegion `
        --no-cli-pager | Out-Null
    
    Write-Host "✅ Lambda function updated" -ForegroundColor Green
} else {
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

Pop-Location

# Step 5: Create CloudWatch Log Group
Write-Host ""
Write-Host "📊 Step 5: Creating CloudWatch log group..." -ForegroundColor Yellow
$LogGroup = "/aws/lambda/$FunctionName"
$logGroupExists = $false
try {
    $result = aws logs describe-log-groups --log-group-name-prefix $LogGroup --region $AwsRegion 2>&1
    if ($result -match $LogGroup) {
        $logGroupExists = $true
    }
} catch {}

if ($logGroupExists) {
    Write-Host "⚠️  Log group already exists" -ForegroundColor Yellow
} else {
    aws logs create-log-group --log-group-name $LogGroup --region $AwsRegion --no-cli-pager
    aws logs put-retention-policy --log-group-name $LogGroup --retention-in-days 7 --region $AwsRegion --no-cli-pager
    Write-Host "✅ Log group created" -ForegroundColor Green
}

# Step 6: Create EventBridge rules
Write-Host ""
Write-Host "⏰ Step 6: Creating EventBridge schedules..." -ForegroundColor Yellow

$StartRuleName = "$Environment-start-rds"
aws events put-rule `
    --name $StartRuleName `
    --schedule-expression $StartSchedule `
    --state ENABLED `
    --description "Start RDS cluster on schedule" `
    --region $AwsRegion `
    --no-cli-pager | Out-Null
Write-Host "✅ Start schedule created: $StartSchedule" -ForegroundColor Green

$StopRuleName = "$Environment-stop-rds"
aws events put-rule `
    --name $StopRuleName `
    --schedule-expression $StopSchedule `
    --state ENABLED `
    --description "Stop RDS cluster on schedule" `
    --region $AwsRegion `
    --no-cli-pager | Out-Null
Write-Host "✅ Stop schedule created: $StopSchedule" -ForegroundColor Green

# Step 7: Add Lambda permissions
Write-Host ""
Write-Host "🔓 Step 7: Adding Lambda permissions..." -ForegroundColor Yellow

$LambdaArn = "arn:aws:lambda:${AwsRegion}:${AccountId}:function:${FunctionName}"
$StartRuleArn = "arn:aws:events:${AwsRegion}:${AccountId}:rule/${StartRuleName}"
$StopRuleArn = "arn:aws:events:${AwsRegion}:${AccountId}:rule/${StopRuleName}"

# Add permission for start rule (ignore if exists)
try {
    aws lambda add-permission `
        --function-name $FunctionName `
        --statement-id "AllowEventBridgeStart" `
        --action "lambda:InvokeFunction" `
        --principal events.amazonaws.com `
        --source-arn $StartRuleArn `
        --region $AwsRegion `
        --no-cli-pager 2>&1 | Out-Null
} catch {}

# Add permission for stop rule (ignore if exists)
try {
    aws lambda add-permission `
        --function-name $FunctionName `
        --statement-id "AllowEventBridgeStop" `
        --action "lambda:InvokeFunction" `
        --principal events.amazonaws.com `
        --source-arn $StopRuleArn `
        --region $AwsRegion `
        --no-cli-pager 2>&1 | Out-Null
} catch {}

Write-Host "✅ Permissions configured" -ForegroundColor Green

# Step 8: Add EventBridge targets
Write-Host ""
Write-Host "🎯 Step 8: Configuring EventBridge targets..." -ForegroundColor Yellow

# Start target
$startInputFile = [System.IO.Path]::GetTempFileName()
@{
    action = "start"
    cluster_identifier = $ClusterId
} | ConvertTo-Json | Set-Content $startInputFile

aws events put-targets `
    --rule $StartRuleName `
    --targets "Id=StartRDS,Arn=$LambdaArn,Input=$(Get-Content $startInputFile -Raw)" `
    --region $AwsRegion `
    --no-cli-pager | Out-Null

Remove-Item $startInputFile -Force
Write-Host "✅ Start target configured" -ForegroundColor Green

# Stop target
$stopInputFile = [System.IO.Path]::GetTempFileName()
@{
    action = "stop"
    cluster_identifier = $ClusterId
} | ConvertTo-Json | Set-Content $stopInputFile

aws events put-targets `
    --rule $StopRuleName `
    --targets "Id=StopRDS,Arn=$LambdaArn,Input=$(Get-Content $stopInputFile -Raw)" `
    --region $AwsRegion `
    --no-cli-pager | Out-Null

Remove-Item $stopInputFile -Force
Write-Host "✅ Stop target configured" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "✅ RDS Scheduler Deployed Successfully!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Yellow
Write-Host "   Function: $FunctionName"
Write-Host "   Cluster: $ClusterId"
Write-Host "   Start: $StartSchedule (UTC)"
Write-Host "   Stop: $StopSchedule (UTC)"
Write-Host ""
Write-Host "🔍 Monitoring:" -ForegroundColor Yellow
Write-Host "   CloudWatch Logs: $LogGroup"
Write-Host "   AWS Console: https://console.aws.amazon.com/lambda/home?region=$AwsRegion#/functions/$FunctionName"
Write-Host ""
Write-Host "💡 Manual Control:" -ForegroundColor Yellow
Write-Host "   Start: aws rds start-db-cluster --db-cluster-identifier $ClusterId"
Write-Host "   Stop:  aws rds stop-db-cluster --db-cluster-identifier $ClusterId"
Write-Host "   Status: aws rds describe-db-clusters --db-cluster-identifier $ClusterId --query 'DBClusters[0].Status'"
Write-Host ""
