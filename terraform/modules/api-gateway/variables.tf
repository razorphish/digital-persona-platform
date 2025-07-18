# =================================
# API Gateway Variables
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

# API Gateway Configuration
variable "stage_name" {
  description = "API Gateway stage name"
  type        = string
  default     = "v1"
}

variable "auto_deploy" {
  description = "Whether to automatically deploy changes"
  type        = bool
  default     = true
}

# Lambda Function Configuration
variable "lambda_function_name" {
  description = "Name of the main Lambda function"
  type        = string
}

variable "lambda_function_invoke_arn" {
  description = "Invoke ARN of the main Lambda function"
  type        = string
}

variable "health_lambda_function_name" {
  description = "Name of the health check Lambda function"
  type        = string
}

variable "health_lambda_function_invoke_arn" {
  description = "Invoke ARN of the health check Lambda function"
  type        = string
}

# CORS Configuration
variable "cors_allow_credentials" {
  description = "Whether to allow credentials in CORS requests"
  type        = bool
  default     = true
}

variable "cors_allow_headers" {
  description = "List of allowed headers for CORS"
  type        = list(string)
  default = [
    "content-type",
    "x-amz-date",
    "authorization",
    "x-api-key",
    "x-amz-security-token",
    "x-amz-user-agent",
    "x-trpc-source"
  ]
}

variable "cors_allow_methods" {
  description = "List of allowed HTTP methods for CORS"
  type        = list(string)
  default     = ["*"]
}

variable "cors_allow_origins" {
  description = "List of allowed origins for CORS"
  type        = list(string)
  default     = ["*"]
}

variable "cors_expose_headers" {
  description = "List of headers to expose in CORS"
  type        = list(string)
  default     = []
}

variable "cors_max_age" {
  description = "Maximum age for CORS preflight requests"
  type        = number
  default     = 86400
}

# Performance and Monitoring
variable "enable_detailed_metrics" {
  description = "Whether to enable detailed CloudWatch metrics"
  type        = bool
  default     = true
}

variable "throttling_burst_limit" {
  description = "API Gateway throttling burst limit"
  type        = number
  default     = 5000
}

variable "throttling_rate_limit" {
  description = "API Gateway throttling rate limit"
  type        = number
  default     = 2000
}

variable "integration_timeout_ms" {
  description = "Integration timeout in milliseconds"
  type        = number
  default     = 30000
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 14
}

# Routing Configuration
variable "enable_default_route" {
  description = "Whether to enable a default catch-all route"
  type        = bool
  default     = false
}

# Custom Domain Configuration
variable "custom_domain_name" {
  description = "Custom domain name for the API (optional)"
  type        = string
  default     = null
}

variable "certificate_arn" {
  description = "ARN of the SSL certificate for custom domain"
  type        = string
  default     = null
} 