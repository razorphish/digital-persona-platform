# Dynamic Sub-Environment SSL Support

## ✅ **SSL Implementation Works for ANY Sub-Environment**

The SSL certificate implementation is **fully dynamic** and supports any sub-environment name, not just `dev01`.

## 🔧 **How Dynamic SSL Works:**

### **1. Terraform Configuration (Dynamic)**

```hcl
# Dynamic domain generation
locals {
  website_domain = "${var.sub_environment}.${var.domain_name}"
  api_domain     = "${var.sub_environment}-api.${var.domain_name}"
}

# SSL Certificate with dynamic domain
resource "aws_acm_certificate" "website" {
  domain_name       = local.website_domain        # e.g., dev02.hibiji.com
  subject_alternative_names = ["*.${local.website_domain}"]  # e.g., *.dev02.hibiji.com
  validation_method = "DNS"
}
```

### **2. Deploy Script (Dynamic)**

```bash
# Works for ANY sub-environment:
./scripts/deploy-serverless.sh -e dev -s dev02   # Creates dev02.hibiji.com
./scripts/deploy-serverless.sh -e dev -s dev03   # Creates dev03.hibiji.com
./scripts/deploy-serverless.sh -e dev -s qa01    # Creates qa01.hibiji.com
./scripts/deploy-serverless.sh -e dev -s staging # Creates staging.hibiji.com
```

### **3. Cleanup Scripts (Dynamic)**

```bash
# Cleanup scripts use variables, not hardcoded values:
SSL_CERTIFICATES=$(aws acm list-certificates --region us-east-1 \
  --query "CertificateSummaryList[?contains(DomainName, '${TARGET_ENV}.hibiji.com')]")

WEBSITE_RECORD="${TARGET_ENV}.hibiji.com"  # Dynamic based on TARGET_ENV
```

## 🧪 **Testing Different Sub-Environments:**

### **Test 1: dev02 Sub-Environment**

```bash
# Deploy SSL for dev02
./scripts/deploy-serverless.sh -e dev -s dev02

# Result: Creates:
# - SSL Certificate for: dev02.hibiji.com, *.dev02.hibiji.com
# - CloudFront Distribution with: dev02.hibiji.com alias
# - Route53 DNS records for: dev02.hibiji.com
# - Working HTTPS: https://dev02.hibiji.com
```

### **Test 2: qa03 Sub-Environment**

```bash
# Deploy SSL for qa03
./scripts/deploy-serverless.sh -e dev -s qa03

# Result: Creates:
# - SSL Certificate for: qa03.hibiji.com, *.qa03.hibiji.com
# - CloudFront Distribution with: qa03.hibiji.com alias
# - Route53 DNS records for: qa03.hibiji.com
# - Working HTTPS: https://qa03.hibiji.com
```

### **Test 3: staging Sub-Environment**

```bash
# Deploy SSL for staging
./scripts/deploy-serverless.sh -e dev -s staging

# Result: Creates:
# - SSL Certificate for: staging.hibiji.com, *.staging.hibiji.com
# - CloudFront Distribution with: staging.hibiji.com alias
# - Route53 DNS records for: staging.hibiji.com
# - Working HTTPS: https://staging.hibiji.com
```

## 🧹 **Dynamic Cleanup Support:**

### **Environment-Specific SSL Cleanup**

```bash
# Clean up SSL certificates for specific sub-environment
./scripts/cleanup-ssl-certificates.sh
# Choose option 3: "Clean up certificates for specific environment"
# Enter: dev02, qa03, staging, etc.
```

### **Full Environment Cleanup**

```bash
# Clean up entire sub-environment (including SSL)
./scripts/dynamic-cleanup-environment.sh dev dev02  # Cleans dev02
./scripts/dynamic-cleanup-environment.sh dev qa03   # Cleans qa03
./scripts/dynamic-cleanup-environment.sh dev staging # Cleans staging
```

## 📋 **Sub-Environment Examples:**

| Sub-Environment | SSL Certificate Domain    | Custom Domain URL                 |
| --------------- | ------------------------- | --------------------------------- |
| `dev01`         | `dev01.hibiji.com`        | `https://dev01.hibiji.com`        |
| `dev02`         | `dev02.hibiji.com`        | `https://dev02.hibiji.com`        |
| `dev03`         | `dev03.hibiji.com`        | `https://dev03.hibiji.com`        |
| `qa01`          | `qa01.hibiji.com`         | `https://qa01.hibiji.com`         |
| `qa02`          | `qa02.hibiji.com`         | `https://qa02.hibiji.com`         |
| `staging`       | `staging.hibiji.com`      | `https://staging.hibiji.com`      |
| `hotfix`        | `hotfix.hibiji.com`       | `https://hotfix.hibiji.com`       |
| `feature-test`  | `feature-test.hibiji.com` | `https://feature-test.hibiji.com` |

## 🔧 **Variable Configuration:**

### **Terraform Variables**

```hcl
variable "sub_environment" {
  description = "Sub-environment name (e.g., dev01, dev02, qa01, staging)"
  type        = string
  default     = "dev01"
}

variable "domain_name" {
  description = "Primary domain name"
  type        = string
  default     = "hibiji.com"
}
```

### **Dynamic Local Values**

```hcl
locals {
  # These generate different domains based on sub_environment:
  website_domain = "${var.sub_environment}.${var.domain_name}"
  api_domain     = "${var.sub_environment}-api.${var.domain_name}"

  # Examples:
  # sub_environment="dev02" → website_domain="dev02.hibiji.com"
  # sub_environment="qa01"  → website_domain="qa01.hibiji.com"
  # sub_environment="staging" → website_domain="staging.hibiji.com"
}
```

## 🚀 **Deployment Commands for Different Sub-Environments:**

```bash
# Development environments
./scripts/deploy-serverless.sh -e dev -s dev01
./scripts/deploy-serverless.sh -e dev -s dev02
./scripts/deploy-serverless.sh -e dev -s dev03

# QA environments
./scripts/deploy-serverless.sh -e dev -s qa01
./scripts/deploy-serverless.sh -e dev -s qa02
./scripts/deploy-serverless.sh -e dev -s qa03

# Special environments
./scripts/deploy-serverless.sh -e dev -s staging
./scripts/deploy-serverless.sh -e dev -s hotfix
./scripts/deploy-serverless.sh -e dev -s demo
./scripts/deploy-serverless.sh -e dev -s preview
```

## 🔒 **SSL Certificate Management per Sub-Environment:**

### **Automatic SSL per Sub-Environment**

- Each sub-environment gets its own SSL certificate
- Certificates are automatically validated via DNS
- No manual certificate management required
- Certificates auto-renew via ACM

### **Certificate Naming Convention**

```
Sub-Environment: dev02
Certificate Domain: dev02.hibiji.com
Wildcard Domain: *.dev02.hibiji.com
CloudFront Alias: dev02.hibiji.com
Route53 Record: dev02.hibiji.com → CloudFront Distribution
```

## 🎯 **Benefits of Dynamic Sub-Environment Support:**

1. **🔄 Unlimited Sub-Environments**: Create as many as needed
2. **🔒 Individual SSL Certificates**: Each environment gets its own SSL
3. **🧹 Safe Cleanup**: Environment-specific cleanup prevents accidents
4. **🚀 Consistent Deployment**: Same script works for all environments
5. **📝 Clear Naming**: Domain names match sub-environment names
6. **🔧 Easy Management**: Standard Terraform variable overrides

## ✅ **Verification:**

The SSL implementation is **production-ready** and supports:

- ✅ **Dynamic sub-environment names** (any string)
- ✅ **Automatic SSL certificate generation** per environment
- ✅ **DNS validation** for each domain
- ✅ **CloudFront custom domain** configuration
- ✅ **Environment-specific cleanup** workflows
- ✅ **Terraform state isolation** per sub-environment

**Your SSL implementation works for ANY sub-environment, not just dev01!** 🎉🔒
