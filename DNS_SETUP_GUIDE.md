# 🌐 Hibiji.com DNS Setup Guide

This guide will help you configure hibiji.com to work with your AWS infrastructure.

## 📋 **Prerequisites**

- **Domain Registrar Access**: Access to your domain registrar (GoDaddy, Namecheap, etc.)
- **AWS Account**: With Route53 and ACM permissions
- **Terraform Access**: To deploy DNS infrastructure

---

## 🚀 **Step 1: Deploy Route53 Infrastructure**

First, deploy your Terraform infrastructure to create the Route53 hosted zone:

```bash
# Deploy to your main environment
cd terraform/environments/main
terraform init
terraform plan -out=tfplan
terraform apply tfplan

# Or deploy via GitHub Actions
# Go to Actions → "Hibiji CI/CD Pipeline" → Run workflow → Select main branch
```

This will create:

- Route53 hosted zone for `hibiji.com`
- ACM certificate for `hibiji.com` and `*.hibiji.com`
- Initial DNS records

---

## 🔧 **Step 2: Get AWS Nameservers**

After deployment, get the AWS nameservers:

```bash
# Get the hosted zone ID
aws route53 list-hosted-zones --query 'HostedZones[?Name==`hibiji.com.`].Id' --output text

# Get nameservers
aws route53 get-hosted-zone --id <zone-id> --query 'DelegationSet.NameServers' --output text
```

**Expected Output:**

```
ns-1234.awsdns-12.com
ns-5678.awsdns-34.net
ns-9012.awsdns-56.org
ns-3456.awsdns-78.co.uk
```

---

## 🌍 **Step 3: Configure Domain Registrar**

### **Option A: Update Nameservers (Recommended)**

1. **Log into your domain registrar** (GoDaddy, Namecheap, etc.)
2. **Find DNS/Nameserver settings** for hibiji.com
3. **Replace existing nameservers** with AWS nameservers:

```
ns-1234.awsdns-12.com
ns-5678.awsdns-34.net
ns-9012.awsdns-56.org
ns-3456.awsdns-78.co.uk
```

### **Option B: Use DNS Records (Alternative)**

If you can't change nameservers, create these records at your registrar:

| Type  | Name      | Value          | TTL |
| ----- | --------- | -------------- | --- |
| A     | @         | [ALB DNS Name] | 300 |
| CNAME | www       | hibiji.com     | 300 |
| CNAME | api       | hibiji.com     | 300 |
| CNAME | dev01     | hibiji.com     | 300 |
| CNAME | qa01      | hibiji.com     | 300 |
| CNAME | staging01 | hibiji.com     | 300 |
| CNAME | main01    | hibiji.com     | 300 |

---

## 🔐 **Step 4: SSL Certificate Validation**

### **Get Certificate Validation Records**

```bash
# Get certificate ARN
aws acm list-certificates --query 'CertificateSummaryList[?DomainName==`hibiji.com`].CertificateArn' --output text

# Get validation records
aws acm describe-certificate --certificate-arn <cert-arn> --query 'Certificate.DomainValidationOptions[0].ResourceRecord'
```

### **Add Validation Records to Route53**

The Terraform should automatically create these, but verify:

```bash
# Check if validation records exist
aws route53 list-resource-record-sets --hosted-zone-id <zone-id> --query 'ResourceRecordSets[?Type==`CNAME`]'
```

---

## 📊 **Step 5: Verify DNS Configuration**

### **Check DNS Propagation**

```bash
# Check nameserver propagation
dig hibiji.com NS

# Check A record
dig hibiji.com A

# Check CNAME records
dig www.hibiji.com CNAME
dig dev01.hibiji.com CNAME
```

### **Test Domain Resolution**

```bash
# Test main domain
curl -I https://hibiji.com

# Test sub-environments
curl -I https://dev01.hibiji.com
curl -I https://qa01.hibiji.com
curl -I https://staging01.hibiji.com
curl -I https://main01.hibiji.com
```

---

## 🏗️ **Step 6: Complete DNS Record Structure**

Your final DNS structure should look like this:

### **Main Records**

```
hibiji.com          → ALB DNS Name (A record)
www.hibiji.com      → hibiji.com (CNAME)
api.hibiji.com      → hibiji.com (CNAME)
```

### **Environment Records**

```
dev01.hibiji.com    → dev01 ALB DNS Name (A record)
dev02.hibiji.com    → dev02 ALB DNS Name (A record)
dev03.hibiji.com    → dev03 ALB DNS Name (A record)

qa01.hibiji.com     → qa01 ALB DNS Name (A record)
qa02.hibiji.com     → qa02 ALB DNS Name (A record)
qa03.hibiji.com     → qa03 ALB DNS Name (A record)

staging01.hibiji.com → staging01 ALB DNS Name (A record)
staging02.hibiji.com → staging02 ALB DNS Name (A record)
staging03.hibiji.com → staging03 ALB DNS Name (A record)

main01.hibiji.com   → main01 ALB DNS Name (A record)
prod01.hibiji.com   → prod01 ALB DNS Name (A record)
prod02.hibiji.com   → prod02 ALB DNS Name (A record)
```

### **SSL Certificate Records**

```
_acme-challenge.hibiji.com → [ACM validation CNAME]
```

---

## 🔍 **Step 7: Troubleshooting**

### **Common Issues**

#### **1. DNS Not Propagating**

```bash
# Check from multiple locations
nslookup hibiji.com 8.8.8.8
nslookup hibiji.com 1.1.1.1
```

#### **2. SSL Certificate Not Validating**

```bash
# Check certificate status
aws acm describe-certificate --certificate-arn <cert-arn>

# Verify validation records exist
aws route53 list-resource-record-sets --hosted-zone-id <zone-id> --query 'ResourceRecordSets[?contains(Name, `_acme-challenge`)]'
```

#### **3. Sub-domain Not Working**

```bash
# Check if ALB exists
aws elbv2 describe-load-balancers --query 'LoadBalancers[?contains(LoadBalancerName, `hibiji-dev01`)]'

# Check Route53 record
aws route53 list-resource-record-sets --hosted-zone-id <zone-id> --query 'ResourceRecordSets[?Name==`dev01.hibiji.com.`]'
```

---

## 📈 **Step 8: Monitoring & Alerts**

### **Set Up DNS Monitoring**

```bash
# Create Route53 health checks
aws route53 create-health-check \
  --caller-reference $(date +%s) \
  --health-check-config '{
    "Type": "HTTP",
    "Port": 80,
    "ResourcePath": "/health",
    "FullyQualifiedDomainName": "hibiji.com",
    "RequestInterval": 30,
    "FailureThreshold": 3
  }'
```

### **CloudWatch Alarms**

```bash
# Create DNS resolution alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "hibiji-dns-resolution" \
  --alarm-description "DNS resolution failure" \
  --metric-name "HealthCheckStatus" \
  --namespace "AWS/Route53" \
  --statistic "Average" \
  --period 60 \
  --threshold 1 \
  --comparison-operator "LessThanThreshold"
```

---

## 🚀 **Step 9: Final Verification**

### **Complete Health Check**

```bash
#!/bin/bash
# Complete DNS and service verification

DOMAINS=(
  "hibiji.com"
  "www.hibiji.com"
  "dev01.hibiji.com"
  "qa01.hibiji.com"
  "staging01.hibiji.com"
  "main01.hibiji.com"
)

echo "🔍 Verifying DNS configuration..."

for domain in "${DOMAINS[@]}"; do
  echo "Checking $domain..."

  # DNS resolution
  if nslookup $domain >/dev/null 2>&1; then
    echo "  ✅ DNS: OK"
  else
    echo "  ❌ DNS: FAILED"
  fi

  # HTTPS access
  if curl -fs --max-time 10 https://$domain/health >/dev/null 2>&1; then
    echo "  ✅ HTTPS: OK"
  else
    echo "  ⚠️ HTTPS: Failed (may be expected for some domains)"
  fi

  # SSL certificate
  if openssl s_client -connect $domain:443 -servername $domain </dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
    echo "  ✅ SSL: OK"
  else
    echo "  ⚠️ SSL: Failed (may be expected for some domains)"
  fi

  echo ""
done

echo "🎉 DNS setup verification complete!"
```

---

## 📞 **Support**

### **If You Need Help**

1. **Check AWS Route53 Console**: https://console.aws.amazon.com/route53/
2. **Verify Certificate Status**: https://console.aws.amazon.com/acm/
3. **Test DNS Propagation**: https://www.whatsmydns.net/
4. **Contact Support**: devops@hibiji.com

### **Useful Commands**

```bash
# Get all Route53 zones
aws route53 list-hosted-zones

# Get all records in a zone
aws route53 list-resource-record-sets --hosted-zone-id <zone-id>

# Test DNS resolution
dig +short hibiji.com

# Check SSL certificate
openssl s_client -connect hibiji.com:443 -servername hibiji.com
```

---

**Status**: Ready for DNS Configuration  
**Last Updated**: July 2025  
**Next Steps**: Deploy infrastructure → Configure nameservers → Verify propagation
