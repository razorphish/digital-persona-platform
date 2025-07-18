# VS Code Debug Configurations Quick Reference

## Available Configurations

### 🚀 **Full Stack Configurations**

| Configuration                      | Description                      | Port Cleanup   | Use Case                 |
| ---------------------------------- | -------------------------------- | -------------- | ------------------------ |
| **Launch Full Stack**              | Both services, no debugging      | ✅ Automatic   | General development      |
| **Debug Full Stack**               | Frontend + Backend debugging     | ✅ Automatic   | Backend debugging needed |
| **Debug Full Stack (Interactive)** | Prompts before killing processes | 🤔 Interactive | When you want control    |

### 🌐 **Frontend Only**

| Configuration          | Description                 | Port Cleanup | Use Case            |
| ---------------------- | --------------------------- | ------------ | ------------------- |
| **Launch Next.js App** | Frontend development server | ✅ Port 4000 | Frontend-only work  |
| **Debug Next.js App**  | Frontend with debugging     | ✅ Port 4000 | Debug frontend code |

### 🔧 **Backend Only**

| Configuration           | Description               | Port Cleanup | Use Case           |
| ----------------------- | ------------------------- | ------------ | ------------------ |
| **Launch tRPC Backend** | Backend without debugging | ✅ Port 4001 | Backend-only work  |
| **Debug tRPC Backend**  | Backend with debugging    | ✅ Port 4001 | Debug backend code |

## How to Use

1. **Open VS Code** in project root
2. **Go to Run and Debug** (Ctrl+Shift+D / Cmd+Shift+D)
3. **Select configuration** from dropdown
4. **Press F5** or click play button

## Port Cleanup Options

### Automatic (Recommended)

- **"Launch Full Stack"** - Best for daily development
- **"Debug Full Stack"** - Best when you need to debug backend

### Interactive

- **"Debug Full Stack (Interactive)"** - Shows what processes will be killed
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

- **Frontend**: http://localhost:4000
- **Backend**: http://localhost:4001
- **Debug Ports**: 9229, 9230, 9231

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
