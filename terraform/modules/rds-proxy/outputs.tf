# =================================
# RDS Proxy Module Outputs
# =================================

output "proxy_endpoint" {
  description = "RDS Proxy endpoint for database connections"
  value       = aws_db_proxy.main.endpoint
}

output "proxy_arn" {
  description = "RDS Proxy ARN"
  value       = aws_db_proxy.main.arn
}

output "proxy_name" {
  description = "RDS Proxy name"
  value       = aws_db_proxy.main.name
}

output "proxy_port" {
  description = "RDS Proxy port (uses database port)"
  value       = 5432
}

output "proxy_iam_role_arn" {
  description = "IAM role ARN used by RDS Proxy"
  value       = aws_iam_role.rds_proxy.arn
}

output "proxy_security_group_id" {
  description = "Security group ID for RDS Proxy"
  value       = aws_security_group.rds_proxy.id
}

output "target_group_name" {
  description = "RDS Proxy target group name"
  value       = aws_db_proxy_default_target_group.main.name
}

output "cloudwatch_log_group_name" {
  description = "CloudWatch log group name for RDS Proxy"
  value       = aws_cloudwatch_log_group.rds_proxy.name
}

# Connection string for Lambda environment variables
output "database_url" {
  description = "Database connection URL for Lambda functions (via RDS Proxy)"
  value       = "postgresql://${aws_db_proxy.main.endpoint}:5432"
  sensitive   = true
} 