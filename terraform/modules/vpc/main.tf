# VPC Module for Hibiji Platform

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name        = "hibiji-${var.environment}-vpc"
    Environment = var.environment
    Project     = "hibiji"
    ManagedBy   = "terraform"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = {
    Name        = "hibiji-${var.environment}-igw"
    Environment = var.environment
    Project     = "hibiji"
  }
}

# Public Subnets (for ALB and NAT Gateway)
resource "aws_subnet" "public" {
  count             = length(var.public_subnets)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.public_subnets[count.index]
  availability_zone = var.availability_zones[count.index]
  
  map_public_ip_on_launch = true
  
  tags = {
    Name        = "hibiji-${var.environment}-public-${var.availability_zones[count.index]}"
    Environment = var.environment
    Project     = "hibiji"
    Type        = "public"
  }
}

# Private Subnets (for application servers)
resource "aws_subnet" "private" {
  count             = length(var.private_subnets)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnets[count.index]
  availability_zone = var.availability_zones[count.index]
  
  tags = {
    Name        = "hibiji-${var.environment}-private-${var.availability_zones[count.index]}"
    Environment = var.environment
    Project     = "hibiji"
    Type        = "private"
  }
}

# Database Subnets (for RDS)
resource "aws_subnet" "database" {
  count             = length(var.database_subnets)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.database_subnets[count.index]
  availability_zone = var.availability_zones[count.index]
  
  tags = {
    Name        = "hibiji-${var.environment}-database-${var.availability_zones[count.index]}"
    Environment = var.environment
    Project     = "hibiji"
    Type        = "database"
  }
}

# NAT Gateway (cost-optimized - single NAT for dev/qa, multiple for staging/prod)
resource "aws_eip" "nat" {
  count = var.environment == "prod" || var.environment == "staging" ? length(var.public_subnets) : 1
  
  domain = "vpc"
  
  tags = {
    Name        = "hibiji-${var.environment}-nat-eip-${count.index + 1}"
    Environment = var.environment
    Project     = "hibiji"
  }
}

resource "aws_nat_gateway" "main" {
  count = var.environment == "prod" || var.environment == "staging" ? length(var.public_subnets) : 1
  
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = {
    Name        = "hibiji-${var.environment}-nat-${count.index + 1}"
    Environment = var.environment
    Project     = "hibiji"
  }
  
  depends_on = [aws_internet_gateway.main]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = {
    Name        = "hibiji-${var.environment}-public-rt"
    Environment = var.environment
    Project     = "hibiji"
  }
}

resource "aws_route_table" "private" {
  count = var.environment == "prod" || var.environment == "staging" ? length(var.private_subnets) : 1
  
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  
  tags = {
    Name        = "hibiji-${var.environment}-private-rt-${count.index + 1}"
    Environment = var.environment
    Project     = "hibiji"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = length(var.public_subnets)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = length(var.private_subnets)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index % length(aws_route_table.private)].id
}

# Variables
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnets" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnets" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "database_subnets" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.0.20.0/24", "10.0.21.0/24"]
}

variable "availability_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = ["us-west-1a", "us-west-1b"]
}

# Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "Database subnet IDs"
  value       = aws_subnet.database[*].id
} 