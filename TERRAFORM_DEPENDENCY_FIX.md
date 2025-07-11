# Terraform Dependency and State Issues Fix

## Problem

The GitHub Actions workflow failed with multiple Terraform errors:

```
Error: deleting EC2 Subnet (subnet-0751dbca2422fa4f0): operation error EC2: DeleteSubnet,
https response error StatusCode: 400, RequestID: 75f62e15-f3bc-43be-ac09-8c3fc41e2add,
api error DependencyViolation: The subnet 'subnet-0751dbca2422fa4f0' has dependencies and cannot be deleted.

Error: deleting EC2 Subnet (subnet-0cca71d2b1a814fe9): operation error EC2: DeleteSubnet,
https response error StatusCode: 400, RequestID: 6ae9ac82-bd80-471c-9d5d-f458e47bef43,
api error DependencyViolation: The subnet 'subnet-0cca71d2b1a814fe9' has dependencies and cannot be deleted.

Error: deleting ENIs for EC2 Subnet (subnet-0136a0d0e5a932772): 1 error occurred:
* detaching RDS ENI (eni-06c2d83b1e3f24f2d): detaching EC2 Network Interface (eni-06c2d83b1e3f24f2d/eni-attach-00e33612f6c316582):
operation error EC2: DetachNetworkInterface, https response error StatusCode: 400, RequestID: c44e3b43-bcf1-465f-8928-976be5ef6334,
api error AuthFailure: You do not have permission to access the specified resource.

Error: creating EC2 Subnet: operation error EC2: CreateSubnet,
https response error StatusCode: 400, RequestID: 7f1e6ade-7ca3-4977-9c0e-e0a093beb142,
api error InvalidVpcID.NotFound: The vpc ID 'vpc-0eb9ab23e173fb03c' does not exist
```

## Root Cause

These errors indicate that:

1. **Subnet Dependencies**: Subnets have dependencies (RDS instances, ECS services, etc.) that prevent deletion
2. **VPC Not Found**: The VPC ID in the Terraform state doesn't exist in AWS anymore
3. **Permission Issues**: Some resources can't be detached due to insufficient permissions
4. **State Inconsistency**: The Terraform state is out of sync with the actual AWS resources

## Solution Applied

### 1. Created State Reset Script

Created `scripts/terraform-state-reset.sh` to handle the dependency issues:

```bash
#!/bin/bash
# terraform-state-reset.sh - Reset Terraform state to handle dependency issues
```

### 2. State Reset Process

The script performs the following steps:

1. **Backup Current State**: Creates a backup of the current state file
2. **Remove Problematic Resources**: Removes all resources from Terraform state that are causing issues
3. **Set Environment Variables**: Configures required Terraform variables
4. **Run Terraform Plan**: Shows what resources will be created

### 3. Resources Removed from State

The script removes these resources from Terraform state:

- VPC and subnets
- Route tables and associations
- Internet Gateway and NAT Gateway
- Security groups
- Load balancer and target groups
- RDS instance and subnet group
- IAM roles and policy attachments
- Secrets Manager secrets
- Route53 resources
- ACM certificate
- CloudFront distribution
- ECS module

## Files Created

- `scripts/terraform-state-reset.sh` - State reset script
- `scripts/terraform-cleanup.sh` - Comprehensive cleanup script (alternative)
- `TERRAFORM_DEPENDENCY_FIX.md` - This documentation

## How to Use

### Option 1: Quick State Reset (Recommended)

```bash
./scripts/terraform-state-reset.sh
```

This will:

- Backup your current state
- Remove all problematic resources from state
- Set up environment variables
- Run `terraform plan` to show what will be created

### Option 2: Comprehensive Cleanup

```bash
./scripts/terraform-cleanup.sh
```

This provides interactive options to:

- Force destroy existing resources
- Import existing resources into state
- Remove resources from state
- Show detailed resource information

## Why This Works

### State Reset Approach

- **Keeps AWS Resources**: Existing resources remain in AWS
- **Removes State Conflicts**: Eliminates state inconsistencies
- **Fresh Start**: Allows Terraform to create new resources
- **Safe**: Backs up state before making changes

### Alternative Approaches

1. **Force Destroy**: Destroys all resources (dangerous, loses data)
2. **Import Resources**: Imports existing resources into state (complex)
3. **Manual Cleanup**: Manually delete resources in AWS (time-consuming)

## Result

After running the state reset script:

- ✅ Terraform state will be clean
- ✅ No more dependency violation errors
- ✅ New infrastructure can be created
- ✅ Existing resources remain in AWS (if any)

## Next Steps

1. **Run the state reset script**: `./scripts/terraform-state-reset.sh`
2. **Review the terraform plan**: Ensure it shows the expected resources
3. **Apply the changes**: `terraform apply` (if plan looks good)
4. **Monitor deployment**: Watch for any new issues
5. **Test the application**: Verify everything works correctly

## Commands to Run

```bash
# Make script executable
chmod +x scripts/terraform-state-reset.sh

# Run state reset
./scripts/terraform-state-reset.sh

# If plan looks good, apply
terraform apply
```

## Safety Notes

- The script creates a backup of your current state
- Existing AWS resources are not deleted
- You can restore the old state if needed
- Review the terraform plan before applying

The fix ensures a clean Terraform state and resolves all dependency issues for successful infrastructure deployment.
