# Domain Setup Guide for hibiji.com

## Overview

This guide will help you configure your GoDaddy-registered `hibiji.com` domain to work with AWS infrastructure.

## Step 1: Deploy Terraform to Create Route53 Zone

### 1.1 Initialize Terraform

```bash
cd terraform/environments/dev
terraform init
```

### 1.2 Plan the Deployment

```bash
terraform plan -var="domain_name=hibiji.com" -out=tfplan
```

### 1.3 Apply the Configuration

```bash
terraform apply tfplan
```

This will create:

- Route53 hosted zone for `hibiji.com`
- ACM certificate for SSL
- DNS records pointing to your ALB

## Step 2: Get AWS Nameservers

After Terraform deployment, get the nameservers:

```bash
# Get the Route53 zone ID
aws route53 list-hosted-zones --query 'HostedZones[?Name==`hibiji.com.`].Id' --output text

# Get nameservers (replace ZONE_ID with the actual ID)
aws route53 get-hosted-zone --id ZONE_ID --query 'DelegationSet.NameServers' --output text
```

You should get 4 nameservers like:

- ns-1234.awsdns-12.com
- ns-5678.awsdns-34.net
- ns-9012.awsdns-56.org
- ns-3456.awsdns-78.co.uk

## Step 3: Configure GoDaddy Nameservers

### 3.1 Log into GoDaddy

1. Go to [godaddy.com](https://godaddy.com)
2. Sign in to your account
3. Go to "My Products" → "Domains"

### 3.2 Update Nameservers

1. Find `hibiji.com` in your domain list
2. Click "Manage" next to the domain
3. Go to "Settings" tab
4. Click "Nameservers"
5. Select "I'll use my own nameservers"
6. Replace the default nameservers with the 4 AWS nameservers from Step 2
7. Click "Save"

## Step 4: Verify DNS Propagation

### 4.1 Check Nameserver Update

```bash
# Check if nameservers are updated (may take 24-48 hours)
dig hibiji.com NS
```

### 4.2 Check DNS Records

```bash
# Check if AWS is serving the domain
dig hibiji.com A
dig dev01.hibiji.com A
```

## Step 5: SSL Certificate Validation

### 5.1 Check Certificate Status

```bash
# Get certificate ARN
aws acm list-certificates --query 'CertificateSummaryList[?DomainName==`hibiji.com`].CertificateArn' --output text

# Check validation status
aws acm describe-certificate --certificate-arn CERT_ARN --query 'Certificate.Status' --output text
```

### 5.2 Manual Validation (if needed)

If DNS validation fails:

1. Go to AWS Console → Certificate Manager
2. Find your certificate
3. Click "Create records in Route 53" for validation
4. Or manually add CNAME records to GoDaddy

## Step 6: Test Your Domain

### 6.1 Test Main Domain

```bash
curl -I https://hibiji.com
```

### 6.2 Test Sub-Environment

```bash
curl -I https://dev01.hibiji.com
```

## Step 7: Update GitHub Actions

### 7.1 Update Workflow Domain

In `.github/workflows/ci-cd-pipeline.yml`, update:

```yaml
env:
  DOMAIN: hibiji.com
```

### 7.2 Update Health Checks

The workflow will now check:

- `https://hibiji.com/health`
- `https://hibiji.com/`

## Troubleshooting

### DNS Not Propagating

- Wait 24-48 hours for full propagation
- Use `dig` or `nslookup` to check from different locations
- Verify nameservers are correctly set in GoDaddy

### SSL Certificate Issues

- Ensure DNS validation records are created
- Check certificate status in AWS Console
- Verify domain ownership

### Application Not Loading

- Check ALB health status
- Verify security groups allow traffic
- Check ECS service status

## Expected URLs After Setup

- **Main Domain**: https://hibiji.com
- **Development**: https://dev01.hibiji.com
- **API Health**: https://hibiji.com/health
- **Frontend**: https://hibiji.com/

## Next Steps

1. Deploy your application
2. Test all endpoints
3. Set up monitoring and alerts
4. Configure additional sub-environments (qa01, staging01, etc.)

## Security Considerations

- Enable HTTPS redirects
- Set up security headers
- Configure WAF if needed
- Monitor certificate expiration
- Set up domain monitoring
