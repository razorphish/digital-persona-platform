#!/usr/bin/env pwsh
# Package RDS Scheduler Lambda Function (PowerShell version)
# Creates lambda.zip for Terraform deployment

Write-Host "📦 Packaging RDS Scheduler Lambda" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Gray
Write-Host ""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$moduleDir = Join-Path $scriptDir "..\..\terraform\modules\rds-scheduler"

Set-Location $moduleDir

Write-Host "📁 Working directory: $moduleDir" -ForegroundColor Gray
Write-Host ""

# Remove old package if exists
$zipFile = "lambda.zip"
if (Test-Path $zipFile) {
    Write-Host "🗑️  Removing old lambda.zip..." -ForegroundColor Yellow
    Remove-Item $zipFile -Force
}

# Create new package
Write-Host "📦 Creating lambda.zip..." -ForegroundColor Cyan

try {
    Compress-Archive -Path "lambda.py" -DestinationPath $zipFile -Force
    
    Write-Host "✅ Package created successfully!" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "📊 Package details:" -ForegroundColor Yellow
    Get-Item $zipFile | Format-Table Name, Length, LastWriteTime
    Write-Host ""
    
    Write-Host "📋 Package contents:" -ForegroundColor Yellow
    Add-Type -Assembly System.IO.Compression.FileSystem
    $zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path $zipFile))
    $zip.Entries | Format-Table FullName, Length, LastWriteTime
    $zip.Dispose()
}
catch {
    Write-Host "❌ Failed to create package" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Gray
Write-Host "✅ Lambda function packaged!" -ForegroundColor Green
Write-Host "   Location: terraform/modules/rds-scheduler/lambda.zip" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Review terraform/modules/rds-scheduler/main.tf" -ForegroundColor Gray
Write-Host "  2. Add module to your environment config" -ForegroundColor Gray
Write-Host "  3. Run: terraform init && terraform apply" -ForegroundColor Gray
Write-Host "=====================================" -ForegroundColor Gray







