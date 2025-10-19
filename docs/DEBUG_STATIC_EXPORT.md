# Debug Static Export Configuration

## Problem Identified

The deployed build uses **static export mode** (`NEXT_BUILD_EXPORT: "true"`) which creates a different build output than the local debug build. This explains why the hydration mismatch error only occurs in deployed environments.

## Build Configuration Differences

### Deployed Build (GitHub Actions)
```yaml
env:
  NEXT_PUBLIC_API_URL: ${{ needs.detect-environment.outputs.api_url }}
  NEXT_BUILD_EXPORT: "true"
run: npm run build
```
- **Output**: `apps/web/out/` (static files)
- **Serving**: S3 static website hosting
- **Behavior**: Static export with client-side routing

### Local Debug Build
```json
{
  "name": "Frontend (Build)",
  "runtimeArgs": ["run", "start"],
  "preLaunchTask": "Build Frontend and Check Port"
}
```
- **Output**: `apps/web/.next/` (Next.js server build)
- **Serving**: Next.js production server
- **Behavior**: Server-side rendering with hydration

## Solution: Local Static Export Debug

### New Debug Configuration
```json
{
  "name": "Frontend (Static Export)",
  "runtimeArgs": ["run", "start"],
  "preLaunchTask": "Build Frontend Static Export and Check Port",
  "env": {
    "NODE_ENV": "production",
    "NEXT_PUBLIC_API_URL": "http://localhost:4001"
  }
}
```

### New Build Task
```json
{
  "label": "Build Frontend Static Export",
  "command": "npm",
  "args": ["run", "build"],
  "options": {
    "cwd": "${workspaceFolder}/apps/web",
    "env": {
      "NEXT_BUILD_EXPORT": "true"
    }
  }
}
```

## Testing the Static Export Build

1. **Build with static export:**
   ```bash
   cd apps/web
   NEXT_BUILD_EXPORT=true npm run build
   ```

2. **Serve static files:**
   ```bash
   cd apps/web/out
   python3 -m http.server 3000
   ```

3. **Test in browser:**
   - Open `http://localhost:3000`
   - Check for hydration mismatch errors
   - Verify authentication flow works correctly

## Expected Results

The static export build should reproduce the same hydration mismatch error that occurs in deployed environments, allowing for proper local debugging of the issue.

## Next Steps

1. Test the static export build locally
2. Identify the specific cause of the hydration mismatch
3. Fix the issue in the static export build
4. Verify the fix works in deployed environments
