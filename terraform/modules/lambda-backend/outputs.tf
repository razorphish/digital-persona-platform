# =================================
# Lambda Backend Outputs
# =================================

output "lambda_function_name" {
  description = "Name of the main Lambda function"
  value       = aws_lambda_function.api.function_name
}

output "lambda_function_arn" {
  description = "ARN of the main Lambda function"
  value       = aws_lambda_function.api.arn
}

output "lambda_function_invoke_arn" {
  description = "Invoke ARN of the main Lambda function"
  value       = aws_lambda_function.api.invoke_arn
}

output "lambda_execution_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_execution.arn
}

output "lambda_execution_role_name" {
  description = "Name of the Lambda execution role"
  value       = aws_iam_role.lambda_execution.name
}

output "lambda_deployments_bucket_id" {
  description = "ID of the Lambda deployments S3 bucket"
  value       = aws_s3_bucket.lambda_deployments.id
}

output "lambda_deployments_bucket_arn" {
  description = "ARN of the Lambda deployments S3 bucket"
  value       = aws_s3_bucket.lambda_deployments.arn
}

output "lambda_log_group_name" {
  description = "Name of the Lambda CloudWatch log group"
  value       = aws_cloudwatch_log_group.lambda_logs.name
}

output "lambda_log_group_arn" {
  description = "ARN of the Lambda CloudWatch log group"
  value       = aws_cloudwatch_log_group.lambda_logs.arn
}

output "dependencies_layer_arn" {
  description = "ARN of the dependencies Lambda layer (if created)"
  value       = var.create_dependencies_layer ? aws_lambda_layer_version.dependencies[0].arn : null
} 