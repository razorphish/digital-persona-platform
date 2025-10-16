# AWS Cost Analysis Report
**Generated:** October 16, 2025  
**Period:** Last 30 days (Sep 16 - Oct 16, 2025)

---

## 💰 Executive Summary

**Total Monthly Cost:** ~$478.68 USD  
**Primary Cost Driver:** Amazon RDS (95.5% of total costs)

### Cost Breakdown by Service

| Service | Sept 16 - Oct 1 | Oct 1 - Oct 16 (Est.) | Total | % of Total |
|---------|----------------|---------------------|-------|------------|
| **Amazon RDS** | $262.35 | $215.55 | **$477.90** | **95.5%** |
| **AWS Secrets Manager** | $4.47 | $4.17 | **$8.64** | **1.7%** |
| **AWS Cost Explorer** | $4.88 | $4.88 | **$9.76** | **2.0%** |
| **Amazon ECR** | $2.96 | $2.49 | **$5.45** | **1.1%** |
| **Amazon Route 53** | $0.00 | $0.51 | **$0.51** | **0.1%** |
| **Amazon S3** | $0.00 | $0.02 | **$0.02** | **<0.1%** |
| **Amazon CloudFront** | $0.00 | $0.00 | **$0.00** | **<0.1%** |
| **Other Services** | $0.00 | $0.00 | **$0.00** | **<0.1%** |

---

## 🔥 Critical Cost Drivers

### 1. ⚠️ Amazon RDS - **$477.90/month (95.5%)**

**Current Setup:**
- **Dev Cluster** (`dev-dev01-dpp-cluster`): **RUNNING** 
  - Status: Available (active)
  - Config: Aurora Serverless v2 (0.5-1.0 ACU)
  - Cost: ~$215/month
  
- **Prod Cluster** (`prod-prod-dpp-cluster`): **STOPPED**
  - Status: Stopped (will auto-restart Oct 20)
  - Config: Aurora Serverless v2 (0.5-1.0 ACU)
  - Cost: ~$262/month when running

**Issues Identified:**
1. ❌ Both dev AND prod clusters running simultaneously
2. ❌ 7-day backup retention (13 snapshots stored)
3. ❌ 3 old manual snapshots from deleted clusters
4. ❌ Prod cluster stopped but still incurring storage costs
5. ❌ No encryption enabled (security concern + potential cost impact)

**RDS Snapshots:**
- **Total Snapshots:** 13
  - 10 automated backups (7-day retention)
  - 3 manual snapshots from old/deleted clusters
- **Old Manual Snapshots:**
  - `dev01-dev01-dpp-cluster-final-snapshot` (July 26, 2025)
  - `dev-dev01-dpp-cluster-manual-backup-20250723-233658` (July 24, 2025)
  - `local-mars-dpp-cluster-final-snapshot` (Oct 9, 2025)

---

### 2. AWS Secrets Manager - **$8.64/month (1.7%)**

**Current Setup:**
- **Total Secrets:** 15
- **Cost per secret:** ~$0.40/month
- **Cost per 10,000 API calls:** ~$0.05

**Issues Identified:**
1. ❌ Multiple duplicate/legacy secrets for same environment
2. ❌ Secrets from deleted infrastructure still present

**Legacy/Duplicate Secrets:**
- `hibiji-database-password` (OLD naming convention)
- `hibiji-secret-key` (OLD naming convention)
- `hibiji/dev01/database/password` (duplicate)
- `hibiji/dev01/app/secret-key` (duplicate)
- `dev01-dev01-dpp-jwt-secret` (duplicate)
- `dev01-dev01-dpp-database-password` (duplicate)
- `hibiji-dev01-secret-key-b7645c49` (duplicate with random suffix)
- `hibiji-dev01-db-password-b4d122c0` (duplicate with random suffix)
- `hibiji-qa03-db-password-1d7ca98f` (QA03 environment - exists?)
- `local-mars-dpp-jwt-secret` (local env - should this be in AWS?)
- `local-mars-dpp-database-password` (local env - should this be in AWS?)

**Currently Active Secrets (needed):**
- `dev-dev01-dpp-jwt-secret`
- `dev-dev01-dpp-database-password`
- `prod-prod-dpp-jwt-secret`
- `prod-prod-dpp-database-password`

---

### 3. AWS Cost Explorer - **$9.76/month (2.0%)**

**Issue:** Cost Explorer API usage charges
- Each API call costs $0.01
- ~488 API calls in 30 days
- Likely from automated cost monitoring scripts

---

### 4. Amazon ECR - **$5.45/month (1.1%)**

**Current Setup:**
- Docker image storage for Lambda/ECS containers
- ~3GB storage used

**Potential Issues:**
- Old/unused container images not cleaned up
- Multiple versions of same images stored

---

## 💡 Optimization Recommendations

### 🔴 HIGH PRIORITY (Immediate Action - Est. Savings: $280-320/month)

#### 1. **Reduce RDS Backup Retention** - Save ~$50-80/month
**Current:** 7-day retention (13 total snapshots)  
**Recommended:** 3-day retention for dev, 7-day for prod only when needed  

**Actions:**
```bash
# Reduce dev backup retention to 3 days
aws rds modify-db-cluster \
  --db-cluster-identifier dev-dev01-dpp-cluster \
  --backup-retention-period 3
```

**Savings:** ~$5-8/snapshot × 4 snapshots = $20-32/month

---

#### 2. **Delete Old Manual Snapshots** - Save ~$10-15/month
**Actions:**
```bash
# Delete old manual snapshots from deleted clusters
aws rds delete-db-cluster-snapshot --db-cluster-snapshot-identifier dev01-dev01-dpp-cluster-final-snapshot
aws rds delete-db-cluster-snapshot --db-cluster-snapshot-identifier dev-dev01-dpp-cluster-manual-backup-20250723-233658
aws rds delete-db-cluster-snapshot --db-cluster-snapshot-identifier local-mars-dpp-cluster-final-snapshot
```

**Savings:** ~$3-5/snapshot × 3 = $9-15/month

---

#### 3. **Optimize RDS Usage Pattern** - Save ~$150-200/month
**Current:** Both dev and prod running 24/7  
**Recommended:** 
- **Dev:** Only run during work hours (8am-6pm, Mon-Fri) = ~40 hours/week
- **Prod:** Keep stopped unless actively testing

**Current Cost Calculation:**
- Running 24/7 = 730 hours/month
- Dev cost: ~$215/month = ~$0.29/hour
- Prod cost: ~$262/month = ~$0.36/hour

**Optimized Dev Schedule:**
- 40 hours/week × 4.3 weeks = ~172 hours/month
- Cost: 172 hours × $0.29/hour = **~$50/month**
- **Savings: $165/month (77% reduction)**

**Actions:**
- Create Lambda function to start/stop RDS on schedule
- Use AWS EventBridge rules for automation
- Manual start for after-hours work

---

#### 4. **Clean Up Legacy Secrets** - Save ~$4-5/month
**Delete 11 unused secrets:**
- All `hibiji-*` prefixed secrets (old naming)
- All duplicate `dev01-dev01-*` secrets
- All `local-mars-*` secrets
- QA03 secret (if environment doesn't exist)

**Actions:**
```bash
# Delete unused secrets (example)
aws secretsmanager delete-secret --secret-id hibiji-database-password --force-delete-without-recovery
# Repeat for all 11 unused secrets
```

**Savings:** 11 secrets × $0.40/month = **$4.40/month**

---

### 🟡 MEDIUM PRIORITY (1-2 weeks - Est. Savings: $20-40/month)

#### 5. **Implement ECR Lifecycle Policies** - Save ~$2-3/month
**Actions:**
- Delete images older than 30 days
- Keep only last 5 versions of each image
- Remove untagged images

**Terraform Implementation:**
```hcl
resource "aws_ecr_lifecycle_policy" "cleanup" {
  repository = aws_ecr_repository.main.name
  
  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 5 images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 5
        }
        action = { type = "expire" }
      },
      {
        rulePriority = 2
        description  = "Remove untagged images"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 7
        }
        action = { type = "expire" }
      }
    ]
  })
}
```

---

#### 6. **Optimize RDS Configuration** - Save ~$10-20/month
**Actions:**
- Enable storage encryption (better security, no cost increase)
- Review and optimize parameter groups
- Implement connection pooling (already done per Aurora optimization doc)
- Consider reducing max ACU from 1.0 to 0.5 for dev

**Terraform Update:**
```hcl
resource "aws_rds_cluster" "dev" {
  # ... existing config ...
  
  # Encryption (security best practice)
  storage_encrypted = true
  kms_key_id       = aws_kms_key.rds.arn
  
  # Optimized scaling
  serverlessv2_scaling_configuration {
    min_capacity = 0.5
    max_capacity = 0.5  # Reduced from 1.0 for dev
  }
}
```

---

#### 7. **Reduce Cost Explorer API Calls** - Save ~$5-8/month
**Current:** ~488 calls/month = $4.88  
**Recommended:** Cache results, reduce polling frequency

**Actions:**
- Modify cost monitoring scripts to run weekly instead of daily for dev
- Cache Cost Explorer results locally
- Use CloudWatch metrics instead where possible

---

### 🟢 LOW PRIORITY (Long-term - Est. Savings: $50-100/month)

#### 8. **Consider Aurora Serverless v1 for Dev**
- v2 has minimum charge even when idle
- v1 can pause completely (saves when not in use)
- **Caveat:** v1 has cold start issues

#### 9. **Implement Reserved Capacity**
- If prod usage becomes predictable
- 1-year commitment can save 30-40%
- Only for prod, not dev

#### 10. **Evaluate Alternative Database Options**
- RDS Proxy for connection pooling (if needed)
- Consider RDS PostgreSQL instead of Aurora for dev
- Evaluate if serverless is right fit vs. provisioned

---

## 📊 Cost Optimization Summary

### Potential Monthly Savings

| Priority | Optimization | Current Cost | Optimized Cost | Savings | Implementation Time |
|----------|-------------|--------------|----------------|---------|---------------------|
| 🔴 HIGH | RDS Dev Schedule | $215 | $50 | **$165** | 2-4 hours |
| 🔴 HIGH | Backup Retention | $80 | $40 | **$40** | 30 minutes |
| 🔴 HIGH | Delete Old Snapshots | $15 | $0 | **$15** | 15 minutes |
| 🔴 HIGH | Clean Legacy Secrets | $4.40 | $0 | **$4.40** | 30 minutes |
| 🟡 MED | ECR Lifecycle | $5.45 | $3 | **$2.45** | 1 hour |
| 🟡 MED | Cost Explorer Cache | $9.76 | $2 | **$7.76** | 1 hour |
| 🟡 MED | RDS Config Optimization | Variable | Variable | **$10-20** | 2 hours |
| **TOTAL** | **All Optimizations** | **$478.68** | **$150-180** | **$300-330** | **8-12 hours** |

### ROI Analysis
- **Implementation Time:** 8-12 hours
- **Monthly Savings:** $300-330 (63-69% reduction)
- **Annual Savings:** $3,600-3,960
- **Payback Period:** Immediate

---

## 🎯 Recommended Implementation Plan

### Phase 1: Quick Wins (1-2 hours)
1. ✅ Delete 3 old manual RDS snapshots → **Save $15/month**
2. ✅ Delete 11 unused Secrets Manager secrets → **Save $4.40/month**
3. ✅ Reduce dev backup retention to 3 days → **Save $40/month**

**Phase 1 Total Savings:** ~$60/month

### Phase 2: Scheduling Automation (2-4 hours)
1. ✅ Create Lambda function for RDS start/stop
2. ✅ Set up EventBridge rules for work hours schedule
3. ✅ Test automation for 1 week

**Phase 2 Total Savings:** ~$165/month

### Phase 3: Infrastructure Optimization (2-4 hours)
1. ✅ Implement ECR lifecycle policies
2. ✅ Optimize RDS configuration
3. ✅ Cache Cost Explorer results
4. ✅ Enable RDS encryption

**Phase 3 Total Savings:** ~$20/month

### Phase 4: Monitoring & Refinement (ongoing)
1. ✅ Monitor savings with Cost Explorer
2. ✅ Adjust schedules based on actual usage
3. ✅ Review monthly for additional opportunities

---

## 📋 Pre-Implementation Checklist

Before implementing any changes, ensure:

- [ ] **Backup critical data** - Create final manual snapshot of prod
- [ ] **Document current state** - Export all current configurations
- [ ] **Test in dev first** - Validate all changes before prod
- [ ] **Update runbooks** - Document new start/stop procedures
- [ ] **Team notification** - Inform team of new dev schedule
- [ ] **Emergency procedures** - Document how to start RDS after-hours
- [ ] **Monitoring setup** - Ensure CloudWatch alarms work with new schedule

---

## 🔧 Detailed Implementation Scripts

See the following files for implementation:
1. `scripts/cleanup-old-snapshots.sh` - Delete old RDS snapshots
2. `scripts/cleanup-unused-secrets.sh` - Delete unused Secrets Manager secrets
3. `scripts/setup-rds-scheduler.sh` - Set up RDS start/stop automation
4. `scripts/optimize-ecr.sh` - Implement ECR lifecycle policies

---

## 📈 Next Steps

1. **Review this report** with stakeholders
2. **Choose optimizations** to implement based on priorities
3. **Schedule implementation** with minimal disruption
4. **Monitor results** for 2-4 weeks
5. **Iterate and refine** based on actual usage patterns

---

**Questions or concerns?** Review the implementation scripts before proceeding.



