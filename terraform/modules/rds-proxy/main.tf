# =================================
# RDS Proxy Module for Aurora PostgreSQL
# Provides connection pooling for serverless Lambda functions
# =================================

# Data sources for existing resources
data "aws_caller_identity" "current" {}

# IAM role for RDS Proxy
resource "aws_iam_role" "rds_proxy" {
  name = "${var.environment}-${var.sub_environment}-${var.project_name}-rds-proxy-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
      }
    ]
  })

  # tags = merge(var.common_tags, {
  #   Name = "${var.environment}-${var.sub_environment}-${var.project_name}-rds-proxy-role"
  #   Type = "IAMRole"
  # })  # Commented out due to IAM permission constraints
}

# IAM policy for RDS Proxy to access Secrets Manager
resource "aws_iam_role_policy" "rds_proxy_secrets" {
  name = "${var.environment}-${var.sub_environment}-${var.project_name}-rds-proxy-secrets"
  role = aws_iam_role.rds_proxy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetResourcePolicy",
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret",
          "secretsmanager:ListSecretVersionIds"
        ]
        Resource = var.database_secret_arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "secretsmanager.${var.aws_region}.amazonaws.com"
          }
        }
      }
    ]
  })
}

# Security group for RDS Proxy
resource "aws_security_group" "rds_proxy" {
  name_prefix = "${var.environment}-${var.sub_environment}-${var.project_name}-rds-proxy-"
  description = "Security group for ${var.environment}-${var.sub_environment}-${var.project_name} RDS Proxy"
  vpc_id      = var.vpc_id

  # Allow inbound connections from Lambda security groups
  ingress {
    description     = "PostgreSQL access from Lambda"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = var.lambda_security_group_ids
  }

  # Allow outbound connections to RDS
  egress {
    description     = "PostgreSQL access to RDS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = var.database_security_group_ids
  }

  # Allow outbound HTTPS for Secrets Manager
  egress {
    description = "HTTPS for Secrets Manager"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.sub_environment}-${var.project_name}-rds-proxy-sg"
    Type = "SecurityGroup"
  })

  lifecycle {
    create_before_destroy = true
  }
}

# Update RDS security group to allow connections from RDS Proxy
resource "aws_security_group_rule" "rds_allow_proxy" {
  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.rds_proxy.id
  security_group_id        = var.database_security_group_ids[0]
  description              = "Allow RDS Proxy access to database"
}

# RDS Proxy
resource "aws_db_proxy" "main" {
  name          = "${var.environment}-${var.sub_environment}-${var.project_name}-rds-proxy"
  engine_family = "POSTGRESQL"
  auth {
    auth_scheme = "SECRETS"
    secret_arn  = var.database_secret_arn
    description = "Database credentials for ${var.environment}-${var.sub_environment}-${var.project_name}"
  }

  role_arn               = aws_iam_role.rds_proxy.arn
  vpc_subnet_ids         = var.subnet_ids
  vpc_security_group_ids = [aws_security_group.rds_proxy.id]

  # Connection settings optimized for serverless
  idle_client_timeout = var.idle_client_timeout
  require_tls         = var.require_tls

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.sub_environment}-${var.project_name}-rds-proxy"
    Type = "RDSProxy"
  })
}

# RDS Proxy target group
resource "aws_db_proxy_default_target_group" "main" {
  db_proxy_name = aws_db_proxy.main.name

  connection_pool_config {
    connection_borrow_timeout    = var.connection_borrow_timeout
    max_connections_percent      = var.max_connections_percent
    max_idle_connections_percent = var.max_idle_connections_percent
    session_pinning_filters      = var.session_pinning_filters
  }
}

# RDS Proxy target
resource "aws_db_proxy_target" "cluster" {
  db_cluster_identifier = var.database_cluster_identifier
  db_proxy_name         = aws_db_proxy.main.name
  target_group_name     = aws_db_proxy_default_target_group.main.name
}

# CloudWatch log group for RDS Proxy
resource "aws_cloudwatch_log_group" "rds_proxy" {
  name              = "/aws/rds-proxy/${aws_db_proxy.main.name}"
  retention_in_days = var.log_retention_days

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.sub_environment}-${var.project_name}-rds-proxy-logs"
    Type = "LogGroup"
  })
} 
