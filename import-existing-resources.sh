#!/bin/bash

# Import Existing AWS Resources into Fresh Terraform State
# Run this in terraform/environments/dev directory

cd terraform/environments/dev

# Initialize Terraform
terraform init -backend-config="key=dev/dev01/terraform.tfstate"

# Import S3 buckets
terraform import aws_s3_bucket.uploads dev-dev01-dpp-uploads
terraform import module.lambda_backend.aws_s3_bucket.lambda_deployments dev-dev01-dpp-lambda-deployments
terraform import module.s3_website.aws_s3_bucket.builds dev-dev01-dpp-builds

# Import RDS resources
terraform import module.rds_proxy.aws_db_proxy.main dev-dev01-dpp-rds-proxy

# Import Batch Job Queue
terraform import module.aws_batch_ml.aws_batch_job_queue.ml_jobs dev-dev01-dpp-ml-jobs-queue

# Import DB Subnet Group (need to get the correct one first)
# terraform import aws_db_subnet_group.database dev-dev01-dpp-db-subnet-group

echo "✅ Resources imported! Now run: terraform apply"

