# =================================
# Lambda Public Module (No VPC)
# =================================
# Creates Lambda functions outside VPC that connect to RDS via RDS Proxy
# Optimized for fast cold starts and no NAT Gateway costs

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

# =================================
# IAM Role for Lambda
# =================================
resource "aws_iam_role" "lambda" {
  name = "${var.environment}-${var.sub_environment}-${var.function_name}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-${var.sub_environment}-${var.function_name}-lambda-role"
    Environment = var.environment
    SubEnv      = var.sub_environment
    Type        = "IAMRole"
  })
}

# Basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# RDS Proxy connect permission (IAM auth)
resource "aws_iam_role_policy" "rds_connect" {
  count = var.rds_proxy_resource_id != null ? 1 : 0

  name = "${var.environment}-${var.sub_environment}-${var.function_name}-rds-connect"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds-db:connect"
        ]
        Resource = "arn:aws:rds-db:${var.region}:${data.aws_caller_identity.current.account_id}:dbuser:${var.rds_proxy_resource_id}/*"
      }
    ]
  })
}

# S3 access policy
resource "aws_iam_role_policy" "s3_access" {
  count = length(var.s3_bucket_arns) > 0 ? 1 : 0

  name = "${var.environment}-${var.sub_environment}-${var.function_name}-s3-access"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = concat(
          var.s3_bucket_arns,
          [for arn in var.s3_bucket_arns : "${arn}/*"]
        )
      }
    ]
  })
}

# Custom IAM policies
resource "aws_iam_role_policy" "custom" {
  count = var.custom_iam_policy_json != null ? 1 : 0

  name   = "${var.environment}-${var.sub_environment}-${var.function_name}-custom-policy"
  role   = aws_iam_role.lambda.id
  policy = var.custom_iam_policy_json
}

# =================================
# Lambda Function
# =================================
resource "aws_lambda_function" "main" {
  function_name = "${var.environment}-${var.sub_environment}-${var.function_name}"
  role          = aws_iam_role.lambda.arn
  handler       = var.handler
  runtime       = var.runtime
  timeout       = var.timeout
  memory_size   = var.memory_size

  # Source code
  filename         = var.source_code_path
  source_code_hash = filebase64sha256(var.source_code_path)

  # Environment variables
  environment {
    variables = merge(
      var.environment_variables,
      var.rds_proxy_endpoint != null ? {
        DB_PROXY_ENDPOINT = var.rds_proxy_endpoint
        DB_PORT           = "5432"
        DB_NAME           = var.database_name
      } : {}
    )
  }

  # Reserved concurrent executions (optional)
  reserved_concurrent_executions = var.reserved_concurrent_executions

  # Dead letter config (optional)
  dynamic "dead_letter_config" {
    for_each = var.dead_letter_target_arn != null ? [1] : []
    content {
      target_arn = var.dead_letter_target_arn
    }
  }

  # Tracing (X-Ray)
  tracing_config {
    mode = var.enable_xray_tracing ? "Active" : "PassThrough"
  }

  # Layers (optional)
  layers = var.lambda_layers

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-${var.sub_environment}-${var.function_name}"
    Environment = var.environment
    SubEnv      = var.sub_environment
    Type        = "LambdaFunction"
  })

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_cloudwatch_log_group.lambda
  ]
}

# =================================
# CloudWatch Log Group
# =================================
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.environment}-${var.sub_environment}-${var.function_name}"
  retention_in_days = var.log_retention_days

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-${var.sub_environment}-${var.function_name}-logs"
    Environment = var.environment
    SubEnv      = var.sub_environment
    Type        = "LogGroup"
  })
}

# =================================
# Lambda Function URL (optional)
# =================================
resource "aws_lambda_function_url" "main" {
  count = var.create_function_url ? 1 : 0

  function_name      = aws_lambda_function.main.function_name
  authorization_type = var.function_url_auth_type

  dynamic "cors" {
    for_each = var.function_url_cors_config != null ? [var.function_url_cors_config] : []
    content {
      allow_origins     = cors.value.allow_origins
      allow_methods     = cors.value.allow_methods
      allow_headers     = cors.value.allow_headers
      expose_headers    = cors.value.expose_headers
      max_age           = cors.value.max_age
      allow_credentials = cors.value.allow_credentials
    }
  }
}

# =================================
# Lambda Alias (optional)
# =================================
resource "aws_lambda_alias" "main" {
  count = var.create_alias ? 1 : 0

  name             = var.alias_name
  description      = "Alias for ${var.environment}-${var.sub_environment}-${var.function_name}"
  function_name    = aws_lambda_function.main.arn
  function_version = var.alias_function_version
}

# =================================
# Data Sources
# =================================
data "aws_caller_identity" "current" {}

