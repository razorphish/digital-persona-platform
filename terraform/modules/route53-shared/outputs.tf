# =================================
# Shared Route53 Module Outputs
# =================================

output "hosted_zone_id" {
  description = "Route53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "hosted_zone_arn" {
  description = "Route53 hosted zone ARN"
  value       = aws_route53_zone.main.arn
}

output "hosted_zone_name_servers" {
  description = "Name servers for the hosted zone"
  value       = aws_route53_zone.main.name_servers
}

output "domain_name" {
  description = "Domain name"
  value       = var.domain_name
}

output "zone_name" {
  description = "Zone name"
  value       = aws_route53_zone.main.name
} 