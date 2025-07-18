terraform {
  required_version = ">= 1.0"
  
  backend "s3" {
    bucket = "hibiji-terraform-state"
    key    = "cost-monitoring/dev/terraform.tfstate"
    region = "us-west-1"
  }
}

# Provider configuration
provider "aws" {
  region = var.aws_region
}

# Cost monitoring variables
variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-west-1"
}
variable "alert_emails" {
  description = "Email addresses for cost alerts"
  type        = list(string)
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

# Cost control module
module "cost_control" {
  source = "../../modules/cost-control"
  
  alert_emails = var.alert_emails
}

# Outputs
output "cost_dashboard_url" {
  description = "URL for the CloudWatch cost dashboard"
  value       = module.cost_control.cost_dashboard_url
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for cost alerts"
  value       = module.cost_control.sns_topic_arn
}
