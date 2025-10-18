#!/usr/bin/env pwsh
#
# Start Dev RDS Cluster - Manual Cost Control
#
# Usage: .\start-dev-rds.ps1
#

$ErrorActionPreference = "Stop"

$CLUSTER_ID = "dev-dev01-dpp-cluster"
$REGION = "us-west-1"

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "Starting Dev RDS Cluster" -ForegroundColor White
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

    if ($status -eq "available") {
        Write-Host "[OK] Cluster is already running!" -ForegroundColor Green
        Write-Host "`nReady to use. Good morning! `n" -ForegroundColor Cyan
        exit 0
    }

    if ($status -eq "starting") {
        Write-Host "[WAIT] Cluster is already starting..." -ForegroundColor Yellow
        Write-Host "`nWait a few minutes for it to complete. `n" -ForegroundColor Cyan
        exit 0
    }

    if ($status -ne "stopped") {
        Write-Host "[ERROR] Cluster is in '$status' state" -ForegroundColor Red
        Write-Host "Can only start clusters that are 'stopped'`n" -ForegroundColor Yellow
        exit 1
    }

    # Start the cluster
    Write-Host "Starting cluster..." -ForegroundColor Yellow
    aws rds start-db-cluster `
        --db-cluster-identifier $CLUSTER_ID `
        --region $REGION `
        --output json | Out-Null

    Write-Host "`n[SUCCESS] Start command sent!" -ForegroundColor Green
    Write-Host "`nCluster will be fully available in 2-5 minutes." -ForegroundColor Cyan
    Write-Host "You can check status with: aws rds describe-db-clusters --db-cluster-identifier $CLUSTER_ID`n" -ForegroundColor Gray

    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "To stop it tonight, run:" -ForegroundColor White
    Write-Host "  .\stop-dev-rds.ps1" -ForegroundColor Yellow
    Write-Host "=========================================`n" -ForegroundColor Cyan

} catch {
    Write-Host "`n[ERROR] Failed to start cluster" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`nMake sure you have AWS CLI configured and proper permissions.`n" -ForegroundColor Yellow
    exit 1
}







