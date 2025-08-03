# =================================
# AWS Batch ML Processing Module
# =================================
# This module creates AWS Batch infrastructure for ML processing
# with SQS for job queuing and VPC integration for database access

# ECR Repository for ML container images
resource "aws_ecr_repository" "ml_service" {
  name                 = "${var.environment}-${var.sub_environment}-${var.project_name}-ml-service"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.sub_environment}-${var.project_name}-ml-service-ecr"
    Type = "ECRRepository"
  })
}

# ECR Lifecycle Policy
resource "aws_ecr_lifecycle_policy" "ml_service" {
  repository = aws_ecr_repository.ml_service.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus     = "tagged"
          tagPrefixList = ["v"]
          countType     = "imageCountMoreThan"
          countNumber   = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

# SQS Queue for ML job requests
resource "aws_sqs_queue" "ml_jobs" {
  name                      = "${var.environment}-${var.sub_environment}-${var.project_name}-ml-jobs"
  delay_seconds             = 0
  max_message_size          = 262144  # 256KB
  message_retention_seconds = 1209600 # 14 days
  receive_wait_time_seconds = 10      # Long polling

  # Dead letter queue configuration
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.ml_jobs_dlq.arn
    maxReceiveCount     = 3
  })

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.sub_environment}-${var.project_name}-ml-jobs-queue"
    Type = "SQSQueue"
  })
}

# Dead Letter Queue for failed ML jobs
resource "aws_sqs_queue" "ml_jobs_dlq" {
  name                      = "${var.environment}-${var.sub_environment}-${var.project_name}-ml-jobs-dlq"
  message_retention_seconds = 1209600 # 14 days

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.sub_environment}-${var.project_name}-ml-jobs-dlq"
    Type = "SQSDeadLetterQueue"
  })
}

# IAM role for Batch service
resource "aws_iam_role" "batch_service" {
  name = "${var.environment}-${var.sub_environment}-${var.project_name}-batch-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "batch.amazonaws.com"
        }
      }
    ]
  })

  # tags = var.common_tags  # Commented out due to IAM permission constraints
}

# Attach AWS managed policy for Batch service
resource "aws_iam_role_policy_attachment" "batch_service" {
  role       = aws_iam_role.batch_service.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBatchServiceRole"
}

# IAM role for ECS instances in Batch compute environment
resource "aws_iam_role" "batch_instance" {
  name = "${var.environment}-${var.sub_environment}-${var.project_name}-batch-instance-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  # tags = var.common_tags  # Commented out due to IAM permission constraints
}

# Attach AWS managed policies for ECS instances
resource "aws_iam_role_policy_attachment" "batch_instance_ecs" {
  role       = aws_iam_role.batch_instance.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
}

# Instance profile for Batch compute environment
resource "aws_iam_instance_profile" "batch_instance" {
  name = "${var.environment}-${var.sub_environment}-${var.project_name}-batch-instance-profile"
  role = aws_iam_role.batch_instance.name

  # tags = var.common_tags  # Commented out due to IAM permission constraints
}

# IAM role for Batch execution (job execution)
resource "aws_iam_role" "batch_execution" {
  name = "${var.environment}-${var.sub_environment}-${var.project_name}-batch-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  # tags = var.common_tags  # Commented out due to IAM permission constraints
}

# Batch execution role policies
resource "aws_iam_role_policy_attachment" "batch_execution_task" {
  role       = aws_iam_role.batch_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Custom policy for ML service to access SQS, RDS, and Secrets Manager
resource "aws_iam_role_policy" "ml_service_permissions" {
  name = "${var.environment}-${var.sub_environment}-${var.project_name}-ml-service-policy"
  role = aws_iam_role.batch_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = [
          aws_sqs_queue.ml_jobs.arn,
          aws_sqs_queue.ml_jobs_dlq.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = var.database_secret_arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:*:*"
      }
    ]
  })
}

# Security group for Batch compute environment
resource "aws_security_group" "batch_compute" {
  name        = "${var.environment}-${var.sub_environment}-${var.project_name}-batch-compute"
  description = "Security group for Batch compute environment"
  vpc_id      = var.vpc_id

  # Outbound internet access for downloading packages and communicating with AWS services
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.sub_environment}-${var.project_name}-batch-compute-sg"
    Type = "SecurityGroup"
  })
}

# Batch compute environment
resource "aws_batch_compute_environment" "ml_processing" {
  compute_environment_name = "${var.environment}-${var.sub_environment}-${var.project_name}-ml-compute"
  type                     = "MANAGED"
  state                    = "ENABLED"
  service_role             = aws_iam_role.batch_service.arn

  compute_resources {
    type                = "EC2"
    allocation_strategy = "BEST_FIT_PROGRESSIVE"

    min_vcpus     = var.min_vcpus
    max_vcpus     = var.max_vcpus
    desired_vcpus = var.desired_vcpus

    instance_type = var.instance_types

    # Use spot instances for cost optimization (can be disabled for production)
    bid_percentage = var.use_spot_instances ? var.spot_bid_percentage : null

    subnets            = var.subnet_ids
    security_group_ids = [aws_security_group.batch_compute.id]
    instance_role      = aws_iam_instance_profile.batch_instance.arn

    # Minimal tags to prevent unnecessary replacements
    # EC2 instance tags are not critical for Batch functionality
    tags = {
      Name = "${var.environment}-${var.sub_environment}-${var.project_name}-batch-compute"
    }
  }

  # Prevent unnecessary replacements due to tag changes
  lifecycle {
    ignore_changes = [
      compute_resources[0].tags,
      tags,
      tags_all
    ]
  }

  depends_on = [
    aws_iam_role_policy_attachment.batch_service
  ]
}

# Batch job queue
resource "aws_batch_job_queue" "ml_jobs" {
  name     = "${var.environment}-${var.sub_environment}-${var.project_name}-ml-jobs-queue"
  state    = "ENABLED"
  priority = 1

  compute_environment_order {
    order               = 1
    compute_environment = aws_batch_compute_environment.ml_processing.arn
  }

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.sub_environment}-${var.project_name}-ml-jobs-queue"
    Type = "BatchJobQueue"
  })

  # Explicit dependency to ensure proper destruction order
  # AWS Batch requires: Job Queue destroyed BEFORE Compute Environment
  # This depends_on ensures Terraform destroys job queue first
  depends_on = [
    aws_batch_compute_environment.ml_processing
  ]
}

# CloudWatch Log Group for Batch jobs
resource "aws_cloudwatch_log_group" "ml_batch_logs" {
  name              = "/aws/batch/${var.environment}-${var.sub_environment}-${var.project_name}-ml-processing"
  retention_in_days = var.log_retention_days

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.sub_environment}-${var.project_name}-ml-batch-logs"
    Type = "CloudWatchLogGroup"
  })
}

# Batch job definition
resource "aws_batch_job_definition" "ml_processor" {
  name = "${var.environment}-${var.sub_environment}-${var.project_name}-ml-processor"
  type = "container"

  container_properties = jsonencode({
    image = "${aws_ecr_repository.ml_service.repository_url}:latest"

    vcpus  = var.job_vcpus
    memory = var.job_memory

    jobRoleArn       = aws_iam_role.batch_execution.arn
    executionRoleArn = aws_iam_role.batch_execution.arn

    environment = [
      {
        name  = "ENVIRONMENT"
        value = var.environment
      },
      {
        name  = "SUB_ENVIRONMENT"
        value = var.sub_environment
      },
      {
        name  = "SQS_QUEUE_URL"
        value = aws_sqs_queue.ml_jobs.url
      },
      {
        name  = "DATABASE_SECRET_ARN"
        value = var.database_secret_arn
      },
      {
        name  = "AWS_REGION"
        value = var.aws_region
      },
      {
        name  = "LOG_LEVEL"
        value = var.log_level
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.ml_batch_logs.name
        "awslogs-region"        = var.aws_region
        "awslogs-stream-prefix" = "ml-processor"
      }
    }

    # Network configuration for VPC access to RDS
    networkMode = "awsvpc"
  })

  tags = merge(var.common_tags, {
    Name = "${var.environment}-${var.sub_environment}-${var.project_name}-ml-processor-job-def"
    Type = "BatchJobDefinition"
  })
} 
