# RDS Optimized Configuration Module

Provides cost-optimized configuration settings for Aurora Serverless v2 clusters.

## Features

- **Reduced Backup Retention**: 3 days for dev (vs 7 days default)
- **Optimized Capacity**: Right-sized ACU limits
- **Encryption Enabled**: Enhanced security with minimal cost impact
- **Tagged for Monitoring**: Cost optimization tracking
- **Environment-Specific**: Different settings per environment

## Usage

### Check Current Configuration

```hcl
module "rds_check" {
  source = "../../modules/rds-optimized"
  
  cluster_identifier = "dev-dev01-dpp-cluster"
  environment        = "dev"
}

output "current_rds_config" {
  value = module.rds_check.current_config
}

output "optimization_summary" {
  value = module.rds_check.cost_optimization_summary
}
```

### Apply to Existing RDS Resource

Update your existing RDS cluster configuration with these optimized settings:

```hcl
resource "aws_rds_cluster" "database" {
  cluster_identifier = "dev-dev01-dpp-cluster"
  
  # Optimized Settings
  serverlessv2_scaling_configuration {
    min_capacity = 0.5  # Minimum (can't go lower)
    max_capacity = 0.5  # Reduced for dev (was 1.0)
  }
  
  # Backup Optimization
  backup_retention_period = 3  # Reduced for dev (was 7)
  preferred_backup_window = "07:00-09:00"
  preferred_maintenance_window = "sun:09:00-sun:10:00"
  
  # Security Enhancement
  storage_encrypted = true
  kms_key_id       = aws_kms_key.rds.arn
  
  # Cost Tracking
  tags = {
    CostOptimized   = "true"
    BackupRetention = "3"
    MaxCapacity     = "0.5"
  }
}
```

## Configuration by Environment

### Development
```hcl
module "rds_optimized_dev" {
  source = "../../modules/rds-optimized"
  
  cluster_identifier        = "dev-dev01-dpp-cluster"
  environment              = "dev"
  min_capacity             = 0.5
  max_capacity             = 0.5  # Reduced from 1.0
  backup_retention_period  = 3    # Reduced from 7
  enable_encryption        = true
  enable_deletion_protection = false
}
```

### Production
```hcl
module "rds_optimized_prod" {
  source = "../../modules/rds-optimized"
  
  cluster_identifier        = "prod-prod-dpp-cluster"
  environment              = "prod"
  min_capacity             = 0.5
  max_capacity             = 1.0  # Keep higher for prod
  backup_retention_period  = 7    # Keep 7 days for prod
  enable_encryption        = true
  enable_deletion_protection = true
}
```

## Cost Savings Breakdown

### Backup Retention (Dev)
- **Before**: 7 days × 7 snapshots × ~$3/snapshot = ~$21/month
- **After**: 3 days × 3 snapshots × ~$3/snapshot = ~$9/month
- **Savings**: ~$12/month per cluster

### Max Capacity (Dev)
- **Before**: max_capacity = 1.0 ACU
- **After**: max_capacity = 0.5 ACU
- **Savings**: ~$20-30/month (scales down faster, lower ceiling)

### Total Dev Cluster Savings
- **Combined**: ~$30-40/month per dev cluster
- **Annual**: ~$360-480/year per dev cluster

## Variables

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| cluster_identifier | RDS cluster identifier | string | n/a | yes |
| environment | Environment name | string | n/a | yes |
| min_capacity | Minimum ACU | number | 0.5 | no |
| max_capacity | Maximum ACU | number | 1.0 | no |
| backup_retention_period | Backup retention days | number | 3 | no |
| enable_encryption | Enable storage encryption | bool | true | no |
| kms_key_id | KMS key ID (optional) | string | null | no |
| enable_deletion_protection | Enable deletion protection | bool | false | no |
| preferred_backup_window | Backup window (UTC) | string | "07:00-09:00" | no |
| preferred_maintenance_window | Maintenance window (UTC) | string | "sun:09:00-sun:10:00" | no |
| tags | Additional tags | map(string) | {} | no |

## Outputs

| Name | Description |
|------|-------------|
| recommended_config | Recommended configuration settings |
| current_config | Current cluster configuration |
| cost_optimization_summary | Summary of changes and savings |

## Best Practices

### Development Environments
- ✅ Use 3-day backup retention
- ✅ Set max_capacity to 0.5 ACU
- ✅ Enable encryption (best practice)
- ✅ Disable deletion protection
- ✅ Use RDS scheduler to stop after hours

### Staging Environments
- ✅ Use 5-day backup retention
- ✅ Set max_capacity to 1.0 ACU
- ✅ Enable encryption
- ✅ Enable deletion protection
- ⚠️ Consider scheduler for cost savings

### Production Environments
- ✅ Use 7+ day backup retention
- ✅ Set max_capacity based on load (1.0-2.0 ACU)
- ✅ Enable encryption
- ✅ Enable deletion protection
- ❌ Do NOT use scheduler

## Applying Changes

1. **Review Current Configuration**
   ```bash
   terraform plan -target=module.rds_check
   ```

2. **Apply Changes Gradually**
   ```bash
   # First: Update backup retention
   # This is low-risk and immediate savings
   terraform apply -target=aws_rds_cluster.database
   ```

3. **Monitor Impact**
   - Watch CloudWatch metrics for 1-2 weeks
   - Verify application performance
   - Check backup completion

4. **Adjust if Needed**
   - Increase max_capacity if performance degrades
   - Adjust backup retention based on recovery needs

## Encryption Costs

- **Storage encryption**: No additional cost
- **KMS key**: $1/month for customer-managed key
- **Recommendation**: Use AWS-managed key (free) for dev/staging

## Monitoring

Track cost optimization with CloudWatch metrics:
- `DatabaseConnections` - Monitor connection usage
- `ACUUtilization` - Track capacity usage
- `BackupRetentionPeriodStorageUsed` - Monitor backup storage

## Rollback

If you need to revert changes:

```hcl
resource "aws_rds_cluster" "database" {
  # Revert to original settings
  serverlessv2_scaling_configuration {
    max_capacity = 1.0  # Original
  }
  backup_retention_period = 7  # Original
}
```

Run `terraform apply` to restore previous configuration.

## Notes

- Changes to backup retention are immediate
- Scaling changes are immediate
- Encryption can only be enabled at cluster creation
- Deletion protection prevents accidental deletion




