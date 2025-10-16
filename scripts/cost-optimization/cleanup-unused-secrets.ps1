#!/usr/bin/env pwsh
# Cleanup Unused Secrets Manager Secrets (PowerShell version)
# Deletes legacy and duplicate secrets
# Expected Savings: ~$4.40/month

param(
    [Parameter(Mandatory=$false)]
    [switch]$Force = $false
)

Write-Host "🔐 AWS Secrets Manager Cleanup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Gray
Write-Host ""

# List of unused/legacy secrets to delete
$unusedSecrets = @(
    "hibiji-database-password",
    "hibiji-secret-key",
    "hibiji/dev01/database/password",
    "hibiji/dev01/app/secret-key",
    "dev01-dev01-dpp-jwt-secret",
    "dev01-dev01-dpp-database-password",
    "hibiji-dev01-secret-key-b7645c49",
    "hibiji-dev01-db-password-b4d122c0",
    "hibiji-qa03-db-password-1d7ca98f",
    "local-mars-dpp-jwt-secret",
    "local-mars-dpp-database-password"
)

Write-Host "📋 Unused secrets to delete (11 total):" -ForegroundColor Yellow
foreach ($secret in $unusedSecrets) {
    Write-Host "  - $secret" -ForegroundColor Gray
}
Write-Host ""

Write-Host "✅ Active secrets to KEEP:" -ForegroundColor Green
Write-Host "  - dev-dev01-dpp-jwt-secret" -ForegroundColor White
Write-Host "  - dev-dev01-dpp-database-password" -ForegroundColor White
Write-Host "  - prod-prod-dpp-jwt-secret" -ForegroundColor White
Write-Host "  - prod-prod-dpp-database-password" -ForegroundColor White
Write-Host ""

# Confirm deletion
if (-not $Force) {
    $confirm = Read-Host "⚠️  Are you sure you want to delete these secrets? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "❌ Aborted. No secrets were deleted." -ForegroundColor Red
        exit 0
    }
}

Write-Host ""
Write-Host "🔄 Deleting unused secrets..." -ForegroundColor Cyan
Write-Host ""

$deleted = 0
$failed = 0

foreach ($secret in $unusedSecrets) {
    Write-Host "Deleting $secret... " -NoNewline
    
    try {
        aws secretsmanager delete-secret `
            --secret-id $secret `
            --force-delete-without-recovery `
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
Write-Host "   Deleted: $deleted secrets" -ForegroundColor White
Write-Host "   Failed: $failed secrets" -ForegroundColor White
Write-Host "   Expected Savings: ~`$4.40/month" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Gray


