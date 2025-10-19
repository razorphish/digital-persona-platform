# 🚀 Serverless Architecture Migration Guide

## Overview

This guide outlines the migration from the current ECS-based container architecture to a modern serverless architecture using AWS Lambda, S3, and API Gateway. This migration will significantly reduce costs and improve scalability.

## 🏗️ Architecture Comparison

### Current Architecture (ECS)

- **Frontend**: ECS Container with Next.js
- **Backend**: ECS Container with tRPC API
- **Database**: RDS PostgreSQL
- **Load Balancer**: Application Load Balancer
- **CDN**: CloudFront
- **Infrastructure**: VPC, Subnets, NAT Gateway

### New Architecture (Serverless)

- **Frontend**: S3 Static Hosting + CloudFront CDN
- **Backend**: AWS Lambda Functions
- **API**: API Gateway v2 (HTTP API)
- **Database**: Aurora Serverless v2
- **File Storage**: S3 Buckets
- **Infrastructure**: Minimal VPC (database only)

## 💰 Cost Benefits

| Component     | Current (ECS)           | New (Serverless)                 | Savings |
| ------------- | ----------------------- | -------------------------------- | ------- |
| Frontend      | ECS Fargate: ~$30/month | S3 + CloudFront: ~$5/month       | 83%     |
| Backend       | ECS Fargate: ~$30/month | Lambda: ~$3/month                | 90%     |
| Database      | RDS: ~$25/month         | Aurora Serverless v2: ~$10/month | 60%     |
| Load Balancer | ALB: ~$20/month         | API Gateway: ~$3/month           | 85%     |
| **Total**     | **~$105/month**         | **~$21/month**                   | **80%** |

## 📁 File Structure

```
digital-persona-platform/
├── terraform/
│   ├── modules/
│   │   ├── s3-static-website/     # S3 + CloudFront for frontend
│   │   ├── lambda-backend/        # Lambda functions for API
│   │   └── api-gateway/           # API Gateway configuration
│   └── environments/
│       └── dev/
│           ├── main.tf            # Current ECS configuration
│           └── main-serverless.tf # New serverless configuration
├── scripts/
│   ├── serverless-migration-cleanup.sh  # Clean up current resources
│   └── deploy-serverless.sh            # Deploy new architecture
├── apps/
│   ├── web/                       # Next.js frontend (already static-ready)
│   └── server/
│       └── src/
│           ├── index.ts          # Current Express server
│           ├── lambda.ts         # New Lambda wrapper
│           └── index-lambda.ts   # Lambda entry point
└── .github/workflows/
    └── deploy-serverless.yml     # CI/CD for serverless deployment
```

## 🚀 Migration Steps

### Phase 1: Infrastructure Migration

#### Step 1: Clean Up Current Resources

**⚠️ IMPORTANT**: This will destroy all current AWS resources except Route 53 records!

```bash
# Review what will be destroyed
./scripts/serverless-migration-cleanup.sh --dry-run

# Clean up current infrastructure
./scripts/serverless-migration-cleanup.sh
```

#### Step 2: Deploy Serverless Infrastructure

```bash
# Deploy to dev01 environment
./scripts/deploy-serverless.sh

# Deploy to specific environment
./scripts/deploy-serverless.sh -e dev -s dev02

# Dry run to see what would be deployed
./scripts/deploy-serverless.sh --dry-run
```

#### Step 3: Update DNS (Optional)

Once infrastructure is deployed, you can update Route 53 records to point to the new resources:

1. **Frontend**: Point to CloudFront distribution
2. **API**: Point to API Gateway custom domain

### Phase 2: Event-Driven Architecture (Future)

After the initial serverless migration, we'll implement an event-driven architecture:

#### Planned Components

1. **Producer API Service**

   - Microservice to add messages to Kafka queues
   - Called by backend Lambda functions
   - Handles event routing and validation

2. **Consumer API Service**

   - Processes AI/ML workloads from Kafka queues
   - Scales automatically based on queue depth
   - Handles long-running AI operations

3. **Kafka Integration**
   - Amazon MSK (Managed Streaming for Kafka)
   - Event sourcing for AI/ML operations
   - Decoupled architecture for better scalability

## 🛠️ Development Workflow

### Local Development

The application can still be developed locally using Docker:

```bash
# Start local development environment
./docker-start.sh dev

# Frontend: http://localhost:3100
# Backend: http://localhost:3101
```

### Frontend Development

The frontend is already configured for static export:

```bash
cd apps/web
npm run build  # Creates static export in 'out' directory
```

### Backend Development

The backend now supports both Express and Lambda modes:

```bash
cd apps/server

# Development (Express mode)
npm run dev

# Build for Lambda
npm run build
```

### Testing Serverless Locally

You can test the Lambda function locally using tools like:

- **AWS SAM CLI**: `sam local start-api`
- **Serverless Framework**: `serverless offline`
- **LocalStack**: Full AWS simulation

## 🔧 Configuration

### Environment Variables

The serverless architecture uses the same environment variables:

```bash
# Frontend (Next.js)
NEXT_PUBLIC_API_URL=https://api-dev01.hibiji.com

# Backend (Lambda)
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET_ARN=arn:aws:secretsmanager:...
CORS_ORIGIN=https://dev01.hibiji.com
```

### Terraform Variables

```hcl
# terraform/environments/dev/terraform.tfvars
environment = "dev"
sub_environment = "dev01"
domain_name = "hibiji.com"
```

## 📊 Monitoring & Observability

### CloudWatch Metrics

The serverless architecture provides comprehensive monitoring:

- **Lambda Function Metrics**: Duration, errors, concurrent executions
- **API Gateway Metrics**: Request count, latency, error rates
- **S3 Metrics**: Storage usage, request metrics
- **CloudFront Metrics**: Cache hit ratio, origin latency

### Logging

- **Lambda Logs**: Automatic CloudWatch logging
- **API Gateway Logs**: Request/response logging
- **Application Logs**: Structured logging with correlation IDs

### Alerts

Configure CloudWatch alarms for:

- Lambda function errors
- API Gateway 5xx errors
- High latency alerts
- Cost monitoring

## 🔒 Security Considerations

### IAM Roles & Policies

- **Lambda Execution Role**: Minimal permissions for secrets and database access
- **S3 Bucket Policies**: CloudFront-only access for website bucket
- **API Gateway**: CORS configuration and request validation

### Network Security

- **Database**: VPC-isolated Aurora Serverless v2
- **Lambda**: VPC configuration for database access
- **S3**: Public read for static assets, private for uploads

### Secrets Management

- **Database Credentials**: AWS Secrets Manager
- **JWT Secrets**: AWS Secrets Manager
- **Environment Secrets**: Lambda environment variables

## 🚨 Troubleshooting

### Common Issues

1. **Lambda Cold Starts**

   - Solution: Provisioned concurrency for critical functions
   - Monitor: CloudWatch Lambda metrics

2. **API Gateway Timeouts**

   - Default: 30 seconds maximum
   - Solution: Optimize Lambda functions or use async patterns

3. **S3 Static Website Issues**

   - Check CloudFront distribution settings
   - Verify S3 bucket policies
   - Check CORS configuration

4. **Database Connection Issues**
   - Lambda functions must be in VPC for database access
   - Check security group configurations
   - Monitor connection pooling

### Debugging Tools

```bash
# View Lambda logs
aws logs tail /aws/lambda/dev-dev01-dpp-api --follow

# Test API Gateway
curl https://api-dev01.hibiji.com/health

# Check S3 sync status
aws s3 ls s3://dev-dev01-dpp-website/

# Monitor CloudFront
aws cloudfront get-distribution --id DISTRIBUTION_ID
```

## 📈 Performance Optimization

### Lambda Optimization

1. **Memory Configuration**: Start with 512MB, monitor and adjust
2. **Timeout Settings**: 30 seconds for API, 15 minutes for batch operations
3. **Connection Pooling**: Use connection pooling for database
4. **Dependencies**: Minimize package size, use Lambda layers

### Frontend Optimization

1. **Static Assets**: Long cache headers (1 year)
2. **HTML/JSON**: Short cache headers (1 hour)
3. **Image Optimization**: Use Next.js image optimization
4. **Code Splitting**: Automatic with Next.js

### Database Optimization

1. **Aurora Serverless v2**: Auto-scaling based on demand
2. **Connection Pooling**: RDS Proxy for connection management
3. **Query Optimization**: Monitor slow queries
4. **Caching**: Redis for frequently accessed data

## 🔄 Rollback Strategy

### Emergency Rollback

If issues arise, you can quickly rollback to the ECS architecture:

1. **Stop new deployments** to serverless infrastructure
2. **Redeploy ECS infrastructure** using the original Terraform configuration
3. **Update DNS records** to point back to ALB
4. **Monitor** the ECS deployment for stability

### Gradual Migration

For production environments, consider a gradual migration:

1. **Blue-Green Deployment**: Run both architectures in parallel
2. **Traffic Splitting**: Route percentage of traffic to serverless
3. **Monitor Metrics**: Compare performance and error rates
4. **Full Cutover**: Once confident, route all traffic to serverless

## 📞 Support & Resources

### Documentation Links

- [AWS Lambda Developer Guide](https://docs.aws.amazon.com/lambda/)
- [API Gateway Documentation](https://docs.aws.amazon.com/apigateway/)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [tRPC Documentation](https://trpc.io/docs)

### Getting Help

1. **Check CloudWatch Logs** for error details
2. **Run health checks** using the deployment script
3. **Review Terraform state** for infrastructure issues
4. **Test locally** using Docker development environment

---

## 🎯 Next Steps

1. **Execute Phase 1**: Migrate to serverless architecture
2. **Monitor Performance**: Compare metrics with ECS baseline
3. **Optimize Costs**: Fine-tune resource allocation
4. **Plan Phase 2**: Design event-driven architecture with Kafka
5. **Implement Monitoring**: Set up comprehensive observability

This migration will provide significant cost savings, improved scalability, and a foundation for future event-driven architecture enhancements.
