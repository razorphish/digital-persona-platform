@echo off
REM Windows batch script to clear build caches
REM Works in both CMD and Git Bash on Windows

echo [INFO] Clearing build caches...

if exist "apps\web\.next" (
    rmdir /s /q "apps\web\.next" 2>nul
    echo [INFO] Removed apps\web\.next
)

if exist "apps\web\out" (
    rmdir /s /q "apps\web\out" 2>nul
    echo [INFO] Removed apps\web\out
)

if exist "apps\server\dist" (
    rmdir /s /q "apps\server\dist" 2>nul
    echo [INFO] Removed apps\server\dist
)

echo [OK] Build caches cleared











