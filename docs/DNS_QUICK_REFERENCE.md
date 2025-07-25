# 🌐 DNS Quick Reference Guide - hibiji.com

## 🚀 **Quick Start**

### **1. Complete DNS Setup**

```bash
./scripts/setup-dns-complete.sh
```

### **2. Get AWS Nameservers**

```bash
./scripts/dns-setup.sh
```

### **3. Test DNS Configuration**

```bash
./scripts/dns-test.sh
```

---

## 📋 **Domain Structure**

### **Main Domain**

- `hibiji.com` - Primary domain
- `www.hibiji.com` - WWW subdomain

### **Environment Subdomains**

- `dev01.hibiji.com` to `dev99.hibiji.com` - Development
- `qa01.hibiji.com` to `qa99.hibiji.com` - QA
- `staging01.hibiji.com` to `staging99.hibiji.com` - Staging
- `main01.hibiji.com` to `main99.hibiji.com` - Main
- `prod01.hibiji.com` to `prod99.hibiji.com` - Production

### **Wildcard Subdomains**

- `*.hibiji.com` - Any subdomain
- `*.dev.hibiji.com` - Dev wildcards
- `*.qa.hibiji.com` - QA wildcards
- `*.staging.hibiji.com` - Staging wildcards
- `*.prod.hibiji.com` - Production wildcards

---

## 🔧 **Management Commands**

### **Create New Subdomain**

```bash
# Single subdomain
./scripts/create-subdomain.sh dev09

# With custom ALB
./scripts/create-subdomain.sh dev09 hibiji-dev09-alb-123456.us-west-1.elb.amazonaws.com

# Batch creation
./scripts/create-subdomain.sh batch dev 01 10
```

### **Test DNS Health**

```bash
# Comprehensive health check
./scripts/dns-health-check.sh

# Quick DNS test
./scripts/dns-test.sh

# Verify Route53 records
./scripts/verify-route53-records.sh
```

### **Check SSL Certificate**

```bash
# Check certificate status
aws acm list-certificates --query "CertificateSummaryList[?DomainName=='hibiji.com'].CertificateArn" --output text

# Get certificate details
aws acm describe-certificate --certificate-arn <cert-arn>
```

---

## 🌍 **Domain Registrar Setup**

### **Required Nameservers**

After running `./scripts/dns-setup.sh`, update your domain registrar with these nameservers:

```
ns-1234.awsdns-12.com
ns-5678.awsdns-34.net
ns-9012.awsdns-56.org
ns-3456.awsdns-78.co.uk
```

### **Registrar Instructions**

1. Log into your domain registrar (GoDaddy, Namecheap, etc.)
2. Find DNS/Nameserver settings for `hibiji.com`
3. Replace existing nameservers with AWS nameservers above
4. Save changes
5. Wait 24-48 hours for propagation

---

## 🔍 **Troubleshooting**

### **DNS Not Working**

```bash
# Check nameserver propagation
dig hibiji.com NS

# Test from different DNS servers
dig @8.8.8.8 hibiji.com A
dig @1.1.1.1 hibiji.com A

# Check Route53 records
aws route53 list-resource-record-sets --hosted-zone-id <zone-id>
```

### **SSL Certificate Issues**

```bash
# Check certificate status
aws acm describe-certificate --certificate-arn <cert-arn> --query 'Certificate.Status'

# Verify validation records
aws route53 list-resource-record-sets --hosted-zone-id <zone-id> --query 'ResourceRecordSets[?contains(Name, `_acme-challenge`)]'
```

### **Subdomain Not Working**

```bash
# Check if ALB exists
aws elbv2 describe-load-balancers --query 'LoadBalancers[?contains(LoadBalancerName, `hibiji-dev09`)]'

# Check Route53 record
aws route53 list-resource-record-sets --hosted-zone-id <zone-id> --query 'ResourceRecordSets[?Name==`dev09.hibiji.com.`]'
```

---

## 📊 **Monitoring**

### **Health Checks**

```bash
# Run comprehensive health check
./scripts/dns-health-check.sh

# Check specific domain
curl -I https://dev09.hibiji.com

# Test SSL certificate
openssl s_client -connect dev09.hibiji.com:443 -servername dev09.hibiji.com
```

### **Route53 Health Checks**

```bash
# List health checks
aws route53 list-health-checks

# Create health check
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

---

## 🛠️ **Advanced Configuration**

### **Wildcard Certificate**

```hcl
resource "aws_acm_certificate" "main" {
  domain_name       = "hibiji.com"
  validation_method = "DNS"

  subject_alternative_names = [
    "*.hibiji.com",
    "*.dev.hibiji.com",
    "*.qa.hibiji.com",
    "*.staging.hibiji.com",
    "*.prod.hibiji.com"
  ]
}
```

### **Wildcard DNS Record**

```hcl
resource "aws_route53_record" "wildcard" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "*.hibiji.com"
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}
```

### **Dynamic Subdomains**

```hcl
locals {
  dev_subdomains = [
    "dev01", "dev02", "dev03", "dev04", "dev05",
    "dev06", "dev07", "dev08", "dev09", "dev10"
  ]
}

resource "aws_route53_record" "dev_subdomains" {
  for_each = toset(local.dev_subdomains)

  zone_id = aws_route53_zone.main.zone_id
  name    = "${each.value}.hibiji.com"
  type    = "A"

  alias {
    name                   = var.dev_alb_dns_name
    zone_id                = var.dev_alb_zone_id
    evaluate_target_health = true
  }
}
```

---

## 📞 **Support**

### **Useful Commands**

```bash
# Get hosted zone ID
aws route53 list-hosted-zones --query "HostedZones[?Name=='hibiji.com.'].Id" --output text

# Get all records
aws route53 list-resource-record-sets --hosted-zone-id <zone-id>

# Test DNS resolution
dig +short hibiji.com

# Check SSL certificate
openssl s_client -connect hibiji.com:443 -servername hibiji.com
```

### **External Tools**

- **DNS Propagation**: https://www.whatsmydns.net/
- **SSL Checker**: https://www.ssllabs.com/ssltest/
- **Route53 Console**: https://console.aws.amazon.com/route53/
- **ACM Console**: https://console.aws.amazon.com/acm/

---

## 📝 **Notes**

- **DNS Propagation**: Can take 24-48 hours globally
- **SSL Validation**: Requires DNS validation records
- **Wildcard Certificates**: Cover all subdomains automatically
- **ALB Zone ID**: Use `Z1H1FL5HABSF5` for us-west-1
- **Health Checks**: Monitor domain availability
- **Backup**: Export records regularly with `./scripts/verify-route53-records.sh`

---

**Last Updated**: January 2025  
**Status**: Ready for Production Use
