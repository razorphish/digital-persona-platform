# RDS Scheduler Deployment Guide

This guide explains how to deploy the RDS scheduler for cost optimization using either **manual deployment** (when IAM permissions are limited) or **Terraform** (for new environments with full permissions).

## Overview

The RDS scheduler automatically starts and stops your RDS cluster on a schedule to reduce costs during non-working hours:

- **Start**: 8 AM PST (3 PM UTC) Monday-Friday
- **Stop**: 6 PM PST (2 AM UTC next day) Monday-Friday  
- **Weekend**: RDS remains stopped

**Estimated Savings**: 50-70% reduction in RDS costs for development environments

---

## Option 1: Manual Deployment (Current Environment)

Use this method when you don't have full IAM permissions required for Terraform deployment.

### Prerequisites

- AWS CLI installed and configured
- Basic IAM permissions:
  - `iam:GetRole`, `iam:CreateRole`, `iam:PutRolePolicy`
  - `lambda:CreateFunction`, `lambda:UpdateFunctionCode`
  - `events:PutRule`, `events:PutTargets`
  - `rds:DescribeDBClusters`, `rds:StartDBCluster`, `rds:StopDBCluster`

### Deployment Steps

#### Linux/Mac:

```bash
# Deploy with defaults
./scripts/cost-optimization/deploy-rds-scheduler-manual.sh

# Or specify custom parameters
./scripts/cost-optimization/deploy-rds-scheduler-manual.sh \
  dev \
  dev-dev01-dpp-cluster \
  "cron(0 15 ? * MON-FRI *)" \
  "cron(0 2 ? * TUE-SAT *)"
```

#### Windows PowerShell:

```powershell
# Deploy with defaults
.\scripts\cost-optimization\deploy-rds-scheduler-manual.ps1

# Or specify custom parameters
.\scripts\cost-optimization\deploy-rds-scheduler-manual.ps1 `
  -Environment "dev" `
  -ClusterId "dev-dev01-dpp-cluster" `
  -StartSchedule "cron(0 15 ? * MON-FRI *)" `
  -StopSchedule "cron(0 2 ? * TUE-SAT *)"
```

### What Gets Created

The manual script creates:

1. **IAM Role**: `dev-rds-scheduler-role`
   - Permissions to start/stop RDS clusters
   - CloudWatch Logs permissions

2. **Lambda Function**: `dev-rds-scheduler`
   - Python 3.11 runtime
   - 128MB memory, 60s timeout
   - Handles start/stop actions

3. **EventBridge Rules**:
   - `dev-start-rds`: Triggers Lambda to start RDS
   - `dev-stop-rds`: Triggers Lambda to stop RDS

4. **CloudWatch Log Group**: `/aws/lambda/dev-rds-scheduler`
   - 7-day retention

### Verification

```bash
# Check Lambda function
aws lambda get-function --function-name dev-rds-scheduler

# Check EventBridge rules
aws events list-rules --name-prefix dev-

# Check RDS status
aws rds describe-db-clusters \
  --db-cluster-identifier dev-dev01-dpp-cluster \
  --query 'DBClusters[0].Status'

# View Lambda logs
aws logs tail /aws/lambda/dev-rds-scheduler --follow
```

### Manual Override

If you need to manually control RDS outside the schedule:

```bash
# Start RDS immediately
aws rds start-db-cluster --db-cluster-identifier dev-dev01-dpp-cluster

# Stop RDS immediately
aws rds stop-db-cluster --db-cluster-identifier dev-dev01-dpp-cluster

# Check status
aws rds describe-db-clusters \
  --db-cluster-identifier dev-dev01-dpp-cluster \
  --query 'DBClusters[0].Status' \
  --output text
```

Or use the helper scripts:

```bash
# Start
./scripts/rds-manual-control/start-dev-rds.sh

# Stop
./scripts/rds-manual-control/stop-dev-rds.sh

# Status
./scripts/rds-manual-control/status-dev-rds.sh
```

---

## Option 2: Terraform Deployment (New Environments)

Use this method for new environments where you have full IAM permissions.

### Prerequisites

- Full IAM permissions including:
  - `iam:CreateRole`, `iam:TagRole`, `iam:AttachRolePolicy`
  - `lambda:*`
  - `events:*`
  - `logs:*`
  - `rds:*`

### Enable in Terraform

1. **Update terraform.tfvars**:

```hcl
# terraform/environments/dev/terraform.tfvars
enable_rds_scheduler = true
```

Or set via command line:

```bash
cd terraform/environments/dev
terraform apply -var="enable_rds_scheduler=true"
```

2. **Package Lambda function** (first time only):

```bash
./scripts/cost-optimization/package-rds-scheduler-lambda.sh
```

3. **Deploy via Terraform**:

```bash
cd terraform/environments/dev
terraform init
terraform plan -target=module.rds_scheduler
terraform apply -target=module.rds_scheduler
```

### Configuration Options

You can customize the schedule in `terraform/environments/dev/main.tf`:

```hcl
module "rds_scheduler" {
  count  = var.enable_rds_scheduler ? 1 : 0
  source = "../../modules/rds-scheduler"

  cluster_identifier = aws_rds_cluster.database.cluster_identifier
  environment        = var.environment

  # Customize schedules (UTC time)
  start_schedule = "cron(0 15 ? * MON-FRI *)"  # 8 AM PST
  stop_schedule  = "cron(0 2 ? * TUE-SAT *)"   # 6 PM PST

  enable_scheduler = true

  tags = merge(local.common_tags, {
    CostOptimization = "Enabled"
    Component        = "RDSScheduler"
  })
}
```

### For New Environments

When setting up a new environment (e.g., `dev02`, `staging`):

1. **Copy environment configuration**:

```bash
cp -r terraform/environments/dev terraform/environments/dev02
```

2. **Update variables in new environment's `terraform.tfvars`**:

```hcl
environment     = "dev"
sub_environment = "dev02"
enable_rds_scheduler = true  # Enable from the start
```

3. **Deploy everything**:

```bash
cd terraform/environments/dev02
terraform init
terraform plan
terraform apply
```

The RDS scheduler will be created automatically along with other infrastructure.

---

## Cron Schedule Reference

All schedules use **UTC time**. PST = UTC - 8 hours (or UTC - 7 during PDT).

Common schedules:

```bash
# Weekdays 8 AM - 6 PM PST
start: "cron(0 15 ? * MON-FRI *)"  # 8 AM PST = 3 PM UTC
stop:  "cron(0 2 ? * TUE-SAT *)"   # 6 PM PST = 2 AM UTC next day

# Weekdays 7 AM - 7 PM PST
start: "cron(0 14 ? * MON-FRI *)"  # 7 AM PST = 2 PM UTC
stop:  "cron(0 3 ? * TUE-SAT *)"   # 7 PM PST = 3 AM UTC next day

# Every day 8 AM - 10 PM PST
start: "cron(0 15 ? * * *)"        # 8 AM PST = 3 PM UTC
stop:  "cron(0 5 ? * * *)"         # 10 PM PST = 5 AM UTC next day

# Custom: Monday-Thursday only
start: "cron(0 15 ? * MON-THU *)"
stop:  "cron(0 2 ? * TUE-FRI *)"
```

### Cron Format

```
cron(Minutes Hours Day-of-month Month Day-of-week Year)
```

- `*` = any value
- `?` = no specific value (use for either day-of-month or day-of-week)
- `MON-FRI` = Monday through Friday
- `*/15` = every 15 minutes

---

## Monitoring and Troubleshooting

### CloudWatch Logs

View execution logs:

```bash
# Tail logs
aws logs tail /aws/lambda/dev-rds-scheduler --follow

# View specific time range
aws logs tail /aws/lambda/dev-rds-scheduler \
  --since 1h \
  --format short
```

### Check Schedule Status

```bash
# List EventBridge rules
aws events list-rules --name-prefix dev-

# Describe specific rule
aws events describe-rule --name dev-start-rds

# List targets for a rule
aws events list-targets-by-rule --rule dev-start-rds
```

### Common Issues

#### RDS Won't Start/Stop

1. Check Lambda logs for errors
2. Verify IAM role has RDS permissions
3. Check RDS cluster status (must be `available` to stop, `stopped` to start)
4. Verify EventBridge rule is enabled

```bash
# Check if rules are enabled
aws events describe-rule --name dev-start-rds --query 'State'
aws events describe-rule --name dev-stop-rds --query 'State'
```

#### Lambda Function Not Triggering

1. Verify EventBridge targets are configured:

```bash
aws events list-targets-by-rule --rule dev-start-rds
```

2. Check Lambda permissions:

```bash
aws lambda get-policy --function-name dev-rds-scheduler
```

3. Test Lambda manually:

```bash
aws lambda invoke \
  --function-name dev-rds-scheduler \
  --payload '{"action":"describe","cluster_identifier":"dev-dev01-dpp-cluster"}' \
  response.json
cat response.json
```

#### Wrong Timezone

All cron expressions must use **UTC**. To convert PST to UTC:

- PST (UTC-8): Add 8 hours
- PDT (UTC-7): Add 7 hours

Example: 8 AM PST = 3 PM UTC (or 4 PM UTC during DST)

---

## Cost Comparison

### Without Scheduler

```
RDS db.serverless (min 0.5 ACU):
- 24 hours/day × 30 days = 720 hours/month
- 720 hours × $0.12/hour = $86.40/month
```

### With Scheduler (Weekday 8 AM - 6 PM)

```
Active hours:
- 10 hours/day × 5 days/week × 4 weeks = 200 hours/month
- 200 hours × $0.12/hour = $24.00/month

Savings: $62.40/month (72%)
```

### Annual Savings

```
- Monthly: $62.40
- Annual: $748.80 per environment
- 3 dev environments: $2,246.40/year
```

---

## Migration Path

### Current State (Manual Deployment)

```
✅ Manual deployment via AWS CLI
✅ Not managed by Terraform
✅ Works with limited IAM permissions
```

### Future State (Terraform Managed)

Once IAM permissions are granted:

1. **Document current manual deployment**:

```bash
# Export current configuration
aws lambda get-function --function-name dev-rds-scheduler \
  > current-lambda-config.json
aws events list-rules --name-prefix dev- \
  > current-rules.json
```

2. **Import into Terraform** (optional):

```bash
cd terraform/environments/dev

# Import Lambda function
terraform import 'module.rds_scheduler[0].aws_lambda_function.rds_scheduler' \
  dev-rds-scheduler

# Import IAM role
terraform import 'module.rds_scheduler[0].aws_iam_role.rds_scheduler' \
  dev-rds-scheduler-role

# Import EventBridge rules
terraform import 'module.rds_scheduler[0].aws_cloudwatch_event_rule.start_rds' \
  dev-start-rds
terraform import 'module.rds_scheduler[0].aws_cloudwatch_event_rule.stop_rds' \
  dev-stop-rds
```

3. **Enable in Terraform**:

```bash
# Update terraform.tfvars
enable_rds_scheduler = true

# Apply
terraform plan
terraform apply
```

Or start fresh:

1. Delete manual resources
2. Enable `enable_rds_scheduler = true`
3. Run `terraform apply`

---

## Summary

| Aspect | Manual Deployment | Terraform Deployment |
|--------|------------------|---------------------|
| **Use Case** | Limited IAM permissions | Full IAM permissions |
| **Current Env** | ✅ Recommended | ❌ Not available |
| **New Envs** | ⚠️ Possible | ✅ Recommended |
| **Maintenance** | Manual updates | Infrastructure as Code |
| **Consistency** | Manual effort | Automatic |
| **Setup Time** | 5 minutes | 2 minutes |

**Recommendation**: 
- **Now**: Use manual deployment for dev01
- **Future**: Request IAM permissions and use Terraform
- **New environments**: Always use Terraform with `enable_rds_scheduler = true`

---

## Additional Resources

- [IAM Permission Request](../IAM_PERMISSION_REQUEST.md) - Required permissions for Terraform deployment
- [Cost Optimization Guide](../COST_OPTIMIZATION_IMPLEMENTATION_GUIDE.md) - Overall cost strategy
- [RDS Manual Control Scripts](../scripts/rds-manual-control/README.md) - Manual start/stop scripts
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda/)
- [AWS EventBridge Cron Expressions](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-create-rule-schedule.html)

