# Quick Debug Reference - Cross-Platform

## TL;DR - Just Want to Debug?

1. Open VS Code
2. Press `F5`
3. Select "🌟 Debug Complete Platform"
4. Done! All services start automatically on Windows, Mac, and Linux

## Debug Configurations Quick Reference

| Configuration | Frontend | Backend | Python ML | Debugging | Use Case |
|--------------|----------|---------|-----------|-----------|----------|
| 🚀 Launch Full Stack | ✅ | ✅ | ❌ | None | Fast development |
| 🐛 Debug Full Stack | ✅ | ✅ (debug) | ❌ | Backend | Debug API issues |
| 🤔 Debug Full Stack (Interactive) | ✅ | ✅ (debug) | ❌ | Backend | Control port cleanup |
| 🌟 Debug Complete Platform | ✅ | ✅ (debug) | ✅ | Backend | Full stack with ML |
| 🏗️ Debug Complete Platform (Build) | ✅ (prod) | ✅ (debug) | ✅ | Backend | Test production builds |
| 🚀 Debug Complete Platform (Static) | ✅ (SPA) | ✅ (debug) | ✅ | Backend | Test S3 deployment |

## Ports

| Service | Port | URL |
|---------|------|-----|
| Frontend | 4000 | http://localhost:4000 |
| Backend | 4001 | http://localhost:4001 |
| Python ML | 8001 | http://localhost:8001 |
| Database | 5432 | postgresql://localhost:5432 |

## Manual Port Cleanup

### Windows
```powershell
# Automatic cleanup
.\scripts\kill-port-conflicts.ps1

# Interactive (with prompts)
.\scripts\interactive-port-cleanup.ps1

# Specific port
Get-NetTCPConnection -LocalPort 4000 -State Listen | Select-Object -ExpandProperty OwningProcess | Stop-Process -Force
```

### Mac/Linux
```bash
# Automatic cleanup
./scripts/kill-port-conflicts.sh

# Interactive (with prompts)
./scripts/interactive-port-cleanup.sh

# Specific port
lsof -ti:4000 | xargs kill -9
```

## VS Code Tasks

Run from Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

- `Tasks: Run Task` → `Clear All Development Ports`
- `Tasks: Run Task` → `Interactive Port Cleanup`
- `Tasks: Run Task` → `Clear Build Caches`

## Common Issues

### Port Already in Use
**Fix:** VS Code automatically clears ports before starting. If it doesn't work, run manual cleanup (see above).

### Database Not Running
```bash
docker-compose -f docker-compose.dev.yml up postgres -d
```

### Frontend Not Loading
1. Check http://localhost:4000
2. Look at terminal for errors
3. Clear cache: Run `Clear Build Caches` task

### Backend Not Responding
1. Check http://localhost:4001
2. Verify database is running: `docker ps | grep postgres`
3. Check backend terminal for errors

### PowerShell Script Execution Error (Windows Only)
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Permission Denied (Mac/Linux Only)
```bash
chmod +x scripts/*.sh
```

## Documentation

- **Quick Start**: This file
- **Detailed Guide**: [CROSS_PLATFORM_DEBUG_SETUP.md](CROSS_PLATFORM_DEBUG_SETUP.md)
- **Changes Summary**: [WINDOWS_MAC_DEBUG_CHANGES.md](WINDOWS_MAC_DEBUG_CHANGES.md)
- **Original Debug Guide**: [DEBUG_SETUP.md](DEBUG_SETUP.md)

## Support

1. Read the appropriate documentation above
2. Check the integrated terminal for error messages
3. Try manual port cleanup
4. Restart VS Code and Docker
5. Report issues with OS version and error details


