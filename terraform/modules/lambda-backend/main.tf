# =================================
# Lambda Backend Module
# =================================
# This module creates Lambda functions for the serverless backend
# with API Gateway for HTTP routing

# S3 bucket for Lambda deployment packages
resource "aws_s3_bucket" "lambda_deployments" {
  bucket = "${var.environment}-${var.sub_environment}-${var.project_name}-lambda-deployments"

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.sub_environment}-${var.project_name}-lambda-deployments"
    Type = "LambdaDeployments"
  })
}

# Lambda deployments bucket versioning
resource "aws_s3_bucket_versioning" "lambda_deployments" {
  bucket = aws_s3_bucket.lambda_deployments.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Lambda deployments bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "lambda_deployments" {
  bucket = aws_s3_bucket.lambda_deployments.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Lambda execution role
resource "aws_iam_role" "lambda_execution" {
  name = "${var.environment}-${var.sub_environment}-${var.project_name}-lambda-execution"

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

  tags = {}
  
  # Workaround for IAM permission issues during deployment
  # This prevents Terraform from trying to read role policies when user lacks iam:GetRolePolicy permission
  lifecycle {
    ignore_changes = [inline_policy]
  }
}

# Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda VPC execution policy (if VPC is used)
resource "aws_iam_role_policy_attachment" "lambda_vpc_execution" {
  count      = var.vpc_config != null ? 1 : 0
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Custom policy for Lambda permissions
resource "aws_iam_role_policy" "lambda_custom_policy" {
  name = "${var.environment}-${var.sub_environment}-${var.project_name}-lambda-policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # S3 access for file uploads
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:GeneratePresignedUrl"
        ]
        Resource = [
          "${var.s3_uploads_bucket_arn}/*"
        ]
      },
      # Secrets Manager access
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          var.database_secret_arn,
          var.jwt_secret_arn
        ]
      },

    ]
  })
}

# Create placeholder zip file for initial Lambda deployment
data "archive_file" "placeholder" {
  type        = "zip"
  source_file = "${path.module}/placeholder-function.js"
  output_path = "${path.module}/placeholder-function.zip"
}

# Main Lambda function for tRPC API
resource "aws_lambda_function" "api" {
  function_name = "${var.environment}-${var.sub_environment}-${var.project_name}-api"
  role         = aws_iam_role.lambda_execution.arn
  handler      = "index.handler"
  runtime      = var.lambda_runtime
  timeout      = var.lambda_timeout
  memory_size  = var.lambda_memory_size

  # Placeholder zip for initial Terraform deployment
  # Actual code will be updated by CI/CD pipeline via aws lambda update-function-code
  filename = data.archive_file.placeholder.output_path

  environment {
    variables = merge({
      NODE_ENV                = var.environment
      DATABASE_URL           = var.database_url
      JWT_SECRET_ARN         = var.jwt_secret_arn
      DATABASE_SECRET_ARN    = var.database_secret_arn
      CORS_ORIGIN           = var.cors_origin
      S3_UPLOADS_BUCKET     = var.s3_uploads_bucket_name
      AWS_ACCOUNT_ID        = data.aws_caller_identity.current.account_id
      # AWS_REGION is reserved by AWS Lambda and cannot be set manually
    }, var.additional_environment_variables)
  }

  # VPC configuration (optional)
  dynamic "vpc_config" {
    for_each = var.vpc_config != null ? [var.vpc_config] : []
    content {
      subnet_ids         = vpc_config.value.subnet_ids
      security_group_ids = vpc_config.value.security_group_ids
    }
  }

  # Dead letter queue configuration
  dynamic "dead_letter_config" {
    for_each = var.dlq_arn != null ? [var.dlq_arn] : []
    content {
      target_arn = dead_letter_config.value
    }
  }

  # Temporarily disabled tags to resolve AWS permissions issue
  # tags = merge(var.common_tags, {
  #   Name = "${var.environment}-${var.sub_environment}-${var.project_name}-api"
  #   Type = "LambdaFunction"
  # })

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_iam_role_policy.lambda_custom_policy
  ]
}

# CloudWatch log group for Lambda function
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.api.function_name}"
  retention_in_days = var.log_retention_days

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.sub_environment}-${var.project_name}-lambda-logs"
    Type = "LogGroup"
  })
}

# Lambda Layer for shared dependencies (optional)
resource "aws_lambda_layer_version" "dependencies" {
  count           = var.create_dependencies_layer ? 1 : 0
  filename        = var.dependencies_layer_filename
  layer_name      = "${var.environment}-${var.sub_environment}-${var.project_name}-dependencies"
  description     = "Shared dependencies for ${var.project_name} Lambda functions"

  compatible_runtimes = [var.lambda_runtime]

  depends_on = [aws_s3_bucket.lambda_deployments]
}

# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {} 