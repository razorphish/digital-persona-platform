# Phase 2: RDS Scheduler Deployment Guide

## ✅ Configuration Complete

The RDS scheduler has been added to **all non-production environments**.

### Environments Updated

| Environment | Schedule | Runtime | Status |
|-------------|----------|---------|--------|
| **dev** | 8 AM - 6 PM PST (Mon-Fri) | 50 hrs/week | ✅ Configured |
| **qa** | 8 AM - 6 PM PST (Mon-Fri) | 50 hrs/week | ✅ Configured |
| **staging** | 7 AM - 8 PM PST (Mon-Fri) | 65 hrs/week | ✅ Configured |
| **hotfix** | 8 AM - 6 PM PST (Mon-Fri) | 50 hrs/week | ✅ Configured |
| **local** | 8 AM - 6 PM PST (Mon-Fri) | 50 hrs/week | ✅ Configured |
| **prod** | 24/7 (No scheduler) | 168 hrs/week | ⏭️ Skipped |

### Expected Savings Per Environment

| Environment | Before | After | Savings/Month |
|-------------|--------|-------|---------------|
| dev | $215 | $50 | **$165** |
| qa | ~$200 | ~$50 | **$150** |
| staging | ~$200 | ~$60 | **$140** |
| hotfix | ~$180 | ~$45 | **$135** |
| local | ~$150 | ~$40 | **$110** |
| **Total** | **~$945** | **~$245** | **~$700/month** |

> Note: Actual costs depend on which environments are actively deployed.

---

## 📋 Next Steps: Terraform Deployment

### Option 1: Deploy All Environments (Recommended)

Deploy the scheduler to all environments at once:

```bash
# Dev environment
cd terraform/environments/dev
terraform init -backend-config="key=dev/dev01/terraform.tfstate"
terraform plan
terraform apply

# QA environment
cd ../qa
terraform init -backend-config="key=qa/qa01/terraform.tfstate"
terraform plan
terraform apply

# Staging environment
cd ../staging
terraform init -backend-config="key=staging/staging01/terraform.tfstate"
terraform plan
terraform apply

# Hotfix environment
cd ../hotfix
terraform init -backend-config="key=hotfix/hotfix01/terraform.tfstate"
terraform plan
terraform apply

# Local environment
cd ../local
terraform init -backend-config="key=local/mars/terraform.tfstate"
terraform plan
terraform apply
```

### Option 2: Deploy One Environment at a Time

Start with dev, verify it works, then roll out to others:

```bash
# Start with dev
cd terraform/environments/dev
terraform init -backend-config="key=dev/dev01/terraform.tfstate"
terraform plan
terraform apply

# Wait 1-2 days to verify, then deploy others
```

### Option 3: Deploy Only Active Environments

If some environments aren't currently deployed, skip them and only deploy where RDS clusters exist.

---

## 🔍 Verification Steps

After deploying, verify the scheduler is working:

### 1. Check Lambda Function Created

```bash
aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'dev-rds-scheduler')]"
```

### 2. Check EventBridge Rules Created

```bash
aws events list-rules --query "Rules[?starts_with(Name, 'dev-start-rds')||starts_with(Name, 'dev-stop-rds')]"
```

### 3. View Lambda Logs

```bash
# After first scheduled execution
aws logs tail /aws/lambda/dev-rds-scheduler --follow
```

### 4. Check RDS Status

```bash
aws rds describe-db-clusters \
  --db-cluster-identifier dev-dev01-dpp-cluster \
  --query "DBClusters[0].Status"
```

---

## 🔧 Manual Override (After-Hours Work)

If you need to work after hours, manually start RDS:

```bash
# Start RDS manually (replace with your environment)
aws lambda invoke \
  --function-name dev-rds-scheduler \
  --payload '{"action":"start","cluster_identifier":"dev-dev01-dpp-cluster"}' \
  response.json

cat response.json
```

To stop manually:

```bash
aws lambda invoke \
  --function-name dev-rds-scheduler \
  --payload '{"action":"stop","cluster_identifier":"dev-dev01-dpp-cluster"}' \
  response.json
```

---

## ⚙️ Schedule Customization

If you need different hours, edit the Terraform configuration:

```hcl
# Example: Change dev to start at 7 AM PST (2 PM UTC)
start_schedule = "cron(0 14 ? * MON-FRI *)"

# Example: Change dev to stop at 8 PM PST (4 AM UTC next day)
stop_schedule = "cron(0 4 ? * TUE-SAT *)"
```

Common schedules:
- **Early Birds**: 7 AM - 5 PM PST = `cron(0 14 ? * MON-FRI *)` to `cron(0 1 ? * TUE-SAT *)`
- **Standard**: 8 AM - 6 PM PST = `cron(0 15 ? * MON-FRI *)` to `cron(0 2 ? * TUE-SAT *)`
- **Night Owls**: 9 AM - 8 PM PST = `cron(0 16 ? * MON-FRI *)` to `cron(0 4 ? * TUE-SAT *)`
- **Extended**: 7 AM - 9 PM PST = `cron(0 14 ? * MON-FRI *)` to `cron(0 5 ? * TUE-SAT *)`

---

## 🚨 Troubleshooting

### Lambda Function Not Triggering

1. Check if EventBridge rules are enabled:
```bash
aws events describe-rule --name dev-start-rds
```

2. Check Lambda permissions:
```bash
aws lambda get-policy --function-name dev-rds-scheduler
```

### RDS Won't Start/Stop

1. Check cluster status:
```bash
aws rds describe-db-clusters --db-cluster-identifier dev-dev01-dpp-cluster
```

2. Check Lambda logs for errors:
```bash
aws logs tail /aws/lambda/dev-rds-scheduler --since 1h
```

### Need to Disable Scheduler Temporarily

```hcl
# In terraform/environments/dev/main.tf
module "rds_scheduler" {
  # ... existing config ...
  enable_scheduler = false  # Set to false
}
```

Then run `terraform apply`.

---

## 📊 Monitoring

### Daily Check

```bash
# Quick status check
aws rds describe-db-clusters \
  --query "DBClusters[*].[DBClusterIdentifier,Status]" \
  --output table
```

### Weekly Review

```bash
# Check Lambda execution count
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=dev-rds-scheduler \
  --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 86400 \
  --statistics Sum
```

### Monthly Cost Check

```bash
# Run the cached cost explorer
.\scripts\cost-optimization\cache-cost-explorer.ps1
```

---

## 🎯 Success Criteria

After 1 week, you should see:
- ✅ RDS clusters starting automatically Mon-Fri mornings
- ✅ RDS clusters stopping automatically Mon-Fri evenings
- ✅ RDS clusters staying stopped on weekends
- ✅ Lambda executions logged in CloudWatch
- ✅ Cost reduction visible in AWS Cost Explorer

After 1 month, you should see:
- ✅ ~$700/month savings across all environments
- ✅ Consistent uptime during work hours
- ✅ Zero manual intervention needed

---

## 📝 Important Notes

1. **First Execution**: The scheduler won't affect clusters until the first scheduled time (8 AM Monday for most environments)

2. **7-Day Auto-Restart**: AWS automatically restarts stopped RDS clusters after 7 days. The scheduler will stop them again on the next stop schedule.

3. **Startup Time**: RDS clusters take 5-10 minutes to start. Plan accordingly if working early.

4. **Cost Savings Delay**: You'll see the full cost savings impact after 30 days of operation.

5. **Production Protection**: Production has NO scheduler and runs 24/7.

---

## 🔗 Related Documentation

- **Phase 1 Results**: Saved $60/month (already completed ✅)
- **Phase 3 Guide**: `COST_OPTIMIZATION_IMPLEMENTATION_GUIDE.md`
- **Full Analysis**: `AWS_COST_ANALYSIS_REPORT.md`
- **RDS Scheduler Module**: `terraform/modules/rds-scheduler/README.md`

---

## ✅ Ready to Deploy?

Choose your deployment strategy:
1. **Conservative**: Deploy to dev only, monitor for 1 week, then roll out
2. **Standard**: Deploy to dev & qa, monitor for 3 days, then roll out
3. **Aggressive**: Deploy to all environments at once

**Recommended**: Option 2 (Standard) for a balanced approach.

---

**Questions?** Check the troubleshooting section or review the full implementation guide.

**Next**: Once deployed, proceed to Phase 3 for an additional $20/month savings with ECR lifecycle policies and configuration optimizations.



