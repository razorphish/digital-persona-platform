# Terraform State Refresh Error Analysis

## Problem
```
Error refreshing state: unsupported checkable object kind "var"
```

## Investigation Timeline

### Attempts Made:
1. ✅ Removed all RDS scheduler Terraform configuration (modules, variables, outputs)
2. ✅ Removed conditional `count` from S3 lifecycle configuration  
3. ✅ Removed `timestamp()` function from `common_tags`
4. ❌ Error persists - issue is in Terraform STATE, not configuration

## Root Cause
This error occurs when Terraform state contains references to variables in checkable blocks (preconditions/postconditions) or when state format is incompatible with the Terraform version being used.

## Potential Causes:
1. **Terraform State Corruption**: State file contains invalid references
2. **Terraform Version Mismatch**: State was created with different Terraform version
3. **Backend State Issue**: S3 backend state file has corruption
4. **Module State References**: Removed modules still in state

## Solutions (In Order of Likelihood)

### Solution 1: State Taint and Refresh (RECOMMENDED)
The state needs to be refreshed/rebuilt:

```bash
cd terraform/environments/dev
terraform init -reconfigure
terraform state list  # Check what's in state
terraform refresh -var-file=terraform.tfvars  # Try to refresh state
```

If refresh fails:
```bash
# Remove problematic resources from state and re-import
terraform state rm <problematic_resource>
terraform import <resource_type>.<name> <resource_id>
```

### Solution 2: Backend State Reset
If state is corrupted, may need to start fresh:

```bash
# Backup current state
aws s3 cp s3://hibiji-terraform-state/dev/dev01/terraform.tfstate ./backup-terraform.tfstate

# Remove current state (DANGER - only if you can rebuild)
terraform state list | xargs -n1 terraform state rm

# Or manually delete and reinitialize
aws s3 rm s3://hibiji-terraform-state/dev/dev01/terraform.tfstate
terraform init
terraform plan  # Should show all resources need to be created
```

### Solution 3: Terraform Version Upgrade/Downgrade
Check GitHub Actions Terraform version vs local:

GitHub Actions uses: `hashicorp/setup-terraform@v3`
Check if there's a version mismatch causing state compatibility issues.

### Solution 4: Remove Specific Problematic State Resources
The error suggests a variable reference issue. Check for:
```bash
terraform state pull > current-state.json
# Inspect current-state.json for:
# - Any "checkable" blocks
# - Variable references (var.*)
# - Removed module references (module.rds_scheduler)
```

## Recommended Immediate Action

Since the manual RDS scheduler is working and deployed outside Terraform:

1. **Option A - State Refresh** (Try this first in CI/CD workflow):
   Add before `terraform plan`:
   ```yaml
   - name: Refresh Terraform State
     run: |
       cd terraform/environments/dev
       terraform init -reconfigure
       terraform refresh -var-file=terraform.tfvars -auto-approve || true
       terraform plan -var-file=terraform.tfvars
   ```

2. **Option B - Force State Pull/Push** (Nuclear option):
   ```yaml
   - name: Handle State Issues
     run: |
       cd terraform/environments/dev
       terraform init -backend-config="key=dev/${SUB_ENVIRONMENT}/terraform.tfstate"
       terraform state pull > /tmp/state-backup.json
       terraform init -reconfigure -backend=false
       terraform init -backend-config="key=dev/${SUB_ENVIRONMENT}/terraform.tfstate"
   ```

3. **Option C - Skip Refresh** (Quickest workaround):
   Add `-refresh=false` to terraform plan/apply in workflow:
   ```yaml
   terraform plan -var-file=terraform.tfvars -refresh=false -out=tfplan
   terraform apply -refresh=false tfplan
   ```

## Status
- ✅ Manual RDS Scheduler deployed and working
- ❌ Terraform CI/CD pipeline blocked
- 🔍 Root cause: Terraform state compatibility/corruption issue
- 📝 Next step: Try Solution 1 (State Refresh) in workflow

## Files Changed
- `terraform/environments/dev/main.tf`: Removed RDS scheduler module, timestamp(), fixed S3 lifecycle
- `.gitignore`: Added lambda.zip exclusion
- Multiple commit attempts: `5b764b6`, `a3b4682`, `96bff6e`

## Recommendation
Try adding `-refresh=false` flag as immediate workaround to unblock CI/CD, then fix state properly offline.


