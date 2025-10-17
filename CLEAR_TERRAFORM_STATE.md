# Manual Terraform State Cleanup - The Right Solution

## Current Status
- ✅ Terraform config reverted to d20e3b2 (working state)
- ✅ Workflow reverted to d20e3b2 (clean, no workarounds)
- ❌ State file in S3 is corrupted
- ✅ Manual RDS scheduler is deployed and working

## State File Location
```
s3://hibiji-terraform-state/dev/dev01/terraform.tfstate
```

## Solution: Clear the Corrupted State

### Step 1: Backup the Current (Corrupted) State
```bash
aws s3 cp s3://hibiji-terraform-state/dev/dev01/terraform.tfstate ./backup-corrupted-state.tfstate
```

### Step 2: Delete the Corrupted State File
```bash
aws s3 rm s3://hibiji-terraform-state/dev/dev01/terraform.tfstate
```

### Step 3: Push the Reverted Code
```bash
git push
```

### Step 4: Let CI/CD Create Fresh State
The next deployment will:
1. Initialize with empty state
2. Create all resources fresh (most already exist in AWS)
3. Import existing resources as needed (workflow handles this)

## What Will Happen

### Resources That Already Exist in AWS:
- RDS Aurora cluster
- VPC, subnets, security groups
- S3 buckets
- Lambda functions
- CloudFront distributions
- ACM certificates
- All other infrastructure

### How Terraform Will Handle Them:
The workflow has logic to:
1. Detect fresh deployment (empty state)
2. Import existing resources automatically
3. Continue deployment

### Example from workflow (line ~415):
```yaml
# Check and import existing RDS DB Subnet Group if it exists
SUBNET_GROUP_NAME="${MAIN_ENV}-${ENVIRONMENT}-${PROJECT_NAME}-db-subnet-group"
if aws rds describe-db-subnet-groups --db-subnet-group-name "$SUBNET_GROUP_NAME" --output text; then
  terraform import aws_db_subnet_group.database "$SUBNET_GROUP_NAME"
fi
```

## Expected Outcome
- ✅ Clean Terraform state
- ✅ All existing AWS resources preserved
- ✅ CI/CD pipeline works normally
- ✅ No more state corruption errors
- ✅ Can detect drift again

## Commands to Run

```bash
# 1. Backup the corrupted state
aws s3 cp s3://hibiji-terraform-state/dev/dev01/terraform.tfstate ./backup-corrupted-state-$(date +%Y%m%d-%H%M%S).tfstate

# 2. Delete the corrupted state
aws s3 rm s3://hibiji-terraform-state/dev/dev01/terraform.tfstate

# 3. Push the reverted code
git push

# 4. Watch the deployment
gh run watch --exit-status
```

## Safety Notes
- ✅ AWS resources are NOT deleted (only state file is removed)
- ✅ Workflow has automatic import logic for existing resources
- ✅ Backup of corrupted state is saved locally
- ✅ Can restore backup if needed

## If Something Goes Wrong
If the deployment fails after clearing state:

1. **Check what resources exist:**
   ```bash
   aws rds describe-db-clusters --query 'DBClusters[?DBClusterIdentifier==`dev-dev01-dpp-database`]'
   aws s3 ls | grep dev-dev01
   ```

2. **Restore backup state:**
   ```bash
   aws s3 cp ./backup-corrupted-state.tfstate s3://hibiji-terraform-state/dev/dev01/terraform.tfstate
   ```

3. **Manual import if needed:**
   ```bash
   cd terraform/environments/dev
   terraform init
   terraform import aws_vpc.main vpc-xxxxx
   # ... import other resources
   ```

## Ready to Execute?

Run these commands in order:
1. `aws s3 cp s3://hibiji-terraform-state/dev/dev01/terraform.tfstate ./backup-corrupted-state.tfstate`
2. `aws s3 rm s3://hibiji-terraform-state/dev/dev01/terraform.tfstate`
3. `git push`

Then monitor the deployment!

---
**This is the CLEAN solution - no workarounds, just fixing the root cause.**

