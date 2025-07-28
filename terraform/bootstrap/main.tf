# =================================
# Terraform Bootstrap Configuration
# =================================
# This creates the foundational infrastructure needed for Terraform state management
# and other bootstrap resources before main deployments can run.

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Bootstrap uses local state since we're creating the remote state bucket
  backend "local" {}
}

# Provider configuration
provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region for bootstrap resources"
  type        = string
  default     = "us-west-1"
}

variable "state_bucket_name" {
  description = "Name of the S3 bucket for Terraform state"
  type        = string
  default     = "hibiji-terraform-state"
}

variable "project_name" {
  description = "Project name for tagging"
  type        = string
  default     = "dpp"
}

# Local values for consistent tagging
locals {
  common_tags = {
    Project     = var.project_name
    Environment = "bootstrap"
    ManagedBy   = "Terraform"
    Purpose     = "Bootstrap"
    CreatedAt   = timestamp()
  }
}

# =================================
# S3 Bucket for Terraform State
# =================================

resource "aws_s3_bucket" "terraform_state" {
  bucket = var.state_bucket_name

  tags = merge(local.common_tags, {
    Name        = var.state_bucket_name
    Type        = "TerraformState"
    Description = "S3 bucket for storing Terraform state files"
  })

  lifecycle {
    prevent_destroy = true
  }
}

# Enable versioning for state file protection
resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Enable server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }

    bucket_key_enabled = true
  }
}

# Block public access
resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle configuration to manage old versions
resource "aws_s3_bucket_lifecycle_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    id     = "terraform_state_lifecycle"
    status = "Enabled"

    filter {
      prefix = ""
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# =================================
# Outputs
# =================================

output "state_bucket_name" {
  description = "Name of the Terraform state bucket"
  value       = aws_s3_bucket.terraform_state.id
}

output "state_bucket_arn" {
  description = "ARN of the Terraform state bucket"
  value       = aws_s3_bucket.terraform_state.arn
}

output "state_bucket_region" {
  description = "Region of the Terraform state bucket"
  value       = aws_s3_bucket.terraform_state.region
}
