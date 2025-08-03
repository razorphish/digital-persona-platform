# =================================
# SHARED TERRAFORM VARIABLES
# =================================
# Common variables used across all environments
# This file should be included/referenced by all environment configurations

variable "environment" {
  description = "Environment name (dev, qa, staging, prod, hotfix, local)"
  type        = string
  validation {
    condition     = can(regex("^(dev|qa|staging|prod|hotfix|main|local)$", var.environment))
    error_message = "Environment must be one of: dev, qa, staging, prod, hotfix, main, local"
  }
}

variable "sub_environment" {
  description = "Sub-environment identifier (e.g., dev01, qa03, staging02)"
  type        = string
  validation {
    condition     = can(regex("^[a-z0-9]+$", var.sub_environment))
    error_message = "Sub-environment must be alphanumeric lowercase (e.g., dev01, qa03)"
  }
}

variable "project_name" {
  description = "Project name used in resource naming"
  type        = string
  default     = "dpp"
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must be lowercase alphanumeric with hyphens"
  }
}

variable "domain_name" {
  description = "Primary domain name for the project"
  type        = string
  default     = "hibiji.com"
  validation {
    condition     = can(regex("^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\\.[a-zA-Z]{2,}$", var.domain_name))
    error_message = "Domain name must be a valid domain format"
  }
}

variable "aws_region" {
  description = "Primary AWS region for resource deployment"
  type        = string
  default     = "us-west-1"
  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[0-9]+$", var.aws_region))
    error_message = "AWS region must be in valid format (e.g., us-west-1)"
  }
}

variable "aws_cert_region" {
  description = "AWS region for SSL certificates (must be us-east-1 for CloudFront)"
  type        = string
  default     = "us-east-1"
  validation {
    condition     = var.aws_cert_region == "us-east-1"
    error_message = "SSL certificates for CloudFront must be in us-east-1 region"
  }
}

variable "organization_name" {
  description = "Organization name used in resource naming and tagging"
  type        = string
  default     = "hibiji"
  validation {
    condition     = can(regex("^[a-z0-9-]+$", var.organization_name))
    error_message = "Organization name must be lowercase alphanumeric with hyphens"
  }
}

variable "alert_emails" {
  description = "List of email addresses for alerts and notifications"
  type        = list(string)
  default     = ["alerts@maras.co"]
  validation {
    condition = alltrue([
      for email in var.alert_emails : can(regex("^[^@]+@[^@]+\\.[^@]+$", email))
    ])
    error_message = "All alert emails must be valid email addresses"
  }
}

# =================================
# COST OPTIMIZATION VARIABLES
# =================================

variable "aurora_auto_pause" {
  description = "Enable Aurora Serverless auto-pause for cost savings"
  type        = bool
  default     = false
}

variable "aurora_pause_delay" {
  description = "Minutes before Aurora auto-pauses (300 = 5 minutes)"
  type        = number
  default     = 300
  validation {
    condition     = var.aurora_pause_delay >= 300
    error_message = "Aurora pause delay must be at least 300 seconds (5 minutes)"
  }
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
  validation {
    condition     = var.lambda_memory_size >= 128 && var.lambda_memory_size <= 10240
    error_message = "Lambda memory must be between 128 and 10240 MB"
  }
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
  validation {
    condition     = var.lambda_timeout >= 1 && var.lambda_timeout <= 900
    error_message = "Lambda timeout must be between 1 and 900 seconds"
  }
}

variable "log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 14
  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.log_retention_days)
    error_message = "Log retention must be a valid CloudWatch retention period"
  }
}

variable "s3_lifecycle_transition_days" {
  description = "Days before S3 objects transition to IA storage"
  type        = number
  default     = 30
}

variable "s3_lifecycle_expiration_days" {
  description = "Days before S3 objects are deleted (0 = never delete)"
  type        = number
  default     = 0
}

variable "cost_budget_limit" {
  description = "Monthly budget limit in USD for cost monitoring"
  type        = number
  default     = 100
}

# =================================
# COMPUTED LOCAL VALUES
# =================================

locals {
  # Resource naming convention
  resource_prefix = "${var.environment}-${var.sub_environment}-${var.project_name}"

  # Domain generation
  website_domain = var.environment == "prod" ? "www.${var.domain_name}" : "${var.sub_environment}.${var.domain_name}"
  api_domain     = var.environment == "prod" ? "api.${var.domain_name}" : "${var.sub_environment}-api.${var.domain_name}"

  # Common tags applied to all resources
  common_tags = {
    Environment    = var.environment
    SubEnvironment = var.sub_environment
    Project        = var.project_name
    Organization   = var.organization_name
    ManagedBy      = "terraform"
    Domain         = var.domain_name
    ResourcePrefix = local.resource_prefix
  }

  # Environment-specific configuration
  is_production     = var.environment == "prod"
  is_staging        = var.environment == "staging"
  is_development    = contains(["dev", "qa", "local"], var.environment)
  is_cost_optimized = contains(["dev", "qa", "local"], var.environment)
}

# =================================
# OUTPUTS
# =================================

output "resource_prefix" {
  description = "Generated resource prefix for naming consistency"
  value       = local.resource_prefix
}

output "website_domain" {
  description = "Generated website domain"
  value       = local.website_domain
}

output "api_domain" {
  description = "Generated API domain"
  value       = local.api_domain
}

output "common_tags" {
  description = "Common tags applied to all resources"
  value       = local.common_tags
}
