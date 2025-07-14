# GitHub Workflows

This directory contains GitHub Actions workflows for the Digital Persona Platform.

## Workflows:

- `ci.yml` - Continuous Integration (runs tests, builds artifacts)
- `deploy.yml` - Deployment workflow (deploys to AWS environments)
- `emergency-deploy.yml` - Emergency deployment workflow
- `cleanup-subenv.yml` - Cleanup sub-environments
- `cost-monitor.yml` - Cost monitoring workflow

## Environment Naming Convention:

All workflows enforce strict environment naming: `dev##`, `qa##`, `staging##`, `hotfix##` where `##` is exactly 2 digits (01-99).

# Force new CI run: Sat Jul 11 14:28:42 PDT 2025
