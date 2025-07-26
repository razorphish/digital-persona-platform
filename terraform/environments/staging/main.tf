# =================================
# Digital Persona Platform - Serverless Architecture
# Staging Environment
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
    # Format: staging/{sub_environment}/terraform.tfstate
  }
}

# Provider configuration
provider "aws" {
  region = "us-west-1"
}

# Variables
variable "sub_environment" {
  description = "Sub-environment name (e.g., staging01, staging02)"
  type        = string
  default     = "staging01"
}

variable "environment" {
  description = "Main environment name"
  type        = string
  default     = "staging"
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

# Local values
locals {
  resource_prefix = "${var.environment}-${var.sub_environment}-${var.project_name}"
  
  common_tags = {
    Environment    = var.environment
    SubEnvironment = var.sub_environment
    Project        = var.project_name
    ManagedBy      = "Terraform"
    Architecture   = "Serverless"
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
    jwt_secret = "qa-jwt-secret-${random_password.jwt_secret.result}"
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
}

# =================================
# Database (Aurora Serverless v2)
# =================================

# Database subnet group
resource "aws_db_subnet_group" "database" {
  name       = "${local.resource_prefix}-db-subnet-group"
  subnet_ids = [aws_subnet.private[0].id, aws_subnet.private[1].id]

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-db-subnet-group"
    Type = "DatabaseSubnetGroup"
  })
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

# Aurora Serverless v2 cluster
resource "aws_rds_cluster" "database" {
  cluster_identifier     = "${local.resource_prefix}-cluster"
  engine                = "aurora-postgresql"
  engine_mode           = "provisioned"
  engine_version        = "15.10"
  database_name         = "digital_persona"
  master_username       = "dpp_admin"
  master_password       = random_password.database_password.result
  backup_retention_period = 7
  preferred_backup_window = "07:00-09:00"
  preferred_maintenance_window = "sun:09:00-sun:10:00"
  
  db_subnet_group_name   = aws_db_subnet_group.database.name
  vpc_security_group_ids = [aws_security_group.database.id]
  
  serverlessv2_scaling_configuration {
    max_capacity = 1
    min_capacity = 0.5
  }
  
  skip_final_snapshot = var.environment != "prod"
  deletion_protection = var.environment == "prod"

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-cluster"
    Type = "DatabaseCluster"
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
# S3 Buckets
# =================================

# S3 bucket for file uploads
resource "aws_s3_bucket" "uploads" {
  bucket = "${local.resource_prefix}-uploads"

  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-uploads"
    Type = "S3Bucket"
    Purpose = "FileUploads"
  })
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

# =================================
# Simplified VPC (for database only)
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
# Module Calls
# =================================

# S3 Static Website
module "s3_website" {
  source = "../../modules/s3-static-website"

  environment     = var.environment
  sub_environment = var.sub_environment
  project_name    = var.project_name
  common_tags     = local.common_tags

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
  vpc_id                        = aws_vpc.main.id
  subnet_ids                    = aws_subnet.private[*].id
  lambda_security_group_ids     = [aws_security_group.lambda.id]
  database_security_group_ids   = [aws_security_group.database.id]

  # Database configuration
  database_cluster_identifier = aws_rds_cluster.database.cluster_identifier
  database_secret_arn         = aws_secretsmanager_secret.database_password.arn

  # RDS Proxy settings optimized for serverless
  idle_client_timeout          = 1800  # 30 minutes
  max_connections_percent      = 75     # Reserve 25% for direct connections
  max_idle_connections_percent = 50     # Keep idle connections reasonable
  connection_borrow_timeout    = 120    # 2 minutes
  require_tls                  = false  # Can be enabled for production
  log_retention_days          = 14
}

# Lambda Backend
module "lambda_backend" {
  source = "../../modules/lambda-backend"

  environment     = var.environment
  sub_environment = var.sub_environment
  project_name    = var.project_name
  common_tags     = local.common_tags

  # Lambda configuration
  lambda_runtime     = "nodejs18.x"
  lambda_timeout     = 30
  lambda_memory_size = 512

  # Environment variables - Using RDS Proxy for connection pooling
  database_url     = "postgresql://${aws_rds_cluster.database.master_username}:${random_password.database_password.result}@${module.rds_proxy.proxy_endpoint}:${module.rds_proxy.proxy_port}/${aws_rds_cluster.database.database_name}"
  cors_origin      = "https://${module.s3_website.cloudfront_domain_name}"
  ml_sqs_queue_url = module.aws_batch_ml.sqs_queue_url
  ml_sqs_queue_arn = module.aws_batch_ml.sqs_queue_arn

  # AWS resources
  database_secret_arn     = aws_secretsmanager_secret.database_password.arn
  jwt_secret_arn         = aws_secretsmanager_secret.jwt_secret.arn
  s3_uploads_bucket_arn  = aws_s3_bucket.uploads.arn
  s3_uploads_bucket_name = aws_s3_bucket.uploads.bucket

  # VPC configuration for database access
  vpc_config = {
    subnet_ids         = aws_subnet.private[*].id
    security_group_ids = [aws_security_group.lambda.id]
  }

  log_retention_days = 14
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

  # CORS configuration
  cors_allow_origins = [
    "https://${module.s3_website.cloudfront_domain_name}",
    "https://${local.website_domain}",  # Custom domain
    "http://localhost:3000",  # Development
    "http://localhost:3100"   # Docker development
  ]

  stage_name         = "v1"
  log_retention_days = 14
}

# =================================
# Route53 Records (Custom Domains)
# =================================

# DNS Records for this sub-environment
resource "aws_route53_record" "website" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = local.website_domain  # qa03.hibiji.com
  type    = "CNAME"
  ttl     = 300
  records = [module.s3_website.cloudfront_domain_name]
  
  lifecycle {
    ignore_changes = [records]
  }
}

resource "aws_route53_record" "api" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = local.api_domain  # qa03-api.hibiji.com
  type    = "CNAME"
  ttl     = 300
  records = [replace(replace(module.api_gateway.api_url, "https://", ""), "/v1", "")]
  
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

output "domain_name" {
  description = "Domain name for the environment"
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
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  # Database configuration
  database_secret_arn = aws_secretsmanager_secret.database_password.arn

  # Batch compute configuration (production-like for Staging)
  min_vcpus             = 0
  max_vcpus             = 8
  desired_vcpus         = 0
  instance_types        = ["m5.large", "m5.xlarge", "c5.large"]
  use_spot_instances    = true
  spot_bid_percentage   = 50

  # Job configuration
  job_vcpus  = 2
  job_memory = 4096

  # Logging
  log_retention_days = 14
  log_level         = "INFO"
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