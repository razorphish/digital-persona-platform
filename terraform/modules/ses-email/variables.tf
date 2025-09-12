# =================================
# SES Email Service Module Variables
# =================================

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "sub_environment" {
  description = "Sub-environment name (e.g., dev01, dev02)"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "domain_name" {
  description = "Domain name for SES identity"
  type        = string
}

variable "from_email" {
  description = "Verified sender email address"
  type        = string
}

variable "lambda_execution_role_name" {
  description = "Name of the Lambda execution role to attach SES permissions to"
  type        = string
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
