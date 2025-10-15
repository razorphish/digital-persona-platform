# Cross-Platform Debug Setup Guide

This guide explains how to debug the Digital Persona Platform on both **Windows** and **Mac/Linux** systems.

## Overview

The debug configuration has been designed to work seamlessly on both platforms by:
- Detecting the OS automatically
- Using platform-specific scripts (PowerShell for Windows, Bash for Mac/Linux)
- Handling port conflicts cross-platform
- Using npm/npx commands that work consistently across platforms

## Prerequisites

### Windows
- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **Docker Desktop** (for database)
- **VS Code** with extensions:
  - Node.js debugging (built-in)
  - Python extension (for ML service)
- **PowerShell** (comes with Windows 10/11)

### Mac/Linux
- **Node.js** (v18 or higher)
- **npm** (comes with Node.js)
- **Docker** (for database)
- **VS Code** with extensions:
  - Node.js debugging (built-in)
  - Python extension (for ML service)
- **bash** (pre-installed on Mac/Linux)

## Available Debug Configurations

### 🚀 Launch Full Stack
**Best for**: Regular development work
- Starts frontend (port 4000) and backend (port 4001)
- Automatic port cleanup before launch
- No debugging overhead
- Works on Windows, Mac, and Linux

### 🐛 Debug Full Stack
**Best for**: Debugging backend code
- Starts frontend normally + backend with debugging
- Backend breakpoints work
- Automatic port cleanup
- Works on Windows, Mac, and Linux

### 🤔 Debug Full Stack (Interactive)
**Best for**: When you want control over port conflicts
- Prompts you before killing processes
- Shows what's using each port
- Give you options: kill, skip, or abort
- Works on Windows, Mac, and Linux

### 🌟 Debug Complete Platform
**Best for**: Full stack development with ML
- Starts frontend (port 4000), backend (port 4001), and Python ML (port 8001)
- Automatic port cleanup for all services
- All services visible in integrated terminal
- Works on Windows, Mac, and Linux

### 🏗️ Debug Complete Platform (Build)
**Best for**: Testing production builds locally
- Builds frontend first, then starts all services
- Tests production-like environment
- Works on Windows, Mac, and Linux

### 🚀 Debug Complete Platform (Static Export)
**Best for**: Testing static export builds (for S3/CloudFront)
- Builds frontend as static export (SPA mode)
- Tests S3 deployment locally
- Works on Windows, Mac, and Linux

## Port Management

### Automatic Port Cleanup

The debug configurations automatically clean up ports before starting. This prevents `EADDRINUSE` errors.

**Ports managed:**
- `4000` - Frontend (Next.js)
- `4001` - Backend (tRPC API)
- `8001` - Python ML Service

**How it works:**

#### Windows
Uses PowerShell commands:
```powershell
Get-NetTCPConnection -LocalPort 4000 -State Listen
Stop-Process -Id <pid> -Force
```

#### Mac/Linux
Uses bash commands:
```bash
lsof -Pi :4000 -sTCP:LISTEN -t
kill -9 <pid>
```

### Manual Port Cleanup

If you need to manually clean ports:

#### Windows (PowerShell)
```powershell
# Clean all development ports
.\scripts\kill-port-conflicts.ps1

# Interactive cleanup with prompts
.\scripts\interactive-port-cleanup.ps1

# Check specific port
Get-NetTCPConnection -LocalPort 4000 -State Listen
Stop-Process -Id <pid> -Force
```

#### Mac/Linux (Bash)
```bash
# Clean all development ports
./scripts/kill-port-conflicts.sh

# Interactive cleanup with prompts
./scripts/interactive-port-cleanup.sh

# Check specific port
lsof -ti:4000 | xargs kill -9
```

### VS Code Tasks

You can run port cleanup tasks from VS Code Command Palette:

1. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)
2. Type "Tasks: Run Task"
3. Select one of:
   - **Clear All Development Ports** - Automatic cleanup
   - **Interactive Port Cleanup** - Prompts before killing
   - **Check and Kill Frontend Port** - Only port 4000
   - **Check and Kill Backend Port** - Only port 4001

## How to Use

### Starting a Debug Session

1. **Open VS Code** in the project root directory
2. **Open Run and Debug panel** (Ctrl+Shift+D / Cmd+Shift+D)
3. **Select a configuration** from the dropdown:
   - "🌟 Debug Complete Platform" (recommended for full development)
   - "🚀 Launch Full Stack" (frontend + backend only)
   - "🐛 Debug Full Stack" (with backend debugging)
4. **Press F5** or click the green play button
5. **Wait for services to start** (check the integrated terminal)

### Services Will Start On:

- **Frontend**: http://localhost:4000
- **Backend**: http://localhost:4001
- **Python ML**: http://localhost:8001 (if using Complete Platform)
- **Database**: postgresql://localhost:5432

### Setting Breakpoints

#### Frontend (Next.js)
1. Open any file in `apps/web/src/`
2. Click in the gutter (left of line numbers) to set breakpoint
3. Refresh the page or trigger the code
4. VS Code will pause at breakpoint

#### Backend (Node.js/TypeScript)
1. Open any file in `apps/server/src/`
2. Set breakpoints
3. Trigger API calls from frontend or Postman
4. VS Code will pause at breakpoint

#### Python ML Service
1. Open any file in `python-ml-service/app/`
2. Set breakpoints
3. Trigger ML API calls
4. VS Code will pause at breakpoint

### Stopping Debug Session

- Press `Shift+F5` or click the red stop button
- Or close the terminal running the services

## Troubleshooting

### Windows-Specific Issues

#### PowerShell Execution Policy Error
```
.\scripts\kill-port-conflicts.ps1 : File cannot be loaded because running scripts is disabled
```

**Solution:**
```powershell
# Run as Administrator
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Our tasks use `-ExecutionPolicy Bypass` to avoid this, but if you run scripts manually, you may need this.

#### Port Not Releasing on Windows
Windows sometimes holds ports longer than expected.

**Solution:**
```powershell
# Find what's using the port
netstat -ano | findstr :4000

# Kill by PID
taskkill /PID <pid> /F
```

#### Git Bash vs PowerShell
If you have Git Bash as your default shell in VS Code:
1. Open Settings (Ctrl+,)
2. Search "terminal.integrated.defaultProfile.windows"
3. Set to "PowerShell" for best compatibility

### Mac/Linux-Specific Issues

#### Permission Denied on Scripts
```
bash: ./scripts/kill-port-conflicts.sh: Permission denied
```

**Solution:**
```bash
chmod +x scripts/*.sh
```

#### lsof Command Not Found
This is rare but can happen on minimal Linux installs.

**Solution:**
```bash
# Ubuntu/Debian
sudo apt-get install lsof

# CentOS/RHEL
sudo yum install lsof
```

### Common Issues (All Platforms)

#### Port Already in Use
If ports are still in use after cleanup:

**Windows:**
```powershell
# Check all ports
Get-NetTCPConnection | Where-Object {$_.LocalPort -in @(4000,4001,8001)} | Format-Table
```

**Mac/Linux:**
```bash
# Check all ports
lsof -Pi :4000,4001,8001 -sTCP:LISTEN
```

#### Database Not Starting
Ensure Docker is running:

**Windows:**
- Check Docker Desktop is running (system tray)

**Mac:**
- Check Docker Desktop is running (menu bar)

**Linux:**
```bash
sudo systemctl status docker
```

Start the database manually:
```bash
docker-compose -f docker-compose.dev.yml up postgres -d
```

#### Frontend Not Loading
1. Check if port 4000 is accessible: http://localhost:4000
2. Check the integrated terminal for errors
3. Verify environment variables are set
4. Clear Next.js cache:
   - Windows: `Remove-Item -Recurse -Force apps\web\.next`
   - Mac/Linux: `rm -rf apps/web/.next`

#### Backend API Not Responding
1. Check if port 4001 is accessible: http://localhost:4001
2. Verify database is running: `docker ps | grep postgres`
3. Check backend terminal for errors
4. Verify DATABASE_URL is correct

## Environment Variables

The debug configurations set these automatically:

### Frontend
```
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:4001
BETTER_AUTH_URL=http://localhost:4001/api/auth
BETTER_AUTH_SECRET=development-secret-key
```

### Backend
```
NODE_ENV=development
PORT=4001
CORS_ORIGIN=http://localhost:4000
JWT_SECRET=development-jwt-secret
DATABASE_URL=postgresql://dpp_user:dpp_password@localhost:5432/digital_persona
```

### Python ML Service
```
PYTHONPATH=<workspace>/python-ml-service
```

## Scripts Reference

### Windows PowerShell Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `kill-port-conflicts.ps1` | Auto-kill ports 4000, 4001, 8001 | `.\scripts\kill-port-conflicts.ps1` |
| `interactive-port-cleanup.ps1` | Interactive port cleanup with prompts | `.\scripts\interactive-port-cleanup.ps1` |
| `clear-build-caches.ps1` | Clear Next.js and build caches | `.\scripts\clear-build-caches.ps1` |

### Mac/Linux Bash Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `kill-port-conflicts.sh` | Auto-kill ports 4000, 4001, 8001 | `./scripts/kill-port-conflicts.sh` |
| `interactive-port-cleanup.sh` | Interactive port cleanup with prompts | `./scripts/interactive-port-cleanup.sh` |

## Architecture

### How Cross-Platform Detection Works

VS Code tasks use OS-specific properties:

```json
{
  "label": "Clear All Development Ports",
  "type": "shell",
  "windows": {
    "command": "powershell",
    "args": ["-ExecutionPolicy", "Bypass", "-Command", "..."]
  },
  "linux": {
    "command": "bash",
    "args": ["-c", "..."]
  },
  "osx": {
    "command": "bash",
    "args": ["-c", "..."]
  }
}
```

VS Code automatically selects the correct command based on the OS.

### Task Dependencies

Tasks can depend on each other:

```
Debug Complete Platform
  └─ Clear Caches and Check Ports
       ├─ Clear Build Caches (OS-specific)
       └─ Clear All Development Ports (OS-specific)
```

## Best Practices

### Development Workflow

1. **Use "Debug Complete Platform"** for daily development
2. **Set breakpoints** liberally - they don't slow things down
3. **Use the integrated terminal** to see all service logs
4. **Keep Docker running** to avoid database startup delays
5. **Clear caches** if you see strange behavior

### Port Management

1. **Let VS Code handle it** - Pre-launch tasks clean ports automatically
2. **Use interactive cleanup** if you want to see what's running
3. **Don't manually kill processes** unless necessary
4. **Close debug sessions properly** (Shift+F5) to release ports

### Performance Tips

1. **Use "Launch Full Stack"** if you don't need debugging (faster)
2. **Use "Debug Full Stack"** only when debugging backend
3. **Disable auto-save** while debugging to avoid constant rebuilds
4. **Use specific breakpoints** instead of step-through debugging

## Additional Resources

- [VS Code Debugging Documentation](https://code.visualstudio.com/docs/editor/debugging)
- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [Next.js Debugging](https://nextjs.org/docs/pages/building-your-application/configuring/debugging)

## Getting Help

If you encounter issues:

1. Check this troubleshooting guide
2. Check the integrated terminal for error messages
3. Run manual port cleanup and retry
4. Restart VS Code
5. Restart Docker
6. Check the main `DEBUG_SETUP.md` for additional debugging tips


