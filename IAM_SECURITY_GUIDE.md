# IAM Security Improvements Guide

## Overview

This guide outlines the security improvements made to your AWS IAM setup, moving from broad permissions to the principle of least privilege.

## 🔒 Security Issues Addressed

### 1. **Broad IAM Permissions**

- **Problem**: `dev-airica` user had dangerous broad permissions:

  - `IAMFullAccess` - Full IAM control (DANGEROUS)
  - `PowerUserAccess` - Broad access to most AWS services
  - `Billing` - Access to billing information

- **Solution**: Created specific, restrictive policies based on actual usage patterns

### 2. **Access Key Usage for Automation**

- **Problem**: Using long-lived access keys for CI/CD and automation
- **Solution**: Implemented IAM roles with temporary credentials

## 📋 New IAM Policies

### DevUserPolicy

**Purpose**: Read-only access for development work based on actual CloudTrail usage

**Permissions**:

- EC2: Describe operations only
- ELB: Describe operations only
- ECS: Describe operations only
- RDS: Describe operations only
- ACM: Describe operations only
- Secrets Manager: Describe operations only
- CloudWatch Logs: Read access
- KMS: Describe operations only
- STS: GetCallerIdentity
- IAM: Limited read access to own user
- CloudTrail: LookupEvents

### TerraformPolicy

**Purpose**: Infrastructure management for Terraform operations

**Permissions**:

- Full access to infrastructure services (EC2, ELB, ECS, RDS, etc.)
- Limited IAM access for role/policy management
- ECR access for container images
- Route53 for DNS management
- CloudFront for CDN

### EC2ApplicationPolicy

**Purpose**: Application permissions for EC2 instances

**Permissions**:

- S3 access for media files
- Secrets Manager access for application secrets
- CloudWatch Logs for application logging

## 🔧 IAM Roles for Automation

### GitHubActionsRole

- **Trust Policy**: OIDC federation with GitHub Actions
- **Permissions**: TerraformPolicy attached
- **Usage**: CI/CD deployments without access keys

### EC2ApplicationRole

- **Trust Policy**: EC2 service principal
- **Permissions**: EC2ApplicationPolicy attached
- **Usage**: Application permissions for EC2 instances

## 🚀 Implementation Steps

### Step 1: Apply Restrictive Policies

```bash
./scripts/apply-iam-security.sh
```

This script will:

1. Create new restrictive policies
2. Attach them to your user
3. Optionally remove broad policies
4. Test permissions

### Step 2: Set Up IAM Roles

```bash
./scripts/setup-iam-roles.sh
```

This script will:

1. Create OIDC provider for GitHub Actions
2. Create GitHubActionsRole
3. Create EC2ApplicationRole
4. Create instance profiles

### Step 3: Update GitHub Actions

1. Add `AWS_ROLE_ARN` secret to your GitHub repository
2. Use the new workflow: `.github/workflows/deploy-with-iam-role.yml`
3. Remove any access keys from GitHub secrets

### Step 4: Update EC2 Instances

1. Update your Terraform to use the new instance profile
2. Remove access keys from application configuration

## 🔍 Monitoring and Verification

### Check Current Permissions

```bash
# Check user policies
aws iam list-attached-user-policies --user-name dev-airica

# Check group policies
aws iam list-attached-group-policies --group-name developers

# Test specific permissions
aws ec2 describe-instances --max-items 1
aws ecs list-clusters
aws rds describe-db-instances --max-items 1
```

### Monitor CloudTrail

```bash
# Check recent API calls
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=Username,AttributeValue=dev-airica \
  --start-time 2025-07-01 \
  --max-items 20
```

## 🛡️ Security Best Practices

### 1. **Principle of Least Privilege**

- Only grant permissions that are actually needed
- Regularly review and audit permissions
- Use CloudTrail to understand actual usage patterns

### 2. **Use IAM Roles Instead of Access Keys**

- **For EC2**: Use instance profiles
- **For Lambda**: Use execution roles
- **For CI/CD**: Use OIDC federation
- **For ECS**: Use task roles

### 3. **Enable MFA**

```bash
# Enable MFA for your user
aws iam create-virtual-mfa-device --virtual-mfa-device-name dev-airica-mfa
```

### 4. **Regular Access Reviews**

- Review IAM users monthly
- Remove unused access keys
- Audit group memberships
- Check for unused policies

### 5. **Use AWS Organizations**

- Separate environments (dev/staging/prod)
- Centralized billing and access management
- Cross-account role assumption

## 🔧 Troubleshooting

### Permission Denied Errors

If you encounter permission errors:

1. **Check the specific error**:

   ```bash
   aws sts get-caller-identity
   ```

2. **Temporarily re-attach broad policy**:

   ```bash
   aws iam attach-group-policy \
     --group-name developers \
     --policy-arn arn:aws:iam::aws:policy/PowerUserAccess
   ```

3. **Add specific permissions** to your custom policy

4. **Remove broad policy again** once fixed

### GitHub Actions Issues

1. Verify OIDC provider is created
2. Check role ARN in GitHub secrets
3. Ensure repository name matches trust policy
4. Check role permissions

## 📊 Security Metrics

Track these metrics for ongoing security:

- **Access Key Age**: Should be rotated regularly
- **Unused Policies**: Remove policies not attached to users/roles
- **Failed API Calls**: Monitor CloudTrail for access denied errors
- **MFA Usage**: Ensure all users have MFA enabled
- **Role Usage**: Monitor which roles are being used

## 🔄 Continuous Improvement

### Monthly Tasks

1. Review CloudTrail logs for unusual activity
2. Audit IAM users and permissions
3. Check for unused resources
4. Update security policies as needed

### Quarterly Tasks

1. Comprehensive IAM audit
2. Review and update access patterns
3. Test disaster recovery procedures
4. Update security documentation

## 📞 Support

If you encounter issues:

1. Check CloudTrail logs for specific error details
2. Review IAM policy simulator for permission testing
3. Use AWS Support if needed
4. Document any custom permissions added

---

**Remember**: Security is an ongoing process. Regularly review and update your IAM setup as your application evolves.
