# =================================
# S3 Shared Bucket Outputs
# =================================

# Bucket
output "bucket_id" {
  description = "ID of the S3 bucket"
  value       = aws_s3_bucket.main.id
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.main.arn
}

output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.main.bucket
}

output "bucket_domain_name" {
  description = "Domain name of the S3 bucket"
  value       = aws_s3_bucket.main.bucket_domain_name
}

output "bucket_regional_domain_name" {
  description = "Regional domain name of the S3 bucket"
  value       = aws_s3_bucket.main.bucket_regional_domain_name
}

# KMS
output "kms_key_id" {
  description = "ID of the KMS key used for encryption"
  value       = aws_kms_key.s3.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for encryption"
  value       = aws_kms_key.s3.arn
}

# Summary
output "bucket_config" {
  description = "Summary configuration for the S3 bucket"
  value = {
    bucket_name                = aws_s3_bucket.main.bucket
    bucket_arn                 = aws_s3_bucket.main.arn
    bucket_domain_name         = aws_s3_bucket.main.bucket_domain_name
    kms_key_arn                = aws_kms_key.s3.arn
    versioning_enabled         = var.enable_versioning
    sub_environment_prefixes   = var.sub_environment_prefixes
    encryption                 = "KMS"
    public_access_blocked      = true
  }
}

