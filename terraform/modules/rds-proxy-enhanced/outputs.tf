# =================================
# RDS Proxy Enhanced Outputs
# =================================

# RDS Proxy
output "proxy_id" {
  description = "ID of the RDS Proxy"
  value       = aws_db_proxy.main.id
}

output "proxy_arn" {
  description = "ARN of the RDS Proxy"
  value       = aws_db_proxy.main.arn
}

output "proxy_name" {
  description = "Name of the RDS Proxy"
  value       = aws_db_proxy.main.name
}

output "proxy_endpoint" {
  description = "Endpoint of the RDS Proxy (use this for Lambda connections)"
  value       = aws_db_proxy.main.endpoint
}

# IAM Role
output "proxy_role_arn" {
  description = "ARN of the IAM role for RDS Proxy"
  value       = aws_iam_role.rds_proxy.arn
}

output "proxy_role_name" {
  description = "Name of the IAM role for RDS Proxy"
  value       = aws_iam_role.rds_proxy.name
}

# Custom Endpoints
output "read_write_endpoint" {
  description = "Read-write endpoint (if created)"
  value       = var.create_read_write_endpoint ? aws_db_proxy_endpoint.read_write[0].endpoint : null
}

output "read_only_endpoint" {
  description = "Read-only endpoint (if created)"
  value       = var.create_read_only_endpoint ? aws_db_proxy_endpoint.read_only[0].endpoint : null
}

# Summary
output "proxy_config" {
  description = "Summary configuration for the RDS Proxy"
  value = {
    proxy_name             = aws_db_proxy.main.name
    proxy_endpoint         = aws_db_proxy.main.endpoint
    iam_auth_required      = true
    tls_required           = true
    max_connections_pct    = var.max_connections_percent
    idle_timeout_seconds   = var.idle_client_timeout
  }
}

