# Lambda Public Module (No VPC)

Creates Lambda functions **outside VPC** that connect to RDS via RDS Proxy with IAM authentication.

## Why Lambda Outside VPC?

✅ **Fast Cold Starts:** 1-2 seconds (vs 10-15 seconds in VPC)  
✅ **No NAT Gateway:** Saves $65/month per AZ  
✅ **No ENI Management:** Scales instantly  
✅ **Unlimited Concurrency:** No VPC limits  
✅ **Simpler Architecture:** Less operational complexity

## Usage

```hcl
module "lambda_api" {
  source = "../../modules/lambda-public"

  environment       = "dev"
  sub_environment   = "dev01"
  function_name     = "api"
  runtime           = "nodejs20.x"
  handler           = "dist/index.handler"
  timeout           = 30
  memory_size       = 512
  source_code_path  = "${path.module}/lambda-deployment.zip"

  # RDS Proxy connection
  rds_proxy_endpoint     = module.rds_proxy.proxy_endpoint
  rds_proxy_resource_id  = module.rds_proxy.proxy_id
  database_name          = "dev01"

  # S3 access
  s3_bucket_arns = [
    aws_s3_bucket.uploads.arn
  ]

  # Environment variables
  environment_variables = {
    NODE_ENV = "production"
    LOG_LEVEL = "info"
  }

  # Logging
  log_retention_days = 7

  common_tags = {
    Project = "vital-woman-reset"
  }
}
```

## RDS Connection (IAM Auth)

Lambda code to connect to RDS via Proxy:

```typescript
import * as AWS from 'aws-sdk';
import { Client } from 'pg';

export const handler = async (event: any) => {
  // Generate IAM auth token
  const signer = new AWS.RDS.Signer({
    region: process.env.AWS_REGION!,
    hostname: process.env.DB_PROXY_ENDPOINT!,
    port: 5432,
    username: `${process.env.SUB_ENVIRONMENT}_lambda`,
  });

  const token = await signer.getAuthToken({
    username: `${process.env.SUB_ENVIRONMENT}_lambda`,
  });

  // Connect using IAM token
  const client = new Client({
    host: process.env.DB_PROXY_ENDPOINT,
    port: 5432,
    database: process.env.DB_NAME,
    user: `${process.env.SUB_ENVIRONMENT}_lambda`,
    password: token,  // IAM token as password
    ssl: { rejectUnauthorized: true },
  });

  await client.connect();
  
  // Your database queries here
  const result = await client.query('SELECT NOW()');
  
  await client.end();
  
  return {
    statusCode: 200,
    body: JSON.stringify(result.rows),
  };
};
```

## S3 Access

Lambda automatically gets S3 access for specified buckets:

```typescript
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: process.env.AWS_REGION });

// Read file from S3
const command = new GetObjectCommand({
  Bucket: process.env.S3_BUCKET_NAME,
  Key: `${process.env.SUB_ENVIRONMENT}/user-123/upload.txt`,
});

const response = await s3Client.send(command);
```

## Custom IAM Permissions

Add custom permissions via `custom_iam_policy_json`:

```hcl
module "lambda_api" {
  # ... other config ...

  custom_iam_policy_json = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage",
          "sqs:GetQueueUrl"
        ]
        Resource = aws_sqs_queue.ml_jobs.arn
      }
    ]
  })
}
```

## Function URL (Optional)

Create a public HTTPS endpoint:

```hcl
module "lambda_api" {
  # ... other config ...

  create_function_url   = true
  function_url_auth_type = "NONE"  # Public access (use AWS_IAM for protected)
  
  function_url_cors_config = {
    allow_origins     = ["https://example.com"]
    allow_methods     = ["GET", "POST"]
    allow_headers     = ["Content-Type"]
    expose_headers    = []
    max_age           = 3600
    allow_credentials = false
  }
}

# Output: module.lambda_api.function_url
# Result: https://abcdef123.lambda-url.us-west-1.on.aws/
```

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| environment | Environment name | string | - | yes |
| sub_environment | Sub-environment name | string | - | yes |
| function_name | Function name | string | - | yes |
| runtime | Lambda runtime | string | nodejs20.x | no |
| handler | Function handler | string | index.handler | no |
| timeout | Timeout (seconds) | number | 30 | no |
| memory_size | Memory (MB) | number | 512 | no |
| source_code_path | Path to zip file | string | - | yes |
| rds_proxy_endpoint | RDS Proxy endpoint | string | null | no |
| rds_proxy_resource_id | RDS Proxy resource ID | string | null | no |
| database_name | Database name | string | null | no |
| s3_bucket_arns | S3 bucket ARNs | list(string) | [] | no |
| environment_variables | Environment variables | map(string) | {} | no |

## Outputs

| Name | Description |
|------|-------------|
| function_name | Lambda function name |
| function_arn | Lambda function ARN |
| function_invoke_arn | API Gateway invoke ARN |
| lambda_role_arn | IAM role ARN |
| function_url | Function URL (if created) |
| lambda_config | Summary configuration object |

## Cost

**Lambda Pricing:**
- **Requests:** $0.20 per 1M requests
- **Compute:** $0.0000166667 per GB-second
- **No VPC costs:** No NAT Gateway ($0 vs $65/mo per AZ)

**Example (1M requests/month, 512MB, 1s avg):**
- Requests: $0.20
- Compute: $8.33 (1M × 0.5 GB × 1s × $0.0000166667)
- **Total: ~$8.53/month**

Compare to Lambda in VPC:
- Same Lambda cost: $8.53
- NAT Gateway: $65/month × 2 AZs = $130/month
- **Total: ~$138.53/month**

**Savings per Lambda:** $130/month 🎉

## Requirements

- Terraform >= 1.5.0
- AWS Provider ~> 5.0

## Notes

- ✅ **No VPC configuration** - Lambda runs in AWS-managed network
- ✅ **IAM authentication** for RDS via Proxy
- ✅ **Fast cold starts** (1-2 seconds vs 10-15 seconds)
- ✅ **No ENI limits** - Scales instantly
- ✅ **Internet access** - Can call external APIs without NAT Gateway

