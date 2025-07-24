# =================================
# Shared Route53 Module Variables
# =================================

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