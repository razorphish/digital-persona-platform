# PowerShell Port Cleanup Script for Windows
# Automatically kills processes on development ports without prompting

# Ports to check
$PORTS = @(4000, 4001, 8001)

function Write-Info {
    param($message)
    Write-Host "[INFO] $message" -ForegroundColor Blue
}

function Write-Success {
    param($message)
    Write-Host "[OK] $message" -ForegroundColor Green
}

function Write-Warning {
    param($message)
    Write-Host "[WARN] $message" -ForegroundColor Yellow
}

# Function to kill processes on a port
function Kill-PortProcesses {
    param($port)
    
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($connections) {
            $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
            foreach ($pid in $pids) {
                # Use taskkill for more reliable process termination
                $result = taskkill /F /PID $pid 2>$null
                if ($LASTEXITCODE -eq 0) {
                    Write-Verbose "Killed process $pid"
                }
            }
            Start-Sleep -Milliseconds 500
            return $true
        }
        return $false
    }
    catch {
        return $false
    }
}

# Function to check if port is in use
function Test-PortInUse {
    param($port)
    
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        return ($null -ne $connections)
    }
    catch {
        return $false
    }
}

# Main execution
Write-Info "[*] Checking and clearing development ports..."

foreach ($port in $PORTS) {
    if (Test-PortInUse -port $port) {
        Write-Warning "Port $port is in use - killing processes..."
        if (Kill-PortProcesses -port $port) {
            Write-Success "Port $port cleared"
        }
        else {
            Write-Warning "Could not clear port $port"
        }
    }
    else {
        Write-Success "Port $port is available"
    }
}

Write-Success "[DONE] Port cleanup completed!"
Start-Sleep -Milliseconds 500

