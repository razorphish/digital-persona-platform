# =================================
# AWS Batch ML Processing Variables
# =================================

# Environment Configuration
variable "environment" {
  description = "Environment name (dev, qa, staging, prod, etc.)"
  type        = string
}

variable "sub_environment" {
  description = "Sub-environment name (dev01, qa05, etc.)"
  type        = string
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "dpp"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-west-1"
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

# Network Configuration
variable "vpc_id" {
  description = "VPC ID where Batch compute environment will be deployed"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for Batch compute environment"
  type        = list(string)
}

# Database Configuration
variable "database_secret_arn" {
  description = "ARN of the database password secret in Secrets Manager"
  type        = string
}

# Batch Compute Configuration
variable "min_vcpus" {
  description = "Minimum number of vCPUs for the compute environment"
  type        = number
  default     = 0
}

variable "max_vcpus" {
  description = "Maximum number of vCPUs for the compute environment"
  type        = number
  default     = 10
}

variable "desired_vcpus" {
  description = "Desired number of vCPUs for the compute environment"
  type        = number
  default     = 0
}

variable "instance_types" {
  description = "List of instance types for the compute environment"
  type        = list(string)
  default     = ["m5.large", "m5.xlarge", "c5.large", "c5.xlarge"]
}

variable "use_spot_instances" {
  description = "Whether to use spot instances for cost optimization"
  type        = bool
  default     = true
}

variable "spot_bid_percentage" {
  description = "Percentage of On-Demand pricing to bid for spot instances"
  type        = number
  default     = 50
}

# Job Configuration
variable "job_vcpus" {
  description = "Number of vCPUs for each ML processing job"
  type        = number
  default     = 1
}

variable "job_memory" {
  description = "Memory (MB) for each ML processing job"
  type        = number
  default     = 2048
}

# Logging Configuration
variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 14
}

variable "log_level" {
  description = "Log level for ML service"
  type        = string
  default     = "INFO"
}

# Feature Flags
variable "enable_batch_processing" {
  description = "Enable AWS Batch processing (can be disabled for environments that don't need ML)"
  type        = bool
  default     = true
} 