# Workflow Environment Naming Convention

## ✅ **ENFORCED STRICT NAMING SYNTAX**

The workflows now **ONLY** allow environments with the specific numbered naming syntax:

### **Required Format**: `{type}{##}`

| Type            | Format      | Examples                              | Description              |
| --------------- | ----------- | ------------------------------------- | ------------------------ |
| **Development** | `dev##`     | `dev01`, `dev02`, `dev15`, `dev99`    | Development environments |
| **QA/Testing**  | `qa##`      | `qa01`, `qa02`, `qa15`, `qa99`        | QA testing environments  |
| **Staging**     | `staging##` | `staging01`, `staging02`, `staging15` | Staging environments     |
| **Hotfix**      | `hotfix##`  | `hotfix01`, `hotfix02`, `hotfix15`    | Hotfix environments      |
| **Production**  | `prod`      | `prod`                                | Production environment   |

### **Important Rules**:

- ✅ **Exactly 2 digits required** (01-99)
- ✅ **Leading zero required** for single digits (01, 02, 03...)
- ❌ **No base environments** (dev, qa, staging) without numbers
- ❌ **No single digits** (dev1, qa2, staging3)
- ❌ **No more than 2 digits** (dev001, qa123)

## 🔧 **Workflow Changes Made**

### **1. CI Workflow (`ci.yml`)**

```yaml
# OLD - Allowed any wildcard
branches: [main, "dev*", "qa*", "staging*", "hotfix*"]

# NEW - Strict numbered format only
branches:
  - main
  - "dev[0-9][0-9]"
  - "qa[0-9][0-9]"
  - "staging[0-9][0-9]"
  - "hotfix[0-9][0-9]"
```

**Environment Detection**:

```bash
# OLD - Fallback to "dev" if no match
elif [[ "${{ github.ref_name }}" =~ ^dev[0-9]+$ ]]; then
  ENVIRONMENT="${{ github.ref_name }}"
else
  ENVIRONMENT="dev"  # ❌ Removed

# NEW - Strict validation with failure
elif [[ "${{ github.ref_name }}" =~ ^dev[0-9][0-9]$ ]]; then
  ENVIRONMENT="${{ github.ref_name }}"
else
  echo "❌ Invalid branch name: ${{ github.ref_name }}"
  echo "❌ Only these formats are allowed: dev##, qa##, staging##, hotfix##, main"
  exit 1
```

### **2. Deploy Workflow (`deploy.yml`)**

**Manual Dispatch Options**:

```yaml
# OLD - Included base environments
options:
  - dev      # ❌ Removed
  - qa       # ❌ Removed
  - staging  # ❌ Removed
  - dev01, dev02, dev03...

# NEW - Only numbered environments
options:
  - prod
  - dev01, dev02, dev03, dev04, dev05
  - qa01, qa02, qa03, qa04, qa05
  - staging01, staging02, staging03, staging04, staging05
  - hotfix01, hotfix02, hotfix03, hotfix04, hotfix05
```

**Branch Triggers**:

```yaml
# OLD - Wildcard patterns
branches: ["dev*", "qa*", "staging*", "hotfix*"]

# NEW - Strict numbered patterns
branches:
  - "dev[0-9][0-9]"
  - "qa[0-9][0-9]"
  - "staging[0-9][0-9]"
  - "hotfix[0-9][0-9]"
```

**Validation**:

```bash
# OLD - Optional numbers allowed
if [[ ! "$ENVIRONMENT" =~ ^(dev|qa|staging|hotfix|prod)([0-9]+)?$ ]]; then

# NEW - Strict numbered format required
if [[ ! "$ENVIRONMENT" =~ ^((dev|qa|staging|hotfix)[0-9][0-9]|prod)$ ]]; then
```

## 🚀 **Usage Examples**

### **✅ Valid Branch Names**

```bash
git checkout -b dev01    # ✅ Creates dev01.hibiji.com
git checkout -b qa15     # ✅ Creates qa15.hibiji.com
git checkout -b staging03 # ✅ Creates staging03.hibiji.com
git checkout -b hotfix07  # ✅ Creates hotfix07.hibiji.com
git checkout -b main      # ✅ Maps to prod
```

### **❌ Invalid Branch Names (Will Fail)**

```bash
git checkout -b dev      # ❌ Missing numbers
git checkout -b qa       # ❌ Missing numbers
git checkout -b dev1     # ❌ Single digit (need dev01)
git checkout -b qa123    # ❌ Too many digits
git checkout -b development # ❌ Wrong format
git checkout -b test     # ❌ Invalid type
```

### **✅ Manual Deployment**

```bash
# Via GitHub Actions UI or CLI
gh workflow run deploy.yml --field environment=dev01  # ✅
gh workflow run deploy.yml --field environment=qa15   # ✅
gh workflow run deploy.yml --field environment=prod   # ✅

# These will now fail:
gh workflow run deploy.yml --field environment=dev    # ❌
gh workflow run deploy.yml --field environment=qa     # ❌
```

## 📊 **Environment Mapping**

| Branch Name | Environment | Main Environment | Domain                 | Infrastructure Prefix |
| ----------- | ----------- | ---------------- | ---------------------- | --------------------- |
| `dev01`     | `dev01`     | `dev`            | `dev01.hibiji.com`     | `hibiji-dev01-*`      |
| `dev15`     | `dev15`     | `dev`            | `dev15.hibiji.com`     | `hibiji-dev15-*`      |
| `qa02`      | `qa02`      | `qa`             | `qa02.hibiji.com`      | `hibiji-qa02-*`       |
| `staging03` | `staging03` | `staging`        | `staging03.hibiji.com` | `hibiji-staging03-*`  |
| `hotfix07`  | `hotfix07`  | `hotfix`         | `hotfix07.hibiji.com`  | `hibiji-hotfix07-*`   |
| `main`      | `prod`      | `prod`           | `hibiji.com`           | `hibiji-prod-*`       |

## 🔒 **Error Messages**

When invalid branch names are used, the workflows will fail with clear error messages:

```bash
❌ Invalid branch name: dev
❌ Only these formats are allowed: dev##, qa##, staging##, hotfix##, main
❌ Examples: dev01, qa15, staging03, hotfix07
```

## 🎯 **Benefits**

1. **Consistent Naming**: All environments follow the same `{type}{##}` pattern
2. **Clear Boundaries**: Exactly 99 environments per type (01-99)
3. **No Ambiguity**: No confusion between "dev" and "dev01"
4. **Infrastructure Isolation**: Each environment gets unique resources
5. **Domain Management**: Predictable subdomain structure
6. **Workflow Clarity**: Clear validation and error messages

## 🚦 **Testing**

The strict naming convention has been tested and confirmed working:

- ✅ `dev01` environment successfully deploys
- ✅ Manual workflow dispatch accepts only valid formats
- ✅ Invalid branch names are rejected with clear error messages
- ✅ Infrastructure resources are properly namespaced

---

**Last Updated**: January 2025  
**Status**: ✅ **ACTIVE - STRICTLY ENFORCED**
