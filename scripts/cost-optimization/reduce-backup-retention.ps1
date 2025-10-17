#!/usr/bin/env pwsh
# Reduce RDS Backup Retention (PowerShell version)
# Changes dev cluster backup retention from 7 days to 3 days
# Expected Savings: ~$40/month

param(
    [Parameter(Mandatory=$false)]
    [switch]$Force = $false
)

Write-Host "💾 AWS RDS Backup Retention Optimization" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Gray
Write-Host ""

$devCluster = "dev-dev01-dpp-cluster"
$prodCluster = "prod-prod-dpp-cluster"

Write-Host "📊 Current Configuration:" -ForegroundColor Yellow
Write-Host "  Dev Cluster: $devCluster" -ForegroundColor White
Write-Host "    Current Retention: 7 days" -ForegroundColor Gray
Write-Host "    New Retention: 3 days" -ForegroundColor Green
Write-Host ""
Write-Host "  Prod Cluster: $prodCluster" -ForegroundColor White
Write-Host "    Current Retention: 7 days" -ForegroundColor Gray
Write-Host "    New Retention: 7 days (unchanged - recommended for prod)" -ForegroundColor Gray
Write-Host ""

# Confirm changes
if (-not $Force) {
    $confirm = Read-Host "⚠️  Proceed with reducing dev backup retention? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "❌ Aborted. No changes were made." -ForegroundColor Red
        exit 0
    }
}

Write-Host ""
Write-Host "🔄 Updating dev cluster backup retention..." -ForegroundColor Cyan
Write-Host ""

# Update dev cluster
Write-Host "Updating $devCluster... " -NoNewline

try {
    aws rds modify-db-cluster `
        --db-cluster-identifier $devCluster `
        --backup-retention-period 3 `
        --apply-immediately `
        --output json | Out-Null
    
    Write-Host "✅ Updated" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Gray
Write-Host "✅ Backup Retention Updated!" -ForegroundColor Green
Write-Host "   Dev retention: 7 days → 3 days" -ForegroundColor White
Write-Host "   Expected Savings: ~`$40/month" -ForegroundColor Green
Write-Host ""
Write-Host "Note: Old snapshots beyond 3 days will be" -ForegroundColor Yellow
Write-Host "automatically deleted within 24 hours." -ForegroundColor Yellow
Write-Host "=====================================" -ForegroundColor Gray




