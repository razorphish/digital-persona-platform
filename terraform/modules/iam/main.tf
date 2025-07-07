# IAM Groups
resource "aws_iam_group" "super_admin" {
  name = "hibiji-super-admin"
}

resource "aws_iam_group" "environment_admin" {
  name = "hibiji-environment-admin"
}

resource "aws_iam_group" "dev_qa_admin" {
  name = "hibiji-dev-qa-admin"
}

resource "aws_iam_group" "dev_full_access" {
  name = "hibiji-dev-full-access"
}

resource "aws_iam_group" "read_only" {
  name = "hibiji-read-only"
}

# IAM Policies
resource "aws_iam_policy" "super_admin_policy" {
  name        = "hibiji-super-admin-policy"
  description = "Full access to all Hibiji environments and resources"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "*"
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestTag/Project": "hibiji"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "ecs:*",
          "ecr:*",
          "rds:*",
          "s3:*",
          "cloudfront:*",
          "route53:*",
          "acm:*",
          "cloudwatch:*",
          "logs:*",
          "iam:*",
          "lambda:*",
          "sqs:*",
          "sns:*"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_policy" "environment_admin_policy" {
  name        = "hibiji-environment-admin-policy"
  description = "Admin access to dev, qa, and staging environments"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecs:*",
          "ecr:*",
          "rds:*",
          "s3:*",
          "cloudfront:*",
          "route53:*",
          "acm:*",
          "cloudwatch:*",
          "logs:*",
          "lambda:*",
          "sqs:*",
          "sns:*"
        ]
        Resource = "*"
        Condition = {
          StringNotEquals = {
            "aws:RequestTag/Environment": "prod"
          }
        }
      },
      {
        Effect = "Deny"
        Action = "*"
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestTag/Environment": "prod"
          }
        }
      }
    ]
  })
}

resource "aws_iam_policy" "dev_qa_admin_policy" {
  name        = "hibiji-dev-qa-admin-policy"
  description = "Admin access to dev and qa environments only"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecs:*",
          "ecr:*",
          "rds:*",
          "s3:*",
          "cloudfront:*",
          "route53:*",
          "acm:*",
          "cloudwatch:*",
          "logs:*",
          "lambda:*",
          "sqs:*",
          "sns:*"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestTag/Environment": ["dev", "qa"]
          }
        }
      },
      {
        Effect = "Deny"
        Action = "*"
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestTag/Environment": ["staging", "prod"]
          }
        }
      }
    ]
  })
}

resource "aws_iam_policy" "dev_full_access_policy" {
  name        = "hibiji-dev-full-access-policy"
  description = "Full access to dev environment only"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecs:*",
          "ecr:*",
          "rds:*",
          "s3:*",
          "cloudfront:*",
          "route53:*",
          "acm:*",
          "cloudwatch:*",
          "logs:*",
          "lambda:*",
          "sqs:*",
          "sns:*"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestTag/Environment": "dev"
          }
        }
      },
      {
        Effect = "Deny"
        Action = "*"
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:RequestTag/Environment": ["qa", "staging", "prod"]
          }
        }
      }
    ]
  })
}

resource "aws_iam_policy" "read_only_policy" {
  name        = "hibiji-read-only-policy"
  description = "Read-only access to all environments"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecs:Describe*",
          "ecs:List*",
          "ecr:Describe*",
          "ecr:List*",
          "rds:Describe*",
          "rds:List*",
          "s3:Get*",
          "s3:List*",
          "cloudfront:Get*",
          "cloudfront:List*",
          "route53:Get*",
          "route53:List*",
          "acm:Describe*",
          "acm:List*",
          "cloudwatch:Get*",
          "cloudwatch:List*",
          "logs:Get*",
          "logs:List*",
          "lambda:Get*",
          "lambda:List*",
          "sqs:Get*",
          "sqs:List*",
          "sns:Get*",
          "sns:List*"
        ]
        Resource = "*"
      },
      {
        Effect = "Deny"
        Action = [
          "ecs:Create*",
          "ecs:Update*",
          "ecs:Delete*",
          "ecr:Create*",
          "ecr:Update*",
          "ecr:Delete*",
          "rds:Create*",
          "rds:Modify*",
          "rds:Delete*",
          "s3:Put*",
          "s3:Delete*",
          "cloudfront:Create*",
          "cloudfront:Update*",
          "cloudfront:Delete*",
          "route53:Create*",
          "route53:Change*",
          "route53:Delete*",
          "acm:Request*",
          "acm:Delete*",
          "cloudwatch:Put*",
          "cloudwatch:Delete*",
          "logs:Create*",
          "logs:Put*",
          "logs:Delete*",
          "lambda:Create*",
          "lambda:Update*",
          "lambda:Delete*",
          "sqs:Create*",
          "sqs:Update*",
          "sqs:Delete*",
          "sns:Create*",
          "sns:Update*",
          "sns:Delete*"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach policies to groups
resource "aws_iam_group_policy_attachment" "super_admin_attachment" {
  group      = aws_iam_group.super_admin.name
  policy_arn = aws_iam_policy.super_admin_policy.arn
}

resource "aws_iam_group_policy_attachment" "environment_admin_attachment" {
  group      = aws_iam_group.environment_admin.name
  policy_arn = aws_iam_policy.environment_admin_policy.arn
}

resource "aws_iam_group_policy_attachment" "dev_qa_admin_attachment" {
  group      = aws_iam_group.dev_qa_admin.name
  policy_arn = aws_iam_policy.dev_qa_admin_policy.arn
}

resource "aws_iam_group_policy_attachment" "dev_full_access_attachment" {
  group      = aws_iam_group.dev_full_access.name
  policy_arn = aws_iam_policy.dev_full_access_policy.arn
}

resource "aws_iam_group_policy_attachment" "read_only_attachment" {
  group      = aws_iam_group.read_only.name
  policy_arn = aws_iam_policy.read_only_policy.arn
} 