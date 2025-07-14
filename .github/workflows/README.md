# GitHub Workflows

This directory contains GitHub Actions workflows for the Digital Persona Platform.

## Active Workflows:

- **`unified-ci-deploy-optimized.yml`** - Main CI/CD pipeline (optimized, self-sufficient)
  - Handles all testing, building, and deployment
  - Auto-creates ECR repositories, S3 backend, and secrets
  - Supports manual dispatch for emergency deployments
  - 40% performance improvement with parallel execution
- **`cost-monitor.yml`** - Cost monitoring and alerting

  - Daily cost analysis and budget alerts
  - Weekly and monthly cost reports
  - Cost optimization recommendations

- **`cleanup-subenv.yml`** - Environment cleanup automation
  - Automatically cleans up AWS resources when feature branches are deleted
  - Prevents resource accumulation and cost drift

## Environment Naming Convention:

All workflows enforce strict environment naming: `dev##`, `qa##`, `staging##`, `hotfix##` where `##` is exactly 2 digits (01-99).

## Emergency Deployments:

Use the manual dispatch feature of the main workflow:

1. Go to Actions → "Digital Persona Platform - Unified CI/CD (Optimized)"
2. Click "Run workflow"
3. Select options:
   - `force_deploy: true` - Force deployment even if tests fail
   - `skip_tests: true` - Skip test execution for emergency deployments

## Single Source of Truth:

The optimized workflow is completely self-sufficient and creates all necessary AWS infrastructure from scratch, including ECR repositories, S3 backend, and secrets. No manual setup required.
