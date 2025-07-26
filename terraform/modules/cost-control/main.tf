# Cost Control Module for Digital Persona Platform (Serverless)

# Budget for overall environment
resource "aws_budgets_budget" "monthly_budget" {
  name         = "${var.environment}-monthly-budget"
  budget_type  = "COST"
  limit_amount = var.monthly_budget_limit
  limit_unit   = "USD"
  time_unit    = "MONTHLY"
  
  cost_filters = {
    Tag = [
      "Environment:${var.environment}"
    ]
  }
  
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                 = 80
    threshold_type            = "PERCENTAGE"
    notification_type         = "ACTUAL"
    subscriber_email_addresses = var.alert_emails
  }
  
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                 = 100
    threshold_type            = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = var.alert_emails
  }
}

# Service-specific budgets for serverless architecture
locals {
  service_budgets = {
    lambda    = 0.15  # 15% of total budget
    apigateway = 0.10  # 10% of total budget
    s3        = 0.15  # 15% of total budget
    rds       = 0.40  # 40% of total budget
    cloudfront = 0.10  # 10% of total budget
    other     = 0.10  # 10% of total budget
  }
}

resource "aws_budgets_budget" "service_budgets" {
  for_each = local.service_budgets
  
  name         = "${var.environment}-${each.key}-budget"
  budget_type  = "COST"
  limit_amount = var.monthly_budget_limit * each.value
  limit_unit   = "USD"
  time_unit    = "MONTHLY"
  
  cost_filters = {
    Service = [each.key == "lambda" ? "AWS Lambda" :
              each.key == "apigateway" ? "Amazon API Gateway" :
              each.key == "s3" ? "Amazon Simple Storage Service" :
              each.key == "rds" ? "Amazon Relational Database Service" :
              each.key == "cloudfront" ? "Amazon CloudFront" :
              "Other"]
    Tag = [
      "Environment:${var.environment}"
    ]
  }
  
  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                 = 90
    threshold_type            = "PERCENTAGE"
    notification_type          = "ACTUAL"
    subscriber_email_addresses = var.alert_emails
  }
}

# CloudWatch alarm for high costs
resource "aws_cloudwatch_metric_alarm" "high_cost_alarm" {
  alarm_name          = "${var.environment}-high-cost-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "EstimatedCharges"
  namespace           = "AWS/Billing"
  period              = "86400"  # 24 hours
  statistic           = "Maximum"
  threshold           = var.monthly_budget_limit * 0.8
  alarm_description   = "This metric monitors estimated charges for ${var.environment}"
  alarm_actions       = [aws_sns_topic.cost_alerts.arn]
  
  dimensions = {
    Currency = "USD"
  }
  
  tags = {
    Environment = var.environment
  }
}

# SNS topic for cost alerts
resource "aws_sns_topic" "cost_alerts" {
  name = "${var.environment}-cost-alerts"
  
  tags = {
    Environment = var.environment
  }
}

# SNS topic subscriptions
resource "aws_sns_topic_subscription" "cost_alert_emails" {
  count     = length(var.alert_emails)
  topic_arn = aws_sns_topic.cost_alerts.arn
  protocol  = "email"
  endpoint  = var.alert_emails[count.index]
}

# Variables
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "monthly_budget_limit" {
  description = "Monthly budget limit in USD"
  type        = number
  default     = 100
}

variable "alert_emails" {
  description = "List of email addresses for cost alerts"
  type        = list(string)
  default     = []
}

# Outputs
output "budget_name" {
  description = "Name of the main budget"
  value       = aws_budgets_budget.monthly_budget.name
}

output "sns_topic_arn" {
  description = "ARN of the cost alerts SNS topic"
  value       = aws_sns_topic.cost_alerts.arn
} 