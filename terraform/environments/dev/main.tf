# =================================
# Digital Persona Platform - Serverless Architecture
# Development Environment
# =================================

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  backend "s3" {
    bucket = "hibiji-terraform-state"
    region = "us-west-1"
    # Key will be provided via -backend-config at runtime for proper isolation
    # Format: dev/{sub_environment}/terraform.tfstate
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

# Include shared variables
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

variable "vpc_id" {
  description = "VPC ID to use (optional, defaults to dev-dev01-dpp-vpc)"
  type        = string
  default     = ""
}

variable "vpc_cidr_block" {
  description = "VPC CIDR block for DPP platform"
  type        = string
  default     = "10.0.0.0/16"
}

variable "private_subnet_cidrs" {
  description = "Private subnet CIDR blocks for DPP platform"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "public_subnet_cidrs" {
  description = "Public subnet CIDR blocks for DPP platform"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

# Legacy ECR variables removed - ECR repositories are now created dynamically by modules
# AWS Batch ML module creates: module.aws_batch_ml.ecr_repository_url 
# Backend/Frontend ECR repos would be created by their respective modules when needed

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

# Cost optimization variables
variable "aurora_auto_pause" {
  description = "Enable Aurora Serverless auto-pause for cost savings"
  type        = bool
  default     = false
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
  default     = 2.0
}

variable "lambda_memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 512
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 14
}

variable "cost_budget_limit" {
  description = "Monthly budget limit in USD for cost monitoring"
  type        = number
  default     = 100
}

variable "s3_lifecycle_transition_days" {
  description = "Days before S3 objects transition to IA storage"
  type        = number
  default     = 30
}

variable "s3_lifecycle_expiration_days" {
  description = "Days before S3 objects are deleted"
  type        = number
  default     = 365
}

# Local values
locals {
  resource_prefix = "${var.environment}-${var.sub_environment}-${var.project_name}"

  common_tags = {
    Environment    = var.environment
    SubEnvironment = var.sub_environment
    Project        = var.project_name
    Platform       = "DPP" # Platform-specific tag for isolation
    ManagedBy      = "Terraform"
    Architecture   = "Serverless"
    CostOptimized  = "true"
    Owner          = "DPP-Team" # Platform ownership
    DataClass      = "Internal" # Data classification
    Backup         = "Required" # Backup requirements
    Compliance     = "SOC2"     # Compliance requirements
  }

  # Domain configuration
  api_domain     = "${var.sub_environment}-api.${var.domain_name}"
  website_domain = "${var.sub_environment}.${var.domain_name}"
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Replace the Route53 zone resource with a data source
# This will use an existing hosted zone instead of creating a new one

# Data source for existing Route53 hosted zone
data "aws_route53_zone" "main" {
  name = var.domain_name
}

# =================================
# Cost Monitoring Budget
# =================================

resource "aws_budgets_budget" "dev_environment" {
  name         = "${local.resource_prefix}-budget"
  budget_type  = "COST"
  limit_amount = var.cost_budget_limit
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_filter {
    name   = "Service"
    values = ["Amazon Relational Database Service", "AWS Lambda", "Amazon Simple Storage Service"]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.alert_emails
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 100
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.alert_emails
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
    jwt_secret = "dev-jwt-secret-${random_password.jwt_secret.result}"
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
    username = aws_rds_cluster.database.master_username
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
# Database (Aurora Serverless v2)
# =================================

# Database subnet group
resource "aws_db_subnet_group" "database" {
  name       = "${local.resource_prefix}-db-subnet-group"
  subnet_ids = [data.aws_subnet.private[0].id, data.aws_subnet.private[1].id]

  # Ensure subnets are created before DB subnet group
  depends_on = [
    aws_subnet.dpp_private
  ]

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-db-subnet-group"
    Type = "DatabaseSubnetGroup"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Database security group
resource "aws_security_group" "database" {
  name_prefix = "${local.resource_prefix}-db-"
  vpc_id      = data.aws_vpc.main.id
  description = "Security group for ${local.resource_prefix} database"

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.main.cidr_block]
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

# Aurora Serverless v2 cluster
resource "aws_rds_cluster" "database" {
  cluster_identifier           = "${local.resource_prefix}-cluster"
  engine                       = "aurora-postgresql"
  engine_mode                  = "provisioned"
  engine_version               = "15.12"
  database_name                = "digital_persona"
  master_username              = "dpp_admin"
  master_password              = random_password.database_password.result
  backup_retention_period      = 7
  preferred_backup_window      = "07:00-09:00"
  preferred_maintenance_window = "sun:09:00-sun:10:00"

  db_subnet_group_name   = aws_db_subnet_group.database.name
  vpc_security_group_ids = [aws_security_group.database.id]

  serverlessv2_scaling_configuration {
    max_capacity = var.aurora_max_capacity
    min_capacity = var.aurora_min_capacity
  }

  skip_final_snapshot = var.environment != "prod"
  deletion_protection = var.environment == "prod"

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-cluster"
    Type = "DatabaseCluster"
  })

  lifecycle {
    ignore_changes        = [engine_version, cluster_identifier, master_password, database_name, master_username, vpc_security_group_ids, db_subnet_group_name]
    create_before_destroy = true
  }
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
# S3 Buckets
# =================================

# S3 bucket for file uploads
resource "aws_s3_bucket" "uploads" {
  bucket = "${local.resource_prefix}-uploads"

  tags = merge(local.common_tags, {
    Name    = "${local.resource_prefix}-uploads"
    Type    = "S3Bucket"
    Purpose = "FileUploads"
  })

  lifecycle {
    # Prevent recreation if bucket already exists
    ignore_changes = [bucket]
    # Use create_before_destroy to avoid conflicts
    create_before_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "uploads" {
  bucket = aws_s3_bucket.uploads.id
  versioning_configuration {
    status = "Enabled"
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

# S3 Lifecycle policy for cost optimization
resource "aws_s3_bucket_lifecycle_configuration" "uploads" {
  count  = var.s3_lifecycle_expiration_days > 0 ? 1 : 0
  bucket = aws_s3_bucket.uploads.id

  rule {
    id     = "dev_cost_optimization"
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
      noncurrent_days = 7
    }
  }
}

# CORS configuration for file uploads
resource "aws_s3_bucket_cors_configuration" "uploads" {
  bucket = aws_s3_bucket.uploads.id

  cors_rule {
    allowed_origins = [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "https://localhost:3000",
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
# VPC Configuration (Dedicated DPP VPC)
# =================================

# Data source for availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Create dedicated DPP VPC with platform-specific CIDR blocks
resource "aws_vpc" "dpp_vpc" {
  cidr_block           = var.vpc_cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-vpc"
    Type = "VPC"
  })
}

# Internet Gateway for DPP VPC
resource "aws_internet_gateway" "dpp_igw" {
  vpc_id = aws_vpc.dpp_vpc.id

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-igw"
    Type = "InternetGateway"
  })
}

# Private subnets for DPP VPC
resource "aws_subnet" "dpp_private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.dpp_vpc.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-private-subnet-${count.index + 1}"
    Type = "PrivateSubnet"
    Tier = "Private"
  })
}

# Public subnets for DPP VPC
resource "aws_subnet" "dpp_public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.dpp_vpc.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-public-subnet-${count.index + 1}"
    Type = "PublicSubnet"
    Tier = "Public"
  })
}

# NAT Gateway for private subnet internet access
resource "aws_eip" "dpp_nat_eip" {
  count = length(var.public_subnet_cidrs)

  domain     = "vpc"
  depends_on = [aws_internet_gateway.dpp_igw]

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-nat-eip-${count.index + 1}"
    Type = "ElasticIP"
  })
}

resource "aws_nat_gateway" "dpp_nat" {
  count = length(var.public_subnet_cidrs)

  allocation_id = aws_eip.dpp_nat_eip[count.index].id
  subnet_id     = aws_subnet.dpp_public[count.index].id

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-nat-gateway-${count.index + 1}"
    Type = "NATGateway"
  })

  depends_on = [aws_internet_gateway.dpp_igw]
}

# Route table for public subnets
resource "aws_route_table" "dpp_public" {
  vpc_id = aws_vpc.dpp_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.dpp_igw.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-public-rt"
    Type = "RouteTable"
    Tier = "Public"
  })
}

# Route table for private subnets
resource "aws_route_table" "dpp_private" {
  count = length(var.private_subnet_cidrs)

  vpc_id = aws_vpc.dpp_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.dpp_nat[count.index].id
  }

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-private-rt-${count.index + 1}"
    Type = "RouteTable"
    Tier = "Private"
  })
}

# Associate public subnets with public route table
resource "aws_route_table_association" "dpp_public" {
  count = length(var.public_subnet_cidrs)

  subnet_id      = aws_subnet.dpp_public[count.index].id
  route_table_id = aws_route_table.dpp_public.id
}

# Associate private subnets with private route tables
resource "aws_route_table_association" "dpp_private" {
  count = length(var.private_subnet_cidrs)

  subnet_id      = aws_subnet.dpp_private[count.index].id
  route_table_id = aws_route_table.dpp_private[count.index].id
}

# Data source for the created VPC (for backward compatibility)
data "aws_vpc" "main" {
  id = aws_vpc.dpp_vpc.id
}

# Data source for private subnets (for backward compatibility)
data "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)
  id    = aws_subnet.dpp_private[count.index].id
}

# =================================
# Module Calls
# =================================

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

# SSL Certificate for API domain (must be in us-east-1 for CloudFront)
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

# Provider for us-east-1 (required for CloudFront certificates)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# Certificate validation - simplified approach without explicit DNS records
# ACM will automatically validate using DNS if records are created externally
resource "aws_acm_certificate_validation" "website" {
  provider        = aws.us_east_1
  certificate_arn = aws_acm_certificate.website.arn

  timeouts {
    create = "10m"
  }

  # Allow validation to proceed without waiting for DNS records
  # DNS records will be created manually or via workflow
  lifecycle {
    create_before_destroy = true
  }
}

# API Certificate validation
resource "aws_acm_certificate_validation" "api" {
  provider        = aws.us_east_1
  certificate_arn = aws_acm_certificate.api.arn

  timeouts {
    create = "10m"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# S3 Static Website
module "s3_website" {
  source = "../../modules/s3-static-website"

  environment     = var.environment
  sub_environment = var.sub_environment
  project_name    = var.project_name
  common_tags     = local.common_tags

  # Custom domain configuration (enabled)
  custom_domain       = local.website_domain
  ssl_certificate_arn = aws_acm_certificate_validation.website.certificate_arn

  cloudfront_price_class = "PriceClass_100"
  build_retention_days   = 30
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
  vpc_id                      = data.aws_vpc.main.id
  subnet_ids                  = [data.aws_subnet.private[0].id, data.aws_subnet.private[1].id]
  lambda_security_group_ids   = [aws_security_group.lambda.id]
  database_security_group_ids = [aws_security_group.database.id]

  # Database configuration
  database_cluster_identifier = aws_rds_cluster.database.cluster_identifier
  database_secret_arn         = aws_secretsmanager_secret.database_password.arn

  # RDS Proxy settings optimized for serverless
  idle_client_timeout          = 1800  # 30 minutes
  max_connections_percent      = 75    # Reserve 25% for direct connections
  max_idle_connections_percent = 50    # Keep idle connections reasonable
  connection_borrow_timeout    = 120   # 2 minutes
  require_tls                  = false # Can be enabled for production
  log_retention_days           = 14
}

# Lambda Backend
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

  # Environment variables - Using RDS Proxy for connection pooling
  database_url     = "postgresql://${aws_rds_cluster.database.master_username}:${urlencode(random_password.database_password.result)}@${module.rds_proxy.proxy_endpoint}:${module.rds_proxy.proxy_port}/${aws_rds_cluster.database.database_name}"
  cors_origin      = "https://${module.s3_website.cloudfront_domain_name},https://${local.website_domain}"
  ml_sqs_queue_url = module.aws_batch_ml.sqs_queue_url
  ml_sqs_queue_arn = module.aws_batch_ml.sqs_queue_arn

  # AWS resources
  database_secret_arn    = aws_secretsmanager_secret.database_password.arn
  jwt_secret_arn         = aws_secretsmanager_secret.jwt_secret.arn
  s3_uploads_bucket_arn  = aws_s3_bucket.uploads.arn
  s3_uploads_bucket_name = aws_s3_bucket.uploads.bucket

  # VPC configuration for database access
  vpc_config = {
    subnet_ids         = [data.aws_subnet.private[0].id, data.aws_subnet.private[1].id]
    security_group_ids = [aws_security_group.lambda.id]
  }

  log_retention_days = var.log_retention_days

  # Email configuration
  domain_name      = var.domain_name
  frontend_url     = "https://${module.s3_website.cloudfront_domain_name}"
  ses_identity_arn = module.ses_email.domain_identity_arn
  from_email       = "noreply@${var.domain_name}"
}

# SES Email Service
module "ses_email" {
  source = "../../modules/ses-email"

  environment     = var.environment
  sub_environment = var.sub_environment
  project_name    = var.project_name
  aws_region      = var.aws_region
  common_tags     = local.common_tags

  domain_name                = var.domain_name
  from_email                 = "noreply@${var.domain_name}"
  lambda_execution_role_name = module.lambda_backend.lambda_execution_role_name
  route53_zone_id            = data.aws_route53_zone.main.zone_id
}

# Lambda security group
resource "aws_security_group" "lambda" {
  name_prefix = "${local.resource_prefix}-lambda-"
  vpc_id      = data.aws_vpc.main.id
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

  # CORS configuration
  cors_allow_origins = [
    "https://${module.s3_website.cloudfront_domain_name}",
    "https://${local.website_domain}", # Custom domain
    "http://localhost:3000",           # Development
    "http://localhost:3100"            # Docker development
  ]
  cors_allow_methods = ["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]
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

  # Custom domain configuration (enabled)
  custom_domain_name = local.api_domain
  certificate_arn    = aws_acm_certificate_validation.api.certificate_arn

  stage_name         = "v1"
  log_retention_days = var.log_retention_days
}

# =================================
# Route53 Records (Custom Domains)
# =================================

# DNS Records for this sub-environment
resource "aws_route53_record" "website" {
  zone_id         = data.aws_route53_zone.main.zone_id
  name            = local.website_domain # dev01.hibiji.com
  type            = "CNAME"
  ttl             = 300
  records         = [module.s3_website.cloudfront_domain_name]
  allow_overwrite = true

  # Add lifecycle to prevent conflicts
  lifecycle {
    ignore_changes        = [records]
    create_before_destroy = true
  }
}

resource "aws_route53_record" "api" {
  zone_id         = data.aws_route53_zone.main.zone_id
  name            = local.api_domain # dev01-api.hibiji.com
  type            = "CNAME"
  ttl             = 300
  records         = [module.api_gateway.custom_domain_target_name]
  allow_overwrite = true

  # Add lifecycle to prevent conflicts
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

# AWS Batch ML Processing for AI/ML workloads
module "aws_batch_ml" {
  source = "../../modules/aws-batch-ml"

  environment     = var.environment
  sub_environment = var.sub_environment
  project_name    = var.project_name
  aws_region      = var.aws_region
  common_tags     = local.common_tags

  # Network configuration
  vpc_id     = data.aws_vpc.main.id
  subnet_ids = [data.aws_subnet.private[0].id, data.aws_subnet.private[1].id]

  # Database configuration
  database_secret_arn = aws_secretsmanager_secret.database_password.arn

  # Batch compute configuration (cost-optimized for Dev)
  min_vcpus           = 0
  max_vcpus           = 3
  desired_vcpus       = 0
  instance_types      = ["m5.large"]
  use_spot_instances  = true
  spot_bid_percentage = 70

  # Job configuration
  job_vcpus  = 1
  job_memory = 1024

  # Logging
  log_retention_days = 7
  log_level          = "DEBUG"
}

# RDS Proxy outputs
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

# AWS Batch ML outputs
output "ml_sqs_queue_url" {
  description = "SQS queue URL for ML job requests"
  value       = module.aws_batch_ml.sqs_queue_url
  sensitive   = true
}

output "ml_ecr_repository_url" {
  description = "ECR repository URL for ML service container images"
  value       = module.aws_batch_ml.ecr_repository_url
}

output "ml_batch_job_queue_name" {
  description = "Batch job queue name for ML processing"
  value       = module.aws_batch_ml.batch_job_queue_name
}

output "cost_budget_name" {
  description = "AWS Budget name for cost monitoring"
  value       = aws_budgets_budget.dev_environment.name
}

output "cost_optimization_summary" {
  description = "Summary of cost optimization features enabled"
  value = {
    aurora_auto_pause = var.aurora_auto_pause
    aurora_capacity   = "${var.aurora_min_capacity}-${var.aurora_max_capacity} ACU"
    lambda_memory     = "${var.lambda_memory_size} MB"
    log_retention     = "${var.log_retention_days} days"
    s3_lifecycle      = var.s3_lifecycle_expiration_days > 0 ? "enabled" : "disabled"
    budget_limit      = "$${var.cost_budget_limit}/month"
    estimated_savings = "70-80% vs production configuration"
  }
}

# SES Email outputs
output "ses_domain_identity_arn" {
  description = "ARN of the SES domain identity"
  value       = module.ses_email.domain_identity_arn
}

output "ses_domain_verification_token" {
  description = "Token for domain verification"
  value       = module.ses_email.domain_identity_verification_token
}

output "ses_dkim_tokens" {
  description = "DKIM tokens for domain authentication"
  value       = module.ses_email.dkim_tokens
}

output "ses_from_email" {
  description = "Verified sender email address"
  value       = module.ses_email.from_email
}
