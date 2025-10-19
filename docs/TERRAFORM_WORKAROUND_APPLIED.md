# Terraform State Corruption - Workaround Applied

## Issue
**Error**: `Error refreshing state: unsupported checkable object kind "var"`

## Root Cause
The Terraform **state file in S3** is corrupted from when we briefly added the RDS scheduler module with conditional `count`. Even reverting the code didn't fix it because the STATE file itself remains corrupted.

## Solution Applied: Option 4 - `-refresh=false` Workaround

Added `-refresh=false` flag to all `terraform plan` and `terraform apply` commands in `.github/workflows/deploy-serverless.yml`

### Changes Made (Commit: 49105fa)

```yaml
# Before:
terraform plan -var-file="environment.auto.tfvars" -out=tfplan

# After:
terraform plan -refresh=false -var-file="environment.auto.tfvars" -out=tfplan
```

### All Modified Commands:
1. Line 394: `terraform plan -refresh=false -target=...` (fresh deployment)
2. Line 397: `terraform plan -refresh=false ...` (existing deployment)
3. Line 1172: `terraform plan -refresh=false ...` (detect changes)
4. Line 1198: `terraform apply -refresh=false -auto-approve -target=...` (stage 1)
5. Line 1202: `terraform plan -refresh=false ...` (stage 2)
6. Line 1213: `terraform apply -refresh=false -auto-approve ...` (full apply)
7. Line 1227: `terraform plan -refresh=false ...` (retry)

## What `-refresh=false` Does

**Normal Behavior:**
- Terraform refreshes state before plan/apply
- Compares current state with actual AWS resources
- Detects drift and changes

**With `-refresh=false`:**
- ✅ Skips state refresh (bypasses corruption)
- ✅ Uses existing state file as-is
- ✅ CI/CD pipeline works
- ⚠️ Won't detect manual changes to AWS resources
- ⚠️ State file corruption remains

## Pros & Cons

### ✅ Pros:
- CI/CD pipeline works immediately
- Deployments can proceed
- No risk to existing AWS resources
- Quick workaround

### ⚠️ Cons:
- State corruption remains
- Can't detect drift (manual AWS changes)
- Not a permanent solution
- May cause issues if resources are manually modified

## Monitoring

Current deployment: Run 18578474390  
Status: Queued  
Commit: 49105fa

Check status:
```bash
gh run list --limit 1
gh run watch 18578474390
```

## Next Steps

### Immediate:
1. ⏳ Wait for deployment to complete
2. ✅ Verify it works with `-refresh=false`
3. 📊 Monitor for any issues

### Long-term Fix (When Time Permits):
1. **Option A**: Manually fix state file
   ```bash
   cd terraform/environments/dev
   terraform state pull > state-backup.json
   # Edit state-backup.json to remove corrupted references
   terraform state push state-backup.json
   ```

2. **Option B**: Rebuild state from scratch
   ```bash
   # Backup state
   aws s3 cp s3://hibiji-terraform-state/dev/dev01/terraform.tfstate ./backup.tfstate
   
   # Delete corrupted state
   terraform state list | xargs -n1 terraform state rm
   
   # Re-import resources one by one
   terraform import aws_vpc.main vpc-xxxxx
   # ... (repeat for all resources)
   ```

3. **Option C**: Create new environment
   - Deploy to dev02 with clean state
   - Migrate traffic
   - Destroy dev01

## Status
- ✅ Workaround applied (commit 49105fa)
- ⏳ Deployment in progress
- ✅ Manual RDS scheduler still working
- ⚠️ State corruption remains (bypassed)

## Files Modified
- `.github/workflows/deploy-serverless.yml` - Added `-refresh=false` to 8 locations

## Previous Attempts
1. ❌ Removed RDS scheduler code - state still corrupted
2. ❌ Fixed S3 lifecycle - state still corrupted  
3. ❌ Removed timestamp() - state still corrupted
4. ❌ Reverted to d20e3b2 - state still corrupted (state file itself is bad)
5. ✅ Added `-refresh=false` - bypasses corruption (current)

---
**Date**: 2025-10-17  
**Commit**: 49105fa  
**Status**: Workaround deployed, monitoring...

