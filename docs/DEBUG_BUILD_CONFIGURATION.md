# Debug Complete Platform (Build) Configuration

This document explains how to set up a local debug configuration that uses the built version of the frontend to replicate production behavior.

## Problem
The authentication loop issue only occurs in the deployed build version (dev01), not in local development mode. This makes it difficult to debug the production issue locally.

## Solution
Create a VS Code debug configuration that builds the frontend and runs the production build locally.

## Setup Instructions

### 1. Add to `.vscode/launch.json`

Add this configuration to the `configurations` array:

```json
{
  "name": "Frontend (Build)",
  "type": "node",
  "request": "launch",
  "cwd": "${workspaceFolder}/apps/web",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "start"],
  "console": "integratedTerminal",
  "skipFiles": ["<node_internals>/**"],
  "preLaunchTask": "Build Frontend and Check Port",
  "env": {
    "NODE_ENV": "production",
    "NODE_OPTIONS": "--inspect=0.0.0.0:9229",
    "NEXT_PUBLIC_API_URL": "http://localhost:4001",
    "BETTER_AUTH_URL": "http://localhost:4001/api/auth",
    "BETTER_AUTH_SECRET": "development-secret-key"
  }
}
```

### 2. Add to `.vscode/tasks.json`

Add these tasks to the `tasks` array:

```json
{
  "label": "Build Frontend",
  "type": "shell",
  "command": "npm",
  "args": ["run", "build"],
  "options": {
    "cwd": "${workspaceFolder}/apps/web"
  },
  "group": "build",
  "presentation": {
    "echo": true,
    "reveal": "always",
    "focus": false,
    "panel": "shared",
    "showReuseMessage": true,
    "clear": false
  },
  "problemMatcher": []
},
{
  "label": "Build Frontend and Check Port",
  "dependsOrder": "sequence",
  "dependsOn": ["Build Frontend", "Check and Kill Frontend Port"],
  "group": "build",
  "presentation": {
    "echo": true,
    "reveal": "always",
    "focus": false,
    "panel": "shared",
    "showReuseMessage": true,
    "clear": false
  },
  "problemMatcher": []
},
{
  "label": "Build and Setup Environment",
  "dependsOrder": "sequence",
  "dependsOn": ["Start Database for Debugging", "Build Frontend and Check Port"],
  "group": "build",
  "presentation": {
    "echo": true,
    "reveal": "always",
    "focus": false,
    "panel": "shared",
    "showReuseMessage": true,
    "clear": false
  },
  "problemMatcher": []
}
```

### 3. Add Compound Configuration

Add this compound configuration to the `compounds` array:

```json
{
  "name": "🏗️ Debug Complete Platform (Build)",
  "configurations": ["Frontend (Build)", "Backend (Debug)", "Python ML (Local)"],
  "preLaunchTask": "Build and Setup Environment",
  "presentation": {
    "group": "complete",
    "order": 2
  }
}
```

## Usage

1. Open VS Code
2. Go to Run and Debug (Ctrl+Shift+D)
3. Select "🏗️ Debug Complete Platform (Build)" from the dropdown
4. Click the play button or press F5

## What This Does

1. **Builds the frontend** using `npm run build` (same as production)
2. **Starts the database** for debugging
3. **Runs the built frontend** using `npm run start` (production mode)
4. **Runs the backend** in debug mode
5. **Runs the Python ML service** locally

## Key Differences from Dev Mode

- **NODE_ENV**: Set to "production" instead of "development"
- **Frontend**: Uses built/optimized version instead of dev server
- **Behavior**: Should replicate the production authentication loop issue

## Testing the Authentication Loop

Once running, test the login flow:
1. Navigate to http://localhost:4000
2. Try to log in
3. Check if the infinite refresh loop occurs (as it does in dev01)
4. Use browser dev tools to inspect the authentication flow
5. Set breakpoints in the authentication context to debug the issue

This configuration will help identify why the authentication loop only occurs in the built version and not in development mode.
