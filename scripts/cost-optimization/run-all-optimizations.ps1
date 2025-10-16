#!/usr/bin/env pwsh
# Master AWS Cost Optimization Script (PowerShell version)
# Runs all Phase 1 optimizations for immediate savings
# Expected Total Savings: ~$60-225/month

param(
    [Parameter(Mandatory=$false)]
    [switch]$Force = $false
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "=========================================" -ForegroundColor Green
Write-Host "AWS Cost Optimization Suite" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "This script will run all Phase 1 optimizations:" -ForegroundColor White
Write-Host ""
Write-Host "  1. Delete old RDS snapshots        → Save ~`$15/month" -ForegroundColor Gray
Write-Host "  2. Delete unused secrets           → Save ~`$4.40/month" -ForegroundColor Gray
Write-Host "  3. Reduce backup retention         → Save ~`$40/month" -ForegroundColor Gray
Write-Host ""
Write-Host "Total Quick Wins: ~`$60/month (47% reduction)" -ForegroundColor Green
Write-Host ""
Write-Host "Phase 2 (RDS Scheduling) is available separately" -ForegroundColor Yellow
Write-Host "and can save an additional ~`$165/month." -ForegroundColor Yellow
Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Confirm execution
if (-not $Force) {
    $confirm = Read-Host "⚠️  Proceed with Phase 1 optimizations? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "❌ Aborted. No changes were made." -ForegroundColor Red
        exit 0
    }
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Phase 1: Quick Wins" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

# Track results
$totalSavings = 0
$successful = 0
$failed = 0

# Step 1: Delete old RDS snapshots
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Step 1/3: Delete Old RDS Snapshots" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

try {
    & "$scriptDir\cleanup-old-snapshots.ps1" -Force
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Snapshot cleanup completed" -ForegroundColor Green
        $totalSavings += 15
        $successful++
    }
    else {
        throw "Script returned error code $LASTEXITCODE"
    }
}
catch {
    Write-Host "❌ Snapshot cleanup failed: $_" -ForegroundColor Red
    $failed++
}

Write-Host ""
Start-Sleep -Seconds 2

# Step 2: Delete unused secrets
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Step 2/3: Delete Unused Secrets" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

try {
    & "$scriptDir\cleanup-unused-secrets.ps1" -Force
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Secrets cleanup completed" -ForegroundColor Green
        $totalSavings += 4
        $successful++
    }
    else {
        throw "Script returned error code $LASTEXITCODE"
    }
}
catch {
    Write-Host "❌ Secrets cleanup failed: $_" -ForegroundColor Red
    $failed++
}

Write-Host ""
Start-Sleep -Seconds 2

# Step 3: Reduce backup retention
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "Step 3/3: Reduce Backup Retention" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

try {
    & "$scriptDir\reduce-backup-retention.ps1" -Force
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Backup retention updated" -ForegroundColor Green
        $totalSavings += 40
        $successful++
    }
    else {
        throw "Script returned error code $LASTEXITCODE"
    }
}
catch {
    Write-Host "❌ Backup retention update failed: $_" -ForegroundColor Red
    $failed++
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "Phase 1 Complete!" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Results:" -ForegroundColor White
Write-Host "  [OK] Successful: $successful/3" -ForegroundColor Green
Write-Host "  [FAIL] Failed: $failed/3" -ForegroundColor Red
Write-Host "  [SAVE] Est. Monthly Savings: `$$totalSavings" -ForegroundColor Yellow
Write-Host "  [ANNUAL] Est. Annual Savings: `$$($totalSavings * 12)" -ForegroundColor Yellow
Write-Host ""

if ($successful -eq 3) {
    Write-Host "[SUCCESS] All optimizations completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Phase 2: RDS Scheduler (~`$165/month savings)" -ForegroundColor Yellow
    Write-Host "  1. Package Lambda: .\scripts\cost-optimization\package-rds-scheduler-lambda.ps1" -ForegroundColor Gray
    Write-Host "  2. Deploy Terraform: cd terraform\environments\dev; terraform apply" -ForegroundColor Gray
    Write-Host "  3. Verify schedule: aws events list-rules --name-prefix dev-" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Phase 3: Advanced Optimizations (~`$20/month savings)" -ForegroundColor Yellow
    Write-Host "  - Apply ECR lifecycle policies" -ForegroundColor Gray
    Write-Host "  - Update RDS Terraform configuration" -ForegroundColor Gray
    Write-Host "  - Enable Cost Explorer caching" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Monitor savings:" -ForegroundColor Cyan
    Write-Host "  .\scripts\cost-optimization\cache-cost-explorer.ps1" -ForegroundColor Gray
}
elseif ($successful -gt 0) {
    Write-Host "[WARNING] Some optimizations completed with errors" -ForegroundColor Yellow
    Write-Host "   Review the output above for details" -ForegroundColor Gray
    Write-Host ""
    Write-Host "You can re-run failed steps individually:" -ForegroundColor Cyan
    Write-Host "  .\scripts\cost-optimization\cleanup-old-snapshots.ps1" -ForegroundColor Gray
    Write-Host "  .\scripts\cost-optimization\cleanup-unused-secrets.ps1" -ForegroundColor Gray
    Write-Host "  .\scripts\cost-optimization\reduce-backup-retention.ps1" -ForegroundColor Gray
}
else {
    Write-Host "[FAIL] All optimizations failed" -ForegroundColor Red
    Write-Host "   Please review errors and retry" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green

