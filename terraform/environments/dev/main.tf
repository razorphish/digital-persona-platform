terraform {
  required_version = ">= 1.0"
  
  backend "s3" {
    bucket = "hibiji-terraform-state"
    key    = "dev/terraform.tfstate"
    region = "us-west-1"
  }
}

# Variables for sub-environment
variable "sub_environment" {
  description = "Sub-environment name (e.g., dev01, dev02)"
  type        = string
  default     = "dev01"
}

variable "environment" {
  description = "Main environment name"
  type        = string
  default     = "dev"
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "hibiji.com"
}

# Local values for sub-environment
locals {
  sub_env = var.sub_environment
  main_env = var.environment
  
  # Generate domain name for sub-environment
  domain_name = "${local.sub_env}.${var.domain_name}"
  
  # Common tags with sub-environment
  common_tags = {
    Project        = "hibiji"
    Environment    = local.main_env
    SubEnvironment = local.sub_env
    ManagedBy      = "terraform"
    Owner          = "hibiji-team"
    CostCenter     = "hibiji-platform"
  }
  
  # Resource naming with sub-environment
  resource_prefix = "hibiji-${local.sub_env}"
}

# VPC for sub-environment
resource "aws_vpc" "main" {
  cidr_block = "10.${index(["dev", "qa", "staging", "prod"], local.main_env)}.${index(["01", "02", "03"], replace(local.sub_env, "/^[a-z]+/", ""))}.0/24"
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-vpc"
  })
}

# ECS Cluster for sub-environment
resource "aws_ecs_cluster" "main" {
  name = "${local.resource_prefix}-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  tags = local.common_tags
}

# RDS Instance for sub-environment
resource "aws_db_instance" "main" {
  identifier = "${local.resource_prefix}-db"
  
  # Sub-environment specific configurations
  instance_class = local.main_env == "prod" ? "db.t3.small" : "db.t3.micro"
  multi_az       = local.main_env == "prod"
  
  # Database name includes sub-environment
  db_name = "hibiji_${replace(local.sub_env, "-", "_")}"
  
  tags = local.common_tags
}

# Application Load Balancer for sub-environment
resource "aws_lb" "main" {
  name               = "${local.resource_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  
  tags = local.common_tags
}

# Route 53 record for sub-environment
resource "aws_route53_record" "sub_env" {
  zone_id = aws_route53_zone.main.zone_id
  name    = local.domain_name
  type    = "A"
  
  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# CloudFront distribution for sub-environment
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  
  aliases = [local.domain_name]
  
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "ALB"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALB"
    
    forwarded_values {
      query_string = true
      headers      = ["*"]
      
      cookies {
        forward = "all"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }
  
  price_class = "PriceClass_100"
  
  viewer_certificate {
    acm_certificate_arn = aws_acm_certificate.main.arn
    ssl_support_method  = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
  
  tags = local.common_tags
} 