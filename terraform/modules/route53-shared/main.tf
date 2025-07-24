# =================================
# Shared Route53 Module
# One hosted zone for all environments
# =================================

# Main hosted zone for the domain (created once)
resource "aws_route53_zone" "main" {
  name = var.domain_name

  tags = {
    Name        = "Primary DNS Zone - ${var.domain_name}"
    Environment = "shared"
    Project     = var.project_name
    ManagedBy   = "Terraform"
    Purpose     = "Primary DNS for all environments"
  }
}

# Environment-specific A records
resource "aws_route53_record" "environment" {
  for_each = var.environment_endpoints

  zone_id = aws_route53_zone.main.zone_id
  name    = "${each.key}.${var.domain_name}"
  type    = "A"
  
  alias {
    name                   = each.value.target_dns
    zone_id                = each.value.target_zone_id
    evaluate_target_health = true
  }
}

# Sub-environment records (dev01, dev02, qa01, etc.)
resource "aws_route53_record" "sub_environment" {
  for_each = var.sub_environment_endpoints

  zone_id = aws_route53_zone.main.zone_id
  name    = "${each.key}.${var.domain_name}"  # dev01.hibiji.com
  type    = "A"
  
  alias {
    name                   = each.value.target_dns
    zone_id                = each.value.target_zone_id
    evaluate_target_health = true
  }
}

# API subdomain records (dev01-api.hibiji.com)
resource "aws_route53_record" "api" {
  for_each = var.api_endpoints

  zone_id = aws_route53_zone.main.zone_id
  name    = "${each.key}-api.${var.domain_name}"
  type    = "CNAME"
  ttl     = 300
  
  records = [each.value.target_dns]
}

# Variables
variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "hibiji.com"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "dpp"
}

variable "environment_endpoints" {
  description = "Environment endpoints for DNS records"
  type = map(object({
    target_dns     = string
    target_zone_id = string
  }))
  default = {}
}

variable "sub_environment_endpoints" {
  description = "Sub-environment endpoints for DNS records"
  type = map(object({
    target_dns     = string
    target_zone_id = string
  }))
  default = {}
}

variable "api_endpoints" {
  description = "API endpoints for DNS records"
  type = map(object({
    target_dns = string
  }))
  default = {}
}

# Outputs
output "hosted_zone_id" {
  description = "Route53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "hosted_zone_name_servers" {
  description = "Name servers for the hosted zone"
  value       = aws_route53_zone.main.name_servers
}

output "domain_name" {
  description = "Domain name"
  value       = var.domain_name
} 