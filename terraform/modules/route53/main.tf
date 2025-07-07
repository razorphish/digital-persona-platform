# Route 53 Module for Hibiji Platform

# Hosted Zone
resource "aws_route53_zone" "main" {
  name = var.domain_name
  
  tags = {
    Name        = "hibiji-${var.environment}-zone"
    Environment = var.environment
    Project     = "hibiji"
  }
}

# Main domain A record (www.hibiji.com)
resource "aws_route53_record" "www" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "www.${var.domain_name}"
  type    = "A"
  
  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}

# API subdomain (api.hibiji.com)
resource "aws_route53_record" "api" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.${var.domain_name}"
  type    = "A"
  
  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}

# Environment-specific subdomains
resource "aws_route53_record" "environment" {
  for_each = toset(var.environments)
  
  zone_id = aws_route53_zone.main.zone_id
  name    = "${each.key}.${var.domain_name}"
  type    = "A"
  
  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}

# Sub-environment records
resource "aws_route53_record" "sub_environment" {
  for_each = var.sub_environments
  
  zone_id = aws_route53_zone.main.zone_id
  name    = "${each.key}.${each.value.main_env}.${var.domain_name}"
  type    = "A"
  
  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}

# MX Record for email
resource "aws_route53_record" "mx" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "MX"
  ttl     = "300"
  
  records = [
    "10 mail.${var.domain_name}."
  ]
}

# TXT Record for domain verification
resource "aws_route53_record" "txt" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "TXT"
  ttl     = "300"
  
  records = [
    "v=spf1 include:_spf.google.com ~all"
  ]
}

# CNAME for email verification
resource "aws_route53_record" "email_verification" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "mail.${var.domain_name}"
  type    = "CNAME"
  ttl     = "300"
  
  records = ["ghs.googlehosted.com."]
}

# Health check for ALB
resource "aws_route53_health_check" "alb" {
  fqdn              = var.alb_dns_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = "3"
  request_interval  = "30"
  
  tags = {
    Name        = "hibiji-${var.environment}-alb-health-check"
    Environment = var.environment
    Project     = "hibiji"
  }
}

# Failover records for high availability (prod only)
resource "aws_route53_record" "failover" {
  count = var.environment == "prod" ? 1 : 0
  
  zone_id = aws_route53_zone.main.zone_id
  name    = "failover.${var.domain_name}"
  type    = "A"
  
  failover_routing_policy {
    type = "PRIMARY"
  }
  
  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
  
  health_check_id = aws_route53_health_check.alb.id
}

# Variables
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "hibiji.com"
}

variable "alb_dns_name" {
  description = "ALB DNS name"
  type        = string
}

variable "alb_zone_id" {
  description = "ALB zone ID"
  type        = string
}

variable "environments" {
  description = "List of environments for subdomain creation"
  type        = list(string)
  default     = ["dev", "qa", "staging", "prod"]
}

variable "sub_environments" {
  description = "Map of sub-environments with their main environment"
  type        = map(object({
    main_env = string
  }))
  default = {
    dev01 = { main_env = "dev" }
    dev02 = { main_env = "dev" }
    dev03 = { main_env = "dev" }
    qa01  = { main_env = "qa" }
    qa02  = { main_env = "qa" }
    qa03  = { main_env = "qa" }
    staging01 = { main_env = "staging" }
    staging02 = { main_env = "staging" }
    staging03 = { main_env = "staging" }
    prod01 = { main_env = "prod" }
    prod02 = { main_env = "prod" }
  }
}

# Outputs
output "zone_id" {
  description = "Route 53 zone ID"
  value       = aws_route53_zone.main.zone_id
}

output "name_servers" {
  description = "Name servers for the hosted zone"
  value       = aws_route53_zone.main.name_servers
}

output "domain_name" {
  description = "Domain name"
  value       = var.domain_name
} 