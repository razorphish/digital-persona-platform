# =================================
# Lambda Public Outputs
# =================================

# Lambda Function
output "function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.main.function_name
}

output "function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.main.arn
}

output "function_qualified_arn" {
  description = "Qualified ARN of the Lambda function (includes version)"
  value       = aws_lambda_function.main.qualified_arn
}

output "function_invoke_arn" {
  description = "Invoke ARN for API Gateway integration"
  value       = aws_lambda_function.main.invoke_arn
}

output "function_version" {
  description = "Latest published version of the Lambda function"
  value       = aws_lambda_function.main.version
}

# IAM Role
output "lambda_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda.arn
}

output "lambda_role_name" {
  description = "Name of the Lambda execution role"
  value       = aws_iam_role.lambda.name
}

# CloudWatch Logs
output "log_group_name" {
  description = "Name of the CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.lambda.name
}

output "log_group_arn" {
  description = "ARN of the CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.lambda.arn
}

# Function URL
output "function_url" {
  description = "Lambda Function URL (if created)"
  value       = var.create_function_url ? aws_lambda_function_url.main[0].function_url : null
}

output "function_url_id" {
  description = "Lambda Function URL ID (if created)"
  value       = var.create_function_url ? aws_lambda_function_url.main[0].url_id : null
}

# Alias
output "alias_arn" {
  description = "ARN of the Lambda alias (if created)"
  value       = var.create_alias ? aws_lambda_alias.main[0].arn : null
}

output "alias_invoke_arn" {
  description = "Invoke ARN of the Lambda alias (if created)"
  value       = var.create_alias ? aws_lambda_alias.main[0].invoke_arn : null
}

# Summary
output "lambda_config" {
  description = "Summary configuration for the Lambda function"
  value = {
    function_name    = aws_lambda_function.main.function_name
    function_arn     = aws_lambda_function.main.arn
    invoke_arn       = aws_lambda_function.main.invoke_arn
    runtime          = var.runtime
    handler          = var.handler
    memory_size      = var.memory_size
    timeout          = var.timeout
    log_group_name   = aws_cloudwatch_log_group.lambda.name
    in_vpc           = false  # This module creates Lambda OUTSIDE VPC
    rds_proxy_enabled = var.rds_proxy_endpoint != null
  }
}

