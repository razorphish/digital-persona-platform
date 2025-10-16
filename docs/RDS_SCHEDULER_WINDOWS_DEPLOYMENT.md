# RDS Scheduler - Windows Deployment Guide

## Quick Deployment for Windows

Since the PowerShell script has complexity issues, here's a simple step-by-step approach using AWS CLI directly.

### Prerequisites

- AWS CLI installed
- Configured AWS credentials
- PowerShell or Command Prompt

### Step-by-Step Deployment

#### 1. Package the Lambda Function

```powershell
cd terraform\modules\rds-scheduler
Compress-Archive -Path "lambda.py" -DestinationPath "lambda.zip" -Force
```

#### 2. Create IAM Role

```powershell
# Create trust policy file
$trustPolicy = @"
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

$trustPolicy | Out-File -FilePath "trust-policy.json" -Encoding ASCII

# Create the role
aws iam create-role `
  --role-name dev-rds-scheduler-role `
  --assume-role-policy-document file://trust-policy.json `
  --description "RDS Scheduler Lambda role" `
  --region us-west-1
```

#### 3. Attach Policy to Role

```powershell
# Create policy document
$policyDoc = @"
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

$policyDoc | Out-File -FilePath "rds-policy.json" -Encoding ASCII

# Attach policy
aws iam put-role-policy `
  --role-name dev-rds-scheduler-role `
  --policy-name dev-rds-scheduler-policy `
  --policy-document file://rds-policy.json `
  --region us-west-1
```

#### 4. Wait for IAM Propagation

```powershell
Write-Host "Waiting for IAM role to propagate..."
Start-Sleep -Seconds 10
```

#### 5. Create Lambda Function

```powershell
# Get your AWS account ID
$accountId = aws sts get-caller-identity --query Account --output text

# Create Lambda function
aws lambda create-function `
  --function-name dev-rds-scheduler `
  --runtime python3.11 `
  --role "arn:aws:iam::${accountId}:role/dev-rds-scheduler-role" `
  --handler lambda.lambda_handler `
  --zip-file fileb://lambda.zip `
  --timeout 60 `
  --memory-size 128 `
  --environment "Variables={CLUSTER_ID=dev-dev01-dpp-cluster}" `
  --description "Automated RDS scheduler for cost optimization" `
  --region us-west-1
```

#### 6. Create CloudWatch Log Group

```powershell
aws logs create-log-group `
  --log-group-name "/aws/lambda/dev-rds-scheduler" `
  --region us-west-1

aws logs put-retention-policy `
  --log-group-name "/aws/lambda/dev-rds-scheduler" `
  --retention-in-days 7 `
  --region us-west-1
```

#### 7. Create EventBridge Start Rule

```powershell
aws events put-rule `
  --name dev-start-rds `
  --schedule-expression "cron(0 15 ? * MON-FRI *)" `
  --state ENABLED `
  --description "Start RDS cluster Monday-Friday 8 AM PST" `
  --region us-west-1
```

#### 8. Create EventBridge Stop Rule

```powershell
aws events put-rule `
  --name dev-stop-rds `
  --schedule-expression "cron(0 2 ? * TUE-SAT *)" `
  --state ENABLED `
  --description "Stop RDS cluster Monday-Friday 6 PM PST" `
  --region us-west-1
```

#### 9. Add Lambda Permissions

```powershell
# Permission for start rule
aws lambda add-permission `
  --function-name dev-rds-scheduler `
  --statement-id AllowEventBridgeStart `
  --action lambda:InvokeFunction `
  --principal events.amazonaws.com `
  --source-arn "arn:aws:events:us-west-1:${accountId}:rule/dev-start-rds" `
  --region us-west-1

# Permission for stop rule
aws lambda add-permission `
  --function-name dev-rds-scheduler `
  --statement-id AllowEventBridgeStop `
  --action lambda:InvokeFunction `
  --principal events.amazonaws.com `
  --source-arn "arn:aws:events:us-west-1:${accountId}:rule/dev-stop-rds" `
  --region us-west-1
```

#### 10. Configure EventBridge Targets

```powershell
# Create input file for start action
$startInput = @"
{
  "action": "start",
  "cluster_identifier": "dev-dev01-dpp-cluster"
}
"@
$startInput | Out-File -FilePath "start-input.json" -Encoding ASCII

# Add start target
aws events put-targets `
  --rule dev-start-rds `
  --targets file://start-input-target.json `
  --region us-west-1
```

Create `start-input-target.json`:
```json
[
  {
    "Id": "StartRDS",
    "Arn": "arn:aws:lambda:us-west-1:YOUR_ACCOUNT_ID:function:dev-rds-scheduler",
    "Input": "{\"action\":\"start\",\"cluster_identifier\":\"dev-dev01-dpp-cluster\"}"
  }
]
```

```powershell
# Create input file for stop action
$stopInput = @"
[
  {
    "Id": "StopRDS",
    "Arn": "arn:aws:lambda:us-west-1:YOUR_ACCOUNT_ID:function:dev-rds-scheduler",
    "Input": "{\"action\":\"stop\",\"cluster_identifier\":\"dev-dev01-dpp-cluster\"}"
  }
]
"@
$stopInput | Out-File -FilePath "stop-input-target.json" -Encoding ASCII

# Add stop target
aws events put-targets `
  --rule dev-stop-rds `
  --targets file://stop-input-target.json `
  --region us-west-1
```

#### 11. Test the Lambda Function

```powershell
# Create test event
$testEvent = @"
{
  "action": "describe",
  "cluster_identifier": "dev-dev01-dpp-cluster"
}
"@
$testEvent | Out-File -FilePath "test-event.json" -Encoding ASCII

# Invoke function
aws lambda invoke `
  --function-name dev-rds-scheduler `
  --payload file://test-event.json `
  --region us-west-1 `
  response.json

# View response
Get-Content response.json
```

#### 12. Cleanup Temp Files

```powershell
Remove-Item trust-policy.json, rds-policy.json, start-input.json, stop-input-target.json, start-input-target.json, test-event.json, response.json -ErrorAction SilentlyContinue
```

### Verification

```powershell
# Check Lambda function
aws lambda get-function --function-name dev-rds-scheduler --region us-west-1

# Check EventBridge rules
aws events list-rules --name-prefix dev- --region us-west-1

# Check targets
aws events list-targets-by-rule --rule dev-start-rds --region us-west-1
aws events list-targets-by-rule --rule dev-stop-rds --region us-west-1
```

### Manual Control

```powershell
# Start RDS manually
aws rds start-db-cluster --db-cluster-identifier dev-dev01-dpp-cluster --region us-west-1

# Stop RDS manually
aws rds stop-db-cluster --db-cluster-identifier dev-dev01-dpp-cluster --region us-west-1

# Check status
aws rds describe-db-clusters `
  --db-cluster-identifier dev-dev01-dpp-cluster `
  --query "DBClusters[0].Status" `
  --region us-west-1 `
  --output text
```

### Alternative: Use Git Bash or WSL

If you have Git Bash or WSL installed, you can use the simpler bash script:

```bash
./scripts/cost-optimization/deploy-rds-scheduler-manual.sh
```

---

## Troubleshooting

### Error: Role already exists

If the role already exists, skip step 2 and continue with step 3.

### Error: Function already exists

Use `update-function-code` instead:

```powershell
aws lambda update-function-code `
  --function-name dev-rds-scheduler `
  --zip-file fileb://lambda.zip `
  --region us-west-1
```

### Error: Permission already exists

This is normal if running the script multiple times. You can ignore it.

### Check Logs

```powershell
# Tail logs (requires AWS CLI v2)
aws logs tail /aws/lambda/dev-rds-scheduler --follow --region us-west-1

# Or view in AWS Console
Start-Process "https://console.aws.amazon.com/cloudwatch/home?region=us-west-1#logsV2:log-groups/log-group/$252Faws$252Flambda$252Fdev-rds-scheduler"
```

---

## Summary

This guide provides step-by-step AWS CLI commands to deploy the RDS scheduler on Windows without requiring a complex PowerShell script.

**Expected time**: 5-10 minutes
**Cost savings**: 50-70% on RDS costs ($60+ per month)

