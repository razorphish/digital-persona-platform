# =================================
# Shared Data VPC Outputs
# =================================

# VPC
output "vpc_id" {
  description = "ID of the shared VPC"
  value       = aws_vpc.shared.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the shared VPC"
  value       = aws_vpc.shared.cidr_block
}

# Subnets
output "private_subnet_ids" {
  description = "IDs of private subnets"
  value       = aws_subnet.private[*].id
}

output "private_subnet_cidrs" {
  description = "CIDR blocks of private subnets"
  value       = aws_subnet.private[*].cidr_block
}

output "availability_zones" {
  description = "Availability zones of private subnets"
  value       = aws_subnet.private[*].availability_zone
}

# Route Tables
output "private_route_table_id" {
  description = "ID of the private route table"
  value       = aws_route_table.private.id
}

# Security Groups
output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "rds_proxy_security_group_id" {
  description = "ID of the RDS Proxy security group"
  value       = aws_security_group.rds_proxy.id
}

output "batch_security_group_id" {
  description = "ID of the AWS Batch security group"
  value       = aws_security_group.batch.id
}

output "vpc_endpoints_security_group_id" {
  description = "ID of the VPC endpoints security group"
  value       = aws_security_group.vpc_endpoints.id
}

# DB Subnet Group
output "db_subnet_group_name" {
  description = "Name of the DB subnet group"
  value       = aws_db_subnet_group.shared.name
}

output "db_subnet_group_id" {
  description = "ID of the DB subnet group"
  value       = aws_db_subnet_group.shared.id
}

# VPC Endpoints
output "s3_vpc_endpoint_id" {
  description = "ID of the S3 VPC endpoint"
  value       = aws_vpc_endpoint.s3.id
}

output "secretsmanager_vpc_endpoint_id" {
  description = "ID of the Secrets Manager VPC endpoint"
  value       = aws_vpc_endpoint.secretsmanager.id
}

# Summary
output "vpc_config" {
  description = "Summary configuration for the shared VPC"
  value = {
    vpc_id                = aws_vpc.shared.id
    vpc_cidr              = aws_vpc.shared.cidr_block
    private_subnet_ids    = aws_subnet.private[*].id
    availability_zones    = aws_subnet.private[*].availability_zone
    db_subnet_group_name  = aws_db_subnet_group.shared.name
    rds_security_group_id = aws_security_group.rds.id
  }
}

