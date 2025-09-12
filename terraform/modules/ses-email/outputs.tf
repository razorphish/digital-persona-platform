# =================================
# SES Email Service Module Outputs
# =================================

output "domain_identity_arn" {
  description = "ARN of the SES domain identity"
  value       = aws_ses_domain_identity.main.arn
}

output "domain_identity_verification_token" {
  description = "Token for domain verification"
  value       = aws_ses_domain_identity.main.verification_token
}

output "dkim_tokens" {
  description = "DKIM tokens for domain authentication"
  value       = aws_ses_domain_dkim.main.dkim_tokens
}

output "mail_from_domain" {
  description = "Mail from domain"
  value       = aws_ses_domain_mail_from.main.mail_from_domain
}

output "configuration_set_name" {
  description = "Name of the SES configuration set"
  value       = aws_ses_configuration_set.main.name
}

output "from_email" {
  description = "Verified sender email address"
  value       = var.from_email
}
