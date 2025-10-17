# RDS Scheduler vs Terraform Deployment Conflict - SOLVED

## The Problem We Discovered

Your **manual RDS scheduler is working perfectly** 🎉 - it's stopping the database at night to save costs. However, this creates a conflict with Terraform deployments:

```
Timeline:
├─ 6:00 PM PST (2 AM UTC): RDS scheduler STOPS database
├─ 8:52 PM PST (4:01 AM UTC): Deployment tries to run
├─ AWS: "Cannot modify stopped cluster"
└─ Deployment: FAILS ❌
```

## Error You'll See

```
Error: updating RDS Cluster (dev-dev01-dpp-cluster): 
InvalidDBClusterStateFault: Db cluster dev-dev01-dpp-cluster 
cannot be in the stopped state.
```

## Solution Implemented ✅

Added **intelligent error detection** to the workflow that now displays:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  RDS CLUSTER IS STOPPED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 Issue: Your RDS cluster is in 'stopped' state.
   Terraform cannot modify a stopped cluster.

💡 This is likely caused by:
   • RDS scheduler stopped the database (cost optimization)
   • Manual stop via AWS console

🔧 To fix this:
   1. Start the RDS cluster:
      aws rds start-db-cluster --db-cluster-identifier dev-dev01-dpp-cluster

   2. Wait for cluster to be available (~5-10 minutes):
      aws rds wait db-cluster-available --db-cluster-identifier dev-dev01-dpp-cluster

   3. Re-run this deployment

⏰ Alternative: Schedule deployments during RDS 'running' hours
   (8 AM - 6 PM PST if using RDS scheduler)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## How to Fix (When It Happens)

### Quick Fix - Start the Database

```bash
# 1. Start the cluster
aws rds start-db-cluster --db-cluster-identifier dev-dev01-dpp-cluster

# 2. Wait for it to be available (~5-10 minutes)
aws rds wait db-cluster-available --db-cluster-identifier dev-dev01-dpp-cluster

# 3. Re-run the deployment (GitHub Actions will auto-retry or manually trigger)
```

### Using the Manual Control Script

```bash
# Easy way using the script we created
./scripts/rds-manual-control/start-dev-rds.sh
```

## Long-term Solutions

### Option 1: Schedule Deployments During "RDS Running" Hours ⏰

**Current RDS Schedule:**
- **Start**: 8 AM PST (3 PM UTC) Mon-Fri
- **Stop**: 6 PM PST (2 AM UTC next day) Mon-Fri
- **Running Hours**: 8 AM - 6 PM PST weekdays
- **Stopped**: Nights and weekends

**Recommendation:** Run deployments between 8 AM - 5 PM PST weekdays

### Option 2: Pause Scheduler During Deployments 🔧

```bash
# Before deployment
aws events disable-rule --name dev-rds-scheduler-start
aws events disable-rule --name dev-rds-scheduler-stop

# Start database
aws rds start-db-cluster --db-cluster-identifier dev-dev01-dpp-cluster

# Run deployment...

# After deployment (re-enable scheduler)
aws events enable-rule --name dev-rds-scheduler-start
aws events enable-rule --name dev-rds-scheduler-stop
```

### Option 3: Add Auto-Start to Workflow (Future Enhancement) 🚀

Could add a pre-deployment step that automatically:
1. Checks if RDS is stopped
2. Starts it if needed
3. Waits for it to be available
4. Proceeds with deployment

**Pros:** Fully automated
**Cons:** Adds 5-10 minutes to every deployment

## Current RDS Scheduler Status

✅ **Active and Working**
- Lambda Function: `dev-rds-scheduler`
- Start Rule: `dev-rds-scheduler-start`
- Stop Rule: `dev-rds-scheduler-stop`
- Cost Savings: ~50-70% on RDS costs 💰

## What Changed

**Commit:** `702a7b5`
**File:** `.github/workflows/deploy-serverless.yml`

**Changes:**
1. Captures `terraform apply` output
2. Detects `InvalidDBClusterStateFault` errors
3. Displays helpful instructions
4. Skips retries (since they won't help with stopped DB)

## Testing the New Error Message

To see the new helpful error message, try deploying when the RDS cluster is stopped (evenings/weekends).

## Quick Reference

### Check RDS Status
```bash
aws rds describe-db-clusters \
  --db-cluster-identifier dev-dev01-dpp-cluster \
  --query 'DBClusters[0].Status' \
  --output text
```

### Start RDS
```bash
aws rds start-db-cluster --db-cluster-identifier dev-dev01-dpp-cluster
```

### Stop RDS
```bash
aws rds stop-db-cluster --db-cluster-identifier dev-dev01-dpp-cluster
```

### Check Scheduler Status
```bash
# Check EventBridge rules
aws events list-rules --name-prefix dev-rds-scheduler

# Check Lambda function
aws lambda get-function --function-name dev-rds-scheduler
```

## Summary

✅ **Problem**: RDS scheduler stops DB, blocking Terraform deployments
✅ **Solution**: Added helpful error message with clear instructions
✅ **Best Practice**: Deploy during RDS running hours (8 AM - 6 PM PST weekdays)
✅ **Manual Fix**: Start database before deployment when needed

The error message will now guide you whenever this happens!

---
**Date**: 2025-10-17  
**Status**: Error detection implemented ✅  
**Cost Savings**: Still active 💰

