# ECR Lifecycle Policy Module
# Automatically cleans up old Docker images to reduce storage costs

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "repository_name" {
  description = "Name of the ECR repository"
  type        = string
}

variable "max_image_count" {
  description = "Maximum number of images to keep"
  type        = number
  default     = 5
}

variable "untagged_image_days" {
  description = "Days to keep untagged images"
  type        = number
  default     = 7
}

variable "any_image_days" {
  description = "Days to keep any image (fallback rule)"
  type        = number
  default     = 30
}

# ECR Lifecycle Policy
resource "aws_ecr_lifecycle_policy" "cleanup" {
  repository = var.repository_name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last ${var.max_image_count} tagged images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v", "release-", "main-", "dev-"]
          countType     = "imageCountMoreThan"
          countNumber   = var.max_image_count
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Remove untagged images after ${var.untagged_image_days} days"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = var.untagged_image_days
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 3
        description  = "Remove any images older than ${var.any_image_days} days"
        selection = {
          tagStatus   = "any"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = var.any_image_days
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

output "policy_text" {
  description = "The ECR lifecycle policy text"
  value       = aws_ecr_lifecycle_policy.cleanup.policy
}







