# =================================
# S3 Static Website Hosting Module
# =================================
# This module creates an S3 bucket for static website hosting
# with CloudFront CDN distribution for global content delivery

# S3 Bucket for static website hosting
resource "aws_s3_bucket" "website" {
  bucket = "${var.environment}-${var.sub_environment}-${var.project_name}-website"

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.sub_environment}-${var.project_name}-website"
    Type = "StaticWebsite"
  })
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "website" {
  bucket = aws_s3_bucket.website.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# S3 Bucket Public Access Block (allow public access for website hosting)
resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# S3 Bucket Policy for public read access (required for website hosting)
resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.website.arn}/*"
      }
    ]
  })
}

# S3 Bucket Website Configuration
resource "aws_s3_bucket_website_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "error.html"
  }
}

# Note: Using S3 website endpoint instead of OAC for proper directory index support
# CloudFront Origin Access Control
# resource "aws_cloudfront_origin_access_control" "website" {
#   name                              = "${var.environment}-${var.sub_environment}-${var.project_name}-oac"
#   description                       = "Origin Access Control for ${var.project_name} website"
#   origin_access_control_origin_type = "s3"
#   signing_behavior                  = "always"
#   signing_protocol                  = "sigv4"
#
#   lifecycle {
#     # Prevent recreation if OAC already exists
#     ignore_changes = [name]
#   }
# }

# CloudFront Distribution
resource "aws_cloudfront_distribution" "website" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = var.cloudfront_price_class

  origin {
    domain_name = aws_s3_bucket_website_configuration.website.website_endpoint
    origin_id   = "S3-${aws_s3_bucket.website.bucket}"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # Cache behavior for Next.js static assets (_next/*)
  ordered_cache_behavior {
    path_pattern           = "/_next/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.website.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 86400    # 1 day
    default_ttl = 604800   # 7 days
    max_ttl     = 31536000 # 1 year
  }

  # Cache behavior for other static assets
  ordered_cache_behavior {
    path_pattern           = "/assets/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.website.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 86400    # 1 day
    default_ttl = 604800   # 7 days
    max_ttl     = 31536000 # 1 year
  }

  # Cache behavior for static file extensions (js, css, png, etc.)
  ordered_cache_behavior {
    path_pattern           = "*.js"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.website.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 86400    # 1 day
    default_ttl = 604800   # 7 days
    max_ttl     = 31536000 # 1 year
  }

  ordered_cache_behavior {
    path_pattern           = "*.css"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.website.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 86400    # 1 day
    default_ttl = 604800   # 7 days
    max_ttl     = 31536000 # 1 year
  }

  # Cache behavior for API routes (don't cache)
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.website.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0
  }

  # Default cache behavior
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-${aws_s3_bucket.website.bucket}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600  # 1 hour
    max_ttl     = 86400 # 1 day
  }

  # Custom error responses for SPA routing
  # Note: Static assets (_next/*, *.js, *.css, etc.) should NOT be redirected to index.html
  # Only redirect actual page routes to support client-side routing
  # We need to redirect 404/403 errors to index.html for SPA routing, but the cache behaviors
  # for static assets should take precedence and prevent this redirect for those paths
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # SSL Certificate configuration
  viewer_certificate {
    cloudfront_default_certificate = var.custom_domain == null ? true : false
    acm_certificate_arn            = var.custom_domain != null ? var.ssl_certificate_arn : null
    ssl_support_method             = var.custom_domain != null ? "sni-only" : null
    minimum_protocol_version       = var.custom_domain != null ? "TLSv1.2_2021" : null
  }

  # Custom domain aliases
  aliases = var.custom_domain != null ? [var.custom_domain] : []

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.sub_environment}-${var.project_name}-cloudfront"
    Type = "CDN"
  })

  depends_on = [aws_s3_bucket.website]
}

# S3 Bucket Policy for CloudFront access
resource "aws_s3_bucket_policy" "website" {
  bucket = aws_s3_bucket.website.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontServicePrincipal"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.website.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.website.arn
          }
        }
      }
    ]
  })

  depends_on = [aws_cloudfront_distribution.website]
}

# S3 bucket for deployment artifacts/builds
resource "aws_s3_bucket" "builds" {
  bucket = "${var.environment}-${var.sub_environment}-${var.project_name}-builds"

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.sub_environment}-${var.project_name}-builds"
    Type = "BuildArtifacts"
  })
}

# Builds bucket versioning
resource "aws_s3_bucket_versioning" "builds" {
  bucket = aws_s3_bucket.builds.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Builds bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "builds" {
  bucket = aws_s3_bucket.builds.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Lifecycle policy for builds bucket
resource "aws_s3_bucket_lifecycle_configuration" "builds" {
  bucket = aws_s3_bucket.builds.id

  rule {
    id     = "delete_old_builds"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = var.build_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = var.build_retention_days
    }
  }
}
