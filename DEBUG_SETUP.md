# Debug Full Stack Setup Guide

## Issues Fixed

### 1. Content-Security-Policy Error

**Error**: `Content-Security-Policy: The page's settings blocked the loading of a resource (img-src) at http://localhost:4001/favicon.ico`

**Solution**: Added favicon.ico endpoint to backend server that returns 204 No Content:

```javascript
app.get("/favicon.ico", (req, res) => {
  res.status(204).end();
});
```

### 2. Cannot GET / Error

**Error**: `Cannot GET /` when accessing the backend server root

**Solution**: Added root endpoint to backend server:

```javascript
app.get("/", (req, res) => {
  res.json({
    message: "Digital Persona Platform API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      api: "/api/trpc",
      health: "/health",
    },
    timestamp: new Date().toISOString(),
  });
});
```

### 3. Next.js Configuration for Development vs Production

**Issue**: Static export configuration breaking development mode

**Solution**: Updated `next.config.js` to use different configs for dev vs prod:

```javascript
output: process.env.NODE_ENV === "production" ? "export" : "standalone",
```

## VS Code Debug Configuration

### Fixed Launch Configurations

The issue with frontend not serving has been resolved by updating the launch configurations:

1. **Debug Full Stack** - Launches frontend using npm + backend with debugging
2. **Launch Full Stack** - Launches both services without debugging overhead
3. **Debug Full Stack (Interactive)** - Prompts user to resolve port conflicts
4. **Environment Variables** - Properly configured for each service
5. **Console Output** - All output visible in VS Code integrated terminal
6. **Automatic Port Cleanup** - Resolves EADDRINUSE errors automatically

### Usage

1. Open VS Code in the project root
2. Go to Run and Debug (Cmd/Ctrl + Shift + D)
3. Select one of these configurations:
   - **"Launch Full Stack"** - Automatic port cleanup, no debugging
   - **"Debug Full Stack"** - Automatic port cleanup, backend debugging enabled
   - **"Debug Full Stack (Interactive)"** - Prompts before killing processes
4. Press F5 or click the play button

**The debugger will automatically handle port conflicts!** No more EADDRINUSE errors.

### Services Started

- **Frontend**: http://localhost:4000 (Next.js development server)
- **Backend**: http://localhost:4001 (tRPC API server)
- **Database**: postgresql://localhost:5432 (if running)

### Environment Variables Set

**Frontend**:

- `NODE_ENV=development`
- `NEXT_PUBLIC_API_URL=http://localhost:4001`
- `BETTER_AUTH_URL=http://localhost:4001/api/auth`

**Backend**:

- `NODE_ENV=development`
- `PORT=4001`
- `CORS_ORIGIN=http://localhost:4000`
- `JWT_SECRET=development-jwt-secret`

## Testing the Setup

1. Start the debug configuration
2. Navigate to http://localhost:4000 (frontend)
3. Check http://localhost:4001 (backend) - should show API info
4. Check http://localhost:4001/health - should show health status
5. Favicon requests to backend will no longer cause CSP errors

## Debugging Features

- **Breakpoints**: Set in both frontend and backend code
- **Hot Reload**: Changes automatically restart services
- **Console Logs**: Available in VS Code Debug Console
- **Network Inspection**: All requests between frontend and backend work correctly

## Common Issues

### EADDRINUSE Error (FIXED)

**Issue**: `Error: listen EADDRINUSE: address already in use :::4000` and `:::4001`  
**Root Cause**: Previous debugging sessions or other processes using ports 4000/4001  
**Solution**: Added automatic port cleanup with pre-launch tasks

**How it works**:

- **Automatic Mode**: Silently kills processes on ports 4000/4001 before starting
- **Interactive Mode**: Prompts user with options when port conflicts detected
- **Individual Tasks**: Available in VS Code Command Palette (Ctrl+Shift+P)

### Frontend Not Serving (FIXED)

**Issue**: "Debug Full Stack" launches backend but frontend doesn't serve on port 4000  
**Root Cause**: Next.js debugging configuration was incorrectly trying to debug Node.js internals  
**Solution**: Updated configuration to use `npm run dev` with integrated terminal

**What was changed**:

- Removed complex Node.js debugging setup for frontend
- Added `"console": "integratedTerminal"` for better output visibility
- Created separate "Launch" vs "Debug" configurations
- Fixed environment variable passing
- Added pre-launch tasks for port cleanup

### Port Already in Use

If you see port conflicts:

```bash
# Kill existing processes
pkill -f "npm run dev"
# Or specific ports
lsof -ti:4000 | xargs kill -9
lsof -ti:4001 | xargs kill -9
```

### Manual Port Cleanup

You can manually run port cleanup tasks:

1. **Via Command Palette** (Ctrl+Shift+P / Cmd+Shift+P):

   - `Tasks: Run Task` → `Clear All Development Ports` (automatic)
   - `Tasks: Run Task` → `Interactive Port Cleanup` (prompts user)
   - `Tasks: Run Task` → `Check and Kill Frontend Port`
   - `Tasks: Run Task` → `Check and Kill Backend Port`

2. **Via Terminal**:

   ```bash
   # Automatic cleanup
   ./scripts/kill-port-conflicts.sh

   # Interactive cleanup (with prompts)
   ./scripts/interactive-port-cleanup.sh
   ```

### VS Code Configuration Not Working

If services still don't start:

1. Try "Launch Full Stack" instead of "Debug Full Stack"
2. Try "Debug Full Stack (Interactive)" to see what processes are conflicting
3. Check VS Code integrated terminal for error messages
4. Manually test: `cd apps/web && npm run dev` and `cd apps/server && npm run dev`

### Database Connection

Ensure PostgreSQL is running:

```bash
docker ps | grep postgres
# Or start if needed
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15-alpine
```

### CORS Issues

If you see CORS errors, verify:

- Backend CORS_ORIGIN matches frontend URL
- Frontend NEXT_PUBLIC_API_URL points to backend
- Both services are running on correct ports
