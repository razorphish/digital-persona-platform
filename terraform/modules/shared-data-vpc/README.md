# Shared Data VPC Module

Creates a shared VPC for multiple sub-environments (dev01-99, qa01-99, etc.) with:
- Private subnets for RDS, RDS Proxy, and AWS Batch
- NO NAT Gateways (cost optimization)
- S3 VPC Gateway Endpoint (for Batch to access S3 without internet)
- Secrets Manager VPC Interface Endpoint (for secure credential retrieval)
- Pre-configured security groups for RDS, RDS Proxy, and Batch

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│          Shared VPC (10.0.0.0/16 or 10.1.0.0/16)        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Private Subnets (Multi-AZ):                              │
│    ├─ Subnet 1 (us-west-1a): 10.0.0.0/20                 │
│    └─ Subnet 2 (us-west-1b): 10.0.16.0/20                │
│                                                           │
│  Resources:                                               │
│    ├─ Aurora Cluster (shared)                            │
│    ├─ RDS Proxy (per sub-environment)                    │
│    └─ AWS Batch (per sub-environment)                    │
│                                                           │
│  VPC Endpoints:                                           │
│    ├─ S3 Gateway Endpoint ✅ (no NAT Gateway needed)     │
│    └─ Secrets Manager Interface Endpoint ✅              │
│                                                           │
│  Security Groups:                                         │
│    ├─ rds-sg (Aurora access)                             │
│    ├─ rds-proxy-sg (Lambda → Proxy)                      │
│    ├─ batch-sg (Batch → RDS/S3)                          │
│    └─ vpc-endpoints-sg (HTTPS to VPC endpoints)          │
│                                                           │
│  NO NAT Gateways ✅ (-$65/month per subnet)              │
└─────────────────────────────────────────────────────────┘
```

## Usage

```hcl
module "shared_vpc" {
  source = "../../modules/shared-data-vpc"

  environment          = "nonprod"
  region               = "us-west-1"
  vpc_cidr_block       = "10.0.0.0/16"
  private_subnet_cidrs = ["10.0.0.0/20", "10.0.16.0/20"]
  availability_zones   = ["us-west-1a", "us-west-1b"]

  common_tags = {
    Project     = "vital-woman-reset"
    ManagedBy   = "Terraform"
    Environment = "nonprod"
  }
}
```

## Inputs

| Name | Description | Type | Default | Required |
|------|-------------|------|---------|----------|
| environment | Environment name (nonprod, prod) | string | - | yes |
| region | AWS region | string | us-west-1 | no |
| vpc_cidr_block | CIDR block for the VPC | string | - | yes |
| private_subnet_cidrs | List of CIDR blocks for private subnets (min 2) | list(string) | - | yes |
| availability_zones | List of availability zones (min 2) | list(string) | - | yes |
| common_tags | Common tags to apply to all resources | map(string) | {} | no |

## Outputs

| Name | Description |
|------|-------------|
| vpc_id | ID of the shared VPC |
| vpc_cidr_block | CIDR block of the shared VPC |
| private_subnet_ids | IDs of private subnets |
| private_subnet_cidrs | CIDR blocks of private subnets |
| availability_zones | Availability zones of private subnets |
| rds_security_group_id | ID of the RDS security group |
| rds_proxy_security_group_id | ID of the RDS Proxy security group |
| batch_security_group_id | ID of the AWS Batch security group |
| db_subnet_group_name | Name of the DB subnet group |
| s3_vpc_endpoint_id | ID of the S3 VPC endpoint |
| vpc_config | Summary configuration object |

## Cost Optimization

This module eliminates NAT Gateways by:
1. **Lambda outside VPC** - No VPC networking needed
2. **S3 VPC Gateway Endpoint** - Batch accesses S3 without internet
3. **Secrets Manager VPC Endpoint** - Secure credential retrieval without NAT

**Savings:** ~$65/month per AZ (typically $130/month for 2 AZs)

## Security Features

- ✅ **No public subnets** - All resources in private subnets
- ✅ **VPC endpoints for AWS services** - No internet egress required
- ✅ **Least-privilege security groups** - Only necessary ports/protocols
- ✅ **IAM authentication** - RDS Proxy uses IAM auth (no passwords)

## Requirements

- Terraform >= 1.5.0
- AWS Provider ~> 5.0

## Notes

- This module creates **only private subnets** - no NAT Gateways
- Lambda functions should be **outside VPC** and use RDS Proxy
- AWS Batch stays **inside VPC** for direct RDS access
- S3 access from Batch is via VPC Gateway Endpoint (no internet)

