# GitHub Actions S3 Permissions Fix

## Problem

The GitHub Actions workflow was failing with multiple IAM permission issues:

1. **S3 Permission Error:**

```
The failure occurred because the GitHub Actions job is not authorized to perform s3:GetObject on arn:aws:s3:::hibiji-terraform-state/main/terraform.tfstate. This is an AWS IAM permission issue.
```

2. **IAM GetUser Permission Error:**

```
An error occurred (AccessDenied) when calling the GetUser operation: User: arn:aws:sts::570827307849:assumed-role/GitHubActionsRole/GitHubActions is not authorized to perform: iam:GetUser on resource: user GitHubActions because no identity-based policy allows the iam:Get
```

## Root Cause

The `TerraformPolicy` attached to the `GitHubActionsRole` was missing several permissions:

1. **S3 permissions** required for Terraform to access the state file stored in S3
2. **IAM GetUser permission** required for the security scan job to verify user identity

## Solution Applied

### 1. Updated TerraformPolicy

Added new permissions to `terraform/iam-policies/terraform-policy.json`:

**S3 Access Statement:**

```json
{
  "Sid": "TerraformS3Access",
  "Effect": "Allow",
  "Action": [
    "s3:GetObject",
    "s3:PutObject",
    "s3:DeleteObject",
    "s3:ListBucket"
  ],
  "Resource": [
    "arn:aws:s3:::hibiji-terraform-state",
    "arn:aws:s3:::hibiji-terraform-state/*"
  ]
}
```

**IAM GetUser Permission (added to existing TerraformIAMAccess statement):**

```json
"iam:GetUser"
```

### 2. Created Update Script

Created `scripts/update-terraform-policy.sh` to:

- Update the existing TerraformPolicy in AWS
- Create a new policy version with S3 permissions
- Clean up old policy versions
- Verify the update was successful

### 3. Applied the Fix

Ran the update script to apply the new permissions to the existing policy.

## Files Modified

- `terraform/iam-policies/terraform-policy.json` - Added S3 permissions
- `scripts/update-terraform-policy.sh` - Created update script
- `scripts/test-s3-permissions.sh` - Created test script

## Verification

The fix was verified by:

1. Successfully updating the TerraformPolicy in AWS
2. Testing S3 bucket access (`s3:ListBucket`)
3. Testing S3 object retrieval (`s3:GetObject`)
4. Testing IAM user access (`iam:GetUser`)

## Result

The GitHub Actions workflow should now be able to:

- Access the Terraform state file: `s3://hibiji-terraform-state/main/terraform.tfstate`
- Perform `terraform init`, `plan`, and `apply` operations
- Deploy infrastructure successfully without permission errors
- Run security scans with IAM user verification
- Execute all AWS CLI commands in the security-scan job

## Next Steps

1. Test the GitHub Actions workflow
2. Monitor the deployment process
3. Verify that all Terraform operations work correctly

## Commands Used

```bash
# Update the policy
./scripts/update-terraform-policy.sh

# Test the permissions
./scripts/test-s3-permissions.sh
```

## IAM Role Chain

```
GitHub Actions → GitHubActionsRole → TerraformPolicy → S3 Permissions
```

The fix ensures that the GitHub Actions workflow can access the Terraform state file and perform all necessary infrastructure operations.
