# After Reboot - Quick Steps

## ✅ What Was Fixed
- PowerShell execution policy configured
- Port cleanup scripts updated for Windows
- VS Code settings configured to use PowerShell
- Ports 4000 and 4001 cleared
- Python ML configured to use venv without activation

## 📝 Next Steps After Reboot

### 1. Install Python Dependencies
Open PowerShell in the project folder and run:

```powershell
cd "C:\Users\AMarasco\OneDrive - campsystems.com\Documents\SC\git\digital-persona-platform"
& "venv\Scripts\python.exe" -m pip install -r python-ml-service\requirements.txt
```

This will install all Python ML dependencies (including chromadb which requires C++ Build Tools).

### 2. Test Python ML
Verify it works:

```powershell
& "venv\Scripts\python.exe" -m uvicorn app.main:app --host 0.0.0.0 --port 8001
```

Press `Ctrl+C` to stop it after you see it started successfully.

### 3. Start Debugging

**Option A: Full Platform (Frontend + Backend + Python ML)**
1. Open VS Code
2. Press `F5`
3. Select **"🌟 Debug Complete Platform"**
4. All three services will start!

**Option B: Just Frontend + Backend (No ML)**
1. Open VS Code  
2. Press `F5`
3. Select **"🐛 Debug Full Stack"**
4. Only frontend and backend will start

## 🚀 Services

| Service | Port | URL |
|---------|------|-----|
| Frontend | 4000 | http://localhost:4000 |
| Backend | 4001 | http://localhost:4001 |
| Python ML | 8001 | http://localhost:8001 |
| Database | 5432 | postgresql://localhost:5432 |

## 🔧 Troubleshooting

### If ports are still in use:
```powershell
.\scripts\kill-port-conflicts.ps1
```

### If Python dependencies fail:
Make sure you installed "Desktop development with C++" workload from Visual Studio Installer.

### If VS Code still shows errors:
1. Close VS Code completely
2. Reopen VS Code
3. Try debugging again

## 📚 Documentation

- **Quick Reference**: `QUICK_DEBUG_REFERENCE.md`
- **Full Guide**: `CROSS_PLATFORM_DEBUG_SETUP.md`  
- **Changes Made**: `WINDOWS_MAC_DEBUG_CHANGES.md`

---

**Everything is ready!** After the reboot and Python dependency install, debugging should work perfectly on Windows. 🎉







