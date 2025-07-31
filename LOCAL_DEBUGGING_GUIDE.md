# Local Debugging Guide for Digital Persona Platform

## 🎉 Successfully Tested and Configured!

Your local debugging environment is now fully set up and tested. Both services are running and ready for debugging.

## 📊 Current Status

✅ **Next.js Frontend** - Running on http://localhost:4000 (local) / http://localhost:3100 (Docker)  
✅ **tRPC Backend** - Running on http://localhost:4001 (local) / http://localhost:3101 (Docker)  
✅ **PostgreSQL Database** - Running on localhost:5432  
✅ **Python ML Service** - Optional on http://localhost:8001  
✅ **VS Code Debug Configurations** - Ready to use

## 🐛 Available Debug Configurations

### 1. **Debug Next.js App**

- Launches Next.js with Node.js debugging on port 9229
- Best for debugging frontend and API routes

### 2. **Debug Next.js App (Alternative Port)**

- Uses port 9230 to avoid conflicts
- Fallback option if port 9229 is in use

### 3. **Debug FastAPI with Uvicorn**

- Launches Python service with standard Python debugging
- Best for step-through debugging of Python code

### 4. **Debug FastAPI with Debugpy**

- Launches Python service with debugpy for remote debugging
- Allows attaching/detaching debugger during development

### 5. **Attach to Python ML Service**

- Attaches to currently running Python service
- Use when service is already running with debugpy

### 6. **Debug Full Stack**

- Launches both services together with debugging
- Best for full application debugging

### 7. **Debug Full Stack (Alternative)**

- Uses alternative ports to avoid conflicts
- Fallback for full stack debugging

## 🚀 Quick Start for Debugging

### Option 1: Use VS Code Debug Panel

1. Open VS Code in this workspace
2. Press `Ctrl+Shift+D` (Windows/Linux) or `Cmd+Shift+D` (Mac)
3. Select a debug configuration from the dropdown
4. Press `F5` or click the green play button
5. Set breakpoints in your code
6. Trigger the code to hit breakpoints

### Option 2: Use Compound Configurations

- **Debug Full Stack**: Starts both services with debugging
- Perfect for debugging interactions between frontend and backend

## 🔧 Setting Breakpoints

### Next.js/TypeScript Files

- Set breakpoints in `.ts`, `.tsx` files
- Breakpoints work in:
  - API routes (`src/app/api/*/route.ts`)
  - Components (`src/components/**/*.tsx`)
  - Pages (`src/app/**/page.tsx`)

### Python Files

- Set breakpoints in `.py` files
- Breakpoints work in:
  - FastAPI routes (`app/routers/*.py`)
  - Services (`app/services/*.py`)
  - Main application (`app/main.py`)

## 📡 Service URLs for Testing

| Service           | URL                          | Purpose                      |
| ----------------- | ---------------------------- | ---------------------------- |
| Frontend (Local)  | http://localhost:4000        | Next.js application (local)  |
| Frontend (Docker) | http://localhost:3100        | Next.js application (Docker) |
| Backend (Local)   | http://localhost:4001        | tRPC API server (local)      |
| Backend (Docker)  | http://localhost:3101        | tRPC API server (Docker)     |
| Backend Health    | http://localhost:4001/health | API health check             |
| Python ML Service | http://localhost:8001        | Optional ML API endpoints    |
| ML Service Docs   | http://localhost:8001/docs   | Optional API documentation   |

## 🧪 Testing Debug Setup

Run the debugging test script:

```bash
./test-debugging.sh
```

This script will:

- ✅ Verify both services are running
- ✅ Check debug ports availability
- ✅ Test API endpoints
- ✅ Display configuration options

## 🔍 Debugging Common Scenarios

### Frontend Issues

1. Use **Debug Next.js App** configuration
2. Set breakpoints in React components or API routes
3. Trigger the issue in your browser
4. Step through code execution

### Backend API Issues

1. Use **Debug FastAPI with Uvicorn** configuration
2. Set breakpoints in Python route handlers
3. Make API calls from frontend or curl
4. Inspect variables and execution flow

### Full Stack Issues

1. Use **Debug Full Stack** configuration
2. Set breakpoints in both frontend and backend
3. Trace requests from frontend to backend
4. Debug the complete data flow

## 🛠️ Troubleshooting

### Port Conflicts

- Use alternative port configurations
- Check `lsof -i :PORT` to see what's using ports
- Kill conflicting processes: `lsof -ti:PORT | xargs kill -9`

### Node.js Inspector Issues

- Try alternative port debug configuration
- Restart VS Code if inspector won't attach
- Use `NODE_OPTIONS` environment variable for custom ports

### Python Debugger Issues

- Ensure debugpy is installed: `pip install debugpy`
- Check Python service is running with debugpy
- Verify PYTHONPATH in debug configuration

## 📁 Key Files for Debugging

### Configuration Files

- `.vscode/launch.json` - VS Code debug configurations
- `test-debugging.sh` - Debug setup testing script
- `docker-compose.dev.yml` - Docker debugging setup

### Application Entry Points

- `apps/web/src/app/layout.tsx` - Next.js root layout
- `apps/server/src/index.ts` - tRPC backend entry point
- `python-ml-service/app/main.py` - Optional FastAPI application entry

## 🐳 Docker Debugging (Alternative)

If you prefer containerized debugging:

```bash
docker-compose -f docker-compose.dev.yml up
```

This provides:

- Next.js with hot reload and debugging
- Python ML service with debugpy
- Redis for caching
- All services networked together

## ⚡ Performance Tips

- Use **compound configurations** for full-stack debugging
- Set conditional breakpoints to avoid stopping on every iteration
- Use logging alongside debugging for complex flows
- Leverage VS Code's integrated terminal for quick tests

## 🎯 Next Steps

1. **Try the debug configurations** - Start with "Debug Full Stack"
2. **Set some breakpoints** - Test in both frontend and backend code
3. **Trigger the breakpoints** - Use browser or API calls
4. **Practice stepping through code** - Use F10 (step over), F11 (step into)
5. **Inspect variables** - Hover over variables or use debug console

---

**🎉 Happy Debugging!** Your development environment is now fully optimized for debugging both frontend and backend code simultaneously.
