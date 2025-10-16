# RDS Scheduler Module
# Automatically starts/stops RDS clusters on schedule to save costs

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Variables
variable "cluster_identifier" {
  description = "RDS cluster identifier to schedule"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "start_schedule" {
  description = "Cron expression for starting RDS (UTC time)"
  type        = string
  default     = "cron(0 15 ? * MON-FRI *)" # 8 AM PST (UTC-7) = 3 PM UTC
}

variable "stop_schedule" {
  description = "Cron expression for stopping RDS (UTC time)"
  type        = string
  default     = "cron(0 2 ? * TUE-SAT *)" # 6 PM PST + next day = 2 AM UTC
}

variable "enable_scheduler" {
  description = "Enable or disable the scheduler"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}

# IAM Role for Lambda
resource "aws_iam_role" "rds_scheduler" {
  name = "${var.environment}-rds-scheduler-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = merge(var.tags, {
    Name = "${var.environment}-rds-scheduler-role"
  })
}

# IAM Policy for RDS operations
resource "aws_iam_role_policy" "rds_scheduler" {
  name = "${var.environment}-rds-scheduler-policy"
  role = aws_iam_role.rds_scheduler.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBClusters",
          "rds:StartDBCluster",
          "rds:StopDBCluster"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# Lambda function
resource "aws_lambda_function" "rds_scheduler" {
  filename      = "${path.module}/lambda.zip"
  function_name = "${var.environment}-rds-scheduler"
  role          = aws_iam_role.rds_scheduler.arn
  handler       = "lambda.lambda_handler"
  runtime       = "python3.11"
  timeout       = 60

  environment {
    variables = {
      CLUSTER_ID = var.cluster_identifier
    }
  }

  tags = merge(var.tags, {
    Name = "${var.environment}-rds-scheduler"
  })
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "rds_scheduler" {
  name              = "/aws/lambda/${aws_lambda_function.rds_scheduler.function_name}"
  retention_in_days = 7

  tags = merge(var.tags, {
    Name = "${var.environment}-rds-scheduler-logs"
  })
}

# EventBridge rule to start RDS
resource "aws_cloudwatch_event_rule" "start_rds" {
  name                = "${var.environment}-start-rds"
  description         = "Start RDS cluster on schedule"
  schedule_expression = var.start_schedule
  is_enabled          = var.enable_scheduler

  tags = merge(var.tags, {
    Name = "${var.environment}-start-rds-rule"
  })
}

# EventBridge target for start
resource "aws_cloudwatch_event_target" "start_rds" {
  rule      = aws_cloudwatch_event_rule.start_rds.name
  target_id = "StartRDS"
  arn       = aws_lambda_function.rds_scheduler.arn

  input = jsonencode({
    action             = "start"
    cluster_identifier = var.cluster_identifier
  })
}

# Lambda permission for start rule
resource "aws_lambda_permission" "allow_eventbridge_start" {
  statement_id  = "AllowExecutionFromEventBridgeStart"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.rds_scheduler.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.start_rds.arn
}

# EventBridge rule to stop RDS
resource "aws_cloudwatch_event_rule" "stop_rds" {
  name                = "${var.environment}-stop-rds"
  description         = "Stop RDS cluster on schedule"
  schedule_expression = var.stop_schedule
  is_enabled          = var.enable_scheduler

  tags = merge(var.tags, {
    Name = "${var.environment}-stop-rds-rule"
  })
}

# EventBridge target for stop
resource "aws_cloudwatch_event_target" "stop_rds" {
  rule      = aws_cloudwatch_event_rule.stop_rds.name
  target_id = "StopRDS"
  arn       = aws_lambda_function.rds_scheduler.arn

  input = jsonencode({
    action             = "stop"
    cluster_identifier = var.cluster_identifier
  })
}

# Lambda permission for stop rule
resource "aws_lambda_permission" "allow_eventbridge_stop" {
  statement_id  = "AllowExecutionFromEventBridgeStop"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.rds_scheduler.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.stop_rds.arn
}

# Outputs
output "lambda_function_arn" {
  description = "ARN of the RDS scheduler Lambda function"
  value       = aws_lambda_function.rds_scheduler.arn
}

output "lambda_function_name" {
  description = "Name of the RDS scheduler Lambda function"
  value       = aws_lambda_function.rds_scheduler.function_name
}

output "start_schedule" {
  description = "Schedule for starting RDS"
  value       = var.start_schedule
}

output "stop_schedule" {
  description = "Schedule for stopping RDS"
  value       = var.stop_schedule
}

