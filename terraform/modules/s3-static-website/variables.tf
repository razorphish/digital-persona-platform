# =================================
# S3 Static Website Variables
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

variable "cloudfront_price_class" {
  description = "CloudFront price class"
  type        = string
  default     = "PriceClass_100"
  validation {
    condition = contains([
      "PriceClass_All",
      "PriceClass_200", 
      "PriceClass_100"
    ], var.cloudfront_price_class)
    error_message = "Price class must be PriceClass_All, PriceClass_200, or PriceClass_100."
  }
}

variable "custom_domain" {
  description = "Custom domain name for the website (optional)"
  type        = string
  default     = null
}

variable "ssl_certificate_arn" {
  description = "ARN of the SSL certificate for custom domain (required if custom_domain is set)"
  type        = string
  default     = null
}

variable "build_retention_days" {
  description = "Number of days to retain build artifacts"
  type        = number
  default     = 30
} 