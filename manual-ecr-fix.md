# Manual ECR Permissions Fix for dev-airica User

## Problem

The `dev-airica` user has explicit denies on both ECR and IAM operations, preventing:

1. `ecr:GetAuthorizationToken` - needed for ECR login
2. `iam:AttachUserPolicy` - needed to modify user policies

## Solution Options

### Option 1: Use AWS Console (Recommended)

1. **Log into AWS Console** with an admin account (not dev-airica)
2. **Navigate to IAM** → Users → dev-airica
3. **Check attached policies** and look for explicit deny statements
4. **Remove or modify the deny statements** that block ECR access

### Option 2: Create a New User for GitHub Actions

1. **Create a new IAM user** specifically for GitHub Actions:

   ```bash
   aws iam create-user --user-name github-actions
   ```

2. **Create access keys** for the new user:

   ```bash
   aws iam create-access-key --user-name github-actions
   ```

3. **Attach ECR permissions** to the new user:

   ```bash
   # Create ECR policy
   aws iam create-policy \
     --policy-name ECRGitHubActions \
     --policy-document '{
       "Version": "2012-10-17",
       "Statement": [
         {
           "Effect": "Allow",
           "Action": [
             "ecr:GetAuthorizationToken",
             "ecr:BatchCheckLayerAvailability",
             "ecr:GetDownloadUrlForLayer",
             "ecr:BatchGetImage",
             "ecr:InitiateLayerUpload",
             "ecr:UploadLayerPart",
             "ecr:CompleteLayerUpload",
             "ecr:PutImage",
             "ecr:DescribeRepositories",
             "ecr:ListRepositories",
             "ecr:DescribeImages",
             "ecr:ListImages",
             "ecr:BatchDeleteImage",
             "ecr:CreateRepository",
             "ecr:DeleteRepository"
           ],
           "Resource": "*"
         }
       ]
     }'

   # Attach to user
   aws iam attach-user-policy \
     --user-name github-actions \
     --policy-arn arn:aws:iam::570827307849:policy/ECRGitHubActions
   ```

4. **Update GitHub secrets** with the new user's credentials

### Option 3: Use AWS CLI with Admin Account

If you have admin access, run this command:

```bash
# First, check what policies are attached
aws iam list-attached-user-policies --user-name dev-airica
aws iam list-groups-for-user --user-name dev-airica

# Then remove the problematic policies or modify them
# You'll need to identify which policy contains the explicit deny
```

### Option 4: Temporary Workaround - Use Different AWS Credentials

1. **Create a new IAM user** with minimal ECR permissions
2. **Update GitHub repository secrets**:
   - Go to Settings → Secrets and variables → Actions
   - Update `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` with new credentials

## Recommended Approach

**Use Option 2** (Create a new user) as it's the cleanest solution:

1. The `dev-airica` user appears to have very restrictive policies
2. Creating a dedicated GitHub Actions user follows security best practices
3. It avoids conflicts with existing restrictive policies

## Steps to Implement Option 2

1. **Run the create-user script** (if you have admin access):

   ```bash
   ./create-dev-aws-user.sh
   # Enter "github-actions" as the username
   # Don't restrict to region only
   ```

2. **Update GitHub secrets**:

   - Go to your GitHub repository
   - Settings → Secrets and variables → Actions
   - Update `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`

3. **Test the workflow** by pushing a commit

## Policy Analysis

The error message indicates:

- User: `arn:aws:iam::570827307849:user/dev-airica`
- Action: `ecr:GetAuthorizationToken`
- Issue: "explicit deny in an identity-based policy"

This means there's a policy (either attached directly or through a group) that explicitly denies ECR actions. You need to either:

- Remove the deny statement
- Override it with an allow statement
- Use a different user with proper permissions
