# Hibiji Platform - AWS URLs & Deployment Guide

## 🌐 **Environment URLs**

### **Base Domain**: `hibiji.com`

**AWS Region**: `us-west-1`

---

## 🚀 **Direct AWS URLs (No DNS Propagation Required)**

### **URL Pattern**

```
Application Load Balancer: hibiji-{sub-environment}-alb-{random-suffix}.us-west-1.elb.amazonaws.com
```

### **What the Placeholders Mean**

#### **`{sub-environment}`**

This is the specific environment identifier:

- `dev01`, `dev02`, `dev03` - Development environments
- `qa01`, `qa02`, `qa03` - QA environments
- `staging01`, `staging02`, `staging03` - Staging environments
- `prod01`, `prod02` - Production environments

#### **`{random-suffix}`**

This is a unique 8-character hexadecimal string generated by Terraform for resource uniqueness. Examples:

- `a1b2c3d4`
- `f5e6d7c8`
- `9a8b7c6d`

#### **`{alb-dns-name}`**

This is the complete Application Load Balancer DNS name. Example:

- `hibiji-dev01-alb-a1b2c3d4.us-west-1.elb.amazonaws.com`

---

## 📋 **Complete Environment URLs**

### **Development Environments**

- **dev01**: `http://hibiji-dev01-alb-{suffix}.us-west-1.elb.amazonaws.com`
- **dev02**: `http://hibiji-dev02-alb-{suffix}.us-west-1.elb.amazonaws.com`
- **dev03**: `http://hibiji-dev03-alb-{suffix}.us-west-1.elb.amazonaws.com`

### **QA Environments**

- **qa01**: `http://hibiji-qa01-alb-{suffix}.us-west-1.elb.amazonaws.com`
- **qa02**: `http://hibiji-qa02-alb-{suffix}.us-west-1.elb.amazonaws.com`
- **qa03**: `http://hibiji-qa03-alb-{suffix}.us-west-1.elb.amazonaws.com`

### **Staging Environments**

- **staging01**: `http://hibiji-staging01-alb-{suffix}.us-west-1.elb.amazonaws.com`
- **staging02**: `http://hibiji-staging02-alb-{suffix}.us-west-1.elb.amazonaws.com`
- **staging03**: `http://hibiji-staging03-alb-{suffix}.us-west-1.elb.amazonaws.com`

### **Production Environments**

- **prod01**: `http://hibiji-prod01-alb-{suffix}.us-west-1.elb.amazonaws.com`
- **prod02**: `http://hibiji-prod02-alb-{suffix}.us-west-1.elb.amazonaws.com`

---

## 🔧 **Service Endpoints**

### **Backend API** (Port 80 - Default)

```
http://{alb-dns-name}/
```

**Example with actual values:**

```
http://hibiji-dev01-alb-a1b2c3d4.us-west-1.elb.amazonaws.com/
```

**Key Endpoints:**

- **Health Check**: `http://{alb-dns-name}/health`
- **API Documentation**: `http://{alb-dns-name}/docs`
- **Root Endpoint**: `http://{alb-dns-name}/`
- **Authentication**: `http://{alb-dns-name}/auth/*`

### **Frontend** (Port 3000)

```
http://{alb-dns-name}:3000/
```

**Example with actual values:**

```
http://hibiji-dev01-alb-a1b2c3d4.us-west-1.elb.amazonaws.com:3000/
```

---

## 🏗️ **AWS Resource Names**

### **ECS Services**

- **Backend Service**: `hibiji-{environment}-backend`
- **Frontend Service**: `hibiji-{environment}-frontend`
- **Cluster**: `hibiji-{environment}-cluster`

**Examples:**

- Backend: `hibiji-dev01-backend`
- Frontend: `hibiji-dev01-frontend`
- Cluster: `hibiji-dev01-cluster`

### **Load Balancer Target Groups**

- **Backend Target Group**: `hibiji-bk-{suffix}`
- **Frontend Target Group**: `hibiji-fr-{suffix}`

**Examples:**

- Backend TG: `hibiji-bk-a1b2c3d4`
- Frontend TG: `hibiji-fr-a1b2c3d4`

### **VPC Resources**

- **VPC**: `hibiji-{sub-environment}-vpc`
- **Security Groups**: `hibiji-{sub-environment}-alb-sg`, `hibiji-{sub-environment}-app-sg`
- **Subnets**: `hibiji-{sub-environment}-public-1`, `hibiji-{sub-environment}-private-1`

---

## 🔍 **How to Find the Exact URLs**

### **Option 1: AWS Console**

1. Go to **EC2** → **Load Balancers**
2. Look for load balancers named `hibiji-{environment}-alb`
3. Copy the **DNS name** from the **Description** tab

### **Option 2: AWS CLI**

```bash
# List all Hibiji load balancers
aws elbv2 describe-load-balancers --region us-west-1 \
  --query 'LoadBalancers[?contains(LoadBalancerName, `hibiji`)].{Name:LoadBalancerName,DNS:DNSName}' \
  --output table

# Get specific environment load balancer
aws elbv2 describe-load-balancers --region us-west-1 \
  --query 'LoadBalancers[?contains(LoadBalancerName, `hibiji-dev01`)].DNSName' \
  --output text
```

### **Option 3: Terraform Output**

Add this to your Terraform configuration:

```hcl
output "alb_dns_name" {
  value = aws_lb.main.dns_name
}

output "alb_name" {
  value = aws_lb.main.name
}
```

Then run:

```bash
terraform output alb_dns_name
```

### **Option 4: ECS Console**

1. Go to **ECS** → **Clusters**
2. Select your cluster (e.g., `hibiji-dev01-cluster`)
3. Go to **Services** tab
4. Click on a service to see the **Load Balancer** configuration

---

## 📊 **Environment Configuration**

### **Resource Sizing**

| Environment | Backend CPU | Backend Memory | Frontend CPU | Frontend Memory | Desired Count |
| ----------- | ----------- | -------------- | ------------ | --------------- | ------------- |
| dev\*       | 256         | 512 MB         | 256          | 512 MB          | 1             |
| qa\*        | 256         | 512 MB         | 256          | 512 MB          | 1             |
| staging\*   | 512         | 1024 MB        | 256          | 512 MB          | 1             |
| prod\*      | 1024        | 2048 MB        | 512          | 1024 MB         | 2             |

### **Database Configuration**

| Environment | Instance Class | Multi-AZ | Storage |
| ----------- | -------------- | -------- | ------- |
| dev\*       | db.t3.micro    | No       | 20 GB   |
| qa\*        | db.t3.micro    | No       | 20 GB   |
| staging\*   | db.t3.micro    | No       | 20 GB   |
| prod\*      | db.t3.small    | Yes      | 20 GB   |

---

## ⚠️ **Important Notes**

### **URL Characteristics**

- ✅ **HTTP only** (no HTTPS on direct ALB URLs)
- ✅ **Available immediately** after Terraform deployment
- ✅ **No DNS propagation** required
- ✅ **Random suffix** for uniqueness
- ⚠️ **Port 3000** required for frontend access

### **Security**

- 🔒 **Private subnets** for ECS tasks
- 🔒 **Security groups** restrict access
- 🔒 **IAM roles** for service permissions
- 🔒 **Secrets Manager** for sensitive data

### **Monitoring**

- 📊 **CloudWatch Logs** for application logs
- 📊 **ALB Access Logs** for traffic monitoring
- 📊 **ECS Service Metrics** for performance
- 📊 **RDS Performance Insights** for database monitoring

---

## 🚀 **Quick Access Commands**

### **Test Backend Health**

```bash
curl -f http://hibiji-dev01-alb-{suffix}.us-west-1.elb.amazonaws.com/health
```

### **Test Frontend**

```bash
curl -f http://hibiji-dev01-alb-{suffix}.us-west-1.elb.amazonaws.com:3000/
```

### **Get Service Status**

```bash
aws ecs describe-services \
  --cluster hibiji-dev01-cluster \
  --services hibiji-dev01-backend hibiji-dev01-frontend \
  --region us-west-1
```

---

## 📞 **Troubleshooting**

### **Common Issues**

1. **Service not responding**: Check ECS service status
2. **Health check failing**: Check application logs in CloudWatch
3. **Port access issues**: Verify security group rules
4. **DNS not resolving**: Use direct ALB URLs instead

### **Useful Commands**

```bash
# Check ECS service status
aws ecs describe-services --cluster hibiji-{env}-cluster --services hibiji-{env}-backend --region us-west-1

# View application logs
aws logs tail /ecs/hibiji-{env}-app --region us-west-1 --follow

# Check ALB target health
aws elbv2 describe-target-health --target-group-arn {target-group-arn} --region us-west-1
```

---

**Last Updated**: July 2025  
**Terraform Version**: 1.8.5  
**AWS Region**: us-west-1

---

Your test scripts are present and executable, but the error `zsh: no such file or directory: ./run_all_tests.sh` usually means one of the following:

1. **You are not in the correct directory.**  
   Make sure you are in `/Users/david/Documents/SC/github/dpp/digital-persona-platform/terraform/environments/main` when running the script.

2. **Line endings issue (rare on macOS, but possible if file was created on Windows).**  
   If the script has Windows line endings (`\r\n`), zsh/bash may not recognize it as a valid script.

3. **Shell hash cache issue.**  
   If you just created the file, your shell might not see it until you run `rehash` or open a new terminal.

---

## **How to Fix**

### 1. **Ensure you are in the correct directory:**

```sh
<code_block_to_apply_changes_from>
cd /Users/david/Documents/SC/github/dpp/digital-persona-platform/terraform/environments/main
ls -la run_all_tests.sh
```

You should see the script listed.

### 2. **Try running with bash explicitly:**

```sh
bash run_all_tests.sh
```

### 3. **Check for Windows line endings and fix:**

```sh
file run_all_tests.sh
# If it says "CRLF", fix with:
dos2unix run_all_tests.sh
```

If you don't have `dos2unix`, you can use:

```sh
sed -i '' 's/\r$//' run_all_tests.sh
```

### 4. **If still not working, try:**

```sh
chmod +x run_all_tests.sh
./run_all_tests.sh
```

---

**Summary:**

- Make sure you are in the right directory.
- Try running with `bash run_all_tests.sh`.
- Fix line endings if needed.
- Ensure the script is executable.

Let me know if you still get the error after these steps, and if so, paste the output of:

```sh
ls -la run_all_tests.sh
file run_all_tests.sh
head -5 run_all_tests.sh
```
