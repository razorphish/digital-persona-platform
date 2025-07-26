# GitHub Workflows

This directory contains GitHub Actions workflows for the Digital Persona Platform.

## Active Workflows:

- `deploy-serverless.yml` - **Primary workflow** for serverless deployment (Lambda, S3, API Gateway)
- `cleanup-subenv.yml` - Cleanup sub-environments
- `cost-monitor.yml` - Cost monitoring workflow

## Architecture:

**Serverless Architecture** (Current):

- Frontend: S3 Static Hosting + CloudFront CDN
- Backend: AWS Lambda Functions
- API: API Gateway v2 (HTTP API)
- Database: Aurora Serverless v2

## Environment Naming Convention:

All workflows enforce strict environment naming: `dev##`, `qa##`, `staging##`, `hotfix##` where `##` is exactly 2 digits (01-99).

## Migration Complete:

✅ **ECS workflows removed** - Now using serverless-only architecture for 80% cost savings and better scalability.

# Force new CI run: Sat Jul 11 14:28:42 PDT 2025
