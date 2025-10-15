# PowerShell script to clear build caches on Windows

function Write-Info {
    param($message)
    Write-Host "[INFO] $message" -ForegroundColor Blue
}

function Write-Success {
    param($message)
    Write-Host "[OK] $message" -ForegroundColor Green
}

Write-Info "[*] Clearing build caches..."

# Clear Next.js cache
$paths = @(
    "apps\web\.next",
    "apps\web\out",
    "apps\server\dist"
)

foreach ($path in $paths) {
    if (Test-Path $path) {
        Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
        Write-Info "Removed $path"
    }
}

Write-Success "[DONE] Build caches cleared"

