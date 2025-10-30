# RDS Proxy Enhanced Module

Creates an RDS Proxy for Lambda functions to connect to Aurora with IAM authentication and connection pooling.

## Features

- ✅ **IAM Authentication** - Passwordless, token-based auth (REQUIRED)
- ✅ **Connection Pooling** - Reuses database connections
- ✅ **TLS Required** - All connections encrypted in transit
- ✅ **Lambda-Optimized** - Handles Lambda's burst concurrency
- ✅ **Secrets Manager Integration** - Secure credential retrieval
- ✅ **Read/Write Splitting** - Optional separate endpoints

## Usage

```hcl
module "rds_proxy" {
  source = "../../modules/rds-proxy-enhanced"

  environment            = "dev"
  sub_environment        = "dev01"
  region                 = "us-west-1"
  subnet_ids             = module.shared_vpc.private_subnet_ids
  db_cluster_arn         = module.rds_cluster.cluster_arn
  db_cluster_identifier  = module.rds_cluster.cluster_identifier
  db_secret_arn          = module.rds_cluster.master_credentials_secret_arn
  kms_key_arn            = module.rds_cluster.kms_key_arn

  # Connection pooling
  max_connections_percent       = 100
  max_idle_connections_percent  = 50
  idle_client_timeout           = 1800  # 30 minutes

  # Optional custom endpoints
  create_read_write_endpoint = false
  create_read_only_endpoint  = false

  common_tags = {
    Project     = "vital-woman-reset"
    ManagedBy   = "Terraform"
  }
}
```

## Lambda IAM Policy

Lambda functions need permission to connect via IAM auth:

```hcl
resource "aws_iam_role_policy" "lambda_rds_connect" {
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds-db:connect"
        ]
        Resource = "arn:aws:rds-db:${var.region}:${data.aws_caller_identity.current.account_id}:dbuser:${module.rds_proxy.proxy_id}/*"
      }
    ]
  })
}
```

## Lambda Connection Example (Node.js)

```typescript
import * as AWS from 'aws-sdk';
import { Client } from 'pg';

export async function connectToDatabase() {
  // Generate IAM auth token
  const signer = new AWS.RDS.Signer({
    region: process.env.AWS_REGION,
    hostname: process.env.DB_PROXY_ENDPOINT,  // From module output
    port: 5432,
    username: 'dev01_lambda',  // IAM-authenticated role
  });

  const token = await signer.getAuthToken({
    username: 'dev01_lambda',
  });

  // Connect using token as password
  const client = new Client({
    host: process.env.DB_PROXY_ENDPOINT,
    port: 5432,
    database: 'dev01',
    user: 'dev01_lambda',
    password: token,
    ssl: { 
      rejectUnauthorized: true  // TLS required
    },
  });

  await client.connect();
  return client;
}
```

## Cost

**RDS Proxy Pricing:**
- **$0.015 per vCPU-hour** (~$54/month for always-on proxy)
- Recommended: 1 proxy per sub-environment

**Example:**
- 5 dev environments × $54 = $270/month
- 2 qa environments × $54 = $108/month
- Total: $378/month for 7 environments

## Benefits vs Lambda in VPC

| Aspect | Lambda in VPC | Lambda + RDS Proxy |
|--------|---------------|---------------------|
| Cold Start | 10-15 seconds | 1-2 seconds ✅ |
| NAT Gateway Cost | $65/mo per AZ | $0 ✅ |
| ENI Management | Complex | None ✅ |
| Connection Pooling | Manual | Automatic ✅ |
| IAM Auth | Supported | Required ✅ |

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| environment | Environment name | string | - | yes |
| sub_environment | Sub-environment name | string | - | yes |
| subnet_ids | List of subnet IDs | list(string) | - | yes |
| db_cluster_arn | RDS cluster ARN | string | - | yes |
| db_cluster_identifier | RDS cluster identifier | string | - | yes |
| db_secret_arn | Secrets Manager ARN | string | - | yes |
| kms_key_arn | KMS key ARN | string | - | yes |
| max_connections_percent | Max connections % | number | 100 | no |
| idle_client_timeout | Idle timeout (seconds) | number | 1800 | no |

## Outputs

| Name | Description |
|------|-------------|
| proxy_endpoint | RDS Proxy endpoint (use this in Lambda) |
| proxy_arn | ARN of the RDS Proxy |
| proxy_role_arn | IAM role ARN |
| proxy_config | Summary configuration object |

## Requirements

- Terraform >= 1.5.0
- AWS Provider ~> 5.0

## Security Notes

- ✅ **IAM authentication REQUIRED** - No password-based auth allowed
- ✅ **TLS REQUIRED** - All connections must use SSL/TLS
- ✅ **Secrets Manager** - Proxy retrieves credentials securely
- ✅ **Private subnets** - Proxy deployed in VPC private subnets

