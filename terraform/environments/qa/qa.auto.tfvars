# QA Environment Variables (dynamic values come from workflow)
# environment and sub_environment are set dynamically by the workflow
domain_name = "hibiji.com"

# ECR Repository URLs will be created dynamically by Terraform
# No hardcoded values needed - URLs are constructed from AWS account ID, region, and project name

# Image tags
image_tag = "latest"
frontend_image_tag = "latest" 