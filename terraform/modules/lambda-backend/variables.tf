# =================================
# Lambda Backend Variables
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
  description = "Project name for resource naming"
  type        = string
  default     = "dpp"
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# Lambda Configuration
variable "lambda_runtime" {
  description = "Lambda runtime environment"
  type        = string
  default     = "nodejs18.x"
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "lambda_memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 512
}

variable "lambda_deployment_key" {
  description = "S3 key for Lambda deployment package"
  type        = string
  default     = "lambda-api.zip"
}

# Environment Variables
variable "database_url" {
  description = "Database connection URL"
  type        = string
}

variable "cors_origin" {
  description = "CORS origin for API requests"
  type        = string
}

variable "additional_environment_variables" {
  description = "Additional environment variables for Lambda functions"
  type        = map(string)
  default     = {}
}

# AWS Resources
variable "database_secret_arn" {
  description = "ARN of the database password secret in Secrets Manager"
  type        = string
}

variable "jwt_secret_arn" {
  description = "ARN of the JWT secret in Secrets Manager"
  type        = string
}

variable "s3_uploads_bucket_arn" {
  description = "ARN of the S3 bucket for file uploads"
  type        = string
}

variable "s3_uploads_bucket_name" {
  description = "Name of the S3 bucket for file uploads"
  type        = string
}

variable "rds_resource_arn" {
  description = "ARN of the RDS instance (for RDS Proxy access)"
  type        = string
  default     = null
}

# VPC Configuration (optional)
variable "vpc_config" {
  description = "VPC configuration for Lambda functions"
  type = object({
    subnet_ids         = list(string)
    security_group_ids = list(string)
  })
  default = null
}

# Dead Letter Queue
variable "dlq_arn" {
  description = "ARN of the Dead Letter Queue for failed Lambda invocations"
  type        = string
  default     = null
}

# Logging
variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 14
}

# Lambda Layer
variable "create_dependencies_layer" {
  description = "Whether to create a Lambda layer for shared dependencies"
  type        = bool
  default     = false
}

variable "dependencies_layer_filename" {
  description = "Filename for the dependencies layer ZIP file"
  type        = string
  default     = null
} 