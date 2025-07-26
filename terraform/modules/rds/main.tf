# RDS Aurora Serverless v2 for Digital Persona Platform

# Database subnet group
resource "aws_db_subnet_group" "database" {
  name       = "${var.environment}-${var.sub_environment}-db-subnet-group"
  subnet_ids = var.subnet_ids
  
  tags = {
    Name        = "${var.environment}-${var.sub_environment}-db-subnet-group"
    Environment = var.environment
    Project     = "digital-persona"
    SubEnvironment = var.sub_environment
  }
}

# Database cluster parameter group for Aurora PostgreSQL
resource "aws_rds_cluster_parameter_group" "main" {
  family      = "aurora-postgresql15"
  name        = "${var.environment}-${var.sub_environment}-cluster-pg"
  description = "Cluster parameter group for ${var.environment}-${var.sub_environment}"
  
  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }
  
  parameter {
    name  = "log_statement"
    value = "all"
  }
  
  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }
  
  tags = {
    Name        = "${var.environment}-${var.sub_environment}-cluster-pg"
    Environment = var.environment
    Project     = "digital-persona"
  }
}

# Aurora Serverless v2 cluster
resource "aws_rds_cluster" "main" {
  cluster_identifier             = "${var.environment}-${var.sub_environment}-cluster"
  engine                        = "aurora-postgresql"
  engine_mode                   = "provisioned"
  engine_version                = var.engine_version
  database_name                 = var.database_name
  master_username               = var.master_username
  manage_master_user_password   = true
  
  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.main.name
  db_subnet_group_name           = aws_db_subnet_group.database.name
  vpc_security_group_ids         = var.security_group_ids
  
  backup_retention_period = var.backup_retention_period
  preferred_backup_window = var.backup_window
  preferred_maintenance_window = var.maintenance_window
  
  serverlessv2_scaling_configuration {
    max_capacity = var.max_capacity
    min_capacity = var.min_capacity
  }
  
  skip_final_snapshot = var.environment != "prod"
  deletion_protection = var.environment == "prod"
  
  copy_tags_to_snapshot = true
  
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  tags = {
    Name        = "${var.environment}-${var.sub_environment}-cluster"
    Environment = var.environment
    Project     = "digital-persona"
    SubEnvironment = var.sub_environment
  }
}

# Aurora Serverless v2 instance
resource "aws_rds_cluster_instance" "cluster_instances" {
  count              = var.instance_count
  identifier         = "${var.environment}-${var.sub_environment}-${count.index}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version
  
  performance_insights_enabled = var.environment != "dev"
  monitoring_interval         = var.environment == "prod" ? 60 : 0
  
  tags = {
    Name        = "${var.environment}-${var.sub_environment}-instance-${count.index}"
    Environment = var.environment
    Project     = "digital-persona"
  }
}

# CloudWatch log group for Aurora logs
resource "aws_cloudwatch_log_group" "aurora_postgresql" {
  name              = "/aws/rds/cluster/${aws_rds_cluster.main.cluster_identifier}/postgresql"
  retention_in_days = var.log_retention_days
  
  tags = {
    Name        = "${var.environment}-${var.sub_environment}-aurora-logs"
    Environment = var.environment
    Project     = "digital-persona"
  }
}

# Variables
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "sub_environment" {
  description = "Sub-environment name"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for the DB subnet group"
  type        = list(string)
}

variable "security_group_ids" {
  description = "List of security group IDs"
  type        = list(string)
}

variable "engine_version" {
  description = "Aurora PostgreSQL engine version"
  type        = string
  default     = "15.10"
}

variable "database_name" {
  description = "Name of the database"
  type        = string
  default     = "digital_persona"
}

variable "master_username" {
  description = "Master username for the database"
  type        = string
  default     = "dpp_admin"
}

variable "backup_retention_period" {
  description = "Number of days to retain backups"
  type        = number
  default     = 7
}

variable "backup_window" {
  description = "Preferred backup window"
  type        = string
  default     = "07:00-09:00"
}

variable "maintenance_window" {
  description = "Preferred maintenance window"
  type        = string
  default     = "sun:09:00-sun:10:00"
}

variable "max_capacity" {
  description = "Maximum capacity for Aurora Serverless v2"
  type        = number
  default     = 1
}

variable "min_capacity" {
  description = "Minimum capacity for Aurora Serverless v2"
  type        = number
  default     = 0.5
}

variable "instance_count" {
  description = "Number of instances in the cluster"
  type        = number
  default     = 1
}

variable "log_retention_days" {
  description = "CloudWatch logs retention in days"
  type        = number
  default     = 14
}

# Outputs
output "cluster_endpoint" {
  description = "Aurora cluster endpoint"
  value       = aws_rds_cluster.main.endpoint
}

output "cluster_reader_endpoint" {
  description = "Aurora cluster reader endpoint"
  value       = aws_rds_cluster.main.reader_endpoint
}

output "cluster_identifier" {
  description = "Aurora cluster identifier"
  value       = aws_rds_cluster.main.cluster_identifier
}

output "master_username" {
  description = "Master username"
  value       = aws_rds_cluster.main.master_username
}

output "database_name" {
  description = "Database name"
  value       = aws_rds_cluster.main.database_name
}

output "port" {
  description = "Database port"
  value       = aws_rds_cluster.main.port
}

output "master_user_secret_arn" {
  description = "ARN of the master user secret"
  value       = aws_rds_cluster.main.master_user_secret[0].secret_arn
  sensitive   = true
} 