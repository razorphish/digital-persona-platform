# AWS Cost Optimization Implementation Guide

**Complete implementation of all cost optimization recommendations**  
**Expected Savings: $300-330/month (63-69% reduction)**

---

## 📋 What's Been Created

I've implemented a complete cost optimization solution with:

### ✅ Phase 1: Quick Wins Scripts (~$60/month)
- `scripts/cost-optimization/cleanup-old-snapshots.{sh,ps1}` - Delete 3 old RDS snapshots
- `scripts/cost-optimization/cleanup-unused-secrets.{sh,ps1}` - Delete 11 unused Secrets Manager secrets
- `scripts/cost-optimization/reduce-backup-retention.{sh,ps1}` - Reduce dev backup retention to 3 days

### ✅ Phase 2: RDS Scheduler (~$165/month)
- `terraform/modules/rds-scheduler/` - Complete Terraform module
  - `lambda.py` - Python Lambda function for start/stop
  - `main.tf` - Terraform configuration with EventBridge rules
  - `README.md` - Documentation
- `scripts/cost-optimization/package-rds-scheduler-lambda.{sh,ps1}` - Lambda packaging script

### ✅ Phase 3: Advanced Optimizations (~$20/month)
- `terraform/modules/ecr-lifecycle/` - ECR image cleanup policies
- `terraform/modules/rds-optimized/` - Optimized RDS configuration module
- `scripts/cost-optimization/cache-cost-explorer.{sh,ps1}` - Cached cost analysis

### ✅ Master Orchestration
- `scripts/cost-optimization/run-all-optimizations.{sh,ps1}` - One command to run Phase 1

### ✅ Documentation
- `AWS_COST_ANALYSIS_REPORT.md` - Detailed cost analysis and breakdown
- This implementation guide

---

## 🚀 Quick Start - Run Phase 1 Now!

Phase 1 is **safe, immediate, and requires no Terraform changes**. It saves ~$60/month in under 5 minutes.

### Option A: Windows (PowerShell)

```powershell
# Run all Phase 1 optimizations at once
.\scripts\cost-optimization\run-all-optimizations.ps1

# Or run individually:
.\scripts\cost-optimization\cleanup-old-snapshots.ps1
.\scripts\cost-optimization\cleanup-unused-secrets.ps1
.\scripts\cost-optimization\reduce-backup-retention.ps1
```

### Option B: Linux/Mac (Bash)

```bash
# Make scripts executable
chmod +x scripts/cost-optimization/*.sh

# Run all Phase 1 optimizations at once
./scripts/cost-optimization/run-all-optimizations.sh

# Or run individually:
./scripts/cost-optimization/cleanup-old-snapshots.sh
./scripts/cost-optimization/cleanup-unused-secrets.sh
./scripts/cost-optimization/reduce-backup-retention.sh
```

---

## 📊 Implementation Phases

### Phase 1: Quick Wins (5 minutes) → Save $60/month

**Status:** ✅ Ready to run NOW  
**Risk Level:** 🟢 Low  
**Terraform Required:** ❌ No

**What it does:**
1. Deletes 3 old manual RDS snapshots from deleted clusters
2. Deletes 11 unused/duplicate Secrets Manager secrets
3. Reduces dev RDS backup retention from 7 days to 3 days

**Run it:**
```powershell
# Windows
.\scripts\cost-optimization\run-all-optimizations.ps1

# Linux/Mac
./scripts/cost-optimization/run-all-optimizations.sh
```

---

### Phase 2: RDS Scheduler (30-60 minutes) → Save $165/month

**Status:** ✅ Code ready, needs deployment  
**Risk Level:** 🟡 Medium  
**Terraform Required:** ✅ Yes

**What it does:**
- Automatically starts dev RDS at 8 AM PST (Mon-Fri)
- Automatically stops dev RDS at 6 PM PST (Mon-Fri)
- Reduces dev RDS runtime from 730 hours/month to ~215 hours/month
- Manual override available via Lambda for after-hours work

**Implementation Steps:**

#### Step 1: Package the Lambda Function

```powershell
# Windows
.\scripts\cost-optimization\package-rds-scheduler-lambda.ps1

# Linux/Mac
./scripts/cost-optimization/package-rds-scheduler-lambda.sh
```

This creates `terraform/modules/rds-scheduler/lambda.zip`

#### Step 2: Update Your Environment Configuration

Add to `terraform/environments/dev/main.tf`:

```hcl
module "rds_scheduler" {
  source = "../../modules/rds-scheduler"
  
  cluster_identifier = "dev-dev01-dpp-cluster"
  environment        = "dev"
  
  # Start: 8 AM PST (3 PM UTC) Mon-Fri
  start_schedule = "cron(0 15 ? * MON-FRI *)"
  
  # Stop: 6 PM PST (2 AM UTC next day) Mon-Fri  
  stop_schedule = "cron(0 2 ? * TUE-SAT *)"
  
  enable_scheduler = true
  
  tags = {
    CostOptimization = "Enabled"
    ManagedBy       = "Terraform"
  }
}

output "rds_scheduler_function" {
  description = "RDS scheduler Lambda function name"
  value       = module.rds_scheduler.lambda_function_name
}
```

#### Step 3: Deploy with Terraform

```bash
cd terraform/environments/dev

# Initialize (first time only)
terraform init

# Review changes
terraform plan

# Apply changes
terraform apply
```

#### Step 4: Verify Deployment

```bash
# Check EventBridge rules
aws events list-rules --name-prefix dev-

# Check Lambda function
aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'dev-rds-scheduler')]"

# View Lambda logs
aws logs tail /aws/lambda/dev-rds-scheduler --follow
```

#### Step 5: Test Manual Override (Optional)

```bash
# Manually start RDS
aws lambda invoke \
  --function-name dev-rds-scheduler \
  --payload '{"action":"start","cluster_identifier":"dev-dev01-dpp-cluster"}' \
  response.json

cat response.json

# Manually stop RDS
aws lambda invoke \
  --function-name dev-rds-scheduler \
  --payload '{"action":"stop","cluster_identifier":"dev-dev01-dpp-cluster"}' \
  response.json

cat response.json
```

---

### Phase 3: Advanced Optimizations (60-90 minutes) → Save $20/month

**Status:** ✅ Code ready, needs deployment  
**Risk Level:** 🟢 Low to 🟡 Medium  
**Terraform Required:** ✅ Yes

#### 3A: ECR Lifecycle Policies

**Saves:** ~$2-3/month  
**Risk:** 🟢 Low

Add to your environment configuration:

```hcl
# Get list of ECR repositories
data "aws_ecr_repositories" "all" {}

locals {
  ecr_repositories = [
    "dpp-server",
    "dpp-web",
    # Add other repository names
  ]
}

# Apply lifecycle policy to each repository
module "ecr_lifecycle" {
  for_each = toset(local.ecr_repositories)
  
  source = "../../modules/ecr-lifecycle"
  
  repository_name      = each.value
  max_image_count      = 5
  untagged_image_days  = 7
  any_image_days       = 30
}
```

Deploy:
```bash
cd terraform/environments/dev
terraform apply
```

#### 3B: RDS Configuration Optimization

**Saves:** ~$10-20/month  
**Risk:** 🟡 Medium (requires cluster modification)

**Option 1: Check Current Configuration**

Add to your environment configuration:

```hcl
module "rds_check" {
  source = "../../modules/rds-optimized"
  
  cluster_identifier = "dev-dev01-dpp-cluster"
  environment        = "dev"
}

output "rds_optimization_summary" {
  value = module.rds_check.cost_optimization_summary
}
```

Run `terraform apply` to see recommendations.

**Option 2: Apply Optimized Settings**

Update your existing RDS cluster resource:

```hcl
resource "aws_rds_cluster" "database" {
  # ... existing config ...
  
  # Optimized Scaling
  serverlessv2_scaling_configuration {
    min_capacity = 0.5  # Minimum
    max_capacity = 0.5  # Reduced from 1.0 for dev
  }
  
  # Backup already optimized in Phase 1
  backup_retention_period = 3
  
  # Enable encryption (security best practice)
  storage_encrypted = true
  kms_key_id       = aws_kms_key.rds.arn  # Or use AWS-managed key
  
  # Cost tracking tags
  tags = merge(var.tags, {
    CostOptimized   = "true"
    MaxCapacity     = "0.5"
    BackupRetention = "3"
  })
}
```

**⚠️ Important:** Reducing `max_capacity` affects maximum available performance. Monitor your application after this change.

#### 3C: Cost Explorer Caching

**Saves:** ~$5-8/month  
**Risk:** 🟢 None

Replace direct `aws ce` calls with cached version:

```powershell
# Windows - Use cached version
.\scripts\cost-optimization\cache-cost-explorer.ps1

# Force refresh
.\scripts\cost-optimization\cache-cost-explorer.ps1 -Refresh

# Linux/Mac
./scripts/cost-optimization/cache-cost-explorer.sh
./scripts/cost-optimization/cache-cost-explorer.sh --refresh
```

Update any automated scripts or CI/CD pipelines that call Cost Explorer API to use the cached version instead.

---

## 📈 Monitoring Your Savings

### Daily Cost Checks

```powershell
# Windows
.\scripts\cost-optimization\cache-cost-explorer.ps1

# Linux/Mac
./scripts/cost-optimization/cache-cost-explorer.sh
```

### Weekly Cost Analysis

```bash
# View RDS cluster status
aws rds describe-db-clusters \
  --query "DBClusters[*].[DBClusterIdentifier,Status,ServerlessV2ScalingConfiguration]" \
  --output table

# Check Lambda scheduler logs
aws logs tail /aws/lambda/dev-rds-scheduler --since 7d
```

### Monthly Deep Dive

1. Review Cost Explorer in AWS Console
2. Compare to previous month
3. Check CloudWatch dashboards
4. Review budget alerts

---

## 🔧 Troubleshooting

### Phase 1 Issues

#### Snapshot Deletion Fails
```bash
# Check if snapshot exists
aws rds describe-db-cluster-snapshots \
  --db-cluster-snapshot-identifier "snapshot-name"

# Check permissions
aws sts get-caller-identity
```

#### Secrets Deletion Fails
```bash
# List all secrets
aws secretsmanager list-secrets

# Check if secret is in use
aws secretsmanager describe-secret --secret-id "secret-name"
```

### Phase 2 Issues

#### Lambda Function Not Triggering
```bash
# Check EventBridge rules
aws events list-rules --name-prefix dev-

# Check if rule is enabled
aws events describe-rule --name dev-start-rds

# View Lambda logs
aws logs tail /aws/lambda/dev-rds-scheduler --follow
```

#### RDS Won't Start/Stop
```bash
# Check cluster status
aws rds describe-db-clusters \
  --db-cluster-identifier dev-dev01-dpp-cluster \
  --query "DBClusters[0].Status"

# Check Lambda execution role permissions
aws iam get-role-policy \
  --role-name dev-rds-scheduler-role \
  --policy-name dev-rds-scheduler-policy
```

#### Need to Work After Hours
```bash
# Manually start RDS (overrides schedule)
aws lambda invoke \
  --function-name dev-rds-scheduler \
  --payload '{"action":"start","cluster_identifier":"dev-dev01-dpp-cluster"}' \
  response.json
```

### Phase 3 Issues

#### ECR Images Being Deleted Unexpectedly
```bash
# Check lifecycle policy
aws ecr get-lifecycle-policy --repository-name dpp-server

# Preview policy results (dry run)
aws ecr get-lifecycle-policy-preview --repository-name dpp-server
```

#### RDS Performance Issues After Max Capacity Reduction
```bash
# Monitor ACU usage
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name ACUUtilization \
  --dimensions Name=DBClusterIdentifier,Value=dev-dev01-dpp-cluster \
  --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average,Maximum

# If consistently hitting max capacity, increase it back
terraform apply -var="max_capacity=1.0"
```

---

## 🔄 Rollback Procedures

### Undo Phase 1 Changes

**Snapshots:** Cannot be restored once deleted (backups from deleted clusters)  
**Secrets:** Can be restored within 7-30 days:
```bash
aws secretsmanager restore-secret --secret-id "secret-name"
```

**Backup Retention:** Can be increased:
```bash
aws rds modify-db-cluster \
  --db-cluster-identifier dev-dev01-dpp-cluster \
  --backup-retention-period 7 \
  --apply-immediately
```

### Disable Phase 2 Scheduler

**Option 1: Disable without destroying**
```hcl
module "rds_scheduler" {
  # ... existing config ...
  enable_scheduler = false
}
```

**Option 2: Remove completely**
```bash
cd terraform/environments/dev
terraform destroy -target=module.rds_scheduler
```

### Revert Phase 3 Changes

**ECR Lifecycle:**
```bash
terraform destroy -target=module.ecr_lifecycle
```

**RDS Configuration:**
```hcl
resource "aws_rds_cluster" "database" {
  serverlessv2_scaling_configuration {
    max_capacity = 1.0  # Restore original
  }
}
```

---

## 💰 Expected Results Timeline

### Week 1
- **Phase 1 savings visible immediately**
- Snapshot costs: -$15/month
- Secrets costs: -$4.40/month
- Backup storage reduced (starts showing in 2-3 days)

### Week 2-3
- **Phase 2 savings start accumulating**
- RDS running ~50 hours/week instead of 168 hours
- 70% reduction in RDS runtime costs
- Monitor for any operational issues

### Week 4
- **Full month of Phase 2 savings**
- Should see ~$165 reduction in RDS costs
- Phase 3 optimizations fully effective

### Month 2+
- **Sustained savings of $300-330/month**
- Total annual savings: ~$3,600-3,960
- Monitor and adjust schedules as needed

---

## 📊 Success Metrics

Track these metrics to verify optimizations:

| Metric | Before | Target | How to Check |
|--------|--------|--------|--------------|
| Monthly AWS Cost | $479 | $150-180 | Cost Explorer |
| RDS Cost | $477 | $120-150 | Cost Explorer (RDS service) |
| Secrets Count | 15 | 4 | `aws secretsmanager list-secrets` |
| RDS Snapshots | 13 | 6-8 | `aws rds describe-db-cluster-snapshots` |
| Dev RDS Runtime | 730h/mo | 215h/mo | CloudWatch RDS uptime |
| ECR Storage | 5+ GB | 1-2 GB | ECR Console |
| Cost Explorer API | 488 calls | <100 calls | CloudWatch API calls |

---

## 🎯 Next Steps

1. **NOW:** Run Phase 1 scripts
   ```powershell
   .\scripts\cost-optimization\run-all-optimizations.ps1
   ```

2. **This Week:** Deploy Phase 2 RDS Scheduler
   - Package Lambda
   - Update Terraform
   - Deploy and test

3. **This Month:** Implement Phase 3
   - ECR lifecycle policies
   - RDS configuration optimization
   - Cost Explorer caching

4. **Ongoing:** Monitor and refine
   - Weekly cost checks
   - Monthly deep dives
   - Adjust schedules based on usage

---

## 📞 Support & Questions

If you encounter issues:

1. Check the troubleshooting section above
2. Review AWS CloudWatch logs
3. Check IAM permissions
4. Verify AWS CLI configuration

All scripts include detailed error messages and can be run with `-Force` flag for non-interactive execution.

---

**Ready to start saving?** Run Phase 1 now to get immediate $60/month savings! 🚀


