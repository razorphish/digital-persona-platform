# RDS PostgreSQL Module for Hibiji Platform

# Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "hibiji-${var.environment}-db-subnet-group"
  subnet_ids = var.subnet_ids
  
  tags = {
    Name        = "hibiji-${var.environment}-db-subnet-group"
    Environment = var.environment
    Project     = "hibiji"
  }
}

# Security Group
resource "aws_security_group" "rds" {
  name_prefix = "hibiji-${var.environment}-rds-"
  vpc_id      = var.vpc_id
  
  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [var.app_security_group_id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = {
    Name        = "hibiji-${var.environment}-rds-sg"
    Environment = var.environment
    Project     = "hibiji"
  }
}

# Parameter Group for optimization
resource "aws_db_parameter_group" "main" {
  family = "postgres15"
  name   = "hibiji-${var.environment}-pg-params"
  
  parameter {
    name  = "max_connections"
    value = var.max_connections
  }
  
  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }
  
  parameter {
    name  = "log_min_duration_statement"
    value = "1000"
  }
  
  tags = {
    Name        = "hibiji-${var.environment}-pg-params"
    Environment = var.environment
    Project     = "hibiji"
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "hibiji-${var.environment}-db"
  
  # Engine configuration
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.instance_class
  
  # Storage configuration
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  
  # Database configuration
  db_name  = "hibiji_${replace(var.environment, "-", "_")}"
  username = var.db_username
  password = var.db_password
  
  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  
  # Backup configuration
  backup_retention_period = var.backup_retention_period
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  # Performance configuration
  parameter_group_name = aws_db_parameter_group.main.name
  performance_insights_enabled = var.environment == "prod" || var.environment == "staging"
  performance_insights_retention_period = 7
  
  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = var.monitoring_role_arn
  
  # Deletion protection
  deletion_protection = var.environment == "prod"
  skip_final_snapshot = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "hibiji-${var.environment}-db-final-snapshot" : null
  
  tags = {
    Name        = "hibiji-${var.environment}-db"
    Environment = var.environment
    Project     = "hibiji"
    SubEnvironment = var.sub_environment
  }
}

# PgBouncer for connection pooling (only for staging/prod)
resource "aws_ecs_task_definition" "pgbouncer" {
  count = var.environment == "prod" || var.environment == "staging" ? 1 : 0
  
  family                   = "hibiji-${var.environment}-pgbouncer"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = 256
  memory                   = 512
  execution_role_arn       = var.ecs_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn
  
  container_definitions = jsonencode([
    {
      name  = "pgbouncer"
      image = "edoburu/pgbouncer:1.18.0"
      
      portMappings = [
        {
          containerPort = 5432
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "DB_HOST"
          value = aws_db_instance.main.endpoint
        },
        {
          name  = "DB_PORT"
          value = "5432"
        },
        {
          name  = "DB_USER"
          value = var.db_username
        },
        {
          name  = "DB_PASSWORD"
          value = var.db_password
        },
        {
          name  = "POOL_MODE"
          value = "transaction"
        },
        {
          name  = "MAX_CLIENT_CONN"
          value = "100"
        },
        {
          name  = "DEFAULT_POOL_SIZE"
          value = "20"
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = "/ecs/hibiji-${var.environment}-pgbouncer"
          awslogs-region        = "us-west-1"
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])
  
  tags = {
    Name        = "hibiji-${var.environment}-pgbouncer-task"
    Environment = var.environment
    Project     = "hibiji"
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
  default     = ""
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_ids" {
  description = "Subnet IDs for RDS"
  type        = list(string)
}

variable "app_security_group_id" {
  description = "Security group ID for application servers"
  type        = string
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "max_allocated_storage" {
  description = "Maximum allocated storage in GB"
  type        = number
  default     = 100
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "hibiji_admin"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "max_connections" {
  description = "Maximum database connections"
  type        = number
  default     = 100
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "monitoring_role_arn" {
  description = "IAM role ARN for RDS monitoring"
  type        = string
  default     = ""
}

variable "ecs_execution_role_arn" {
  description = "ECS execution role ARN"
  type        = string
  default     = ""
}

variable "ecs_task_role_arn" {
  description = "ECS task role ARN"
  type        = string
  default     = ""
}

# Outputs
output "db_endpoint" {
  description = "RDS endpoint"
  value       = aws_db_instance.main.endpoint
}

output "db_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "db_username" {
  description = "Database username"
  value       = aws_db_instance.main.username
}

output "db_port" {
  description = "Database port"
  value       = aws_db_instance.main.port
}

output "pgbouncer_endpoint" {
  description = "PgBouncer endpoint (if deployed)"
  value       = var.environment == "prod" || var.environment == "staging" ? "pgbouncer.${var.environment}.hibiji.com:5432" : aws_db_instance.main.endpoint
} 