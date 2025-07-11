# 🌐 Hibiji.com DNS Setup Guide

This guide will help you configure hibiji.com to work with your AWS infrastructure, including wildcard subdomain support for dynamic environments like `dev09`.

## 📋 **Prerequisites**

- **Domain Registrar Access**: Access to your domain registrar (GoDaddy, Namecheap, etc.)
- **AWS Account**: With Route53 and ACM permissions
- **Terraform Access**: To deploy DNS infrastructure
- **AWS CLI**: Configured with appropriate permissions

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
- ACM certificate for `hibiji.com` and `*.hibiji.com` (wildcard)
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

## 🏗️ **Step 5: Wildcard Subdomain Configuration**

### **5.1 ACM Certificate with Wildcard Support**

Your ACM certificate should include:

```hcl
resource "aws_acm_certificate" "main" {
  domain_name       = "hibiji.com"
  validation_method = "DNS"

  subject_alternative_names = [
    "*.hibiji.com",           # Wildcard for all subdomains
    "*.dev.hibiji.com",       # Wildcard for dev subdomains
    "*.qa.hibiji.com",        # Wildcard for qa subdomains
    "*.staging.hibiji.com",   # Wildcard for staging subdomains
    "*.prod.hibiji.com"       # Wildcard for prod subdomains
  ]

  lifecycle {
    create_before_destroy = true
  }
}
```

### **5.2 Route53 Wildcard Records**

Create wildcard records for dynamic subdomains:

```hcl
# Wildcard record for all subdomains
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

# Specific environment wildcards
resource "aws_route53_record" "dev_wildcard" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "*.dev.hibiji.com"
  type    = "A"

  alias {
    name                   = var.dev_alb_dns_name
    zone_id                = var.dev_alb_zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "qa_wildcard" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "*.qa.hibiji.com"
  type    = "A"

  alias {
    name                   = var.qa_alb_dns_name
    zone_id                = var.qa_alb_zone_id
    evaluate_target_health = true
  }
}
```

### **5.3 Dynamic Subdomain Support**

For dynamic subdomains like `dev09`, `dev10`, etc., use a more flexible approach:

```hcl
# Dynamic subdomain records using for_each
locals {
  # Define your subdomain patterns
  dev_subdomains = [
    "dev01", "dev02", "dev03", "dev04", "dev05",
    "dev06", "dev07", "dev08", "dev09", "dev10"
  ]

  qa_subdomains = [
    "qa01", "qa02", "qa03", "qa04", "qa05"
  ]

  staging_subdomains = [
    "staging01", "staging02", "staging03"
  ]

  prod_subdomains = [
    "prod01", "prod02"
  ]
}

# Create records for each subdomain
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

resource "aws_route53_record" "qa_subdomains" {
  for_each = toset(local.qa_subdomains)

  zone_id = aws_route53_zone.main.zone_id
  name    = "${each.value}.hibiji.com"
  type    = "A"

  alias {
    name                   = var.qa_alb_dns_name
    zone_id                = var.qa_alb_zone_id
    evaluate_target_health = true
  }
}
```

---

## 📊 **Step 6: Complete DNS Record Structure**

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
...
dev09.hibiji.com    → dev09 ALB DNS Name (A record)
dev10.hibiji.com    → dev10 ALB DNS Name (A record)

qa01.hibiji.com     → qa01 ALB DNS Name (A record)
qa02.hibiji.com     → qa02 ALB DNS Name (A record)
qa03.hibiji.com     → qa03 ALB DNS Name (A record)
...
qa09.hibiji.com     → qa09 ALB DNS Name (A record)

staging01.hibiji.com → staging01 ALB DNS Name (A record)
staging02.hibiji.com → staging02 ALB DNS Name (A record)
staging03.hibiji.com → staging03 ALB DNS Name (A record)

main01.hibiji.com   → main01 ALB DNS Name (A record)
prod01.hibiji.com   → prod01 ALB DNS Name (A record)
prod02.hibiji.com   → prod02 ALB DNS Name (A record)
```

### **Wildcard Records**

```
*.hibiji.com        → Default ALB DNS Name (A record)
*.dev.hibiji.com    → Dev ALB DNS Name (A record)
*.qa.hibiji.com     → QA ALB DNS Name (A record)
*.staging.hibiji.com → Staging ALB DNS Name (A record)
*.prod.hibiji.com   → Prod ALB DNS Name (A record)
```

### **SSL Certificate Records**

```
_acme-challenge.hibiji.com → [ACM validation CNAME]
```

---

## 🔍 **Step 7: DNS Testing and Verification**

### **7.1 Comprehensive DNS Testing Script**

Create a comprehensive testing script:

```bash
#!/bin/bash
# dns-test.sh - Comprehensive DNS testing for hibiji.com

DOMAIN="hibiji.com"
ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name==\`$DOMAIN.\`].Id" --output text)

echo "🌐 DNS Testing for $DOMAIN"
echo "=========================="

# Test main domain
echo "Testing main domain..."
dig $DOMAIN A +short
dig $DOMAIN NS +short

# Test www subdomain
echo "Testing www subdomain..."
dig www.$DOMAIN A +short

# Test environment subdomains
ENVIRONMENTS=("dev01" "dev02" "dev03" "dev09" "dev10" "qa01" "qa02" "qa03" "staging01" "staging02" "main01" "prod01")

for env in "${ENVIRONMENTS[@]}"; do
    echo "Testing $env.$DOMAIN..."
    dig $env.$DOMAIN A +short
done

# Test wildcard subdomains
echo "Testing wildcard subdomains..."
dig random.$DOMAIN A +short
dig test.dev.$DOMAIN A +short
dig test.qa.$DOMAIN A +short

# Test SSL certificate
echo "Testing SSL certificate..."
openssl s_client -connect $DOMAIN:443 -servername $DOMAIN </dev/null 2>/dev/null | grep "Verify return code"

echo "DNS testing complete!"
```

### **7.2 Automated DNS Health Check**

```bash
#!/bin/bash
# dns-health-check.sh

DOMAIN="hibiji.com"
HEALTH_ENDPOINT="/health"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "🏥 DNS Health Check for $DOMAIN"
echo "================================"

# Test domains
DOMAINS=(
    "$DOMAIN"
    "www.$DOMAIN"
    "dev01.$DOMAIN"
    "dev09.$DOMAIN"
    "qa01.$DOMAIN"
    "staging01.$DOMAIN"
    "main01.$DOMAIN"
)

for domain in "${DOMAINS[@]}"; do
    echo "Checking $domain..."

    # DNS resolution
    if nslookup $domain >/dev/null 2>&1; then
        echo -e "  ${GREEN}✅ DNS: OK${NC}"
    else
        echo -e "  ${RED}❌ DNS: FAILED${NC}"
        continue
    fi

    # HTTPS access
    if curl -fs --max-time 10 https://$domain$HEALTH_ENDPOINT >/dev/null 2>&1; then
        echo -e "  ${GREEN}✅ HTTPS: OK${NC}"
    else
        echo -e "  ${YELLOW}⚠️ HTTPS: Failed (may be expected)${NC}"
    fi

    # SSL certificate
    if openssl s_client -connect $domain:443 -servername $domain </dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
        echo -e "  ${GREEN}✅ SSL: OK${NC}"
    else
        echo -e "  ${YELLOW}⚠️ SSL: Failed (may be expected)${NC}"
    fi

    echo ""
done

echo "🎉 DNS health check complete!"
```

### **7.3 Route53 Record Verification**

```bash
#!/bin/bash
# verify-route53-records.sh

DOMAIN="hibiji.com"
ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name==\`$DOMAIN.\`].Id" --output text)

echo "🔍 Verifying Route53 Records for $DOMAIN"
echo "========================================"

# List all records
echo "All DNS records in zone:"
aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID --query 'ResourceRecordSets[?Type==`A`].{Name:Name,Type:Type,Value:AliasTarget.DNSName}' --output table

# Check for wildcard records
echo ""
echo "Wildcard records:"
aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID --query 'ResourceRecordSets[?contains(Name, `*`)].{Name:Name,Type:Type}' --output table

# Check for environment records
echo ""
echo "Environment records:"
aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID --query 'ResourceRecordSets[?contains(Name, `dev`) || contains(Name, `qa`) || contains(Name, `staging`) || contains(Name, `prod`)].{Name:Name,Type:Type}' --output table
```

---

## 🚀 **Step 8: Dynamic Subdomain Creation**

### **8.1 Script to Create New Subdomains**

```bash
#!/bin/bash
# create-subdomain.sh

DOMAIN="hibiji.com"
ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name==\`$DOMAIN.\`].Id" --output text)

if [ $# -eq 0 ]; then
    echo "Usage: $0 <subdomain> [alb-dns-name] [alb-zone-id]"
    echo "Example: $0 dev09 hibiji-dev09-alb-123456.us-west-1.elb.amazonaws.com Z1234567890ABC"
    exit 1
fi

SUBDOMAIN=$1
ALB_DNS_NAME=${2:-"hibiji-$SUBDOMAIN-alb-123456.us-west-1.elb.amazonaws.com"}
ALB_ZONE_ID=${3:-"Z1234567890ABC"}

echo "Creating subdomain: $SUBDOMAIN.$DOMAIN"
echo "ALB DNS Name: $ALB_DNS_NAME"
echo "ALB Zone ID: $ALB_ZONE_ID"

# Create the DNS record
aws route53 change-resource-record-sets \
    --hosted-zone-id $ZONE_ID \
    --change-batch '{
        "Changes": [
            {
                "Action": "UPSERT",
                "ResourceRecordSet": {
                    "Name": "'$SUBDOMAIN.$DOMAIN'",
                    "Type": "A",
                    "AliasTarget": {
                        "HostedZoneId": "'$ALB_ZONE_ID'",
                        "DNSName": "'$ALB_DNS_NAME'",
                        "EvaluateTargetHealth": true
                    }
                }
            }
        ]
    }'

echo "✅ Subdomain $SUBDOMAIN.$DOMAIN created successfully!"
```

### **8.2 Batch Subdomain Creation**

```bash
#!/bin/bash
# create-batch-subdomains.sh

DOMAIN="hibiji.com"
ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name==\`$DOMAIN.\`].Id" --output text)

# Define subdomains to create
SUBDOMAINS=(
    "dev04" "dev05" "dev06" "dev07" "dev08" "dev09" "dev10"
    "qa04" "qa05" "qa06" "qa07" "qa08" "qa09" "qa10"
    "staging04" "staging05" "staging06"
    "prod03" "prod04" "prod05"
)

echo "Creating batch subdomains for $DOMAIN"
echo "====================================="

for subdomain in "${SUBDOMAINS[@]}"; do
    echo "Creating $subdomain.$DOMAIN..."

    # Generate ALB DNS name (you'll need to replace with actual ALB DNS names)
    ALB_DNS_NAME="hibiji-$subdomain-alb-123456.us-west-1.elb.amazonaws.com"
    ALB_ZONE_ID="Z1234567890ABC"

    aws route53 change-resource-record-sets \
        --hosted-zone-id $ZONE_ID \
        --change-batch '{
            "Changes": [
                {
                    "Action": "UPSERT",
                    "ResourceRecordSet": {
                        "Name": "'$subdomain.$DOMAIN'",
                        "Type": "A",
                        "AliasTarget": {
                            "HostedZoneId": "'$ALB_ZONE_ID'",
                            "DNSName": "'$ALB_DNS_NAME'",
                            "EvaluateTargetHealth": true
                        }
                    }
                }
            ]
        }' >/dev/null 2>&1

    if [ $? -eq 0 ]; then
        echo "✅ $subdomain.$DOMAIN created"
    else
        echo "❌ Failed to create $subdomain.$DOMAIN"
    fi
done

echo "🎉 Batch subdomain creation complete!"
```

---

## 🔍 **Step 9: Troubleshooting**

### **Common Issues**

#### **1. DNS Not Propagating**

```bash
# Check from multiple locations
nslookup hibiji.com 8.8.8.8
nslookup hibiji.com 1.1.1.1

# Check propagation globally
curl -s "https://dns.google/resolve?name=hibiji.com&type=A"
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
aws elbv2 describe-load-balancers --query 'LoadBalancers[?contains(LoadBalancerName, `hibiji-dev09`)]'

# Check Route53 record
aws route53 list-resource-record-sets --hosted-zone-id <zone-id> --query 'ResourceRecordSets[?Name==`dev09.hibiji.com.`]'
```

#### **4. Wildcard Certificate Issues**

```bash
# Check if wildcard certificate includes the domain
aws acm describe-certificate --certificate-arn <cert-arn> --query 'Certificate.SubjectAlternativeNames'

# Verify all validation records are created
aws acm describe-certificate --certificate-arn <cert-arn> --query 'Certificate.DomainValidationOptions'
```

---

## 📈 **Step 10: Monitoring & Alerts**

### **Set Up DNS Monitoring**

```bash
# Create Route53 health checks for each environment
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

## 🎯 **Step 11: Final Verification Checklist**

### **Pre-Deployment Checklist**

- [ ] Route53 hosted zone created
- [ ] ACM certificate requested with wildcard support
- [ ] Nameservers updated at domain registrar
- [ ] DNS propagation verified (24-48 hours)
- [ ] SSL certificate validated
- [ ] Main domain accessible
- [ ] Environment subdomains working
- [ ] Wildcard subdomains functional
- [ ] Health checks configured
- [ ] Monitoring alerts set up

### **Post-Deployment Verification**

```bash
# Run comprehensive test
./scripts/dns-test.sh
./scripts/dns-health-check.sh
./scripts/verify-route53-records.sh

# Test specific subdomains
curl -I https://hibiji.com
curl -I https://dev01.hibiji.com
curl -I https://dev09.hibiji.com
curl -I https://qa01.hibiji.com
curl -I https://staging01.hibiji.com
curl -I https://main01.hibiji.com
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

# Test specific subdomain
dig +short dev09.hibiji.com
```

---

**Status**: Ready for DNS Configuration with Wildcard Support  
**Last Updated**: January 2025  
**Next Steps**: Deploy infrastructure → Configure nameservers → Verify propagation → Test wildcard subdomains
