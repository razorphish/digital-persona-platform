# =================================
# RDS Proxy Enhanced Variables
# =================================

variable "environment" {
  description = "Environment name (dev, qa, staging, prod)"
  type        = string
}

variable "sub_environment" {
  description = "Sub-environment name (dev01, qa05, etc.)"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-west-1"
}

# Network Configuration
variable "subnet_ids" {
  description = "List of subnet IDs for RDS Proxy"
  type        = list(string)
}

# Database Configuration
variable "db_cluster_arn" {
  description = "ARN of the RDS Aurora cluster"
  type        = string
}

variable "db_cluster_identifier" {
  description = "Identifier of the RDS Aurora cluster"
  type        = string
}

variable "db_secret_arn" {
  description = "ARN of the Secrets Manager secret containing DB credentials"
  type        = string
}

variable "kms_key_arn" {
  description = "ARN of the KMS key for decrypting secrets"
  type        = string
}

# Connection Pooling Configuration
variable "max_connections_percent" {
  description = "Maximum percentage of available connections to use"
  type        = number
  default     = 100

  validation {
    condition     = var.max_connections_percent >= 1 && var.max_connections_percent <= 100
    error_message = "Max connections percent must be between 1 and 100."
  }
}

variable "max_idle_connections_percent" {
  description = "Maximum percentage of idle connections to keep open"
  type        = number
  default     = 50

  validation {
    condition     = var.max_idle_connections_percent >= 0 && var.max_idle_connections_percent <= 100
    error_message = "Max idle connections percent must be between 0 and 100."
  }
}

variable "connection_borrow_timeout" {
  description = "Timeout in seconds for borrowing a connection from the pool"
  type        = number
  default     = 120

  validation {
    condition     = var.connection_borrow_timeout >= 0 && var.connection_borrow_timeout <= 3600
    error_message = "Connection borrow timeout must be between 0 and 3600 seconds."
  }
}

variable "idle_client_timeout" {
  description = "Timeout in seconds for idle client connections"
  type        = number
  default     = 1800  # 30 minutes

  validation {
    condition     = var.idle_client_timeout >= 0 && var.idle_client_timeout <= 28800
    error_message = "Idle client timeout must be between 0 and 28800 seconds."
  }
}

variable "init_query" {
  description = "SQL query to run when opening a new connection (optional)"
  type        = string
  default     = ""
}

variable "session_pinning_filters" {
  description = "List of SQL statement types to pin sessions for"
  type        = list(string)
  default     = []
}

# Endpoints Configuration
variable "create_read_write_endpoint" {
  description = "Create a separate read-write endpoint"
  type        = bool
  default     = false
}

variable "create_read_only_endpoint" {
  description = "Create a separate read-only endpoint"
  type        = bool
  default     = false
}

# Monitoring Configuration
variable "enable_debug_logging" {
  description = "Enable debug logging (verbose, disable in production)"
  type        = bool
  default     = false
}

# Tags
variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}

