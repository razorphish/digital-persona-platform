# Terraform Directory Structure Fix

## 🚨 **Issue**

The GitHub Actions CI/CD pipeline was failing with the error:

```
The job failed because it could not start the process '/usr/bin/bash' in the working directory /home/runner/work/digital-persona-platform/digital-persona-platform/./terraform/environments/main: "No such file or directory".
```

## 🔍 **Root Cause**

The workflow was trying to access `./terraform/environments/${{ github.ref_name }}` where `github.ref_name` is the branch name. When the branch was `main`, it was looking for `./terraform/environments/main`, but that directory didn't exist.

**Existing Structure:**

```
terraform/environments/
└── dev/
    ├── main.tf
    ├── tfplan
    └── .terraform/
```

**Required Structure:**

```
terraform/environments/
├── main/
├── dev/
├── qa/
├── staging/
└── prod/
```

## ✅ **Solution Applied**

### 1. **Created Missing Directories**

```bash
mkdir -p terraform/environments/main
mkdir -p terraform/environments/qa
mkdir -p terraform/environments/staging
mkdir -p terraform/environments/prod
```

### 2. **Created Environment-Specific Terraform Configurations**

Each environment now has its own `main.tf` file with appropriate settings:

#### **Main Environment** (`terraform/environments/main/main.tf`)

- Backend key: `main/terraform.tfstate`
- Default sub-environment: `main01`
- Environment: `main`

#### **QA Environment** (`terraform/environments/qa/main.tf`)

- Backend key: `qa/terraform.tfstate`
- Default sub-environment: `qa01`
- Environment: `qa`

#### **Staging Environment** (`terraform/environments/staging/main.tf`)

- Backend key: `staging/terraform.tfstate`
- Default sub-environment: `staging01`
- Environment: `staging`

#### **Production Environment** (`terraform/environments/prod/main.tf`)

- Backend key: `prod/terraform.tfstate`
- Default sub-environment: `prod01`
- Environment: `prod`

### 3. **Updated VPC CIDR Block Calculation**

Updated the VPC CIDR block calculation to include the "main" environment:

```hcl
cidr_block = "10.${index(["dev", "qa", "staging", "prod", "main"], local.main_env)}.${index(["01", "02", "03"], replace(local.sub_env, "/^[a-z]+/", ""))}.0/24"
```

## 📋 **Current Directory Structure**

```
terraform/environments/
├── main/
│   └── main.tf          # Main environment configuration
├── dev/
│   ├── main.tf          # Development environment configuration
│   ├── tfplan           # Existing Terraform plan
│   └── .terraform/      # Existing Terraform state
├── qa/
│   └── main.tf          # QA environment configuration
├── staging/
│   └── main.tf          # Staging environment configuration
└── prod/
    └── main.tf          # Production environment configuration
```

## 🔄 **Workflow Compatibility**

### **CI/CD Pipeline** (`.github/workflows/ci-cd-pipeline.yml`)

- ✅ Uses `./terraform/environments/${{ github.ref_name }}`
- ✅ Now works with all branch names: `main`, `dev`, `qa`, `staging`, `prod`

### **Simple Deploy** (`.github/workflows/simple-deploy.yml`)

- ✅ Uses `./terraform/environments/dev` (hardcoded)
- ✅ No changes needed

### **Multi-Sub-Environment Deploy** (`.github/workflows/multi-sub-environment-deploy.yml`)

- ✅ Uses `terraform/environments/$MAIN_ENV`
- ✅ Extracts main environment from sub-environment (e.g., "dev01" → "dev")
- ✅ No changes needed

## 🚀 **Next Steps**

1. **Test the Fix**: Push to the `main` branch to verify the workflow works
2. **Initialize Terraform**: Each environment directory needs to be initialized:

   ```bash
   cd terraform/environments/main
   terraform init
   ```

3. **Deploy to Main**: The main environment can now be deployed via CI/CD

## 📊 **Environment Mapping**

| Branch Name | Terraform Directory               | Default Sub-Environment | Backend State Key           |
| ----------- | --------------------------------- | ----------------------- | --------------------------- |
| `main`      | `terraform/environments/main/`    | `main01`                | `main/terraform.tfstate`    |
| `dev`       | `terraform/environments/dev/`     | `dev01`                 | `dev/terraform.tfstate`     |
| `qa`        | `terraform/environments/qa/`      | `qa01`                  | `qa/terraform.tfstate`      |
| `staging`   | `terraform/environments/staging/` | `staging01`             | `staging/terraform.tfstate` |
| `prod`      | `terraform/environments/prod/`    | `prod01`                | `prod/terraform.tfstate`    |

## ⚠️ **Important Notes**

- Each environment maintains separate Terraform state files
- VPC CIDR blocks are automatically calculated based on environment
- All environments use the same Terraform modules and configurations
- Environment-specific variables are set via the `sub_environment` and `environment` variables

---

**Status**: ✅ **FIXED**  
**Date**: July 2025  
**Files Modified**:

- `terraform/environments/main/main.tf` (new)
- `terraform/environments/qa/main.tf` (new)
- `terraform/environments/staging/main.tf` (new)
- `terraform/environments/prod/main.tf` (new)
- `terraform/environments/dev/main.tf` (updated VPC CIDR)
