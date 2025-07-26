# =================================
# AWS Batch ML Processing Outputs
# =================================

# ECR Repository
output "ecr_repository_url" {
  description = "URL of the ECR repository for ML service container images"
  value       = aws_ecr_repository.ml_service.repository_url
}

output "ecr_repository_name" {
  description = "Name of the ECR repository"
  value       = aws_ecr_repository.ml_service.name
}

output "ecr_repository_arn" {
  description = "ARN of the ECR repository"
  value       = aws_ecr_repository.ml_service.arn
}

# SQS Queues
output "sqs_queue_url" {
  description = "URL of the SQS queue for ML job requests"
  value       = aws_sqs_queue.ml_jobs.url
}

output "sqs_queue_arn" {
  description = "ARN of the SQS queue for ML job requests"
  value       = aws_sqs_queue.ml_jobs.arn
}

output "sqs_queue_name" {
  description = "Name of the SQS queue for ML job requests"
  value       = aws_sqs_queue.ml_jobs.name
}

output "sqs_dlq_url" {
  description = "URL of the dead letter queue"
  value       = aws_sqs_queue.ml_jobs_dlq.url
}

output "sqs_dlq_arn" {
  description = "ARN of the dead letter queue"
  value       = aws_sqs_queue.ml_jobs_dlq.arn
}

# Batch Resources
output "batch_compute_environment_arn" {
  description = "ARN of the Batch compute environment"
  value       = aws_batch_compute_environment.ml_processing.arn
}

output "batch_compute_environment_name" {
  description = "Name of the Batch compute environment"
  value       = aws_batch_compute_environment.ml_processing.compute_environment_name
}

output "batch_job_queue_arn" {
  description = "ARN of the Batch job queue"
  value       = aws_batch_job_queue.ml_jobs.arn
}

output "batch_job_queue_name" {
  description = "Name of the Batch job queue"
  value       = aws_batch_job_queue.ml_jobs.name
}

output "batch_job_definition_arn" {
  description = "ARN of the Batch job definition"
  value       = aws_batch_job_definition.ml_processor.arn
}

output "batch_job_definition_name" {
  description = "Name of the Batch job definition"
  value       = aws_batch_job_definition.ml_processor.name
}

# IAM Roles
output "batch_execution_role_arn" {
  description = "ARN of the Batch execution role"
  value       = aws_iam_role.batch_execution.arn
}

output "batch_service_role_arn" {
  description = "ARN of the Batch service role"
  value       = aws_iam_role.batch_service.arn
}

# CloudWatch Logs
output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group for Batch jobs"
  value       = aws_cloudwatch_log_group.ml_batch_logs.name
}

output "cloudwatch_log_group_arn" {
  description = "ARN of the CloudWatch log group for Batch jobs"
  value       = aws_cloudwatch_log_group.ml_batch_logs.arn
}

# Security Group
output "batch_security_group_id" {
  description = "ID of the security group for Batch compute environment"
  value       = aws_security_group.batch_compute.id
}

# Configuration Summary
output "ml_processing_config" {
  description = "Summary configuration for ML processing setup"
  value = {
    sqs_queue_url           = aws_sqs_queue.ml_jobs.url
    ecr_repository_url      = aws_ecr_repository.ml_service.repository_url
    batch_job_queue_name    = aws_batch_job_queue.ml_jobs.name
    batch_job_definition    = aws_batch_job_definition.ml_processor.name
    log_group_name          = aws_cloudwatch_log_group.ml_batch_logs.name
  }
  sensitive = false
} 