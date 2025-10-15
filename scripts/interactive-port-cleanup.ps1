# PowerShell Interactive Port Cleanup Script for Windows
# Checks for port conflicts and prompts user to resolve them

# Ports to check
$FRONTEND_PORT = 4000
$BACKEND_PORT = 4001
$ML_PORT = 8001

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

function Write-Error {
    param($message)
    Write-Host "[ERROR] $message" -ForegroundColor Red
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

# Function to get process info for a port
function Get-PortInfo {
    param($port)
    
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($connections) {
            $pids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
            foreach ($pid in $pids) {
                $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                if ($process) {
                    Write-Host "  PID: $pid - Name: $($process.ProcessName) - Path: $($process.Path)"
                }
            }
        }
    }
    catch {
        Write-Warning "Could not get process info for port $port"
    }
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
                taskkill /F /PID $pid 2>$null | Out-Null
            }
            Start-Sleep -Seconds 1
            return $true
        }
        return $false
    }
    catch {
        return $false
    }
}

# Function to prompt user for action
function Get-UserAction {
    param($port, $serviceName)
    
    Write-Host ""
    Write-Warning "Port $port is currently in use by:"
    Get-PortInfo -port $port
    Write-Host ""
    
    while ($true) {
        Write-Host "What would you like to do?" -ForegroundColor Yellow
        Write-Host "1) Kill processes and continue"
        Write-Host "2) Skip this port"
        Write-Host "3) Abort debugging"
        Write-Host ""
        
        $choice = Read-Host "Enter your choice (1/2/3)"
        
        switch ($choice) {
            { $_ -in "1", "y", "Y", "yes", "YES" } {
                Write-Info "Killing processes on port $port..."
                if (Kill-PortProcesses -port $port) {
                    Write-Success "Processes on port $port killed successfully"
                    return $true
                }
                else {
                    Write-Error "Failed to kill processes on port $port"
                    return $false
                }
            }
            { $_ -in "2", "s", "S", "skip", "SKIP" } {
                Write-Warning "Skipping port $port - debugging may fail"
                return $false
            }
            { $_ -in "3", "n", "N", "no", "NO", "abort", "ABORT" } {
                Write-Info "Aborting debug session"
                exit 1
            }
            default {
                Write-Host "Invalid choice. Please enter 1, 2, or 3." -ForegroundColor Red
            }
        }
    }
}

# Main execution
Write-Host ""
Write-Info "[*] Checking for port conflicts before debugging..."
Write-Host ""

$conflictsFound = $false

# Check frontend port
if (Test-PortInUse -port $FRONTEND_PORT) {
    $conflictsFound = $true
    if (-not (Get-UserAction -port $FRONTEND_PORT -serviceName "Frontend (Next.js)")) {
        Write-Warning "Frontend port $FRONTEND_PORT not cleared"
    }
}
else {
    Write-Success "Frontend port $FRONTEND_PORT is available"
}

# Check backend port
if (Test-PortInUse -port $BACKEND_PORT) {
    $conflictsFound = $true
    if (-not (Get-UserAction -port $BACKEND_PORT -serviceName "Backend (tRPC)")) {
        Write-Warning "Backend port $BACKEND_PORT not cleared"
    }
}
else {
    Write-Success "Backend port $BACKEND_PORT is available"
}

# Check ML service port
if (Test-PortInUse -port $ML_PORT) {
    $conflictsFound = $true
    if (-not (Get-UserAction -port $ML_PORT -serviceName "Python ML Service")) {
        Write-Warning "ML service port $ML_PORT not cleared"
    }
}
else {
    Write-Success "ML service port $ML_PORT is available"
}

# Final status
Write-Host ""
if (-not $conflictsFound) {
    Write-Success "[DONE] All ports are clear! Ready to start debugging."
}
else {
    Write-Info "[*] Port cleanup completed. Starting debug session..."
}
Write-Host ""

Start-Sleep -Seconds 1

