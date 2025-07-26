# Dev Environment Variables (dynamic values come from workflow)
# environment and sub_environment are set dynamically by the workflow
domain_name = "hibiji.com"

# ECR Repository URLs (will be created by Terraform)
ecr_repository_url = "570827307849.dkr.ecr.us-west-1.amazonaws.com/dpp-backend"
frontend_ecr_repository_url = "570827307849.dkr.ecr.us-west-1.amazonaws.com/dpp-frontend"

# Image tags
image_tag = "latest"
frontend_image_tag = "latest" 