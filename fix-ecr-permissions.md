# Fix ECR Permissions for dev-airica User

## Problem

The GitHub Actions deployment is failing because the AWS IAM user `dev-airica` has an explicit deny on `ecr:GetAuthorizationToken`, preventing ECR login during Docker image push.

## Error Message

```
User: arn:aws:iam::570827307849:user/dev-airica is not authorized to perform: ecr:GetAuthorizationToken
```

## Solution: Fix in AWS Console

### Step 1: Access IAM Console

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Navigate to **Users** → **dev-airica**

### Step 2: Check Current Policies

1. Click on the **dev-airica** user
2. Go to the **Permissions** tab
3. Review all attached policies (both **Managed policies** and **Inline policies**)

### Step 3: Remove Explicit Deny (if present)

Look for any policy that contains:

```json
{
  "Effect": "Deny",
  "Action": "ecr:GetAuthorizationToken",
  "Resource": "*"
}
```

If found:

1. Click on the policy name
2. Click **Edit policy**
3. Remove the deny statement for `ecr:GetAuthorizationToken`
4. Save the policy

### Step 4: Add ECR Permissions

If no explicit deny is found, or after removing it, add ECR permissions:

#### Option A: Attach AWS Managed Policy (Recommended)

1. In the **Permissions** tab, click **Add permissions**
2. Choose **Attach existing policies directly**
3. Search for and select **AmazonEC2ContainerRegistryPowerUser**
4. Click **Next** and **Add permissions**

#### Option B: Create Custom Inline Policy

1. In the **Permissions** tab, click **Add permissions**
2. Choose **Create inline policy**
3. Go to the **JSON** tab
4. Replace the content with:

```json
{
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
        "ecr:PutImage"
      ],
      "Resource": "*"
    }
  ]
}
```

5. Click **Review policy**
6. Name it `ECRDeploymentPolicy`
7. Click **Create policy**

### Step 5: Verify Permissions

1. Go back to the **dev-airica** user
2. Click **Add permissions** → **Attach existing policies directly**
3. Verify that ECR permissions are now attached

## Alternative: Create New IAM User (If preferred)

If you want to create a fresh IAM user for GitHub Actions:

### Step 1: Create New User

1. Go to IAM Console → **Users** → **Create user**
2. Name: `github-actions-deploy`
3. Select **Programmatic access**

### Step 2: Attach Policies

1. Attach **AmazonEC2ContainerRegistryPowerUser**
2. Attach any other necessary policies for your deployment

### Step 3: Update GitHub Secrets

1. Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**
2. Update `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` with the new user's credentials

## Test the Fix

After making the changes:

1. **Re-run the GitHub Actions workflow** that failed
2. **Monitor the logs** to ensure ECR login succeeds
3. **Verify deployment** completes successfully

## Required ECR Permissions

The deployment needs these ECR permissions:

- `ecr:GetAuthorizationToken` - For ECR login
- `ecr:BatchCheckLayerAvailability` - Check if layers exist
- `ecr:GetDownloadUrlForLayer` - Get layer download URLs
- `ecr:BatchGetImage` - Pull images
- `ecr:InitiateLayerUpload` - Start uploading layers
- `ecr:UploadLayerPart` - Upload layer parts
- `ecr:CompleteLayerUpload` - Complete layer upload
- `ecr:PutImage` - Push images

## Troubleshooting

If the issue persists:

1. Check if there are any **Service Control Policies (SCPs)** at the organization level
2. Verify the user is not in a group with conflicting policies
3. Check CloudTrail logs for detailed permission denial reasons

## Status

🟡 **PENDING** - Requires manual action in AWS Console to fix IAM permissions.
