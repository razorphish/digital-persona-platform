# =================================
# API Gateway Outputs
# =================================

output "api_gateway_id" {
  description = "ID of the API Gateway"
  value       = aws_apigatewayv2_api.main.id
}

output "api_gateway_arn" {
  description = "ARN of the API Gateway"
  value       = aws_apigatewayv2_api.main.arn
}

output "api_gateway_execution_arn" {
  description = "Execution ARN of the API Gateway"
  value       = aws_apigatewayv2_api.main.execution_arn
}

output "api_endpoint" {
  description = "HTTP endpoint of the API Gateway"
  value       = aws_apigatewayv2_api.main.api_endpoint
}

output "api_url" {
  description = "Full URL of the API Gateway stage"
  value       = "${aws_apigatewayv2_api.main.api_endpoint}/${aws_apigatewayv2_stage.main.name}"
}

output "stage_id" {
  description = "ID of the API Gateway stage"
  value       = aws_apigatewayv2_stage.main.id
}

output "stage_arn" {
  description = "ARN of the API Gateway stage"
  value       = aws_apigatewayv2_stage.main.arn
}

output "stage_invoke_url" {
  description = "Invoke URL of the API Gateway stage"
  value       = aws_apigatewayv2_stage.main.invoke_url
}

output "custom_domain_name" {
  description = "Custom domain name (if configured)"
  value       = var.custom_domain_name
}

output "custom_domain_target_name" {
  description = "Target domain name for custom domain DNS configuration (CloudFront domain)"
  value       = var.custom_domain_name != null ? aws_cloudfront_distribution.api[0].domain_name : null
}

output "custom_domain_hosted_zone_id" {
  description = "Hosted zone ID for custom domain DNS configuration (CloudFront zone ID)"
  value       = var.custom_domain_name != null ? aws_cloudfront_distribution.api[0].hosted_zone_id : null
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution for the API"
  value       = var.custom_domain_name != null ? aws_cloudfront_distribution.api[0].id : null
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = var.custom_domain_name != null ? aws_cloudfront_distribution.api[0].domain_name : null
}

output "log_group_name" {
  description = "Name of the CloudWatch log group for API Gateway"
  value       = aws_cloudwatch_log_group.api_gateway.name
}

output "log_group_arn" {
  description = "ARN of the CloudWatch log group for API Gateway"
  value       = aws_cloudwatch_log_group.api_gateway.arn
} 
