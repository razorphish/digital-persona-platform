# =================================
# RDS Proxy Enhanced Module
# =================================
# Creates an RDS Proxy for Lambda to connect to Aurora
# with IAM authentication and connection pooling

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# =================================
# IAM Role for RDS Proxy
# =================================
resource "aws_iam_role" "rds_proxy" {
  name = "${var.environment}-${var.sub_environment}-rds-proxy-role"

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

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-${var.sub_environment}-rds-proxy-role"
    Environment = var.environment
    SubEnv      = var.sub_environment
    Type        = "IAMRole"
  })
}

# IAM Policy for RDS Proxy to access Secrets Manager
resource "aws_iam_role_policy" "rds_proxy_secrets" {
  name = "${var.environment}-${var.sub_environment}-rds-proxy-secrets-policy"
  role = aws_iam_role.rds_proxy.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = var.db_secret_arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = var.kms_key_arn
        Condition = {
          StringEquals = {
            "kms:ViaService" = "secretsmanager.${var.region}.amazonaws.com"
          }
        }
      }
    ]
  })
}

# =================================
# RDS Proxy
# =================================
resource "aws_db_proxy" "main" {
  name                   = "${var.environment}-${var.sub_environment}-rds-proxy"
  engine_family          = "POSTGRESQL"
  auth {
    auth_scheme = "SECRETS"
    description = "Database credentials from Secrets Manager"
    iam_auth    = "REQUIRED"  # Force IAM authentication
    secret_arn  = var.db_secret_arn
  }
  role_arn               = aws_iam_role.rds_proxy.arn
  vpc_subnet_ids         = var.subnet_ids
  require_tls            = true  # Force TLS for all connections

  # Connection pooling configuration
  idle_client_timeout = var.idle_client_timeout
  max_connections_percent = var.max_connections_percent
  max_idle_connections_percent = var.max_idle_connections_percent

  # Debug logging (disable in production)
  debug_logging = var.enable_debug_logging

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-${var.sub_environment}-rds-proxy"
    Environment = var.environment
    SubEnv      = var.sub_environment
    Type        = "DBProxy"
  })
}

# =================================
# RDS Proxy Target Group
# =================================
resource "aws_db_proxy_default_target_group" "main" {
  db_proxy_name = aws_db_proxy.main.name

  connection_pool_config {
    connection_borrow_timeout    = var.connection_borrow_timeout
    init_query                   = var.init_query
    max_connections_percent      = var.max_connections_percent
    max_idle_connections_percent = var.max_idle_connections_percent
    session_pinning_filters      = var.session_pinning_filters
  }
}

# =================================
# RDS Proxy Target
# =================================
resource "aws_db_proxy_target" "main" {
  db_proxy_name         = aws_db_proxy.main.name
  target_arn            = var.db_cluster_arn
  db_cluster_identifier = var.db_cluster_identifier
}

# =================================
# Security Group Association
# =================================
resource "aws_db_proxy_endpoint" "read_write" {
  count = var.create_read_write_endpoint ? 1 : 0

  db_proxy_name          = aws_db_proxy.main.name
  db_proxy_endpoint_name = "${var.environment}-${var.sub_environment}-rds-proxy-rw"
  vpc_subnet_ids         = var.subnet_ids
  target_role            = "READ_WRITE"

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-${var.sub_environment}-rds-proxy-rw-endpoint"
    Environment = var.environment
    SubEnv      = var.sub_environment
    Type        = "DBProxyEndpoint"
  })
}

resource "aws_db_proxy_endpoint" "read_only" {
  count = var.create_read_only_endpoint ? 1 : 0

  db_proxy_name          = aws_db_proxy.main.name
  db_proxy_endpoint_name = "${var.environment}-${var.sub_environment}-rds-proxy-ro"
  vpc_subnet_ids         = var.subnet_ids
  target_role            = "READ_ONLY"

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-${var.sub_environment}-rds-proxy-ro-endpoint"
    Environment = var.environment
    SubEnv      = var.sub_environment
    Type        = "DBProxyEndpoint"
  })
}

