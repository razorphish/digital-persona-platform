#!/usr/bin/env pwsh
#
# Check Dev RDS Cluster Status
#
# Usage: .\status-dev-rds.ps1
#

$ErrorActionPreference = "Stop"

$CLUSTER_ID = "dev-dev01-dpp-cluster"
$REGION = "us-west-1"

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "Dev RDS Cluster Status" -ForegroundColor White
Write-Host "=========================================`n" -ForegroundColor Cyan

try {
    $result = aws rds describe-db-clusters `
        --db-cluster-identifier $CLUSTER_ID `
        --region $REGION `
        --query "DBClusters[0].[Status,Endpoint,ReaderEndpoint,BackupRetentionPeriod,ServerlessV2ScalingConfiguration.MinCapacity,ServerlessV2ScalingConfiguration.MaxCapacity]" `
        --output text

    $parts = $result -split "`t"
    $status = $parts[0]
    $endpoint = $parts[1]
    $readerEndpoint = $parts[2]
    $backupRetention = $parts[3]
    $minCapacity = $parts[4]
    $maxCapacity = $parts[5]

    Write-Host "Cluster:          $CLUSTER_ID" -ForegroundColor White
    Write-Host "Region:           $REGION" -ForegroundColor White
    
    # Status with color
    $statusColor = switch ($status) {
        "available" { "Green" }
        "stopped" { "Yellow" }
        "starting" { "Cyan" }
        "stopping" { "Cyan" }
        default { "Red" }
    }
    Write-Host "Status:           $status" -ForegroundColor $statusColor
    
    Write-Host "Endpoint:         $endpoint" -ForegroundColor Gray
    Write-Host "Reader Endpoint:  $readerEndpoint" -ForegroundColor Gray
    Write-Host "Backup Retention: $backupRetention days" -ForegroundColor White
    Write-Host "Min Capacity:     $minCapacity ACUs" -ForegroundColor White
    Write-Host "Max Capacity:     $maxCapacity ACUs" -ForegroundColor White

    Write-Host "`n=========================================" -ForegroundColor Cyan
    
    if ($status -eq "available") {
        Write-Host "Cluster is RUNNING" -ForegroundColor Green
        Write-Host "Remember to stop it after hours to save money!" -ForegroundColor Yellow
        Write-Host "Run: .\stop-dev-rds.ps1" -ForegroundColor Gray
    } elseif ($status -eq "stopped") {
        Write-Host "Cluster is STOPPED" -ForegroundColor Yellow
        Write-Host "Start it when needed with:" -ForegroundColor White
        Write-Host "Run: .\start-dev-rds.ps1" -ForegroundColor Gray
    } else {
        Write-Host "Cluster is in transition state: $status" -ForegroundColor Cyan
        Write-Host "Wait a few minutes and check again" -ForegroundColor Gray
    }
    
    Write-Host "=========================================`n" -ForegroundColor Cyan

} catch {
    Write-Host "[ERROR] Failed to get cluster status" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "`nMake sure you have AWS CLI configured and proper permissions.`n" -ForegroundColor Yellow
    exit 1
}

