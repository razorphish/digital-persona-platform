# =================================
# SHARED TERRAFORM VARIABLES
# =================================
# Common variables used across all environments
# This file should be included/referenced by all environment configurations

variable "environment" {
  description = "Environment name (dev, qa, staging, prod, hotfix)"
  type        = string
  validation {
    condition     = can(regex("^(dev|qa|staging|prod|hotfix|main)$", var.environment))
    error_message = "Environment must be one of: dev, qa, staging, prod, hotfix, main"
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
  is_production  = var.environment == "prod"
  is_staging     = var.environment == "staging"
  is_development = contains(["dev", "qa"], var.environment)
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
