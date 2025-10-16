#!/usr/bin/env pwsh
# Cleanup Old RDS Snapshots (PowerShell version)
# Deletes old manual snapshots from deleted clusters
# Expected Savings: ~$15/month

param(
    [Parameter(Mandatory=$false)]
    [switch]$Force = $false
)

Write-Host "🗑️  AWS RDS Snapshot Cleanup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Gray
Write-Host ""

# List of old manual snapshots to delete
$oldSnapshots = @(
    "dev01-dev01-dpp-cluster-final-snapshot",
    "dev-dev01-dpp-cluster-manual-backup-20250723-233658",
    "local-mars-dpp-cluster-final-snapshot"
)

Write-Host "📋 Old snapshots to delete:" -ForegroundColor Yellow
foreach ($snapshot in $oldSnapshots) {
    Write-Host "  - $snapshot" -ForegroundColor Gray
}
Write-Host ""

# Confirm deletion
if (-not $Force) {
    $confirm = Read-Host "⚠️  Are you sure you want to delete these snapshots? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "❌ Aborted. No snapshots were deleted." -ForegroundColor Red
        exit 0
    }
}

Write-Host ""
Write-Host "🔄 Deleting old snapshots..." -ForegroundColor Cyan
Write-Host ""

$deleted = 0
$failed = 0

foreach ($snapshot in $oldSnapshots) {
    Write-Host "Deleting $snapshot... " -NoNewline
    
    try {
        aws rds delete-db-cluster-snapshot `
            --db-cluster-snapshot-identifier $snapshot `
            --output json | Out-Null
        
        Write-Host "✅ Deleted" -ForegroundColor Green
        $deleted++
    }
    catch {
        Write-Host "❌ Failed or doesn't exist" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Gray
Write-Host "✅ Cleanup Complete!" -ForegroundColor Green
Write-Host "   Deleted: $deleted snapshots" -ForegroundColor White
Write-Host "   Failed: $failed snapshots" -ForegroundColor White
Write-Host "   Expected Savings: ~`$15/month" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Gray


