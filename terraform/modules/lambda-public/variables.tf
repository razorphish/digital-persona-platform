# =================================
# Lambda Public Variables
# =================================

variable "environment" {
  description = "Environment name (dev, qa, staging, prod)"
  type        = string
}

variable "sub_environment" {
  description = "Sub-environment name (dev01, qa05, etc.)"
  type        = string
}

variable "function_name" {
  description = "Name of the Lambda function (e.g., 'api', 'worker')"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-west-1"
}

# Lambda Configuration
variable "handler" {
  description = "Lambda function handler (e.g., 'index.handler')"
  type        = string
  default     = "index.handler"
}

variable "runtime" {
  description = "Lambda runtime (e.g., 'nodejs20.x', 'python3.12')"
  type        = string
  default     = "nodejs20.x"
}

variable "timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30

  validation {
    condition     = var.timeout >= 1 && var.timeout <= 900
    error_message = "Timeout must be between 1 and 900 seconds."
  }
}

variable "memory_size" {
  description = "Lambda function memory size in MB"
  type        = number
  default     = 512

  validation {
    condition     = var.memory_size >= 128 && var.memory_size <= 10240
    error_message = "Memory size must be between 128 and 10240 MB."
  }
}

variable "source_code_path" {
  description = "Path to the Lambda deployment package (zip file)"
  type        = string
}

variable "environment_variables" {
  description = "Environment variables for the Lambda function"
  type        = map(string)
  default     = {}
}

variable "reserved_concurrent_executions" {
  description = "Reserved concurrent executions (-1 for unreserved)"
  type        = number
  default     = -1
}

variable "lambda_layers" {
  description = "List of Lambda layer ARNs"
  type        = list(string)
  default     = []
}

# RDS Proxy Configuration
variable "rds_proxy_endpoint" {
  description = "RDS Proxy endpoint for database connection"
  type        = string
  default     = null
}

variable "rds_proxy_resource_id" {
  description = "RDS Proxy resource ID for IAM authentication (e.g., 'prx-abc123')"
  type        = string
  default     = null
}

variable "database_name" {
  description = "Database name to connect to"
  type        = string
  default     = null
}

# S3 Configuration
variable "s3_bucket_arns" {
  description = "List of S3 bucket ARNs to grant access to"
  type        = list(string)
  default     = []
}

# Custom IAM Policy
variable "custom_iam_policy_json" {
  description = "Custom IAM policy JSON for additional permissions"
  type        = string
  default     = null
}

# Logging Configuration
variable "log_retention_days" {
  description = "CloudWatch Logs retention period in days"
  type        = number
  default     = 7

  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.log_retention_days)
    error_message = "Log retention must be a valid CloudWatch Logs retention period."
  }
}

# Monitoring Configuration
variable "enable_xray_tracing" {
  description = "Enable AWS X-Ray tracing"
  type        = bool
  default     = false
}

variable "dead_letter_target_arn" {
  description = "ARN of SQS queue or SNS topic for dead letter queue"
  type        = string
  default     = null
}

# Function URL Configuration
variable "create_function_url" {
  description = "Create a Lambda Function URL"
  type        = bool
  default     = false
}

variable "function_url_auth_type" {
  description = "Authorization type for function URL (AWS_IAM or NONE)"
  type        = string
  default     = "AWS_IAM"

  validation {
    condition     = contains(["AWS_IAM", "NONE"], var.function_url_auth_type)
    error_message = "Function URL auth type must be AWS_IAM or NONE."
  }
}

variable "function_url_cors_config" {
  description = "CORS configuration for function URL"
  type = object({
    allow_origins     = list(string)
    allow_methods     = list(string)
    allow_headers     = list(string)
    expose_headers    = list(string)
    max_age           = number
    allow_credentials = bool
  })
  default = null
}

# Alias Configuration
variable "create_alias" {
  description = "Create a Lambda alias"
  type        = bool
  default     = false
}

variable "alias_name" {
  description = "Name of the Lambda alias"
  type        = string
  default     = "live"
}

variable "alias_function_version" {
  description = "Function version for the alias"
  type        = string
  default     = "$LATEST"
}

# Tags
variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

