# =================================
# Shared Data VPC Module
# =================================
# Creates a shared VPC for multiple sub-environments
# Supports up to 99 sub-environments per environment type
# with private subnets for RDS, RDS Proxy, and AWS Batch

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# =================================
# VPC
# =================================
resource "aws_vpc" "shared" {
  cidr_block           = var.vpc_cidr_block
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-shared-data-vpc"
    Environment = var.environment
    Type        = "SharedVPC"
    Purpose     = "DataInfrastructure"
  })
}

# =================================
# Private Subnets (for RDS, RDS Proxy, Batch)
# =================================
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.shared.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-shared-private-${var.availability_zones[count.index]}"
    Environment = var.environment
    Type        = "PrivateSubnet"
    Tier        = "Private"
  })
}

# =================================
# Route Tables
# =================================
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.shared.id

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-shared-private-rt"
    Environment = var.environment
    Type        = "RouteTable"
  })
}

# Associate private subnets with private route table
resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# =================================
# VPC Endpoints (S3 Gateway - No NAT Gateway needed)
# =================================
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.shared.id
  service_name      = "com.amazonaws.${var.region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [aws_route_table.private.id]

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-shared-s3-endpoint"
    Environment = var.environment
    Type        = "VPCEndpoint"
  })
}

# VPC Endpoint for Secrets Manager (Interface)
resource "aws_vpc_endpoint" "secretsmanager" {
  vpc_id              = aws_vpc.shared.id
  service_name        = "com.amazonaws.${var.region}.secretsmanager"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  private_dns_enabled = true

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-shared-secretsmanager-endpoint"
    Environment = var.environment
    Type        = "VPCEndpoint"
  })
}

# =================================
# Security Groups
# =================================

# Security group for VPC endpoints
resource "aws_security_group" "vpc_endpoints" {
  name        = "${var.environment}-shared-vpc-endpoints-sg"
  description = "Security group for VPC endpoints"
  vpc_id      = aws_vpc.shared.id

  ingress {
    description = "HTTPS from VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr_block]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-shared-vpc-endpoints-sg"
    Environment = var.environment
    Type        = "SecurityGroup"
  })
}

# Security group for RDS
resource "aws_security_group" "rds" {
  name        = "${var.environment}-shared-rds-sg"
  description = "Security group for RDS Aurora cluster"
  vpc_id      = aws_vpc.shared.id

  ingress {
    description     = "PostgreSQL from RDS Proxy"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.rds_proxy.id]
  }

  ingress {
    description     = "PostgreSQL from AWS Batch"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.batch.id]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-shared-rds-sg"
    Environment = var.environment
    Type        = "SecurityGroup"
  })
}

# Security group for RDS Proxy
resource "aws_security_group" "rds_proxy" {
  name        = "${var.environment}-shared-rds-proxy-sg"
  description = "Security group for RDS Proxy (Lambda access)"
  vpc_id      = aws_vpc.shared.id

  ingress {
    description = "PostgreSQL from public Lambda (via IAM auth)"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] # Lambda is public, uses IAM auth
  }

  egress {
    description     = "PostgreSQL to RDS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.rds.id]
  }

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-shared-rds-proxy-sg"
    Environment = var.environment
    Type        = "SecurityGroup"
  })
}

# Security group for AWS Batch
resource "aws_security_group" "batch" {
  name        = "${var.environment}-shared-batch-sg"
  description = "Security group for AWS Batch compute environment"
  vpc_id      = aws_vpc.shared.id

  egress {
    description = "Allow all outbound (for ECR, S3, RDS)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-shared-batch-sg"
    Environment = var.environment
    Type        = "SecurityGroup"
  })
}

# =================================
# DB Subnet Group (for RDS Aurora)
# =================================
resource "aws_db_subnet_group" "shared" {
  name       = "${var.environment}-shared-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(var.common_tags, {
    Name        = "${var.environment}-shared-db-subnet-group"
    Environment = var.environment
    Type        = "DBSubnetGroup"
  })
}

