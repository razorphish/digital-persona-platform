# Terraform Environment: Main

This directory contains the Terraform configuration for the `main` sub-environment of the Hibiji platform.

## Quick Start

### Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform installed (version 1.8.5+)
- ECR repositories created: `hibiji-backend` and `hibiji-frontend`

### Local Development

1. **Static Configuration** (already set in `main.auto.tfvars`):

   ```hcl
   domain_name     = "hibiji.com"
   environment     = "dev"
   sub_environment = "main"
   ```

2. **Run with automated ECR discovery**:

   ```bash
   ./fetch-terraform-vars.sh
   ```

   This script will:

   - Automatically discover your ECR repository URLs
   - Set the required environment variables
   - Run `terraform apply` with all variables provided

### Manual Execution

If you prefer to set variables manually:

```bash
# Set environment variables
export TF_VAR_ecr_repository_url="your-backend-ecr-url"
export TF_VAR_frontend_ecr_repository_url="your-frontend-ecr-url"
export TF_VAR_image_tag="latest"
export TF_VAR_frontend_image_tag="latest"

# Run Terraform
terraform apply
```

## CI/CD Deployment

### GitHub Actions

The project includes a GitHub Actions workflow (`.github/workflows/terraform-deploy.yml`) that:

1. **Automatically discovers ECR repositories** using AWS CLI
2. **Uses commit SHA as image tags** for versioning
3. **Supports multiple actions**: plan, apply, destroy
4. **Supports multiple environments**: dev, qa, staging, prod
5. **Supports multiple sub-environments**: main, qa, staging

### Required GitHub Secrets

Set these in your GitHub repository settings:

- `AWS_ACCESS_KEY_ID`: AWS access key with ECR and infrastructure permissions
- `AWS_SECRET_ACCESS_KEY`: Corresponding AWS secret key

### Running the Workflow

1. Go to your GitHub repository
2. Navigate to Actions → Terraform Deploy
3. Click "Run workflow"
4. Select your desired options:
   - **Environment**: dev, qa, staging, prod
   - **Sub-environment**: main, qa, staging
   - **Action**: plan, apply, destroy

## Architecture

This environment creates:

- **VPC** with public and private subnets across 2 AZs
- **Application Load Balancer** with target groups for backend (port 8000) and frontend (port 3000)
- **ECS Cluster** with Fargate services for backend and frontend
- **RDS PostgreSQL** database
- **Route53** hosted zone and DNS records
- **ACM Certificate** for HTTPS
- **CloudFront Distribution** for global CDN
- **Security Groups** for ALB and application tiers
- **IAM Roles** for ECS execution and task permissions
- **Secrets Manager** for database password and application secret key

## Outputs

After successful deployment, Terraform will output:

- `alb_dns_name`: Load balancer DNS name
- `alb_name`: Load balancer name
- `cluster_name`: ECS cluster name
- `domain_name`: Full domain name for the environment

## Best Practices

✅ **Automated variable injection** - No interactive prompts  
✅ **Versioned static config** - `main.auto.tfvars` in git  
✅ **Dynamic ECR discovery** - Always uses latest repository URLs  
✅ **Environment-specific tagging** - Uses commit SHA for versioning  
✅ **Security** - Secrets managed via environment variables  
✅ **Validation** - Format and validation checks in CI/CD

## Troubleshooting

### ECR Repository Not Found

Ensure your ECR repositories exist:

```bash
aws ecr describe-repositories --repository-names hibiji-backend hibiji-frontend
```

### AWS Credentials

Verify your AWS credentials are configured:

```bash
aws sts get-caller-identity
```

### Terraform State

If you need to start fresh:

```bash
terraform destroy
terraform init
```
