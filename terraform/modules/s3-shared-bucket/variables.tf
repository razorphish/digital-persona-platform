# =================================
# S3 Shared Bucket Variables
# =================================

variable "environment" {
  description = "Environment name (nonprod, prod)"
  type        = string
}

variable "bucket_name" {
  description = "Base name for the S3 bucket (will be prefixed with environment)"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-west-1"
}

# Access Control
variable "authorized_role_arns" {
  description = "List of IAM role ARNs authorized to access the bucket"
  type        = list(string)
  default     = []
}

variable "sub_environment_prefixes" {
  description = "List of sub-environment prefixes (e.g., ['dev01', 'dev02', 'qa01'])"
  type        = list(string)
  default     = []
}

# Bucket Configuration
variable "enable_versioning" {
  description = "Enable versioning for the bucket"
  type        = bool
  default     = true
}

variable "enable_metrics" {
  description = "Enable CloudWatch metrics for the bucket"
  type        = bool
  default     = false
}

variable "logging_target_bucket" {
  description = "Target bucket for access logs (optional)"
  type        = string
  default     = null
}

# Lifecycle Configuration
variable "lifecycle_rules" {
  description = "List of lifecycle rules for the bucket"
  type = list(object({
    id                                   = string
    enabled                              = bool
    prefix                               = optional(string)
    expiration_days                      = optional(number)
    noncurrent_version_expiration_days   = optional(number)
    transitions = optional(list(object({
      days          = number
      storage_class = string
    })), [])
  }))
  default = null
}

# CORS Configuration
variable "cors_rules" {
  description = "List of CORS rules for the bucket"
  type = list(object({
    allowed_headers = list(string)
    allowed_methods = list(string)
    allowed_origins = list(string)
    expose_headers  = optional(list(string), [])
    max_age_seconds = optional(number, 3000)
  }))
  default = null
}

# Tags
variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

