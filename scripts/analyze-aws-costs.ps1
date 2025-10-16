#!/usr/bin/env pwsh
# AWS Cost Analysis Script
# Analyzes AWS costs by service to identify optimization opportunities

param(
    [Parameter(Mandatory=$false)]
    [string]$Environment = "dev",
    
    [Parameter(Mandatory=$false)]
    [int]$Days = 30,
    
    [Parameter(Mandatory=$false)]
    [string]$OutputFile = "aws-cost-analysis.json"
)

Write-Host "🔍 AWS Cost Analysis" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Gray
Write-Host "Period: Last $Days days" -ForegroundColor Gray
Write-Host ""

# Get date range
$endDate = (Get-Date).ToString("yyyy-MM-dd")
$startDate = (Get-Date).AddDays(-$Days).ToString("yyyy-MM-dd")

Write-Host "📅 Analyzing costs from $startDate to $endDate..." -ForegroundColor Yellow
Write-Host ""

# Function to format currency
function Format-Cost {
    param([decimal]$amount)
    return "{0:C2}" -f $amount
}

# 1. Get cost by service
Write-Host "💰 Getting costs by service..." -ForegroundColor Cyan
$costByService = aws ce get-cost-and-usage `
    --time-period Start=$startDate,End=$endDate `
    --granularity MONTHLY `
    --metrics BlendedCost `
    --group-by Type=DIMENSION,Key=SERVICE `
    --output json | ConvertFrom-Json

# 2. Get cost by resource (tagged with environment)
Write-Host "🏷️  Getting costs by tagged resources..." -ForegroundColor Cyan
$costByTag = aws ce get-cost-and-usage `
    --time-period Start=$startDate,End=$endDate `
    --granularity MONTHLY `
    --metrics BlendedCost `
    --group-by Type=TAG,Key=Environment `
    --output json | ConvertFrom-Json

# 3. Get daily cost trend
Write-Host "📊 Getting daily cost trend..." -ForegroundColor Cyan
$dailyCosts = aws ce get-cost-and-usage `
    --time-period Start=$startDate,End=$endDate `
    --granularity DAILY `
    --metrics BlendedCost `
    --output json | ConvertFrom-Json

# 4. Get forecasted costs
Write-Host "🔮 Getting cost forecast..." -ForegroundColor Cyan
$forecast = aws ce get-cost-forecast `
    --time-period Start=$endDate,End=$((Get-Date).AddDays(30).ToString("yyyy-MM-dd")) `
    --metric BLENDED_COST `
    --granularity MONTHLY `
    --output json | ConvertFrom-Json

# Parse and display results
Write-Host ""
Write-Host "=" * 80 -ForegroundColor Green
Write-Host "📈 COST ANALYSIS RESULTS" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Green
Write-Host ""

# Total cost
$totalCost = [decimal]($costByService.ResultsByTime[0].Total.BlendedCost.Amount)
Write-Host "💵 TOTAL COST (Last $Days days): $(Format-Cost $totalCost)" -ForegroundColor Yellow
Write-Host ""

# Cost by service (top 10)
Write-Host "🔝 TOP 10 SERVICES BY COST:" -ForegroundColor Cyan
Write-Host "-" * 80
$services = $costByService.ResultsByTime[0].Groups | 
    ForEach-Object { 
        [PSCustomObject]@{
            Service = $_.Keys[0]
            Cost = [decimal]$_.Metrics.BlendedCost.Amount
        }
    } | 
    Sort-Object Cost -Descending | 
    Select-Object -First 10

$rank = 1
foreach ($service in $services) {
    $percentage = ($service.Cost / $totalCost) * 100
    $bar = "█" * [Math]::Floor($percentage)
    Write-Host ("{0,2}. {1,-40} {2,10} ({3,5:F1}%) {4}" -f $rank, $service.Service, (Format-Cost $service.Cost), $percentage, $bar) -ForegroundColor White
    $rank++
}
Write-Host ""

# Daily average
$avgDailyCost = $totalCost / $Days
Write-Host "📅 DAILY AVERAGE: $(Format-Cost $avgDailyCost)" -ForegroundColor Cyan
Write-Host ""

# Forecasted cost
$forecastedCost = [decimal]($forecast.Total.Amount)
Write-Host "🔮 FORECASTED NEXT 30 DAYS: $(Format-Cost $forecastedCost)" -ForegroundColor Magenta
Write-Host ""

# Cost optimization recommendations
Write-Host "=" * 80 -ForegroundColor Green
Write-Host "💡 COST OPTIMIZATION RECOMMENDATIONS" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Green
Write-Host ""

$recommendations = @()

foreach ($service in $services) {
    $serviceName = $service.Service
    $cost = $service.Cost
    
    switch -Wildcard ($serviceName) {
        "*RDS*" {
            if ($cost -gt 50) {
                $recommendations += [PSCustomObject]@{
                    Priority = "HIGH"
                    Service = $serviceName
                    Issue = "High RDS costs detected"
                    Recommendation = "Review Aurora capacity, RDS Proxy usage, pause/resume settings, backup retention, and unused snapshots"
                    PotentialSavings = "30-50%"
                }
            }
        }
        "*Lambda*" {
            if ($cost -gt 20) {
                $recommendations += [PSCustomObject]@{
                    Priority = "MEDIUM"
                    Service = $serviceName
                    Issue = "Lambda costs higher than expected"
                    Recommendation = "Review Lambda memory size, execution times, cold starts, provisioned concurrency, and consider Lambda@Edge"
                    PotentialSavings = "20-40%"
                }
            }
        }
        "*CloudFront*" {
            if ($cost -gt 30) {
                $recommendations += [PSCustomObject]@{
                    Priority = "MEDIUM"
                    Service = $serviceName
                    Issue = "High CloudFront costs"
                    Recommendation = "Review data transfer volumes, optimize assets, increase cache TTL, consider S3 Transfer Acceleration, review price class"
                    PotentialSavings = "15-30%"
                }
            }
        }
        "*S3*" {
            if ($cost -gt 10) {
                $recommendations += [PSCustomObject]@{
                    Priority = "LOW"
                    Service = $serviceName
                    Issue = "S3 storage costs detected"
                    Recommendation = "Review S3 lifecycle policies, delete unused objects, enable Intelligent-Tiering, compress objects, clean up multipart uploads"
                    PotentialSavings = "20-40%"
                }
            }
        }
        "*Batch*" {
            if ($cost -gt 15) {
                $recommendations += [PSCustomObject]@{
                    Priority = "MEDIUM"
                    Service = $serviceName
                    Issue = "AWS Batch costs detected"
                    Recommendation = "Ensure min_vcpus=0, use Spot instances, review job requirements, consider Fargate, check if Batch needed in dev"
                    PotentialSavings = "40-60%"
                }
            }
        }
        "*EC2*" {
            if ($cost -gt 10) {
                $recommendations += [PSCustomObject]@{
                    Priority = "HIGH"
                    Service = $serviceName
                    Issue = "EC2 costs detected (should be serverless)"
                    Recommendation = "Check for unused EC2 instances, review Batch compute, ensure auto-scaling works, consider Lambda, stop dev instances"
                    PotentialSavings = "50-80%"
                }
            }
        }
        "*NAT*" {
            if ($cost -gt 10) {
                $recommendations += [PSCustomObject]@{
                    Priority = "MEDIUM"
                    Service = $serviceName
                    Issue = "NAT Gateway costs"
                    Recommendation = "Consider VPC endpoints, review NAT Gateway necessity, use single NAT for dev, route local traffic directly"
                    PotentialSavings = "40-70%"
                }
            }
        }
        "*CloudWatch*" {
            if ($cost -gt 5) {
                $recommendations += [PSCustomObject]@{
                    Priority = "LOW"
                    Service = $serviceName
                    Issue = "CloudWatch costs"
                    Recommendation = "Review log retention, delete unused log groups, use Log Insights, reduce custom metrics, archive old logs to S3"
                    PotentialSavings = "30-50%"
                }
            }
        }
    }
}

if ($recommendations.Count -gt 0) {
    $recommendations = $recommendations | Sort-Object @{Expression={
        switch ($_.Priority) {
            "HIGH" { 1 }
            "MEDIUM" { 2 }
            "LOW" { 3 }
        }
    }}
    
    foreach ($rec in $recommendations) {
        $color = switch ($rec.Priority) {
            "HIGH" { "Red" }
            "MEDIUM" { "Yellow" }
            "LOW" { "Cyan" }
        }
        
        Write-Host "[$($rec.Priority)] $($rec.Service)" -ForegroundColor $color
        Write-Host "Issue: $($rec.Issue)" -ForegroundColor Gray
        Write-Host "Potential Savings: $($rec.PotentialSavings)" -ForegroundColor Green
        Write-Host "Recommendations:" -ForegroundColor White
        Write-Host $rec.Recommendation -ForegroundColor Gray
        Write-Host ""
    }
} else {
    Write-Host "✅ No high-cost services detected. Your costs are well optimized!" -ForegroundColor Green
    Write-Host ""
}

# Save detailed report to JSON
$report = @{
    analysis_date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    period = @{
        start = $startDate
        end = $endDate
        days = $Days
    }
    total_cost = $totalCost
    daily_average = $avgDailyCost
    forecasted_next_30_days = $forecastedCost
    services = $services
    recommendations = $recommendations
    daily_costs = $dailyCosts.ResultsByTime | ForEach-Object {
        [PSCustomObject]@{
            Date = $_.TimePeriod.Start
            Cost = [decimal]$_.Total.BlendedCost.Amount
        }
    }
}

$report | ConvertTo-Json -Depth 10 | Out-File -FilePath $OutputFile -Encoding UTF8

Write-Host "=" * 80 -ForegroundColor Green
Write-Host "💾 Detailed report saved to: $OutputFile" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Green
Write-Host ""

# Quick resource inventory
Write-Host "📦 QUICK RESOURCE INVENTORY:" -ForegroundColor Cyan
Write-Host "-" * 80

# Count Lambda functions
$lambdaCount = (aws lambda list-functions --query "Functions[].FunctionName" --output json | ConvertFrom-Json).Count
Write-Host "Lambda Functions: $lambdaCount" -ForegroundColor White

# Count RDS instances
$rdsCount = (aws rds describe-db-clusters --query "DBClusters[].DBClusterIdentifier" --output json | ConvertFrom-Json).Count
Write-Host "RDS Clusters: $rdsCount" -ForegroundColor White

# Count S3 buckets
$s3Count = (aws s3 ls | Measure-Object).Count
Write-Host "S3 Buckets: $s3Count" -ForegroundColor White

# Count CloudFront distributions
$cfCount = (aws cloudfront list-distributions --query "DistributionList.Items[].Id" --output json | ConvertFrom-Json).Count
Write-Host "CloudFront Distributions: $cfCount" -ForegroundColor White

Write-Host ""
Write-Host "✅ Cost analysis complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review the recommendations above" -ForegroundColor Gray
Write-Host "2. Run: .\scripts\optimize-resources.ps1 to apply optimizations" -ForegroundColor Gray
Write-Host "3. Monitor costs daily with GitHub Actions workflow" -ForegroundColor Gray
Write-Host ""

