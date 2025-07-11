# Terraform "No Configuration Files" Error Fix

## Problem

You're getting this error when running Terraform:

```
Error: No configuration files

Apply requires configuration to be present. Applying without a configuration would mark everything for
destruction, which is normally not what is desired. If you would like to destroy everything, run 'terraform
destroy' instead.
```

## Root Cause

This error occurs when:

1. You're not in the correct directory containing Terraform files
2. The Terraform configuration files are missing
3. You're running Terraform from the wrong location

## Quick Fix

### Option 1: Use the Terraform Runner Script (Recommended)

```bash
# From the project root directory
./scripts/run-terraform.sh
```

This script will:

- ✅ Navigate to the correct directory automatically
- ✅ Set up all required environment variables
- ✅ Provide an interactive menu for Terraform commands
- ✅ Verify the configuration is present

### Option 2: Manual Fix

```bash
# Navigate to the Terraform directory
cd terraform/environments/main

# Verify Terraform files are present
ls -la *.tf

# Set environment variables
export TF_VAR_environment="prod"
export TF_VAR_ecr_repository_url="570827307849.dkr.ecr.us-west-2.amazonaws.com/dpp-backend"
export TF_VAR_frontend_ecr_repository_url="570827307849.dkr.ecr.us-west-2.amazonaws.com/dpp-frontend"
export TF_VAR_image_tag="latest"
export TF_VAR_frontend_image_tag="latest"

# Run Terraform commands
terraform init
terraform plan
terraform apply
```

### Option 3: State Reset (If you have dependency issues)

```bash
# From the project root directory
./scripts/terraform-state-reset.sh
```

## Directory Structure

Your Terraform files should be in:

```
digital-persona-platform/
└── terraform/
    └── environments/
        └── main/
            ├── main.tf          # Main configuration
            ├── main.auto.tfvars # Auto-loaded variables
            └── .terraform/      # Terraform working directory
```

## Verification Steps

1. **Check current directory**:

   ```bash
   pwd
   # Should show: /path/to/digital-persona-platform
   ```

2. **Check Terraform files exist**:

   ```bash
   ls -la terraform/environments/main/*.tf
   # Should show main.tf and other .tf files
   ```

3. **Check Terraform is initialized**:
   ```bash
   cd terraform/environments/main
   ls -la .terraform/
   # Should show terraform working directory
   ```

## Common Issues and Solutions

### Issue: "No configuration files"

**Solution**: Navigate to the correct directory

```bash
cd terraform/environments/main
```

### Issue: "Terraform not initialized"

**Solution**: Run terraform init

```bash
terraform init
```

### Issue: "Missing variables"

**Solution**: Set environment variables

```bash
export TF_VAR_environment="prod"
export TF_VAR_ecr_repository_url="570827307849.dkr.ecr.us-west-2.amazonaws.com/dpp-backend"
export TF_VAR_frontend_ecr_repository_url="570827307849.dkr.ecr.us-west-2.amazonaws.com/dpp-frontend"
```

### Issue: "State conflicts"

**Solution**: Use state reset script

```bash
./scripts/terraform-state-reset.sh
```

## Next Steps

1. **Use the runner script**: `./scripts/run-terraform.sh`
2. **Choose option 1** (terraform init) to initialize
3. **Choose option 2** (terraform plan) to see what will be created
4. **Choose option 3** (terraform apply) to deploy infrastructure

## Safety Notes

- The runner script includes safety prompts for destructive operations
- Always review the terraform plan before applying
- The script automatically sets up environment variables
- You can cancel any operation by answering 'n' to prompts

The fix ensures you're always in the correct directory with proper configuration when running Terraform commands.
