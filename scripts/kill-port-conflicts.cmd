@echo off
REM Windows batch script to kill port conflicts
REM Works in both CMD and Git Bash on Windows

echo [INFO] Checking and clearing development ports...

REM Function to check and kill a port
call :CheckAndKillPort 4000
call :CheckAndKillPort 4001
call :CheckAndKillPort 8001

echo [OK] Port cleanup completed!
goto :EOF

:CheckAndKillPort
setlocal
set PORT=%1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":%PORT% " ^| findstr "LISTENING"') do (
    echo [WARN] Port %PORT% is in use - killing process %%a...
    taskkill /F /PID %%a >nul 2>&1
    if errorlevel 1 (
        echo [WARN] Could not kill process %%a
    ) else (
        echo [OK] Port %PORT% cleared
    )
    goto :PortDone
)
echo [OK] Port %PORT% is available
:PortDone
endlocal
goto :EOF






