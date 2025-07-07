# ECS Cluster Module for Hibiji Platform

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "hibiji-${var.environment}-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  configuration {
    execute_command_configuration {
      logging = "DEFAULT"
    }
  }
  
  tags = {
    Name        = "hibiji-${var.environment}-cluster"
    Environment = var.environment
    Project     = "hibiji"
    SubEnvironment = var.sub_environment
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "app" {
  name              = "/ecs/hibiji-${var.environment}-app"
  retention_in_days = var.environment == "prod" ? 30 : 7
  
  tags = {
    Name        = "hibiji-${var.environment}-app-logs"
    Environment = var.environment
    Project     = "hibiji"
  }
}

resource "aws_cloudwatch_log_group" "frontend" {
  name              = "/ecs/hibiji-${var.environment}-frontend"
  retention_in_days = var.environment == "prod" ? 30 : 7
  
  tags = {
    Name        = "hibiji-${var.environment}-frontend-logs"
    Environment = var.environment
    Project     = "hibiji"
  }
}

# ECS Task Definitions
resource "aws_ecs_task_definition" "backend" {
  family                   = "hibiji-${var.environment}-backend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.backend_cpu
  memory                   = var.backend_memory
  execution_role_arn       = var.ecs_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn
  
  container_definitions = jsonencode([
    {
      name  = "backend"
      image = "${var.ecr_repository_url}:${var.image_tag}"
      
      portMappings = [
        {
          containerPort = 8000
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "DATABASE_URL"
          value = var.database_url
        },
        {
          name  = "REDIS_URL"
          value = var.redis_url
        },
        {
          name  = "AWS_REGION"
          value = "us-west-1"
        },
        {
          name  = "ENVIRONMENT"
          value = var.environment
        }
      ]
      
      secrets = [
        {
          name      = "SECRET_KEY"
          valueFrom = var.secret_key_arn
        },
        {
          name      = "DATABASE_PASSWORD"
          valueFrom = var.database_password_arn
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.app.name
          awslogs-region        = "us-west-1"
          awslogs-stream-prefix = "ecs"
        }
      }
      
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])
  
  tags = {
    Name        = "hibiji-${var.environment}-backend-task"
    Environment = var.environment
    Project     = "hibiji"
  }
}

resource "aws_ecs_task_definition" "frontend" {
  family                   = "hibiji-${var.environment}-frontend"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.frontend_cpu
  memory                   = var.frontend_memory
  execution_role_arn       = var.ecs_execution_role_arn
  task_role_arn            = var.ecs_task_role_arn
  
  container_definitions = jsonencode([
    {
      name  = "frontend"
      image = "${var.frontend_ecr_repository_url}:${var.frontend_image_tag}"
      
      portMappings = [
        {
          containerPort = 80
          protocol      = "tcp"
        }
      ]
      
      environment = [
        {
          name  = "REACT_APP_API_URL"
          value = var.api_url
        },
        {
          name  = "REACT_APP_ENVIRONMENT"
          value = var.environment
        }
      ]
      
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.frontend.name
          awslogs-region        = "us-west-1"
          awslogs-stream-prefix = "ecs"
        }
      }
      
      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:80 || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 30
      }
    }
  ])
  
  tags = {
    Name        = "hibiji-${var.environment}-frontend-task"
    Environment = var.environment
    Project     = "hibiji"
  }
}

# ECS Services
resource "aws_ecs_service" "backend" {
  name            = "hibiji-${var.environment}-backend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.backend_desired_count
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.app_security_group_id]
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = var.backend_target_group_arn
    container_name   = "backend"
    container_port   = 8000
  }
  
  depends_on = [var.backend_target_group_arn]
  
  tags = {
    Name        = "hibiji-${var.environment}-backend-service"
    Environment = var.environment
    Project     = "hibiji"
  }
}

resource "aws_ecs_service" "frontend" {
  name            = "hibiji-${var.environment}-frontend"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.frontend.arn
  desired_count   = var.frontend_desired_count
  launch_type     = "FARGATE"
  
  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.app_security_group_id]
    assign_public_ip = false
  }
  
  load_balancer {
    target_group_arn = var.frontend_target_group_arn
    container_name   = "frontend"
    container_port   = 80
  }
  
  depends_on = [var.frontend_target_group_arn]
  
  tags = {
    Name        = "hibiji-${var.environment}-frontend-service"
    Environment = var.environment
    Project     = "hibiji"
  }
}

# Auto Scaling (only for staging/prod)
resource "aws_appautoscaling_target" "backend" {
  count              = var.environment == "prod" || var.environment == "staging" ? 1 : 0
  max_capacity       = var.backend_max_capacity
  min_capacity       = var.backend_min_capacity
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.backend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "backend_cpu" {
  count              = var.environment == "prod" || var.environment == "staging" ? 1 : 0
  name               = "hibiji-${var.environment}-backend-cpu-policy"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.backend[0].resource_id
  scalable_dimension = aws_appautoscaling_target.backend[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.backend[0].service_namespace
  
  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
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

variable "ecr_repository_url" {
  description = "ECR repository URL for backend"
  type        = string
}

variable "frontend_ecr_repository_url" {
  description = "ECR repository URL for frontend"
  type        = string
}

variable "image_tag" {
  description = "Backend image tag"
  type        = string
  default     = "latest"
}

variable "frontend_image_tag" {
  description = "Frontend image tag"
  type        = string
  default     = "latest"
}

variable "backend_cpu" {
  description = "Backend CPU units"
  type        = number
  default     = 256
}

variable "backend_memory" {
  description = "Backend memory (MiB)"
  type        = number
  default     = 512
}

variable "frontend_cpu" {
  description = "Frontend CPU units"
  type        = number
  default     = 256
}

variable "frontend_memory" {
  description = "Frontend memory (MiB)"
  type        = number
  default     = 512
}

variable "backend_desired_count" {
  description = "Backend desired count"
  type        = number
  default     = 1
}

variable "frontend_desired_count" {
  description = "Frontend desired count"
  type        = number
  default     = 1
}

variable "backend_min_capacity" {
  description = "Backend minimum capacity"
  type        = number
  default     = 1
}

variable "backend_max_capacity" {
  description = "Backend maximum capacity"
  type        = number
  default     = 3
}

variable "private_subnet_ids" {
  description = "Private subnet IDs"
  type        = list(string)
}

variable "app_security_group_id" {
  description = "Application security group ID"
  type        = string
}

variable "backend_target_group_arn" {
  description = "Backend target group ARN"
  type        = string
}

variable "frontend_target_group_arn" {
  description = "Frontend target group ARN"
  type        = string
}

variable "database_url" {
  description = "Database URL"
  type        = string
}

variable "redis_url" {
  description = "Redis URL"
  type        = string
}

variable "api_url" {
  description = "API URL"
  type        = string
}

variable "ecs_execution_role_arn" {
  description = "ECS execution role ARN"
  type        = string
}

variable "ecs_task_role_arn" {
  description = "ECS task role ARN"
  type        = string
}

variable "secret_key_arn" {
  description = "Secret key ARN"
  type        = string
}

variable "database_password_arn" {
  description = "Database password ARN"
  type        = string
}

# Outputs
output "cluster_id" {
  description = "ECS cluster ID"
  value       = aws_ecs_cluster.main.id
}

output "cluster_arn" {
  description = "ECS cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "backend_service_name" {
  description = "Backend service name"
  value       = aws_ecs_service.backend.name
}

output "frontend_service_name" {
  description = "Frontend service name"
  value       = aws_ecs_service.frontend.name
} 