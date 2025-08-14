# =================================
# Digital Persona Platform - Serverless Architecture
# Local Development Environment in AWS
# =================================

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket = "hibiji-terraform-state"
    region = "us-west-1"
    # Key will be provided via -backend-config at runtime for proper isolation
    # Format: local/{sub_environment}/terraform.tfstate
  }
}

# Provider configuration
provider "aws" {
  region = "us-west-1"

  # Temporarily disable default tags due to IAM permission constraints
  # default_tags {
  #   tags = local.common_tags
  # }
}

# Variables
variable "sub_environment" {
  description = "Sub-environment name (e.g., mars, local01)"
  type        = string
  default     = "mars"
}

variable "environment" {
  description = "Main environment name"
  type        = string
  default     = "local"
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "hibiji.com"
}

variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-west-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "dpp"
}

variable "image_tag" {
  description = "Image tag (legacy - not used in serverless)"
  type        = string
  default     = "latest"
}

variable "frontend_image_tag" {
  description = "Frontend image tag (legacy - not used in serverless)"
  type        = string
  default     = "latest"
}

variable "alert_emails" {
  description = "Email addresses for cost monitoring alerts"
  type        = list(string)
  default     = []
}

# Cost optimization variables with local-optimized defaults
variable "aurora_auto_pause" {
  description = "Enable Aurora Serverless auto-pause for cost savings"
  type        = bool
  default     = true
}

variable "aurora_pause_delay" {
  description = "Minutes before Aurora auto-pauses"
  type        = number
  default     = 300
}

variable "aurora_min_capacity" {
  description = "Minimum Aurora Serverless v2 capacity units"
  type        = number
  default     = 0.5
}

variable "aurora_max_capacity" {
  description = "Maximum Aurora Serverless v2 capacity units"
  type        = number
  default     = 1.0
}

variable "lambda_memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 256
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 7
}

variable "cost_budget_limit" {
  description = "Monthly budget limit in USD for cost monitoring"
  type        = number
  default     = 50
}

variable "s3_lifecycle_transition_days" {
  description = "Days before S3 objects transition to IA storage"
  type        = number
  default     = 30
}

variable "s3_lifecycle_expiration_days" {
  description = "Days before S3 objects are deleted"
  type        = number
  default     = 30
}

# Local values
locals {
  resource_prefix = "${var.environment}-${var.sub_environment}-${var.project_name}"

  common_tags = {
    Environment    = var.environment
    SubEnvironment = var.sub_environment
    Project        = var.project_name
    ManagedBy      = "Terraform"
    Architecture   = "Serverless"
    CostOptimized  = "true"
    Owner          = var.sub_environment
    CreatedAt      = timestamp()
  }

  # Domain configuration
  api_domain     = "${var.sub_environment}-api.${var.domain_name}"
  website_domain = "${var.sub_environment}.${var.domain_name}"
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Data source for existing Route53 hosted zone
data "aws_route53_zone" "main" {
  name = var.domain_name
}

# =================================
# Cost Monitoring Budget
# =================================

resource "aws_budgets_budget" "local_environment" {
  name         = "${local.resource_prefix}-budget"
  budget_type  = "COST"
  limit_amount = var.cost_budget_limit
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_filter {
    name   = "Service"
    values = ["Amazon Relational Database Service", "AWS Lambda", "Amazon Simple Storage Service"]
  }

  dynamic "notification" {
    for_each = length(var.alert_emails) > 0 ? [1] : []
    content {
      comparison_operator        = "GREATER_THAN"
      threshold                  = 80
      threshold_type             = "PERCENTAGE"
      notification_type          = "ACTUAL"
      subscriber_email_addresses = var.alert_emails
    }
  }

  dynamic "notification" {
    for_each = length(var.alert_emails) > 0 ? [1] : []
    content {
      comparison_operator        = "GREATER_THAN"
      threshold                  = 100
      threshold_type             = "PERCENTAGE"
      notification_type          = "FORECASTED"
      subscriber_email_addresses = var.alert_emails
    }
  }

  depends_on = [
    aws_secretsmanager_secret.jwt_secret
  ]
}

# =================================
# Secrets Manager
# =================================

# JWT Secret
resource "aws_secretsmanager_secret" "jwt_secret" {
  name                    = "${local.resource_prefix}-jwt-secret"
  description             = "JWT secret for ${local.resource_prefix}"
  recovery_window_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-jwt-secret"
    Type = "Secret"
  })
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id = aws_secretsmanager_secret.jwt_secret.id
  secret_string = jsonencode({
    jwt_secret = "local-jwt-secret-${random_password.jwt_secret.result}"
  })
}

# Database password secret
resource "aws_secretsmanager_secret" "database_password" {
  name                    = "${local.resource_prefix}-database-password"
  description             = "Database password for ${local.resource_prefix}"
  recovery_window_in_days = 7

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-database-password"
    Type = "Secret"
  })
}

resource "aws_secretsmanager_secret_version" "database_password" {
  secret_id = aws_secretsmanager_secret.database_password.id
  secret_string = jsonencode({
    password = random_password.database_password.result
  })
}

# Random passwords
resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

resource "random_password" "database_password" {
  length  = 32
  special = true
  # Exclude characters that are invalid for RDS master password
  override_special = "!#$%&*()_+-=[]{}|;:,.<>?"
}

# =================================
# Database (Aurora Serverless v2 - Cost Optimized)
# =================================

# Database subnet group
resource "aws_db_subnet_group" "database" {
  name       = "${local.resource_prefix}-db-subnet-group"
  subnet_ids = [aws_subnet.private[0].id, aws_subnet.private[1].id]

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-db-subnet-group"
    Type = "DatabaseSubnetGroup"
  })

  lifecycle {
    ignore_changes = [name]
  }
}

# Database security group
resource "aws_security_group" "database" {
  name_prefix = "${local.resource_prefix}-db-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for ${local.resource_prefix} database"

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.main.cidr_block]
    description = "PostgreSQL access from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-db-sg"
    Type = "SecurityGroup"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Aurora Serverless v2 cluster with auto-pause for maximum cost savings
resource "aws_rds_cluster" "database" {
  cluster_identifier           = "${local.resource_prefix}-cluster"
  engine                       = "aurora-postgresql"
  engine_mode                  = "provisioned"
  engine_version               = "15.10"
  database_name                = "digital_persona"
  master_username              = "dpp_admin"
  master_password              = random_password.database_password.result
  backup_retention_period      = 1 # Minimal backup for cost savings
  preferred_backup_window      = "07:00-09:00"
  preferred_maintenance_window = "sun:09:00-sun:10:00"

  db_subnet_group_name   = aws_db_subnet_group.database.name
  vpc_security_group_ids = [aws_security_group.database.id]

  serverlessv2_scaling_configuration {
    max_capacity = var.aurora_max_capacity
    min_capacity = var.aurora_min_capacity
  }

  # Note: Aurora Serverless v2 doesn't support auto-pause like v1
  # Cost optimization is achieved through min_capacity = 0.5

  skip_final_snapshot = true  # Always true for local environments
  deletion_protection = false # Never protect local environments

  tags = merge(local.common_tags, {
    Name          = "${local.resource_prefix}-cluster"
    Type          = "DatabaseCluster"
    CostOptimized = "true"
  })
}

# Aurora Serverless v2 instance
resource "aws_rds_cluster_instance" "database" {
  identifier         = "${local.resource_prefix}-instance"
  cluster_identifier = aws_rds_cluster.database.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.database.engine
  engine_version     = aws_rds_cluster.database.engine_version

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-instance"
    Type = "DatabaseInstance"
  })
}

# =================================
# S3 Buckets with Lifecycle Management
# =================================

# S3 bucket for file uploads with aggressive lifecycle
resource "aws_s3_bucket" "uploads" {
  bucket = "${local.resource_prefix}-uploads"

  tags = merge(local.common_tags, {
    Name    = "${local.resource_prefix}-uploads"
    Type    = "S3Bucket"
    Purpose = "FileUploads"
  })
}

resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  versioning_configuration {
    status = "Suspended" # Disable versioning for cost savings
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Aggressive lifecycle policy for local development
resource "aws_s3_bucket_lifecycle_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  rule {
    id     = "local_development_cleanup"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = var.s3_lifecycle_expiration_days
    }

    transition {
      days          = var.s3_lifecycle_transition_days
      storage_class = "STANDARD_IA"
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }

    noncurrent_version_expiration {
      noncurrent_days = 1
    }
  }
}

# CORS configuration for file uploads
resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  cors_rule {
    allowed_origins = [
      "http://localhost:3000",
      "http://localhost:4000",
      "http://localhost:3100",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:4000",
      "https://localhost:3000",
      "https://localhost:4000",
      "https://${module.s3_website.cloudfront_domain_name}",
      "https://${local.website_domain}"
    ]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_headers = ["*"]
    expose_headers  = ["ETag", "x-amz-server-side-encryption", "x-amz-request-id", "x-amz-id-2"]
    max_age_seconds = 86400
  }
}

# =================================
# Simplified VPC (Cost Optimized)
# =================================

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-vpc"
    Type = "VPC"
  })
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-igw"
    Type = "InternetGateway"
  })
}

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Private Subnets (for database)
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 4, count.index + 2)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-private-${count.index + 1}"
    Type = "PrivateSubnet"
  })
}

# =================================
# SSL Certificates
# =================================

# Provider for us-east-1 (required for CloudFront certificates)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# SSL Certificate for custom domain (must be in us-east-1 for CloudFront)
resource "aws_acm_certificate" "website" {
  provider          = aws.us_east_1
  domain_name       = local.website_domain
  validation_method = "DNS"

  subject_alternative_names = [
    "*.${local.website_domain}"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-website-cert"
    Type = "SSL Certificate"
  })
}

# SSL Certificate for API domain
resource "aws_acm_certificate" "api" {
  provider          = aws.us_east_1
  domain_name       = local.api_domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-api-cert"
    Type = "SSL Certificate"
  })
}

# Certificate validation
resource "aws_acm_certificate_validation" "website" {
  provider        = aws.us_east_1
  certificate_arn = aws_acm_certificate.website.arn
  validation_record_fqdns = [
    for record in aws_route53_record.website_cert_validation : record.fqdn
  ]

  timeouts {
    create = "10m"
  }
}

# API Certificate validation
resource "aws_acm_certificate_validation" "api" {
  provider        = aws.us_east_1
  certificate_arn = aws_acm_certificate.api.arn
  validation_record_fqdns = [
    for record in aws_route53_record.api_cert_validation : record.fqdn
  ]

  timeouts {
    create = "10m"
  }
}

# Route53 records for certificate validation
resource "aws_route53_record" "website_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.website.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main.zone_id
}

# Route53 records for API certificate validation
resource "aws_route53_record" "api_cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.api.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.main.zone_id
}

# =================================
# Module Calls (Cost Optimized)
# =================================

# S3 Static Website with minimal CloudFront configuration
module "s3_website" {
  source = "../../modules/s3-static-website"

  environment     = var.environment
  sub_environment = var.sub_environment
  project_name    = var.project_name
  common_tags     = local.common_tags

  # Custom domain configuration
  custom_domain       = local.website_domain
  ssl_certificate_arn = aws_acm_certificate_validation.website.certificate_arn

  cloudfront_price_class = "PriceClass_100" # Use only North America and Europe edge locations
  build_retention_days   = 7                # Shorter retention for local
}

# RDS Proxy for Connection Pooling
module "rds_proxy" {
  source = "../../modules/rds-proxy"

  environment     = var.environment
  sub_environment = var.sub_environment
  project_name    = var.project_name
  aws_region      = var.aws_region
  common_tags     = local.common_tags

  # Network configuration
  vpc_id                      = aws_vpc.main.id
  subnet_ids                  = aws_subnet.private[*].id
  lambda_security_group_ids   = [aws_security_group.lambda.id]
  database_security_group_ids = [aws_security_group.database.id]

  # Database configuration
  database_cluster_identifier = aws_rds_cluster.database.cluster_identifier
  database_secret_arn         = aws_secretsmanager_secret.database_password.arn

  # RDS Proxy settings optimized for local development
  idle_client_timeout          = 900 # 15 minutes (shorter for local)
  max_connections_percent      = 50  # Lower for local workloads
  max_idle_connections_percent = 25  # Fewer idle connections
  connection_borrow_timeout    = 60  # 1 minute
  require_tls                  = false
  log_retention_days           = var.log_retention_days
}

# Lambda Backend with cost-optimized settings
module "lambda_backend" {
  source = "../../modules/lambda-backend"

  environment     = var.environment
  sub_environment = var.sub_environment
  project_name    = var.project_name
  common_tags     = local.common_tags

  # Lambda configuration - cost optimized
  lambda_runtime     = "nodejs18.x"
  lambda_timeout     = var.lambda_timeout
  lambda_memory_size = var.lambda_memory_size

  # Environment variables
  database_url = "postgresql://${aws_rds_cluster.database.master_username}:${urlencode(random_password.database_password.result)}@${module.rds_proxy.proxy_endpoint}:${module.rds_proxy.proxy_port}/${aws_rds_cluster.database.database_name}"
  cors_origin  = "https://${module.s3_website.cloudfront_domain_name},https://${local.website_domain}"
  # ML processing disabled for local environments due to IAM permission constraints
  ml_sqs_queue_url = null # module.aws_batch_ml.sqs_queue_url
  ml_sqs_queue_arn = null # module.aws_batch_ml.sqs_queue_arn

  # AWS resources
  database_secret_arn    = aws_secretsmanager_secret.database_password.arn
  jwt_secret_arn         = aws_secretsmanager_secret.jwt_secret.arn
  s3_uploads_bucket_arn  = aws_s3_bucket.uploads.arn
  s3_uploads_bucket_name = aws_s3_bucket.uploads.bucket

  # VPC configuration for database access
  vpc_config = {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  log_retention_days = var.log_retention_days
}

# Lambda security group
resource "aws_security_group" "lambda" {
  name_prefix = "${local.resource_prefix}-lambda-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for ${local.resource_prefix} Lambda functions"

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "All outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-lambda-sg"
    Type = "SecurityGroup"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway
module "api_gateway" {
  source = "../../modules/api-gateway"

  environment     = var.environment
  sub_environment = var.sub_environment
  project_name    = var.project_name
  common_tags     = local.common_tags

  # Lambda function configuration
  lambda_function_name       = module.lambda_backend.lambda_function_name
  lambda_function_invoke_arn = module.lambda_backend.lambda_function_invoke_arn

  # CORS configuration - local development friendly
  cors_allow_origins = [
    "https://${module.s3_website.cloudfront_domain_name}",
    "https://${local.website_domain}",
    "http://localhost:3000",
    "http://localhost:4000",
    "http://localhost:3100",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:4000"
  ]
  cors_allow_methods = ["GET","HEAD","OPTIONS","POST","PUT","PATCH","DELETE"]
  cors_allow_headers = [
    "content-type",
    "authorization",
    "x-requested-with",
    "x-trpc-source",
    "x-amz-date",
    "x-amz-security-token",
    "x-api-key"
  ]
  cors_allow_credentials = true

  # Custom domain configuration
  custom_domain_name = local.api_domain
  certificate_arn    = aws_acm_certificate_validation.api.certificate_arn

  stage_name         = "v1"
  log_retention_days = var.log_retention_days
}

# AWS Batch ML Processing - DISABLED for local environments due to IAM permission constraints
# The dev-airica user lacks permissions for iam:CreateInstanceProfile
# Uncomment and run with elevated IAM permissions if ML processing is needed

# module "aws_batch_ml" {
#   source = "../../modules/aws-batch-ml"
#
#   environment     = var.environment
#   sub_environment = var.sub_environment
#   project_name    = var.project_name
#   aws_region      = var.aws_region
#   common_tags     = local.common_tags
#
#   # Network configuration
#   vpc_id     = aws_vpc.main.id
#   subnet_ids = aws_subnet.private[*].id
#
#   # Database configuration
#   database_secret_arn = aws_secretsmanager_secret.database_password.arn
#
#   # Batch compute configuration (minimal for local)
#   min_vcpus           = 0
#   max_vcpus           = 1 # Minimal capacity for local
#   desired_vcpus       = 0
#   instance_types      = ["t3.micro", "t3.small"] # Smallest instances
#   use_spot_instances  = true
#   spot_bid_percentage = 50 # Aggressive spot pricing
#
#   # Job configuration (minimal)
#   job_vcpus  = 1
#   job_memory = 512 # Minimal memory
#
#   # Logging
#   log_retention_days = var.log_retention_days
#   log_level          = "INFO" # Less verbose logging
# }

# =================================
# Route53 Records (Custom Domains)
# =================================

# DNS Records for this sub-environment
resource "aws_route53_record" "website" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = local.website_domain
  type    = "CNAME"
  ttl     = 300
  records = [module.s3_website.cloudfront_domain_name]

  lifecycle {
    ignore_changes = [records]
  }
}

resource "aws_route53_record" "api" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = local.api_domain
  type    = "CNAME"
  ttl     = 300
  records = [module.api_gateway.custom_domain_target_name]

  lifecycle {
    ignore_changes = [records]
  }
}

# =================================
# Outputs
# =================================

output "website_url" {
  description = "URL of the static website"
  value       = module.s3_website.website_url
}

output "api_url" {
  description = "URL of the API Gateway"
  value       = module.api_gateway.api_url
}

output "website_bucket_name" {
  description = "Name of the website S3 bucket"
  value       = module.s3_website.website_bucket_id
}

output "lambda_function_name" {
  description = "Name of the main Lambda function"
  value       = module.lambda_backend.lambda_function_name
}

output "database_endpoint" {
  description = "RDS cluster endpoint"
  value       = aws_rds_cluster.database.endpoint
  sensitive   = true
}

output "uploads_bucket_name" {
  description = "Name of the uploads S3 bucket"
  value       = aws_s3_bucket.uploads.bucket
}

output "ssl_certificate_arn" {
  description = "ARN of the SSL certificate for the website"
  value       = aws_acm_certificate.website.arn
}

output "api_ssl_certificate_arn" {
  description = "ARN of the SSL certificate for the API"
  value       = aws_acm_certificate.api.arn
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = module.s3_website.cloudfront_distribution_id
}

output "website_domain" {
  description = "Website domain name"
  value       = local.website_domain
}

output "rds_proxy_endpoint" {
  description = "RDS Proxy endpoint for database connections"
  value       = module.rds_proxy.proxy_endpoint
  sensitive   = true
}

output "rds_proxy_name" {
  description = "RDS Proxy name"
  value       = module.rds_proxy.proxy_name
}

output "rds_proxy_port" {
  description = "RDS Proxy port"
  value       = module.rds_proxy.proxy_port
}

# ML outputs disabled for local environments due to IAM permission constraints
# output "ml_sqs_queue_url" {
#   description = "SQS queue URL for ML job requests"
#   value       = module.aws_batch_ml.sqs_queue_url
#   sensitive   = true
# }

# output "ml_ecr_repository_url" {
#   description = "ECR repository URL for ML service container images"
#   value       = module.aws_batch_ml.ecr_repository_url
# }

# output "ml_batch_job_queue_name" {
#   description = "Batch job queue name for ML processing"
#   value       = module.aws_batch_ml.batch_job_queue_name
# }

output "cost_budget_name" {
  description = "AWS Budget name for cost monitoring"
  value       = aws_budgets_budget.local_environment.name
}

output "estimated_monthly_cost" {
  description = "Estimated monthly cost in USD"
  value       = "~$10-30 (Aurora auto-pause, minimal Lambda, spot instances)"
}
