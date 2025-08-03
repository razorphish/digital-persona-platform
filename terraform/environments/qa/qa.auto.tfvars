# QA Environment Variables (dynamic values come from workflow)
# environment and sub_environment are set dynamically by the workflow
domain_name = "hibiji.com"

# ECR Repository URLs will be created dynamically by Terraform
# No hardcoded values needed - URLs are constructed from AWS account ID, region, and project name

# Image tags
image_tag          = "latest"
frontend_image_tag = "latest"

# Cost optimization settings for QA environment
aurora_auto_pause   = true
aurora_pause_delay  = 600 # 10 minutes (longer than dev for stability)
aurora_min_capacity = 0.5
aurora_max_capacity = 4.0 # Higher capacity for QA testing

lambda_memory_size = 512 # Standard for QA
lambda_timeout     = 60  # Longer timeout for QA testing

log_retention_days = 30 # 1 month for QA analysis

# S3 lifecycle for QA
s3_lifecycle_transition_days = 30  # Move to IA after 30 days
s3_lifecycle_expiration_days = 180 # Delete after 6 months

# Budget monitoring for QA environments
cost_budget_limit = 150 # $150/month budget for QA environments 
