# =================================
# S3 Static Website Outputs
# =================================

output "website_bucket_id" {
  description = "ID of the S3 website bucket"
  value       = aws_s3_bucket.website.id
}

output "website_bucket_arn" {
  description = "ARN of the S3 website bucket"
  value       = aws_s3_bucket.website.arn
}

output "website_bucket_domain_name" {
  description = "Domain name of the S3 website bucket"
  value       = aws_s3_bucket.website.bucket_domain_name
}

output "website_bucket_regional_domain_name" {
  description = "Regional domain name of the S3 website bucket"
  value       = aws_s3_bucket.website.bucket_regional_domain_name
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.website.id
}

output "cloudfront_distribution_arn" {
  description = "ARN of the CloudFront distribution"
  value       = aws_cloudfront_distribution.website.arn
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.website.domain_name
}

output "website_url" {
  description = "Full URL of the website"
  value       = "https://${aws_cloudfront_distribution.website.domain_name}"
}

output "builds_bucket_id" {
  description = "ID of the builds/artifacts S3 bucket"
  value       = aws_s3_bucket.builds.id
}

output "builds_bucket_arn" {
  description = "ARN of the builds/artifacts S3 bucket"
  value       = aws_s3_bucket.builds.arn
} 