# Dev Environment Variables (dynamic values come from workflow)
# environment and sub_environment are set dynamically by the workflow
domain_name = "hibiji.com"

# ECR Repository URLs will be created dynamically by Terraform
# No hardcoded values needed - URLs are constructed from AWS account ID, region, and project name

# Image tags
image_tag          = "latest"
frontend_image_tag = "latest"

# Cost optimization settings for dev environment
aurora_auto_pause   = true
aurora_pause_delay  = 300 # 5 minutes
aurora_min_capacity = 0.5
aurora_max_capacity = 2.0

lambda_memory_size = 512 # Standard for dev
lambda_timeout     = 30

log_retention_days = 14 # 2 weeks for dev debugging

# S3 lifecycle for dev
s3_lifecycle_transition_days = 30  # Move to IA after 30 days
s3_lifecycle_expiration_days = 365 # Delete after 1 year

# Budget monitoring for dev environments
cost_budget_limit = 100 # $100/month budget for dev environments 
