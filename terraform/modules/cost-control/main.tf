# Cost Control and Budget Management Module

# Environment-specific budgets
locals {
  budgets = {
    dev      = 50
    qa       = 100
    staging  = 200
    prod     = 1000
  }
  
  # Sub-environment budgets (fraction of main environment)
  sub_environment_budgets = {
    dev01 = 20
    dev02 = 20
    dev03 = 20
    qa01  = 50
    qa02  = 50
    qa03  = 50
    staging01 = 100
    staging02 = 100
    staging03 = 100
    prod01 = 500
    prod02 = 500
  }
}

# AWS Budget for main environments
resource "aws_budgets_budget" "environment_budget" {
  for_each = local.budgets
  
  name              = "hibiji-${each.key}-budget"
  budget_type       = "COST"
  time_unit         = "MONTHLY"
  
  cost_filters = {
    TagKeyValue = "Environment$${each.key}"
  }
  
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

# AWS Budget for sub-environments
resource "aws_budgets_budget" "sub_environment_budget" {
  for_each = local.sub_environment_budgets
  
  name              = "hibiji-${each.key}-budget"
  budget_type       = "COST"
  time_unit         = "MONTHLY"
  
  cost_filters = {
    TagKeyValue = "SubEnvironment$${each.key}"
  }
  
  notification {
    comparison_operator = "GREATER_THAN"
    threshold          = each.value
    threshold_type     = "ABSOLUTE_VALUE"
    notification_type  = "ACTUAL"
    subscriber_email_addresses = var.alert_emails
  }
}

# CloudWatch Cost Anomaly Detection
resource "aws_ce_anomaly_monitor" "cost_anomaly" {
  name              = "hibiji-cost-anomaly-monitor"
  monitor_type      = "DIMENSIONAL"
  monitor_dimension = "SERVICE"
  
  dimensional_value_count = 10
}

resource "aws_ce_anomaly_subscription" "cost_anomaly" {
  name        = "hibiji-cost-anomaly-subscription"
  threshold   = 10
  frequency   = "DAILY"
  
  subscriber {
    type    = "EMAIL"
    address = var.alert_emails[0]
  }
  
  monitor_arn_list = [aws_ce_anomaly_monitor.cost_anomaly.arn]
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