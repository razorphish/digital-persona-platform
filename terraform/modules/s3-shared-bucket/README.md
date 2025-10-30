# S3 Shared Bucket Module

Creates shared S3 buckets with sub-environment prefixes for cost optimization and simplified management.

## Features

- ✅ **Shared Bucket Strategy** - One bucket, multiple sub-environment prefixes
- ✅ **KMS Encryption** - All data encrypted at rest
- ✅ **Public Access Blocked** - No public access allowed
- ✅ **Prefix-based IAM Policies** - Each sub-env only accesses its prefix
- ✅ **Lifecycle Policies** - Automatic transition to cheaper storage classes
- ✅ **Versioning** - Optional version control
- ✅ **CORS Support** - For direct browser uploads

## Usage

```hcl
module "uploads_bucket" {
  source = "../../modules/s3-shared-bucket"

  environment  = "nonprod"
  bucket_name  = "vwr-uploads"
  region       = "us-west-1"

  # Sub-environment prefixes
  sub_environment_prefixes = [
    "dev01",
    "dev02",
    "qa01",
    "staging"
  ]

  # Authorized IAM roles
  authorized_role_arns = [
    module.lambda_dev01.lambda_role_arn,
    module.lambda_dev02.lambda_role_arn,
    module.lambda_qa01.lambda_role_arn,
    module.batch_dev01.batch_execution_role_arn
  ]

  # Versioning
  enable_versioning = true

  # Lifecycle rules
  lifecycle_rules = [
    {
      id      = "transition-to-ia"
      enabled = true
      prefix  = null  # Apply to all objects
      transitions = [
        {
          days          = 30
          storage_class = "STANDARD_IA"  # After 30 days
        },
        {
          days          = 90
          storage_class = "GLACIER_IR"  # After 90 days
        }
      ]
      expiration_days                    = 365  # Delete after 1 year
      noncurrent_version_expiration_days = 90   # Delete old versions after 90 days
    }
  ]

  # CORS for direct browser uploads
  cors_rules = [
    {
      allowed_headers = ["*"]
      allowed_methods = ["GET", "PUT", "POST"]
      allowed_origins = [
        "https://dev01.vitalwomanreset.com",
        "https://dev02.vitalwomanreset.com"
      ]
      expose_headers  = ["ETag"]
      max_age_seconds = 3000
    }
  ]

  common_tags = {
    Project   = "vital-woman-reset"
    ManagedBy = "Terraform"
  }
}
```

## Bucket Structure

```
nonprod-vwr-uploads/
  ├── dev01/
  │   ├── user-123/
  │   │   ├── uploads/
  │   │   │   ├── document1.pdf
  │   │   │   └── image1.jpg
  │   │   └── processed/
  │   │       └── analysis-results.json
  │   └── user-456/
  │       └── uploads/
  │           └── audio1.mp3
  ├── dev02/
  │   └── user-789/
  │       └── uploads/
  │           └── video1.mp4
  ├── qa01/
  │   └── ...
  └── staging/
      └── ...
```

## IAM Policy Example

Lambda functions get prefix-scoped access:

```hcl
# Automatically created by module
resource "aws_iam_role_policy" "lambda_s3_access" {
  role = aws_iam_role.lambda_dev01.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = "${module.uploads_bucket.bucket_arn}/dev01/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = module.uploads_bucket.bucket_arn
        Condition = {
          StringLike = {
            "s3:prefix" = ["dev01/*"]
          }
        }
      }
    ]
  })
}
```

## Lifecycle Example

Optimize storage costs automatically:

| Age | Storage Class | Cost Savings |
|-----|---------------|--------------|
| 0-30 days | STANDARD | $0.023/GB |
| 30-90 days | STANDARD_IA | $0.0125/GB (46% cheaper) |
| 90-365 days | GLACIER_IR | $0.004/GB (83% cheaper) |
| 365+ days | Deleted | $0 (100% savings) |

**Example:** 1TB of data over 1 year:
- **Without lifecycle:** $276/year (all in STANDARD)
- **With lifecycle:** ~$120/year (**56% savings**)

## Direct Browser Upload (Pre-signed URL)

Lambda generates pre-signed URLs for secure direct uploads:

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({ region: 'us-west-1' });

export async function generateUploadUrl(userId: string, fileName: string) {
  const key = `${process.env.SUB_ENVIRONMENT}/user-${userId}/uploads/${fileName}`;
  
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: key,
    ContentType: 'application/octet-stream',
  });

  // URL expires in 1 hour
  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  
  return { uploadUrl: url, key };
}
```

Frontend uploads directly to S3:

```typescript
async function uploadFile(file: File, uploadUrl: string) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });
  
  if (!response.ok) throw new Error('Upload failed');
  return response;
}
```

## Cost Comparison

### Current: 1 Bucket Per Sub-Environment
- 10 sub-environments × $0 base cost = $0 (buckets are free)
- BUT: 10 separate buckets to manage
- Complexity: High

### Optimized: Shared Bucket with Prefixes
- 2 buckets (nonprod + prod) × $0 = $0 (buckets are free)
- Complexity: Low
- Easier lifecycle policies (apply once, not per bucket)

**Cost:** Same ($0), but **much simpler to manage** 🎉

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| environment | Environment name | string | - | yes |
| bucket_name | Base bucket name | string | - | yes |
| authorized_role_arns | Authorized IAM role ARNs | list(string) | [] | no |
| sub_environment_prefixes | Sub-environment prefixes | list(string) | [] | no |
| enable_versioning | Enable versioning | bool | true | no |
| lifecycle_rules | Lifecycle rules | list(object) | null | no |
| cors_rules | CORS rules | list(object) | null | no |

## Outputs

| Name | Description |
|------|-------------|
| bucket_name | S3 bucket name |
| bucket_arn | S3 bucket ARN |
| bucket_domain_name | Bucket domain name |
| kms_key_arn | KMS key ARN |
| bucket_config | Summary configuration object |

## Requirements

- Terraform >= 1.5.0
- AWS Provider ~> 5.0

## Security Notes

- ✅ **KMS encryption at rest** - All data encrypted
- ✅ **Public access blocked** - No public access allowed
- ✅ **Prefix-based access control** - IAM policies enforce boundaries
- ✅ **Bucket key enabled** - Reduces KMS costs
- ✅ **Versioning** - Protects against accidental deletion
- ✅ **Lifecycle policies** - Automatic data management

