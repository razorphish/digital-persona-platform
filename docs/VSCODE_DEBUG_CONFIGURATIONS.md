# VS Code Debug Configurations Quick Reference

## Available Configurations

### 🚀 **Full Stack Configurations**

| Configuration                         | Description                      | Port Cleanup   | Use Case                 |
| ------------------------------------- | -------------------------------- | -------------- | ------------------------ |
| **🚀 Launch Full Stack**              | Both services, no debugging      | ✅ Automatic   | General development      |
| **🐛 Debug Full Stack**               | Frontend + Backend debugging     | ✅ Automatic   | Backend debugging needed |
| **🤔 Debug Full Stack (Interactive)** | Prompts before killing processes | 🤔 Interactive | When you want control    |
| **🐳 Debug Full Stack (Docker)**      | Full containerized environment   | ✅ Automatic   | Production-like testing  |
| **🌟 Debug Complete Platform**        | All services including Python ML | ✅ Automatic   | Complete stack debugging |

### 🌐 **Frontend Only**

| Configuration         | Description                      | Port Cleanup | Use Case            |
| --------------------- | -------------------------------- | ------------ | ------------------- |
| **Frontend (Launch)** | Frontend development server      | ✅ Port 4000 | Frontend-only work  |
| **Frontend (Debug)**  | Frontend with debugging          | ✅ Port 4000 | Debug frontend code |
| **Frontend (Docker)** | Attach to containerized frontend | -            | Docker debugging    |

### 🔧 **Backend Only**

| Configuration        | Description                     | Port Cleanup | Use Case           |
| -------------------- | ------------------------------- | ------------ | ------------------ |
| **Backend (Launch)** | Backend without debugging       | ✅ Port 4001 | Backend-only work  |
| **Backend (Debug)**  | Backend with debugging          | ✅ Port 4001 | Debug backend code |
| **Backend (Docker)** | Attach to containerized backend | -            | Docker debugging   |

### 🐍 **Python ML Service**

| Configuration          | Description                    | Port Cleanup | Use Case                |
| ---------------------- | ------------------------------ | ------------ | ----------------------- |
| **Python ML (Local)**  | Local FastAPI service          | -            | Python ML debugging     |
| **Python ML (Docker)** | Attach to containerized Python | -            | Docker Python debugging |

## How to Use

1. **Open VS Code** in project root
2. **Go to Run and Debug** (Ctrl+Shift+D / Cmd+Shift+D)
3. **Select configuration** from dropdown
4. **Press F5** or click play button

## Port Cleanup Options

### Automatic (Recommended)

- **"🚀 Launch Full Stack"** - Best for daily development
- **"🐛 Debug Full Stack"** - Best when you need to debug backend
- **"🐳 Debug Full Stack (Docker)"** - Production-like environment with debugging

### Interactive

- **"🤔 Debug Full Stack (Interactive)"** - Shows what processes will be killed
- Gives you options: Kill, Skip, or Abort

### Manual

```bash
# Command Palette (Ctrl+Shift+P)
Tasks: Run Task → Clear All Development Ports

# Terminal
./scripts/kill-port-conflicts.sh
./scripts/interactive-port-cleanup.sh
```

## Ports Used

**Local Development:**

- **Frontend**: http://localhost:4000
- **Backend**: http://localhost:4001
- **Debug Ports**: 9229, 9230, 9231

**Docker Development:**

- **Frontend**: http://localhost:3100 (external → internal 4000)
- **Backend**: http://localhost:3101 (external → internal 4001)
- **Docker Debug Ports**: 9230 (frontend), 9231 (backend)

## Environment Variables Set

**Frontend**:

- `NODE_ENV=development`
- `NEXT_PUBLIC_API_URL=http://localhost:4001`
- `BETTER_AUTH_URL=http://localhost:4001/api/auth`

**Backend**:

- `NODE_ENV=development`
- `PORT=4001`
- `CORS_ORIGIN=http://localhost:4000`
- `JWT_SECRET=development-jwt-secret`

## Troubleshooting

❌ **EADDRINUSE Error**: Use configurations with port cleanup  
❌ **Frontend not loading**: Try "Launch Full Stack"  
❌ **Process conflicts**: Use "Debug Full Stack (Interactive)"  
❌ **Can't connect**: Check environment variables above

## Quick Commands

```bash
# Kill all development processes
pkill -f "npm run dev"

# Check what's using ports
lsof -i :4000
lsof -i :4001

# Test endpoints
curl http://localhost:4000
curl http://localhost:4001
```
