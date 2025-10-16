# AWS Cost Optimization Scripts

This directory contains all scripts for implementing AWS cost optimizations.

## Quick Start

### Run All Phase 1 Optimizations (~$60/month savings)

**Windows:**
```powershell
.\run-all-optimizations.ps1
```

**Linux/Mac:**
```bash
chmod +x *.sh
./run-all-optimizations.sh
```

## Available Scripts

### Phase 1: Quick Wins

| Script | Savings | Time | Description |
|--------|---------|------|-------------|
| `cleanup-old-snapshots` | ~$15/mo | 1 min | Delete 3 old RDS snapshots |
| `cleanup-unused-secrets` | ~$4/mo | 1 min | Delete 11 unused secrets |
| `reduce-backup-retention` | ~$40/mo | 1 min | Reduce dev backup to 3 days |
| **`run-all-optimizations`** | **~$60/mo** | **5 min** | **Runs all above scripts** |

### Phase 2: RDS Scheduler Setup

| Script | Purpose |
|--------|---------|
| `package-rds-scheduler-lambda` | Package Lambda function for Terraform deployment |

### Phase 3: Monitoring

| Script | Purpose |
|--------|---------|
| `cache-cost-explorer` | Get cost data with caching (saves API calls) |

## Script Formats

All scripts available in two formats:
- `.sh` - Bash (Linux/Mac)
- `.ps1` - PowerShell (Windows)

## Usage Examples

### Individual Scripts

```powershell
# Delete old snapshots
.\cleanup-old-snapshots.ps1

# Delete unused secrets
.\cleanup-unused-secrets.ps1

# Reduce backup retention
.\reduce-backup-retention.ps1

# Package Lambda
.\package-rds-scheduler-lambda.ps1

# Check costs (cached)
.\cache-cost-explorer.ps1
```

### Non-Interactive Mode

All scripts support force/yes flags:

```powershell
# Windows
.\run-all-optimizations.ps1 -Force

# Linux/Mac
./run-all-optimizations.sh
# Then type 'yes' when prompted
```

## Safety Features

- ✅ All scripts ask for confirmation (unless -Force)
- ✅ Detailed output showing what will be changed
- ✅ Error handling with clear messages
- ✅ No destructive actions without confirmation

## Documentation

- **Cost Analysis:** `../../AWS_COST_ANALYSIS_REPORT.md`
- **Implementation Guide:** `../../COST_OPTIMIZATION_IMPLEMENTATION_GUIDE.md`
- **RDS Scheduler:** `../../terraform/modules/rds-scheduler/README.md`
- **ECR Lifecycle:** `../../terraform/modules/ecr-lifecycle/README.md`

## Expected Savings

| Phase | Savings/Month | Time to Implement |
|-------|---------------|-------------------|
| Phase 1: Quick Wins | $60 | 5 minutes |
| Phase 2: RDS Scheduler | $165 | 30-60 minutes |
| Phase 3: Advanced | $20 | 60-90 minutes |
| **Total** | **$245-300** | **2-3 hours** |

## Prerequisites

- AWS CLI configured with appropriate credentials
- Permissions: RDS, Secrets Manager, Lambda, EventBridge
- PowerShell 5.1+ (Windows) or Bash (Linux/Mac)

## Troubleshooting

If scripts fail:

1. **Check AWS credentials:**
   ```bash
   aws sts get-caller-identity
   ```

2. **Check permissions:**
   ```bash
   # RDS
   aws rds describe-db-clusters --query "DBClusters[0].DBClusterIdentifier"
   
   # Secrets Manager
   aws secretsmanager list-secrets --max-results 1
   ```

3. **Run scripts individually** to isolate the issue

4. **Check script output** for specific error messages

## Support

For issues or questions, refer to:
- Implementation Guide: `../../COST_OPTIMIZATION_IMPLEMENTATION_GUIDE.md`
- AWS Documentation: https://docs.aws.amazon.com/

---

**Ready to start?** Run `run-all-optimizations` now! 🚀



