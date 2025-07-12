# Cost Control and Budget Management Module

# Environment-specific budgets with detailed breakdown
locals {
  budgets = {
    dev      = 50
    qa       = 75
    staging  = 75
    hotfix   = 75
    prod     = 100
  }
  
  # Sub-environment budgets (fraction of main environment)
  sub_environment_budgets = {
    dev01 = 20
    dev02 = 20
    dev03 = 20
    qa01  = 35
    qa02  = 35
    qa03  = 35
    staging01 = 35
    staging02 = 35
    staging03 = 35
    hotfix01 = 35
    hotfix02 = 35
    hotfix03 = 35
  }

  # Service-specific cost thresholds
  service_budgets = {
    ecs      = 0.4  # 40% of total budget
    rds      = 0.3  # 30% of total budget
    alb      = 0.1  # 10% of total budget
    storage  = 0.1  # 10% of total budget
    other    = 0.1  # 10% of total budget
  }
}

# Environment budgets for main environments
resource "aws_budgets_budget" "environment_budget" {
  for_each = local.budgets

  name        = "hibiji-${each.key}-budget"
  budget_type = "COST"
  time_unit   = "MONTHLY"
  limit_amount = tostring(each.value)
  limit_unit   = "USD"

  notification {
    comparison_operator = "GREATER_THAN"
    threshold          = each.value
    threshold_type     = "ABSOLUTE_VALUE"
    notification_type  = "ACTUAL"
    subscriber_email_addresses = var.alert_emails
  }

  notification {
    comparison_operator = "GREATER_THAN"
    threshold          = each.value * 0.8
    threshold_type     = "ABSOLUTE_VALUE"
    notification_type  = "FORECASTED"
    subscriber_email_addresses = var.alert_emails
  }
}

# Sub-environment budgets
resource "aws_budgets_budget" "sub_environment_budget" {
  for_each = local.sub_environment_budgets

  name        = "hibiji-${each.key}-sub-budget"
  budget_type = "COST"
  time_unit   = "MONTHLY"
  limit_amount = tostring(each.value)
  limit_unit   = "USD"

  notification {
    comparison_operator = "GREATER_THAN"
    threshold          = each.value
    threshold_type     = "ABSOLUTE_VALUE"
    notification_type  = "ACTUAL"
    subscriber_email_addresses = var.alert_emails
  }

  notification {
    comparison_operator = "GREATER_THAN"
    threshold          = each.value * 0.8
    threshold_type     = "ABSOLUTE_VALUE"
    notification_type  = "FORECASTED"
    subscriber_email_addresses = var.alert_emails
  }
}

# Service-specific budgets for main environments
resource "aws_budgets_budget" "service_budget" {
  for_each = {
    for pair in setproduct(keys(local.budgets), keys(local.service_budgets)) : "${pair[0]}-${pair[1]}" => {
      environment = pair[0]
      service     = pair[1]
      budget      = local.budgets[pair[0]]
      percentage  = local.service_budgets[pair[1]]
    }
  }

  name        = "hibiji-${each.value.environment}-${each.value.service}-budget"
  budget_type = "COST"
  time_unit   = "MONTHLY"
  limit_amount = tostring(each.value.budget * each.value.percentage)
  limit_unit   = "USD"

  notification {
    comparison_operator = "GREATER_THAN"
    threshold          = each.value.budget * each.value.percentage
    threshold_type     = "ABSOLUTE_VALUE"
    notification_type  = "ACTUAL"
    subscriber_email_addresses = var.alert_emails
  }
}

# CloudWatch Dashboard for Cost Monitoring
resource "aws_cloudwatch_dashboard" "cost_dashboard" {
  dashboard_name = "hibiji-cost-monitoring"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/Billing", "EstimatedCharges", "Currency", "USD"],
            [".", ".", "ServiceName", "AmazonEC2"],
            [".", ".", "ServiceName", "AmazonRDS"],
            [".", ".", "ServiceName", "AWSElasticLoadBalancing"],
            [".", ".", "ServiceName", "AmazonS3"]
          ]
          period = 86400
          stat   = "Maximum"
          region = "us-east-1"
          title  = "Daily Estimated Charges by Service"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/Billing", "EstimatedCharges", "Currency", "USD"]
          ]
          period = 86400
          stat   = "Maximum"
          region = "us-east-1"
          title  = "Total Daily Estimated Charges"
        }
      }
    ]
  })
}

# Cost Allocation Tags
resource "aws_ce_cost_allocation_tag" "environment_tag" {
  tag_key = "Environment"
  status  = "Active"
}

resource "aws_ce_cost_allocation_tag" "project_tag" {
  tag_key = "Project"
  status  = "Active"
}

resource "aws_ce_cost_allocation_tag" "sub_environment_tag" {
  tag_key = "SubEnvironment"
  status  = "Active"
}

# CloudWatch Alarms for Cost Monitoring
resource "aws_cloudwatch_metric_alarm" "daily_cost_alarm" {
  for_each = local.budgets
  
  alarm_name          = "hibiji-${each.key}-daily-cost-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "EstimatedCharges"
  namespace           = "AWS/Billing"
  period              = "86400"
  statistic           = "Maximum"
  threshold           = each.value * 0.05  # 5% of monthly budget
  alarm_description   = "Daily cost exceeds 5% of monthly budget for ${each.key} environment"
  
  dimensions = {
    Currency = "USD"
  }
  
  alarm_actions = [aws_sns_topic.cost_alerts.arn]
}

# SNS Topic for Cost Alerts
resource "aws_sns_topic" "cost_alerts" {
  name = "hibiji-cost-alerts"
  
  tags = {
    Name        = "hibiji-cost-alerts"
    Environment = "global"
    Project     = "hibiji"
  }
}

resource "aws_sns_topic_subscription" "cost_alerts_email" {
  for_each = toset(var.alert_emails)
  
  topic_arn = aws_sns_topic.cost_alerts.arn
  protocol  = "email"
  endpoint  = each.value
}

# Variables
variable "alert_emails" {
  description = "Email addresses for cost alerts"
  type        = list(string)
  default     = ["admin@hibiji.com"]
}

# Outputs
output "budget_arns" {
  description = "ARNs of created budgets"
  value = {
    for env, budget in aws_budgets_budget.environment_budget : env => budget.arn
  }
}

output "sub_budget_arns" {
  description = "ARNs of sub-environment budgets"
  value = {
    for env, budget in aws_budgets_budget.sub_environment_budget : env => budget.arn
  }
}

output "cost_dashboard_url" {
  description = "URL for the CloudWatch cost dashboard"
  value       = "https://${data.aws_region.current.name}.console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#dashboards:name=${aws_cloudwatch_dashboard.cost_dashboard.dashboard_name}"
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for cost alerts"
  value       = aws_sns_topic.cost_alerts.arn
}

# Data sources
data "aws_region" "current" {} 