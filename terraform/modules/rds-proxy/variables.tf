# =================================
# RDS Proxy Module Variables
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
  description = "VPC ID where RDS Proxy will be deployed"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for RDS Proxy"
  type        = list(string)
}

variable "lambda_security_group_ids" {
  description = "List of Lambda security group IDs that need access to RDS Proxy"
  type        = list(string)
}

variable "database_security_group_ids" {
  description = "List of database security group IDs that RDS Proxy needs access to"
  type        = list(string)
}

# Database Configuration
variable "database_cluster_identifier" {
  description = "RDS cluster identifier to connect to"
  type        = string
}

variable "database_secret_arn" {
  description = "ARN of the Secrets Manager secret containing database credentials"
  type        = string
}

# RDS Proxy Configuration
variable "idle_client_timeout" {
  description = "The number of seconds that a connection to the proxy can be inactive before the proxy disconnects it"
  type        = number
  default     = 1800  # 30 minutes
}

variable "max_connections_percent" {
  description = "The maximum size of the connection pool for each target in a target group"
  type        = number
  default     = 100
}

variable "max_idle_connections_percent" {
  description = "Controls how actively the proxy closes idle database connections in the connection pool"
  type        = number
  default     = 50
}

variable "connection_borrow_timeout" {
  description = "The number of seconds for a proxy to wait for a connection to become available in the connection pool"
  type        = number
  default     = 120
}

variable "session_pinning_filters" {
  description = "Each item in the list represents a class of SQL operations that normally cause all later statements in a session to be pinned to the same underlying database connection"
  type        = list(string)
  default     = ["EXCLUDE_VARIABLE_SETS"]
}

variable "require_tls" {
  description = "A Boolean parameter that specifies whether Transport Layer Security (TLS) encryption is required for connections to the proxy"
  type        = bool
  default     = false
}

variable "log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 14
} 