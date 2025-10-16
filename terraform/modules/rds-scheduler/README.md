# RDS Scheduler Module

Automatically starts and stops RDS clusters on a schedule to optimize costs.

## Features

- **Automatic Start/Stop**: Schedules RDS clusters based on work hours
- **Cost Savings**: Reduces RDS costs by ~77% for dev environments
- **Flexible Scheduling**: Customizable cron expressions
- **Safe Operations**: Only acts on specified clusters
- **Logging**: CloudWatch logs for all operations

## Usage

```hcl
module "rds_scheduler" {
  source = "../../modules/rds-scheduler"
  
  cluster_identifier = "dev-dev01-dpp-cluster"
  environment        = "dev"
  
  # Start at 8 AM PST Monday-Friday (3 PM UTC)
  start_schedule = "cron(0 15 ? * MON-FRI *)"
  
  # Stop at 6 PM PST Monday-Friday (2 AM UTC next day)
  stop_schedule = "cron(0 2 ? * TUE-SAT *)"
  
  enable_scheduler = true
  
  tags = {
    CostOptimization = "Enabled"
    ManagedBy       = "Terraform"
  }
}
```

## Schedule Configuration

The module uses AWS EventBridge (CloudWatch Events) with cron expressions in UTC time.

### Default Schedule
- **Start**: Monday-Friday at 8 AM PST (3 PM UTC)
- **Stop**: Monday-Friday at 6 PM PST (2 AM UTC next day)
- **Running**: ~50 hours/week (40 work hours + startup time)

### Time Zone Conversion
PST is UTC-7 (or UTC-8 during standard time). Examples:
- 8 AM PST = 3 PM UTC (or 4 PM UTC in winter)
- 6 PM PST = 1 AM UTC next day (or 2 AM UTC next day in winter)

### Cron Expression Format
```
cron(minute hour day-of-month month day-of-week year)
```

Examples:
- `cron(0 15 ? * MON-FRI *)` - 3 PM UTC, Monday-Friday
- `cron(0 2 ? * TUE-SAT *)` - 2 AM UTC, Tuesday-Saturday (covers Mon-Fri 6PM PST)
- `cron(0 12 ? * * *)` - 12 PM UTC every day

## Cost Savings

### Before
- Running 24/7: 730 hours/month
- Cost: ~$215/month

### After
- Running 50 hours/week × 4.3 weeks = ~215 hours/month
- Cost: ~$50/month
- **Savings: $165/month (77% reduction)**

## Manual Override

To manually start/stop RDS outside of schedule:

```bash
# Start cluster manually
aws lambda invoke \
  --function-name dev-rds-scheduler \
  --payload '{"action":"start","cluster_identifier":"dev-dev01-dpp-cluster"}' \
  response.json

# Stop cluster manually
aws lambda invoke \
  --function-name dev-rds-scheduler \
  --payload '{"action":"stop","cluster_identifier":"dev-dev01-dpp-cluster"}' \
  response.json
```

## Disable Scheduler

To temporarily disable scheduling without destroying resources:

```hcl
module "rds_scheduler" {
  # ... other config ...
  enable_scheduler = false
}
```

## Monitoring

View logs in CloudWatch:
```bash
aws logs tail /aws/lambda/dev-rds-scheduler --follow
```

## Prerequisites

Before deploying, package the Lambda function:

```bash
cd terraform/modules/rds-scheduler
zip lambda.zip lambda.py
```

Or use the provided script:
```bash
./scripts/package-rds-scheduler-lambda.sh
```

## Variables

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| cluster_identifier | RDS cluster identifier | string | n/a | yes |
| environment | Environment name | string | n/a | yes |
| start_schedule | Cron for starting RDS (UTC) | string | `cron(0 15 ? * MON-FRI *)` | no |
| stop_schedule | Cron for stopping RDS (UTC) | string | `cron(0 2 ? * TUE-SAT *)` | no |
| enable_scheduler | Enable/disable scheduler | bool | true | no |
| tags | Additional tags | map(string) | {} | no |

## Outputs

| Name | Description |
|------|-------------|
| lambda_function_arn | ARN of the Lambda function |
| lambda_function_name | Name of the Lambda function |
| start_schedule | Schedule for starting RDS |
| stop_schedule | Schedule for stopping RDS |

## Notes

- RDS clusters take 5-10 minutes to start/stop
- Stopped clusters automatically restart after 7 days (AWS limitation)
- The scheduler will not interfere with manual starts/stops
- Prod clusters should NOT use this scheduler



