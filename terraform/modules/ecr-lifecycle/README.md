# ECR Lifecycle Policy Module

Automatically manages Docker image lifecycle in ECR to optimize storage costs.

## Features

- **Automatic Cleanup**: Removes old and unused images
- **Tag-Based Retention**: Keeps recent tagged images
- **Untagged Image Removal**: Cleans up build artifacts
- **Configurable Rules**: Customizable retention policies
- **Cost Savings**: Reduces ECR storage costs by 40-60%

## Usage

```hcl
module "ecr_lifecycle" {
  source = "../../modules/ecr-lifecycle"
  
  repository_name      = "dpp-server"
  max_image_count      = 5
  untagged_image_days  = 7
  any_image_days       = 30
}
```

## Lifecycle Rules

The module creates three rules (in priority order):

### Rule 1: Keep Last N Tagged Images
- **Priority**: 1
- **Applies to**: Tagged images with prefixes: `v`, `release-`, `main-`, `dev-`
- **Action**: Keep last 5 images (configurable), expire older ones
- **Example**: Keeps v1.0.5, v1.0.4, v1.0.3, v1.0.2, v1.0.1, deletes v1.0.0 and older

### Rule 2: Remove Untagged Images
- **Priority**: 2
- **Applies to**: Untagged images (build artifacts, failed builds)
- **Action**: Delete images older than 7 days (configurable)
- **Purpose**: Cleans up temporary build images

### Rule 3: Remove Old Images
- **Priority**: 3
- **Applies to**: Any images (fallback rule)
- **Action**: Delete images older than 30 days (configurable)
- **Purpose**: Ensures no images are kept indefinitely

## Cost Savings

### Before
- 20 images × ~200 MB = ~4 GB
- Cost: $0.10/GB/month = $0.40/month

### After
- 5 images × ~200 MB = ~1 GB
- Cost: $0.10/GB/month = $0.10/month
- **Savings: $0.30/month per repository**

With multiple repositories:
- 5 repositories × $0.30/month = **$1.50/month**
- Plus reduced data transfer costs

## Apply to Multiple Repositories

```hcl
locals {
  ecr_repositories = [
    "dpp-server",
    "dpp-web",
    "dpp-ml-service",
  ]
}

module "ecr_lifecycle" {
  for_each = toset(local.ecr_repositories)
  
  source = "../../modules/ecr-lifecycle"
  
  repository_name      = each.value
  max_image_count      = 5
  untagged_image_days  = 7
  any_image_days       = 30
}
```

## Variables

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| repository_name | ECR repository name | string | n/a | yes |
| max_image_count | Max tagged images to keep | number | 5 | no |
| untagged_image_days | Days to keep untagged images | number | 7 | no |
| any_image_days | Days to keep any image | number | 30 | no |

## Outputs

| Name | Description |
|------|-------------|
| policy_text | The ECR lifecycle policy JSON |

## Best Practices

1. **Tagged Images**: Always tag production images with semantic versioning (v1.0.0)
2. **Build Artifacts**: Let untagged images expire automatically
3. **Testing**: Start with longer retention periods and adjust based on needs
4. **Multiple Environments**: Use different retention for dev vs prod repositories

## Tag Prefixes

The module recognizes these tag patterns for retention:
- `v*` - Version tags (v1.0.0, v2.1.3)
- `release-*` - Release tags (release-2025-01-15)
- `main-*` - Main branch builds (main-abc123)
- `dev-*` - Dev branch builds (dev-feature-x)

Images with other tags or no tags will be subject to the time-based rules.

## Monitoring

View lifecycle policy execution in ECR console or via CLI:

```bash
# List images in repository
aws ecr list-images --repository-name dpp-server

# Describe lifecycle policy
aws ecr get-lifecycle-policy --repository-name dpp-server

# Preview lifecycle policy results (dry run)
aws ecr get-lifecycle-policy-preview \
  --repository-name dpp-server \
  --lifecycle-policy-text file://policy.json
```

## Notes

- Lifecycle policies run once per day
- Images are permanently deleted (cannot be recovered)
- Policy changes take effect on next daily run
- Test with preview before applying to production repositories




