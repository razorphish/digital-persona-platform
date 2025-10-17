#!/usr/bin/env pwsh
# Cached Cost Explorer Script (PowerShell version)
# Reduces API calls to Cost Explorer by caching results locally
# Expected Savings: ~$5-8/month

param(
    [Parameter(Mandatory=$false)]
    [switch]$Refresh = $false
)

$cacheDir = Join-Path $env:USERPROFILE ".aws-cost-cache"
$cacheFile = Join-Path $cacheDir "cost-data.json"
$cacheMaxAgeHours = 24

Write-Host "📊 AWS Cost Explorer (Cached)" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Gray
Write-Host ""

# Create cache directory if it doesn't exist
if (-not (Test-Path $cacheDir)) {
    New-Item -ItemType Directory -Path $cacheDir -Force | Out-Null
}

# Function to check if cache is valid
function Test-CacheValid {
    if (-not (Test-Path $cacheFile)) {
        return $false
    }
    
    $cacheAge = (Get-Date) - (Get-Item $cacheFile).LastWriteTime
    $maxAge = New-TimeSpan -Hours $cacheMaxAgeHours
    
    return $cacheAge -lt $maxAge
}

# Function to fetch fresh data
function Get-FreshCostData {
    Write-Host "🔄 Fetching fresh cost data from AWS..." -ForegroundColor Yellow
    
    $endDate = (Get-Date).ToString("yyyy-MM-dd")
    $startDate = (Get-Date).AddDays(-30).ToString("yyyy-MM-dd")
    
    aws ce get-cost-and-usage `
        --time-period Start=$startDate,End=$endDate `
        --granularity MONTHLY `
        --metrics BlendedCost `
        --group-by Type=DIMENSION,Key=SERVICE `
        --output json | Out-File -FilePath $cacheFile -Encoding UTF8
    
    Write-Host "✅ Data cached successfully" -ForegroundColor Green
}

# Check if we should use cache
if ($Refresh) {
    Write-Host "🔄 Forcing refresh..." -ForegroundColor Yellow
    Get-FreshCostData
}
elseif (Test-CacheValid) {
    $cacheAge = [math]::Round(((Get-Date) - (Get-Item $cacheFile).LastWriteTime).TotalHours, 1)
    Write-Host "✅ Using cached data (age: $cacheAge hours old)" -ForegroundColor Green
}
else {
    Write-Host "⏰ Cache expired or missing" -ForegroundColor Yellow
    Get-FreshCostData
}

Write-Host ""
Write-Host "📈 Cost Summary (Last 30 Days)" -ForegroundColor Cyan
Write-Host "-------------------------------------" -ForegroundColor Gray

# Parse and display costs
$costData = Get-Content $cacheFile | ConvertFrom-Json
$services = $costData.ResultsByTime[0].Groups | 
    Where-Object { [decimal]$_.Metrics.BlendedCost.Amount -gt 0.01 } |
    ForEach-Object {
        [PSCustomObject]@{
            Service = $_.Keys[0]
            Cost = [decimal]$_.Metrics.BlendedCost.Amount
        }
    } |
    Sort-Object Cost -Descending |
    Select-Object -First 10

foreach ($service in $services) {
    Write-Host ("{0,-50} `${1,10:F2}" -f $service.Service, $service.Cost) -ForegroundColor White
}

# Calculate total
Write-Host "-------------------------------------" -ForegroundColor Gray
$total = ($costData.ResultsByTime[0].Groups | 
    ForEach-Object { [decimal]$_.Metrics.BlendedCost.Amount } |
    Measure-Object -Sum).Sum
Write-Host ("TOTAL: `${0:F2}" -f $total) -ForegroundColor Green

Write-Host ""
Write-Host "=====================================" -ForegroundColor Gray
Write-Host "💾 Cache Info:" -ForegroundColor Cyan
Write-Host "  Location: $cacheFile" -ForegroundColor White
Write-Host "  Max Age: ${cacheMaxAgeHours}h" -ForegroundColor White

if (Test-Path $cacheFile) {
    $nextRefresh = (Get-Item $cacheFile).LastWriteTime.AddHours($cacheMaxAgeHours)
    Write-Host "  Next Refresh: $($nextRefresh.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor White
}

Write-Host ""
Write-Host "Force refresh: $($MyInvocation.MyCommand.Name) -Refresh" -ForegroundColor Gray
Write-Host "=====================================" -ForegroundColor Gray




