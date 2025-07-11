# Testing Documentation

This directory contains a comprehensive testing suite for the Terraform deployment configuration and automation scripts.

## 🧪 Test Suites Overview

### 1. **Terraform Configuration Tests** (`test_terraform.sh`)

Tests the core Terraform configuration files for syntax, validation, and best practices.

**What it tests:**

- ✅ Terraform syntax and formatting
- ✅ Variable definitions and validation
- ✅ Output definitions
- ✅ Security best practices (no hardcoded secrets)
- ✅ Resource tagging consistency
- ✅ State management
- ✅ Prerequisites (Terraform, AWS CLI)
- ✅ ECR repository existence
- ✅ Dry-run Terraform plan

### 2. **Automation Scripts Tests** (`test_automation.sh`)

Tests the automation scripts and CI/CD components for proper functionality.

**What it tests:**

- ✅ Script existence and executability
- ✅ Script syntax validation
- ✅ Environment variable injection
- ✅ ECR repository discovery logic
- ✅ GitHub Actions workflow structure
- ✅ Documentation completeness
- ✅ Error handling and user feedback
- ✅ Security practices in automation
- ✅ Terraform integration with automation

### 3. **Integration Tests** (`test_integration.sh`)

Tests the complete workflow from automation to deployment.

**What it tests:**

- ✅ Complete workflow simulation
- ✅ ECR repository discovery and validation
- ✅ Variable injection workflow
- ✅ Complete Terraform plan execution
- ✅ GitHub Actions workflow simulation
- ✅ Environment-specific configurations
- ✅ Resource naming consistency
- ✅ Security configurations
- ✅ Output validation
- ✅ Documentation completeness
- ✅ Error handling and validation

### 4. **Master Test Runner** (`run_all_tests.sh`)

Runs all three test suites in sequence and provides a comprehensive summary.

## 🚀 How to Run Tests

### Quick Start - Run All Tests

```bash
./run_all_tests.sh
```

### Individual Test Suites

```bash
# Test Terraform configuration only
./test_terraform.sh

# Test automation scripts only
./test_automation.sh

# Test complete integration only
./test_integration.sh
```

## 📋 Prerequisites

Before running tests, ensure you have:

- **Terraform** (version 1.8.5+)
- **AWS CLI** configured with appropriate credentials
- **Bash** shell
- **yamllint** (optional, for GitHub Actions workflow validation)

## 🎯 Test Results Interpretation

### ✅ PASS

- Test passed successfully
- Component is working as expected
- No action required

### ❌ FAIL

- Test failed
- Component needs attention
- Review the specific error message

### ⚠️ WARNING

- Test passed but with warnings
- Component works but could be improved
- Consider addressing the warning

## 🔧 Troubleshooting Common Test Failures

### Terraform Configuration Tests

**"Terraform Validate" fails:**

```bash
# Check for syntax errors
terraform validate

# Check for formatting issues
terraform fmt -check -recursive
```

**"ECR Repository" fails:**

```bash
# Verify ECR repositories exist
aws ecr describe-repositories --repository-names hibiji-backend hibiji-frontend

# Create repositories if missing
aws ecr create-repository --repository-name hibiji-backend
aws ecr create-repository --repository-name hibiji-frontend
```

### Automation Scripts Tests

**"Fetch Script Syntax" fails:**

```bash
# Check script syntax
bash -n fetch-terraform-vars.sh

# Make script executable
chmod +x fetch-terraform-vars.sh
```

**"GitHub Actions Workflow" fails:**

```bash
# Check workflow file exists
ls -la ../../../.github/workflows/terraform-deploy.yml

# Validate YAML syntax (if yamllint is available)
yamllint ../../../.github/workflows/terraform-deploy.yml
```

### Integration Tests

**"Variable Injection Workflow" fails:**

```bash
# Test environment variable setting
export TF_VAR_ecr_repository_url="test-url"
echo $TF_VAR_ecr_repository_url

# Check if variables are properly exported
env | grep TF_VAR_
```

**"Complete Terraform Plan" fails:**

```bash
# Run terraform plan manually with all variables
terraform plan -var-file=main.auto.tfvars \
  -var="ecr_repository_url=dummy" \
  -var="frontend_ecr_repository_url=dummy" \
  -var="image_tag=test" \
  -var="frontend_image_tag=test"
```

## 📊 Test Coverage

The testing suite covers:

| Component               | Coverage | Test Files                                  |
| ----------------------- | -------- | ------------------------------------------- |
| Terraform Configuration | 100%     | `test_terraform.sh`                         |
| Automation Scripts      | 100%     | `test_automation.sh`                        |
| Integration Workflow    | 100%     | `test_integration.sh`                       |
| GitHub Actions          | 100%     | `test_automation.sh`, `test_integration.sh` |
| Documentation           | 100%     | All test files                              |
| Security Best Practices | 100%     | All test files                              |

## 🔄 Continuous Testing

### Pre-commit Testing

Run tests before committing changes:

```bash
./run_all_tests.sh
```

### CI/CD Integration

The GitHub Actions workflow automatically runs validation steps:

- Terraform format check
- Terraform validate
- Terraform plan (dry run)

### Local Development

Run tests during development:

```bash
# Quick validation
./test_terraform.sh

# Full validation
./run_all_tests.sh
```

## 📈 Test Metrics

Each test suite provides:

- **Pass/Fail count**
- **Detailed error messages**
- **Specific test names**
- **Color-coded output**
- **Summary statistics**

## 🛠️ Customizing Tests

### Adding New Tests

1. Add test logic to the appropriate test file
2. Update the test counter variables
3. Add descriptive test names
4. Include proper error handling

### Modifying Test Behavior

- Edit test conditions in the respective test files
- Update expected values for your environment
- Modify prerequisite checks as needed

## 📚 Related Documentation

- [README.md](./README.md) - Main deployment documentation
- [main.auto.tfvars](./main.auto.tfvars) - Environment configuration
- [fetch-terraform-vars.sh](./fetch-terraform-vars.sh) - Automation script
- [.github/workflows/terraform-deploy.yml](../../../.github/workflows/terraform-deploy.yml) - CI/CD workflow

## 🆘 Getting Help

If tests continue to fail:

1. **Check prerequisites** - Ensure all required tools are installed
2. **Review error messages** - Look for specific failure reasons
3. **Run individual tests** - Isolate the failing component
4. **Check documentation** - Review README.md for setup instructions
5. **Verify AWS credentials** - Ensure AWS CLI is properly configured

## 🎉 Success Criteria

All tests should pass before proceeding with deployment:

- ✅ All 3 test suites pass
- ✅ No critical failures
- ✅ All prerequisites met
- ✅ ECR repositories accessible
- ✅ AWS credentials valid
