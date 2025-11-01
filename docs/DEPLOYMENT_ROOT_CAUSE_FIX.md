# Deployment Root Cause Analysis & Fix

## 🔍 Root Cause Identified

### Primary Issue: **Lambda Package Structure**

**Error:**
```
Runtime.ImportModuleError: Error: Cannot find module 'index'
Require stack: /var/runtime/index.mjs
```

**Root Cause:**
The Lambda deployment zip file structure is incorrect. The zip is being created from the wrong directory level, causing Lambda to not find `index.js` at the expected location.

---

## 📊 Current Workflow Flow

1. **Build:** Creates `apps/server/lambda-dist/index.js`
2. **Upload Artifact:** Uploads `apps/server/lambda-dist/index.js`
3. **Download Artifact:** Downloads to workspace root (preserves structure)
4. **Locate Files:** Finds `index.js` (likely at `apps/server/lambda-dist/index.js`)
5. **Move Files:** Moves to current directory (`./index.js`)
6. **Create Zip:** `zip -r lambda-deployment.zip .` (includes everything in current dir)

**Problem:** The zip likely includes:
- `./index.js` ✅
- `./package.json` ✅  
- But ALSO: `./apps/`, `./.github/`, etc. ❌

OR the zip structure is:
```
lambda-deployment.zip
├── apps/
│   └── server/
│       └── lambda-dist/
│           └── index.js  ❌ WRONG LOCATION
```

Instead of:
```
lambda-deployment.zip
├── index.js  ✅ CORRECT
├── package.json  ✅
└── packages/  (if needed)
```

---

## ✅ Solution

### Fix 1: Improve Zip Creation

**Current code (line ~1705):**
```bash
zip -r lambda-deployment.zip . -x "*.DS_Store*" "*.git*"
```

**Problem:** This zips everything in current directory, including workspace files.

**Fix:** Create zip only with Lambda files in a clean directory:

```bash
# Create clean Lambda deployment directory
mkdir -p lambda-deploy
cp index.js lambda-deploy/
cp package.json lambda-deploy/

# Copy migration files if needed
if [ -d "packages/database/drizzle" ]; then
  cp -r packages lambda-deploy/
fi

# Create zip from clean directory
cd lambda-deploy
zip -r ../lambda-deployment.zip . -x "*.DS_Store*"
cd ..
```

---

### Fix 2: Verify Zip Structure

Add verification step:

```bash
echo "🔍 Verifying zip structure..."
unzip -l lambda-deployment.zip | grep -E "index\.js|package\.json"
if ! unzip -l lambda-deployment.zip | grep -q "^.*index\.js$"; then
  echo "❌ index.js not found at zip root!"
  echo "📁 Zip contents:"
  unzip -l lambda-deployment.zip | head -20
  exit 1
fi
```

---

### Fix 3: Alternative - Use Working Directory

Change the workflow to work in a clean directory:

```bash
# After locating files, create clean working dir
mkdir -p lambda-package
cd lambda-package

# Copy only needed files
cp ../index.js .
cp ../package.json .

# Copy migration files if they exist
if [ -d "../packages/database/drizzle" ]; then
  mkdir -p packages/database
  cp -r ../packages/database/drizzle packages/database/
fi

# Create zip from clean directory
zip -r lambda-deployment.zip .

# Return to parent for update
cd ..
aws lambda update-function-code --function-name $FUNCTION_NAME --zip-file fileb://lambda-package/lambda-deployment.zip
```

---

## 🚨 Secondary Issues

### 1. RDS Proxy State Mismatch

**Status:** ✅ **RESOLVED**
- Proxy exists in AWS: `prx-03c5c43fb96762f8f`
- In correct VPC: `vpc-0f110539d07034d52` ✅
- State should sync automatically on next successful apply

**Action:** None needed - proxy is correct, state will catch up

---

### 2. Database Connection Errors

**Error:** `Connection terminated unexpectedly`

**Cause:** Lambda can't initialize properly due to module import error
- Once Lambda module issue is fixed, database connections should work

**Action:** Fix Lambda first, then retest database operations

---

### 3. VPC Deposed Objects

**Status:** Normal - Terraform cleaning up old VPC resources
**Action:** Will resolve automatically once apply completes successfully

---

## 📝 Implementation Plan

### Immediate Fix (Highest Priority):

1. **Fix Lambda Package Structure** in workflow
   - File: `.github/workflows/deploy-serverless.yml`
   - Section: "Create Lambda deployment package"
   - Lines: ~1699-1709

2. **Add Verification Step** after zip creation
   - Verify `index.js` is at zip root
   - Verify `package.json` exists
   - Fail fast if structure is wrong

3. **Test Locally** before committing
   - Create test zip
   - Verify structure with `unzip -l`

---

## 🎯 Expected Outcome

After fix:
1. ✅ Lambda deploys successfully
2. ✅ Database migrations run
3. ✅ Database seeding works
4. ✅ API endpoints functional
5. ✅ Health checks pass

---

## 📋 Verification Commands

```bash
# Check current Lambda handler
aws lambda get-function --function-name dev-dev01-dpp-api --query 'Configuration.Handler'

# Should be: index.handler

# Test Lambda invocation
aws lambda invoke --function-name dev-dev01-dpp-api \
  --payload '{"httpMethod":"GET","path":"/health"}' \
  output.json && cat output.json
```

---

**Priority:** 🔴 **CRITICAL** - Blocks all backend functionality
**Estimated Fix Time:** 15-30 minutes
**Risk:** Low - Only changes zip creation logic

