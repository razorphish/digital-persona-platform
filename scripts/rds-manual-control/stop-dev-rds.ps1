#!/usr/bin/env pwsh
#
# Stop Dev RDS Cluster - Manual Cost Control
# Saves ~$165/month when stopped after hours
#
# Usage: .\stop-dev-rds.ps1
#

$ErrorActionPreference = "Stop"

$CLUSTER_ID = "dev-dev01-dpp-cluster"
$REGION = "us-west-1"

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "Stopping Dev RDS Cluster" -ForegroundColor White
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Cluster: $CLUSTER_ID" -ForegroundColor Gray
Write-Host "Region:  $REGION`n" -ForegroundColor Gray

# Check current status
Write-Host "Checking current status..." -ForegroundColor Yellow
try {
    $status = aws rds describe-db-clusters `
        --db-cluster-identifier $CLUSTER_ID `
        --region $REGION `
        --query "DBClusters[0].Status" `
        --output text

    Write-Host "Current status: $status`n" -ForegroundColor White

    if ($status -eq "stopped") {
        Write-Host "[SKIP] Cluster is already stopped!" -ForegroundColor Green
        Write-Host "`nNo action needed. Have a great evening! `n" -ForegroundColor Cyan
        exit 0
    }

    if ($status -eq "stopping") {
        Write-Host "[WAIT] Cluster is already stopping..." -ForegroundColor Yellow
        Write-Host "`nWait a few minutes for it to complete. `n" -ForegroundColor Cyan
        exit 0
    }

    if ($status -ne "available") {
        Write-Host "[ERROR] Cluster is in '$status' state" -ForegroundColor Red
        Write-Host "Can only stop clusters that are 'available'`n" -ForegroundColor Yellow
        exit 1
    }

    # Stop the cluster
    Write-Host "Stopping cluster..." -ForegroundColor Yellow
    aws rds stop-db-cluster `
        --db-cluster-identifier $CLUSTER_ID `
        --region $REGION `
        --output json | Out-Null

    Write-Host "`n[SUCCESS] Stop command sent!" -ForegroundColor Green
    Write-Host "`nCluster will be fully stopped in 2-5 minutes." -ForegroundColor Cyan
    Write-Host "Estimated savings: `$165/month when stopped after hours`n" -ForegroundColor Green

    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "To start it again tomorrow, run:" -ForegroundColor White
    Write-Host "  .\start-dev-rds.ps1" -ForegroundColor Yellow
    Write-Host "=========================================`n" -ForegroundColor Cyan

} catch {
    Write-Host "`n[ERROR] Failed to stop cluster" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`nMake sure you have AWS CLI configured and proper permissions.`n" -ForegroundColor Yellow
    exit 1
}




