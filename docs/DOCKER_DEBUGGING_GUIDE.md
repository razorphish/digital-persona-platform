# Docker Container Debugging Guide

## 🐳 Docker Debugging Setup Complete!

Your Docker containerized debugging environment is ready for testing. This setup ensures reliable debugging without crashes and provides multiple debugging modes.

## 📋 Available Docker Configurations

### 1. **Standard Development Mode**

**File:** `docker-compose.dev.yml`

```bash
docker-compose -f docker-compose.dev.yml up --build
```

- ✅ Services start immediately
- ✅ Debugging available but not blocking
- ✅ Best for general development
- ✅ Python service responds to API calls immediately

### 2. **Debug Wait Mode**

**File:** `docker-compose.dev.yml`

```bash
docker-compose -f docker-compose.dev.yml up --build
```

- ⏳ Python service waits for debugger client
- 🐛 Best for step-through debugging from start
- ⚠️ Python API won't respond until debugger attaches

## 🏗️ Container Architecture

| Container             | Purpose                      | Ports | Debug Port     |
| --------------------- | ---------------------------- | ----- | -------------- |
| **frontend**          | Next.js frontend application | 3100  | 9230 (Node.js) |
| **backend**           | tRPC Express API server      | 3101  | 9231 (Node.js) |
| **postgres**          | PostgreSQL database          | 5432  | -              |
| **python-ml-service** | Optional FastAPI ML service  | 8001  | 5678 (debugpy) |

## 🧪 Testing Your Docker Setup

### Quick Test

1. **Start Docker Desktop**
2. **Run the test script:**
   ```bash
   ./test-docker-debugging.sh
   ```

### Manual Testing

```bash
# Standard mode (recommended for testing)
docker-compose -f docker-compose.dev.yml up --build

# Debug wait mode (for debugging from start)
docker-compose -f docker-compose.dev.yml up --build
```

## 🐛 VS Code Docker Debugging

### Setup Steps

1. **Start containers** using one of the Docker Compose files
2. **Open VS Code** in this workspace
3. **Go to Run & Debug** (`Ctrl+Shift+D` / `Cmd+Shift+D`)
4. **Select debug configuration:**
   - `Debug Next.js App (Docker)` - Attach to Node.js in container
   - `Debug Python ML Service (Docker)` - Attach to Python in container
   - `Debug Full Stack (Docker)` - Debug both services with containerized environment

### Debug Configuration Details

#### Next.js Docker Debugging

```json
{
  "name": "Debug Next.js App (Docker)",
  "type": "node",
  "request": "attach",
  "port": 9230,
  "address": "localhost",
  "localRoot": "${workspaceFolder}/apps/web",
  "remoteRoot": "/app"
}
```

#### tRPC Backend Docker Debugging

```json
{
  "name": "Debug tRPC Backend (Docker)",
  "type": "node",
  "request": "attach",
  "port": 9231,
  "address": "localhost",
  "localRoot": "${workspaceFolder}/apps/server",
  "remoteRoot": "/app"
}
```

#### Python Docker Debugging

```json
{
  "name": "Debug Python ML Service (Docker)",
  "type": "python",
  "request": "attach",
  "connect": {
    "host": "localhost",
    "port": 5678
  },
  "pathMappings": [
    {
      "localRoot": "${workspaceFolder}/python-ml-service",
      "remoteRoot": "/app"
    }
  ]
}
```

## 🔍 Container Features

### Hot Reload Support

- ✅ **Next.js:** File changes trigger automatic reload
- ✅ **Python:** uvicorn --reload restarts on changes
- ✅ **Volume mounting** preserves local file editing

### Debug Capabilities

- ✅ **Breakpoints** in both TypeScript and Python
- ✅ **Variable inspection** and watches
- ✅ **Call stack navigation**
- ✅ **Console debugging** with integrated terminal

### Development Tools

- 📊 **SQLite Web Viewer:** http://localhost:8080
- 📖 **FastAPI Docs:** http://localhost:8001/docs
- ❤️ **Health Check:** http://localhost:8001/health
- 🔄 **Redis CLI:** `docker exec -it <redis-container> redis-cli`

## 🚀 Service URLs

| Service         | URL                          | Status                     |
| --------------- | ---------------------------- | -------------------------- |
| Next.js App     | http://localhost:3100        | Ready immediately          |
| tRPC Backend    | http://localhost:3101        | Ready immediately          |
| Backend Health  | http://localhost:3101/health | API health check           |
| PostgreSQL      | localhost:5432               | Database available         |
| Python ML API   | http://localhost:8001        | Optional ML service        |
| ML Service Docs | http://localhost:8001/docs   | Optional API documentation |

## 🛠️ Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose -f docker-compose.dev.yml logs

# Check specific service
docker-compose -f docker-compose.dev.yml logs python-ml-service

# Rebuild from scratch
docker-compose -f docker-compose.dev.yml down --volumes
docker-compose -f docker-compose.dev.yml up --build --force-recreate
```

### Debug Port Not Accessible

```bash
# Check if port is mapped correctly
docker ps

# Check container networking
docker network inspect digital-persona-platform_dev-network
```

### Python Service Not Responding

- **In Debug Wait Mode:** This is expected! Attach debugger first
- **In Standard Mode:** Check container logs for errors

### Memory/Performance Issues

```bash
# Check container resource usage
docker stats

# Increase Docker Desktop resources if needed
# Docker Desktop → Settings → Resources
```

## 🏃‍♂️ Quick Start Workflow

### For General Development

1. `docker-compose -f docker-compose.dev.yml up -d`
2. Wait for services to start (1-2 minutes)
3. Open http://localhost:3100 to verify frontend
4. Open http://localhost:3101/health to verify backend
5. Start coding with hot reload!

### For Debugging Session

1. `docker-compose -f docker-compose.dev.yml up -d`
2. Open VS Code → Run & Debug
3. Select **"Debug Full Stack (Docker)"**
4. Press F5 to attach debuggers
5. Set breakpoints and start debugging!

### For Testing

1. `./test-docker-debugging.sh`
2. Follow the automated test results
3. Use provided URLs to verify functionality

## 📁 Key Files

| File                           | Purpose                          |
| ------------------------------ | -------------------------------- |
| `docker-compose.dev.yml`       | Standard development containers  |
| `docker-compose.dev.yml`       | Debug-enabled development        |
| `test-docker-debugging.sh`     | Automated testing script         |
| `.vscode/launch.json`          | VS Code debug configurations     |
| `apps/web/Dockerfile`          | Next.js container build          |
| `apps/server/Dockerfile`       | tRPC backend container build     |
| `python-ml-service/Dockerfile` | Optional Python ML service build |

## 🎯 Best Practices

### Development

- Use **standard mode** for daily development
- Use **debug wait mode** only when debugging from startup
- Keep containers running between sessions for faster development

### Debugging

- Set breakpoints before attaching debugger
- Use conditional breakpoints to avoid stopping on every iteration
- Leverage VS Code integrated terminal for quick tests

### Performance

- Restart containers if they become slow over time
- Use `docker system prune` periodically to clean up
- Monitor resource usage with `docker stats`

## 🔄 Container Lifecycle

### Starting

```bash
# Build and start
docker-compose -f docker-compose.dev.yml up --build -d

# Just start (if already built)
docker-compose -f docker-compose.dev.yml up -d
```

### Stopping

```bash
# Stop containers
docker-compose -f docker-compose.dev.yml down

# Stop and remove volumes
docker-compose -f docker-compose.dev.yml down --volumes
```

### Updating

```bash
# Rebuild after code changes
docker-compose -f docker-compose.dev.yml up --build

# Force complete rebuild
docker-compose -f docker-compose.dev.yml build --no-cache
```

---

## 🎉 You're Ready for Docker Debugging!

Your containerized debugging environment provides:

- ✅ **Reliable debugging** without crashes
- ✅ **Hot reload** for rapid development
- ✅ **VS Code integration** for seamless debugging
- ✅ **Multiple debugging modes** for different scenarios
- ✅ **Complete isolation** from local environment conflicts

**Start Docker Desktop and run `./test-docker-debugging.sh` to begin!**
