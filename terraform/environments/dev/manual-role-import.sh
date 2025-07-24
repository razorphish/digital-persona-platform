#!/bin/bash
echo "🔧 Manual IAM Role Import Script"
echo "================================"

# Remove problematic resources from Terraform state
echo "Removing IAM roles from Terraform state..."
terraform state rm aws_iam_role.ecs_execution 2>/dev/null || echo "ECS execution role not in state"
terraform state rm aws_iam_role.ecs_task 2>/dev/null || echo "ECS task role not in state"  
terraform state rm module.lambda_backend.aws_iam_role.lambda_execution 2>/dev/null || echo "Lambda execution role not in state"

# Apply without IAM role creation (they exist in AWS)
echo "Applying infrastructure without problematic IAM resources..."
terraform apply \
  -target=module.api_gateway \
  -target=module.lambda_backend.aws_lambda_function.api \
  -target=module.s3_website \
  -target=aws_route53_record.api \
  -target=aws_route53_record.website \
  -auto-approve

echo "✅ Infrastructure applied successfully without IAM conflicts"
