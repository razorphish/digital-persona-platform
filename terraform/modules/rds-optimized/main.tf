# Optimized RDS Configuration
# Cost-optimized settings for Aurora Serverless v2

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "cluster_identifier" {
  description = "RDS cluster identifier"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "min_capacity" {
  description = "Minimum Aurora capacity units (ACU)"
  type        = number
  default     = 0.5
}

variable "max_capacity" {
  description = "Maximum Aurora capacity units (ACU)"
  type        = number
  default     = 1.0
}

variable "backup_retention_period" {
  description = "Days to retain automated backups"
  type        = number
  default     = 3
}

variable "enable_encryption" {
  description = "Enable storage encryption"
  type        = bool
  default     = true
}

variable "kms_key_id" {
  description = "KMS key ID for encryption (optional)"
  type        = string
  default     = null
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = false
}

variable "preferred_backup_window" {
  description = "Daily time range for backups (UTC)"
  type        = string
  default     = "07:00-09:00"
}

variable "preferred_maintenance_window" {
  description = "Weekly time range for maintenance (UTC)"
  type        = string
  default     = "sun:09:00-sun:10:00"
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}

# Data source to get the existing cluster
data "aws_rds_cluster" "existing" {
  cluster_identifier = var.cluster_identifier
}

# Note: This configuration shows the recommended settings
# Apply these changes to your existing RDS module/resource

locals {
  optimized_settings = {
    # Serverless v2 Scaling
    serverlessv2_scaling_configuration = {
      min_capacity = var.min_capacity
      max_capacity = var.max_capacity
    }
    
    # Backup Configuration
    backup_retention_period      = var.backup_retention_period
    preferred_backup_window      = var.preferred_backup_window
    preferred_maintenance_window = var.preferred_maintenance_window
    
    # Security
    storage_encrypted       = var.enable_encryption
    kms_key_id             = var.kms_key_id
    deletion_protection    = var.enable_deletion_protection
    
    # Cost Optimization Tags
    tags = merge(var.tags, {
      CostOptimized    = "true"
      BackupRetention  = var.backup_retention_period
      MaxCapacity      = var.max_capacity
      Environment      = var.environment
    })
  }
}

# Output the recommended configuration
output "recommended_config" {
  description = "Recommended RDS configuration for cost optimization"
  value       = local.optimized_settings
}

output "current_config" {
  description = "Current RDS cluster configuration"
  value = {
    status                = data.aws_rds_cluster.existing.status
    engine_version        = data.aws_rds_cluster.existing.engine_version
    backup_retention      = data.aws_rds_cluster.existing.backup_retention_period
    storage_encrypted     = data.aws_rds_cluster.existing.storage_encrypted
    deletion_protection   = data.aws_rds_cluster.existing.deletion_protection
    serverless_v2_scaling = data.aws_rds_cluster.existing.serverlessv2_scaling_configuration
  }
}

output "cost_optimization_summary" {
  description = "Summary of cost optimization changes"
  value = {
    current_backup_retention = data.aws_rds_cluster.existing.backup_retention_period
    new_backup_retention     = var.backup_retention_period
    current_max_capacity     = try(data.aws_rds_cluster.existing.serverlessv2_scaling_configuration[0].max_capacity, "N/A")
    new_max_capacity         = var.max_capacity
    encryption_enabled       = var.enable_encryption
    estimated_monthly_savings = "$40-60"
  }
}

