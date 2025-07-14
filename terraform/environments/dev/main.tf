terraform {
  required_version = ">= 1.0"
  
  backend "s3" {
    bucket = "hibiji-terraform-state"
    key    = "dev/terraform.tfstate"
    region = "us-west-1"
  }
}

# Variables for sub-environment
variable "sub_environment" {
  description = "Sub-environment name (e.g., dev01, dev02)"
  type        = string
  default     = "dev01"
}

variable "environment" {
  description = "Main environment name"
  type        = string
  default     = "dev"
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "hibiji.com"
}

# ECR and image variables
variable "ecr_repository_url" {
  description = "Backend ECR repository URL"
  type        = string
}

variable "frontend_ecr_repository_url" {
  description = "Frontend ECR repository URL"
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

# Local values for sub-environment
locals {
  sub_env = var.sub_environment
  main_env = var.environment
  
  # Generate domain name for sub-environment
  domain_name = "${local.sub_env}.${var.domain_name}"
  
  # Common tags with sub-environment
  common_tags = {
    Project        = "hibiji"
    Environment    = local.main_env
    SubEnvironment = local.sub_env
    ManagedBy      = "terraform"
    Owner          = "hibiji-team"
    CostCenter     = "hibiji-platform"
  }
  
  # Resource naming with sub-environment
  resource_prefix = "hibiji-${local.sub_env}"
}

# VPC for sub-environment
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-vpc"
  })
  
  lifecycle {
    create_before_destroy = true
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-igw"
  })
  
  lifecycle {
    create_before_destroy = true
  }
  
  timeouts {
    create = "10m"
    delete = "10m"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 4, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-public-${count.index + 1}"
    Tier = "Public"
  })
  
  # Ensure these subnets are not destroyed while resources depend on them
  lifecycle {
    create_before_destroy = true
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(aws_vpc.main.cidr_block, 4, count.index + 2)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-private-${count.index + 1}"
    Tier = "Private"
  })
  
  # Ensure these subnets are not destroyed while resources depend on them
  lifecycle {
    create_before_destroy = true
  }
}

# Route Table for Public Subnets
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-public-rt"
  })
  
  lifecycle {
    create_before_destroy = true
  }
}

# Separate route resource for proper destruction ordering
resource "aws_route" "public_internet_access" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
  
  # Implicit dependencies through resource references are sufficient
  
  lifecycle {
    create_before_destroy = true
  }
}

# Route Table Association for Public Subnets
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
  
  # Implicit dependencies through resource references are sufficient
  
  lifecycle {
    create_before_destroy = true
  }
}

# NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-nat-eip"
  })
  
  # Rely on implicit dependencies - EIP in VPC automatically depends on IGW
  
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-nat"
  })
  
  # Rely on implicit dependencies through resource references
  # NAT Gateway implicitly depends on EIP and public subnet
  
  lifecycle {
    create_before_destroy = true
  }
  
  timeouts {
    create = "10m"
    delete = "10m"
  }
}

# Route Table for Private Subnets
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-private-rt"
  })
  
  depends_on = [aws_nat_gateway.main]
  
  lifecycle {
    create_before_destroy = true
  }
}

# Route Table Association for Private Subnets
resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
  
  lifecycle {
    create_before_destroy = true
  }
}

# Security Groups
resource "aws_security_group" "alb" {
  name_prefix = "${local.resource_prefix}-alb-"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-alb-sg"
  })
  
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "app" {
  name_prefix = "${local.resource_prefix}-app-"
  vpc_id      = aws_vpc.main.id
  
  ingress {
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-app-sg"
  })
  
  lifecycle {
    create_before_destroy = true
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${local.resource_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id
  
  enable_deletion_protection = false
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-alb"
  })
  
  # Implicit dependencies through resource references
  # ALB automatically depends on subnets and security groups through references
  
  lifecycle {
    create_before_destroy = true
  }
}

# Random suffix for unique resource names
resource "random_id" "suffix" {
  byte_length = 4
}

# ALB Target Groups
resource "aws_lb_target_group" "backend" {
  name        = "hibiji-bk-${random_id.suffix.hex}"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-backend-tg"
  })
  
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lb_target_group" "frontend" {
  name        = "hibiji-fr-${random_id.suffix.hex}"
  port        = 80
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-frontend-tg"
  })
  
  lifecycle {
    create_before_destroy = true
  }
}

# ALB Listeners
resource "aws_lb_listener" "backend" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend.arn
  }
}

resource "aws_lb_listener" "frontend" {
  load_balancer_arn = aws_lb.main.arn
  port              = "3000"
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.frontend.arn
  }
  
  depends_on = [aws_lb_target_group.frontend]
}

# ECS Cluster for sub-environment
resource "aws_ecs_cluster" "main" {
  name = "${local.resource_prefix}-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  
  tags = local.common_tags
}

# IAM Roles for ECS
resource "aws_iam_role" "ecs_execution" {
  name = "${local.resource_prefix}-ecs-execution"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task" {
  name = "${local.resource_prefix}-ecs-task"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
  
  tags = local.common_tags
}

# Secrets for application
resource "aws_secretsmanager_secret" "secret_key" {
  name = "${local.resource_prefix}-secret-key-${random_id.suffix.hex}"
  
  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "secret_key" {
  secret_id     = aws_secretsmanager_secret.secret_key.id
  secret_string = "your-secret-key-here"
}

resource "aws_secretsmanager_secret" "database_password" {
  name = "${local.resource_prefix}-db-password-${random_id.suffix.hex}"
  
  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "database_password" {
  secret_id     = aws_secretsmanager_secret.database_password.id
  secret_string = "your-database-password-here"
}

# RDS Instance for sub-environment
resource "aws_db_instance" "main" {
  identifier = "${local.resource_prefix}-db"
  
  # Database engine
  engine         = "postgres"
  engine_version = data.aws_rds_engine_version.postgres.version
  
  # Sub-environment specific configurations
  instance_class = local.main_env == "prod" ? "db.t3.small" : "db.t3.micro"
  multi_az       = local.main_env == "prod"
  
  # Database name includes sub-environment
  db_name = "hibiji_${replace(local.sub_env, "-", "_")}"
  
  # Database credentials
  username = "hibiji_admin"
  password = aws_secretsmanager_secret_version.database_password.secret_string
  
  # Network configuration
  vpc_security_group_ids = [aws_security_group.app.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  # Storage
  allocated_storage     = 20
  storage_type          = "gp2"
  storage_encrypted     = true
  
  # Backup
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  # Deletion protection
  deletion_protection = false
  skip_final_snapshot = true
  
  tags = local.common_tags
  
  # Implicit dependencies through resource references
  # RDS automatically depends on DB subnet group and security groups
  
  lifecycle {
    create_before_destroy = true
  }
  
  timeouts {
    create = "20m"
    delete = "20m"
    update = "20m"
  }
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${local.resource_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id
  description = "DB subnet group for ${local.resource_prefix}"
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-db-subnet-group"
  })
  
  # Ensure subnet group depends on subnets and is managed carefully
  depends_on = [
    aws_subnet.private,
    aws_vpc.main
  ]
  
      lifecycle {
      create_before_destroy = true
      ignore_changes = [description]
    }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

# Get available PostgreSQL versions
data "aws_rds_engine_version" "postgres" {
  engine = "postgres"
}

# ECS Module
module "ecs" {
  source = "../../modules/ecs"
  
  environment                = local.main_env
  sub_environment           = local.sub_env
  ecr_repository_url        = var.ecr_repository_url
  frontend_ecr_repository_url = var.frontend_ecr_repository_url
  image_tag                 = var.image_tag
  frontend_image_tag        = var.frontend_image_tag
  
  # Resource sizing based on environment
  backend_cpu    = local.main_env == "prod" ? 1024 : 256
  backend_memory = local.main_env == "prod" ? 2048 : 512
  frontend_cpu   = local.main_env == "prod" ? 512 : 256
  frontend_memory = local.main_env == "prod" ? 1024 : 512
  
  backend_desired_count  = local.main_env == "prod" ? 2 : 1
  frontend_desired_count = local.main_env == "prod" ? 2 : 1
  
  backend_min_capacity = local.main_env == "prod" ? 2 : 1
  backend_max_capacity = local.main_env == "prod" ? 10 : 3
  
  # Network configuration
  private_subnet_ids      = aws_subnet.private[*].id
  app_security_group_id   = aws_security_group.app.id
  backend_target_group_arn = aws_lb_target_group.backend.arn
  frontend_target_group_arn = aws_lb_target_group.frontend.arn
  
  # Application configuration
  database_url = "postgresql://hibiji_admin:${aws_secretsmanager_secret_version.database_password.secret_string}@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}"
  redis_url    = "redis://localhost:6379"  # Will be updated when Redis is added
  api_url      = "http://${aws_lb.main.dns_name}"
  
  # IAM roles
  ecs_execution_role_arn = aws_iam_role.ecs_execution.arn
  ecs_task_role_arn     = aws_iam_role.ecs_task.arn
  
  # Secrets
  secret_key_arn       = aws_secretsmanager_secret.secret_key.arn
  database_password_arn = aws_secretsmanager_secret.database_password.arn
  
  # Ensure ECS module depends on all network resources to prevent ENI dependency issues
  depends_on = [
    aws_lb_listener.backend,
    aws_lb_listener.frontend,
    aws_subnet.private,
    aws_security_group.app,
    aws_lb_target_group.backend,
    aws_lb_target_group.frontend,
    aws_lb.main,
    aws_route_table_association.private,
    aws_nat_gateway.main,
    aws_db_instance.main
  ]
}

# ENI Cleanup Resource - handles orphaned ENIs before subnet destruction
# Pre-destruction cleanup to ensure proper resource cleanup
resource "null_resource" "pre_destroy_cleanup" {
  triggers = {
    # Use static values to avoid dependency cycles
    environment = local.sub_env
    timestamp = timestamp()
  }
  
  provisioner "local-exec" {
    when    = destroy
    command = <<-EOT
      echo "Starting pre-destroy cleanup for environment: ${self.triggers.environment}"
      
      # Wait for services to be properly stopped
      sleep 30
      
      # Clean up orphaned ENIs by environment tag
      echo "Cleaning up ENIs for environment: ${self.triggers.environment}"
      aws ec2 describe-network-interfaces \
        --filters "Name=tag:Environment,Values=${self.triggers.environment}" "Name=status,Values=available" \
        --query 'NetworkInterfaces[].NetworkInterfaceId' \
        --output text | xargs -r -n1 aws ec2 delete-network-interface --network-interface-id || true
      
      echo "Pre-destroy cleanup completed"
    EOT
  }
  
  depends_on = [
    module.ecs,
    aws_db_instance.main,
    aws_lb.main
  ]
}

# Post-cleanup for networking resources
resource "null_resource" "network_cleanup" {
  triggers = {
    environment = local.sub_env
    cleanup_id = null_resource.pre_destroy_cleanup.id
  }
  
  provisioner "local-exec" {
    when    = destroy
    command = <<-EOT
      echo "Starting network cleanup for environment: ${self.triggers.environment}"
      
      # Additional wait for network resources
      sleep 30
      
      echo "Network cleanup completed"
    EOT
  }
  
  depends_on = [
    null_resource.pre_destroy_cleanup
  ]
}

# Route 53 record for sub-environment
resource "aws_route53_record" "sub_env" {
  zone_id = aws_route53_zone.main.zone_id
  name    = local.domain_name
  type    = "A"
  
  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Route 53 Zone (placeholder - you'll need to create this or use existing zone)
resource "aws_route53_zone" "main" {
  name = var.domain_name
  
  tags = local.common_tags
}

# ACM Certificate (placeholder - you'll need to validate this)
resource "aws_acm_certificate" "main" {
  domain_name       = var.domain_name
  validation_method = "DNS"
  
  subject_alternative_names = [
    "*.${var.domain_name}"
  ]
  
  tags = local.common_tags
  
  lifecycle {
    create_before_destroy = true
  }
}

# CloudFront distribution for sub-environment
resource "aws_cloudfront_distribution" "main" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  
  origin {
    domain_name = aws_lb.main.dns_name
    origin_id   = "ALB"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "ALB"
    
    forwarded_values {
      query_string = true
      headers      = ["*"]
      
      cookies {
        forward = "all"
      }
    }
    
    viewer_protocol_policy = "allow-all"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  price_class = "PriceClass_100"
  
  viewer_certificate {
    cloudfront_default_certificate = true
  }
  
  tags = local.common_tags
} 