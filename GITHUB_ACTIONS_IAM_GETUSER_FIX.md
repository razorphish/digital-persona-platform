# GitHub Actions IAM GetUser Fix

## Problem

The GitHub Actions workflow was failing in the security-scan job with the following error:

```
An error occurred (ValidationError) when calling the GetUser operation: Must specify userName when calling with non-User credentials
```

## Root Cause

When using an assumed IAM role (like in GitHub Actions with OIDC), `aws iam get-user` fails because role sessions don't have a "user" identity, only a role identity. The command was being called in the "Check IAM permissions" step:

```yaml
- name: Check IAM permissions
  run: |
    aws sts get-caller-identity
    aws iam get-user  # This fails with assumed roles
```

## Solution Applied

### 1. Removed Problematic Command

Updated the workflow to remove `aws iam get-user` and use only `aws sts get-caller-identity`:

```yaml
- name: Check IAM permissions
  run: |
    # Verify current identity (works for both users and roles)
    aws sts get-caller-identity
    echo "✅ IAM permissions check completed successfully"
```

### 2. Why This Works

- `aws sts get-caller-identity` works for both user and role credentials
- It provides the necessary identity information without requiring a user context
- It's the recommended approach for assumed role scenarios

## Files Modified

- `.github/workflows/deploy-with-iam-role.yml` - Removed `aws iam get-user` command
- `GITHUB_ACTIONS_S3_FIX.md` - Updated documentation to reflect the fix

## Technical Details

### Assumed Role vs User Credentials

- **User Credentials**: Have a user identity that can be queried with `aws iam get-user`
- **Assumed Role Credentials**: Have a role identity that cannot be queried with `aws iam get-user`

### GitHub Actions OIDC

GitHub Actions uses OIDC (OpenID Connect) to assume IAM roles, which creates assumed role credentials. This is why `aws iam get-user` fails.

### Alternative Commands

Instead of `aws iam get-user`, use:

- `aws sts get-caller-identity` - Shows current identity (works for both users and roles)
- `aws iam get-role --role-name ROLE_NAME` - If you need role information specifically

## Result

The security-scan job should now:

- ✅ Complete successfully without IAM permission errors
- ✅ Verify identity using `aws sts get-caller-identity`
- ✅ Provide clear feedback about the current identity
- ✅ Work correctly with GitHub Actions OIDC authentication

## Next Steps

1. Test the GitHub Actions workflow
2. Monitor the security-scan job execution
3. Verify that all AWS CLI commands work correctly

## Commands Comparison

### ❌ Before (Failed with assumed roles)

```bash
aws sts get-caller-identity
aws iam get-user  # Fails with ValidationError
```

### ✅ After (Works with both users and roles)

```bash
aws sts get-caller-identity  # Works for both
echo "✅ IAM permissions check completed successfully"
```

The fix ensures that the workflow works correctly with GitHub Actions OIDC authentication and assumed IAM roles.
