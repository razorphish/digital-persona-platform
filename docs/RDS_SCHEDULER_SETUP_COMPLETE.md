# RDS Scheduler - Dual Deployment Setup Complete

## Summary

The RDS scheduler has been configured to support **two deployment methods**:

### ✅ Option 1: Manual Deployment (Ready Now)

**Use this now** with limited IAM permissions:

```bash
# Linux/Mac
./scripts/cost-optimization/deploy-rds-scheduler-manual.sh

# Windows
.\scripts\cost-optimization\deploy-rds-scheduler-manual.ps1
```

**What it does:**
- Creates Lambda function: `dev-rds-scheduler`
- Creates IAM role with RDS start/stop permissions
- Sets up EventBridge schedules:
  - Start: Monday-Friday 8 AM PST
  - Stop: Monday-Friday 6 PM PST
- Deploys independently of Terraform

### ✅ Option 2: Terraform Deployment (Ready for New Environments)

**Use this** when setting up new environments with full IAM permissions:

```bash
cd terraform/environments/dev
terraform apply -var="enable_rds_scheduler=true"
```

Or in `terraform.tfvars`:
```hcl
enable_rds_scheduler = true
```

**Benefits:**
- Infrastructure as Code
- Consistent across environments
- Automatic deployment
- Easier to maintain

## Current Configuration

### Terraform Changes

1. **Added variable** in `terraform/environments/dev/main.tf`:
   ```hcl
   variable "enable_rds_scheduler" {
     description = "Enable RDS scheduler module"
     type        = bool
     default     = false  # Off by default
   }
   ```

2. **Made module conditional**:
   ```hcl
   module "rds_scheduler" {
     count  = var.enable_rds_scheduler ? 1 : 0
     source = "../../modules/rds-scheduler"
     # ... configuration
   }
   ```

3. **Updated outputs** to handle conditional deployment

### New Scripts Created

1. **`scripts/cost-optimization/deploy-rds-scheduler-manual.sh`** (Linux/Mac)
   - Full AWS CLI deployment
   - Creates all resources
   - Tests deployment
   - Provides monitoring commands

2. **`scripts/cost-optimization/deploy-rds-scheduler-manual.ps1`** (Windows)
   - PowerShell version
   - Same functionality

3. **`terraform/environments/dev/terraform.tfvars.example`**
   - Example configuration
   - Documents all cost optimization variables
   - Shows how to enable RDS scheduler

### Documentation Created

1. **`docs/RDS_SCHEDULER_DEPLOYMENT.md`**
   - Complete deployment guide
   - Both manual and Terraform methods
   - Troubleshooting section
   - Cost analysis
   - Cron schedule reference

2. **`scripts/cost-optimization/README.md`** (updated)
   - Quick start section
   - Links to deployment guide

## Next Steps

### For Current Environment (dev01)

1. **Deploy manually** (do this now):
   ```bash
   ./scripts/cost-optimization/deploy-rds-scheduler-manual.sh
   ```

2. **Verify deployment**:
   ```bash
   aws lambda get-function --function-name dev-rds-scheduler
   aws events list-rules --name-prefix dev-
   ```

3. **Monitor first execution**:
   ```bash
   aws logs tail /aws/lambda/dev-rds-scheduler --follow
   ```

4. **Test manual override** (if needed):
   ```bash
   ./scripts/rds-manual-control/stop-dev-rds.sh
   ```

### For New Environments (dev02, dev03, etc.)

1. **Copy environment config**:
   ```bash
   cp -r terraform/environments/dev terraform/environments/dev02
   ```

2. **Update terraform.tfvars**:
   ```hcl
   sub_environment = "dev02"
   enable_rds_scheduler = true  # Enable from the start
   ```

3. **Deploy everything**:
   ```bash
   cd terraform/environments/dev02
   terraform init
   terraform apply
   ```

### For Production/Staging

**Important**: Keep RDS scheduler **disabled** for production:

```hcl
enable_rds_scheduler = false  # Production should stay running
```

## Cost Impact

### Expected Savings

**Without Scheduler:**
- 720 hours/month × $0.12/hour = **$86.40/month**

**With Scheduler (10 hours/day, 5 days/week):**
- 200 hours/month × $0.12/hour = **$24.00/month**

**Savings:** **$62.40/month per environment (72%)**

### Multi-Environment Savings

| Environments | Monthly | Annual |
|-------------|---------|--------|
| 1 (dev01) | $62 | $748 |
| 3 (dev01-03) | $187 | $2,246 |
| 5 (dev01-05) | $312 | $3,744 |

## Migration Path

### Current State
```
✅ Manual deployment available
✅ Terraform ready (disabled by default)
✅ Works with limited IAM permissions
✅ Can be imported to Terraform later
```

### Future State (when IAM permissions granted)

**Option A: Import existing resources**
```bash
cd terraform/environments/dev
terraform import 'module.rds_scheduler[0].aws_lambda_function.rds_scheduler' dev-rds-scheduler
terraform import 'module.rds_scheduler[0].aws_iam_role.rds_scheduler' dev-rds-scheduler-role
# ... other resources
```

**Option B: Recreate via Terraform**
```bash
# Delete manual resources
aws lambda delete-function --function-name dev-rds-scheduler
aws iam delete-role --role-name dev-rds-scheduler-role
# ... other resources

# Enable in Terraform
terraform apply -var="enable_rds_scheduler=true"
```

## Files Modified/Created

### Created
- ✅ `scripts/cost-optimization/deploy-rds-scheduler-manual.sh`
- ✅ `scripts/cost-optimization/deploy-rds-scheduler-manual.ps1`
- ✅ `docs/RDS_SCHEDULER_DEPLOYMENT.md`
- ✅ `terraform/environments/dev/terraform.tfvars.example`
- ✅ `RDS_SCHEDULER_SETUP_COMPLETE.md` (this file)

### Modified
- ✅ `terraform/environments/dev/main.tf`
  - Added `enable_rds_scheduler` variable
  - Made `rds_scheduler` module conditional
  - Updated outputs
- ✅ `scripts/cost-optimization/README.md`
  - Added Quick Start section
  - Links to deployment guide

## References

- **Deployment Guide**: [docs/RDS_SCHEDULER_DEPLOYMENT.md](docs/RDS_SCHEDULER_DEPLOYMENT.md)
- **IAM Permissions**: [IAM_PERMISSION_REQUEST.md](IAM_PERMISSION_REQUEST.md)
- **Cost Optimization**: [COST_OPTIMIZATION_IMPLEMENTATION_GUIDE.md](COST_OPTIMIZATION_IMPLEMENTATION_GUIDE.md)
- **Manual Control Scripts**: [scripts/rds-manual-control/README.md](scripts/rds-manual-control/README.md)

## Questions?

### How do I deploy for the current environment?
```bash
./scripts/cost-optimization/deploy-rds-scheduler-manual.sh
```

### How do I enable for new environments?
In `terraform.tfvars`:
```hcl
enable_rds_scheduler = true
```

### Can I change the schedule?
Yes, edit the cron expressions in the deployment script or Terraform module.

### Will this affect production?
No, the scheduler is disabled by default and should remain disabled for production.

### Can I manually control RDS outside the schedule?
Yes, use:
```bash
./scripts/rds-manual-control/start-dev-rds.sh
./scripts/rds-manual-control/stop-dev-rds.sh
```

---

**Status**: ✅ Complete and ready for deployment
**Next Action**: Run `./scripts/cost-optimization/deploy-rds-scheduler-manual.sh` to deploy

