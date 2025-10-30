# =================================
# S3 Shared Bucket Module
# =================================
# Creates shared S3 buckets with sub-environment prefixes
# for cost optimization and simplified management

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# =================================
# KMS Key for S3 Encryption
# =================================
resource "aws_kms_key" "s3" {
  description             = "KMS key for ${var.environment} S3 bucket encryption"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-${var.bucket_name}-kms"
    Environment = var.environment
    Type        = "KMSKey"
  })
}

resource "aws_kms_alias" "s3" {
  name          = "alias/${var.environment}-${var.bucket_name}-s3"
  target_key_id = aws_kms_key.s3.key_id
}

# =================================
# S3 Bucket
# =================================
resource "aws_s3_bucket" "main" {
  bucket = "${var.environment}-${var.bucket_name}"

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-${var.bucket_name}"
    Environment = var.environment
    Type        = "S3Bucket"
  })
}

# Block all public access
resource "aws_s3_bucket_public_access_block" "main" {
  bucket = aws_s3_bucket.main.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "main" {
  bucket = aws_s3_bucket.main.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
    bucket_key_enabled = true  # Reduces KMS API calls and costs
  }
}

# Versioning
resource "aws_s3_bucket_versioning" "main" {
  bucket = aws_s3_bucket.main.id

  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Suspended"
  }
}

# Lifecycle policy
resource "aws_s3_bucket_lifecycle_configuration" "main" {
  count = var.lifecycle_rules != null ? 1 : 0

  bucket = aws_s3_bucket.main.id

  dynamic "rule" {
    for_each = var.lifecycle_rules
    content {
      id     = rule.value.id
      status = rule.value.enabled ? "Enabled" : "Disabled"

      dynamic "filter" {
        for_each = rule.value.prefix != null ? [1] : []
        content {
          prefix = rule.value.prefix
        }
      }

      dynamic "transition" {
        for_each = rule.value.transitions
        content {
          days          = transition.value.days
          storage_class = transition.value.storage_class
        }
      }

      dynamic "expiration" {
        for_each = rule.value.expiration_days != null ? [1] : []
        content {
          days = rule.value.expiration_days
        }
      }

      dynamic "noncurrent_version_expiration" {
        for_each = rule.value.noncurrent_version_expiration_days != null ? [1] : []
        content {
          noncurrent_days = rule.value.noncurrent_version_expiration_days
        }
      }
    }
  }
}

# CORS configuration
resource "aws_s3_bucket_cors_configuration" "main" {
  count = var.cors_rules != null ? 1 : 0

  bucket = aws_s3_bucket.main.id

  dynamic "cors_rule" {
    for_each = var.cors_rules
    content {
      allowed_headers = cors_rule.value.allowed_headers
      allowed_methods = cors_rule.value.allowed_methods
      allowed_origins = cors_rule.value.allowed_origins
      expose_headers  = cors_rule.value.expose_headers
      max_age_seconds = cors_rule.value.max_age_seconds
    }
  }
}

# =================================
# S3 Bucket Policy (Prefix-based Access)
# =================================
resource "aws_s3_bucket_policy" "main" {
  bucket = aws_s3_bucket.main.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      # Deny all access except from authorized IAM roles
      [
        {
          Sid    = "DenyAllExceptAuthorizedRoles"
          Effect = "Deny"
          Principal = "*"
          Action = "s3:*"
          Resource = [
            aws_s3_bucket.main.arn,
            "${aws_s3_bucket.main.arn}/*"
          ]
          Condition = {
            StringNotEquals = {
              "aws:PrincipalArn" = var.authorized_role_arns
            }
          }
        }
      ],
      # Allow prefix-based access for each sub-environment
      [for prefix in var.sub_environment_prefixes : {
        Sid    = "Allow${replace(title(prefix), "/[^a-zA-Z0-9]/", "")}Access"
        Effect = "Allow"
        Principal = {
          AWS = var.authorized_role_arns
        }
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "${aws_s3_bucket.main.arn}/${prefix}/*",
          aws_s3_bucket.main.arn
        ]
        Condition = {
          StringLike = {
            "s3:prefix" = ["${prefix}/*"]
          }
        }
      }]
    )
  })
}

# =================================
# CloudWatch Metrics (optional)
# =================================
resource "aws_s3_bucket_metric" "main" {
  count = var.enable_metrics ? 1 : 0

  bucket = aws_s3_bucket.main.id
  name   = "${var.environment}-${var.bucket_name}-metrics"
}

# =================================
# S3 Bucket Logging (optional)
# =================================
resource "aws_s3_bucket_logging" "main" {
  count = var.logging_target_bucket != null ? 1 : 0

  bucket = aws_s3_bucket.main.id

  target_bucket = var.logging_target_bucket
  target_prefix = "${var.environment}-${var.bucket_name}/"
}

