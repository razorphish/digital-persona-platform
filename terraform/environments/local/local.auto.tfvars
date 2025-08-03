# Local Environment Variables - Cost Optimized for Personal Development
# Designed for local-mars-### pattern with maximum cost savings

environment     = "local"
sub_environment = "mars"
domain_name     = "hibiji.com"

# Image tags
image_tag          = "latest"
frontend_image_tag = "latest"

# Cost optimization settings - Aggressive savings for local development
aurora_auto_pause   = true
aurora_pause_delay  = 300 # 5 minutes
aurora_min_capacity = 0.5 # Minimum possible
aurora_max_capacity = 1.0 # Low ceiling for local

lambda_memory_size = 256 # Minimal memory
lambda_timeout     = 30  # Standard timeout

log_retention_days = 7 # Weekly cleanup

# Aggressive S3 lifecycle for local
s3_lifecycle_transition_days = 30 # Move to IA after 30 days (AWS minimum)
s3_lifecycle_expiration_days = 60 # Delete after 60 days

# Budget monitoring
cost_budget_limit = 50 # $50/month budget for personal dev environment

# Alert emails (optional - add your email for budget alerts)
alert_emails = [
  # "your-email@example.com"
]
