#!/bin/bash

# Hibiji DNS Setup Script
# This script helps configure DNS for hibiji.com

set -e

DOMAIN="hibiji.com"
AWS_REGION="us-west-1"

echo "🌐 Hibiji DNS Setup Script"
echo "=========================="
echo ""

# Function to check if AWS CLI is installed
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        echo "❌ AWS CLI is not installed. Please install it first:"
        echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    fi
    
    if ! aws sts get-caller-identity &> /dev/null; then
        echo "❌ AWS CLI is not configured. Please run 'aws configure' first."
        exit 1
    fi
    
    echo "✅ AWS CLI is configured"
}

# Function to get Route53 hosted zone
get_hosted_zone() {
    echo "🔍 Looking for Route53 hosted zone for $DOMAIN..."
    
    ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name==\`$DOMAIN.\`].Id" --output text)
    
    if [ -z "$ZONE_ID" ]; then
        echo "❌ No Route53 hosted zone found for $DOMAIN"
        echo "   Please deploy your Terraform infrastructure first:"
        echo "   cd terraform/environments/main && terraform apply"
        exit 1
    fi
    
    echo "✅ Found hosted zone: $ZONE_ID"
    echo $ZONE_ID
}

# Function to get nameservers
get_nameservers() {
    local zone_id=$1
    
    echo "🔍 Getting nameservers for $DOMAIN..."
    
    NAMESERVERS=$(aws route53 get-hosted-zone --id $zone_id --query 'DelegationSet.NameServers' --output text)
    
    if [ -z "$NAMESERVERS" ]; then
        echo "❌ No nameservers found for hosted zone"
        exit 1
    fi
    
    echo "✅ Nameservers for $DOMAIN:"
    echo "$NAMESERVERS" | tr '\t' '\n'
    echo ""
    echo "📝 Copy these nameservers to your domain registrar"
}

# Function to check DNS propagation
check_dns_propagation() {
    echo "🔍 Checking DNS propagation for $DOMAIN..."
    
    # Check nameservers
    echo "Checking nameservers..."
    if dig $DOMAIN NS +short | grep -q "awsdns"; then
        echo "✅ Nameservers are pointing to AWS"
    else
        echo "❌ Nameservers are not pointing to AWS yet"
        echo "   Please update your domain registrar with the AWS nameservers"
        return 1
    fi
    
    # Check A record
    echo "Checking A record..."
    A_RECORD=$(dig $DOMAIN A +short)
    if [ ! -z "$A_RECORD" ]; then
        echo "✅ A record exists: $A_RECORD"
    else
        echo "❌ A record not found"
        return 1
    fi
    
    echo "✅ DNS propagation looks good!"
}

# Function to test domain resolution
test_domain_resolution() {
    echo "🔍 Testing domain resolution..."
    
    DOMAINS=(
        "$DOMAIN"
        "www.$DOMAIN"
        "dev01.$DOMAIN"
        "qa01.$DOMAIN"
        "staging01.$DOMAIN"
        "main01.$DOMAIN"
    )
    
    for domain in "${DOMAINS[@]}"; do
        echo "Testing $domain..."
        
        # DNS resolution
        if nslookup $domain >/dev/null 2>&1; then
            echo "  ✅ DNS: OK"
        else
            echo "  ❌ DNS: FAILED"
            continue
        fi
        
        # HTTP access (with timeout)
        if curl -fs --max-time 10 http://$domain/health >/dev/null 2>&1; then
            echo "  ✅ HTTP: OK"
        else
            echo "  ⚠️ HTTP: Failed (may be expected)"
        fi
        
        # HTTPS access (with timeout)
        if curl -fs --max-time 10 https://$domain/health >/dev/null 2>&1; then
            echo "  ✅ HTTPS: OK"
        else
            echo "  ⚠️ HTTPS: Failed (may be expected)"
        fi
        
        echo ""
    done
}

# Function to check SSL certificate
check_ssl_certificate() {
    echo "🔐 Checking SSL certificate for $DOMAIN..."
    
    CERT_ARN=$(aws acm list-certificates --region $AWS_REGION --query "CertificateSummaryList[?DomainName==\`$DOMAIN\`].CertificateArn" --output text)
    
    if [ -z "$CERT_ARN" ]; then
        echo "❌ No SSL certificate found for $DOMAIN"
        echo "   Please deploy your Terraform infrastructure to create the certificate"
        return 1
    fi
    
    echo "✅ Found SSL certificate: $CERT_ARN"
    
    # Check certificate status
    CERT_STATUS=$(aws acm describe-certificate --certificate-arn $CERT_ARN --region $AWS_REGION --query 'Certificate.Status' --output text)
    echo "Certificate status: $CERT_STATUS"
    
    if [ "$CERT_STATUS" = "ISSUED" ]; then
        echo "✅ SSL certificate is issued and valid"
    else
        echo "⚠️ SSL certificate is not yet issued (status: $CERT_STATUS)"
        echo "   This may take up to 24 hours for DNS validation"
    fi
}

# Function to get ALB DNS names
get_alb_dns_names() {
    echo "🔍 Getting ALB DNS names..."
    
    ALBS=$(aws elbv2 describe-load-balancers --query 'LoadBalancers[?contains(LoadBalancerName, `hibiji`)].{Name:LoadBalancerName,DNS:DNSName}' --output table)
    
    if [ ! -z "$ALBS" ]; then
        echo "✅ Found ALBs:"
        echo "$ALBS"
    else
        echo "❌ No ALBs found"
        echo "   Please deploy your infrastructure first"
    fi
}

# Main script
main() {
    echo "Starting DNS setup for $DOMAIN..."
    echo ""
    
    # Check prerequisites
    check_aws_cli
    
    # Get hosted zone
    ZONE_ID=$(get_hosted_zone)
    
    # Get nameservers
    get_nameservers $ZONE_ID
    
    echo "📋 Next Steps:"
    echo "1. Go to your domain registrar (GoDaddy, Namecheap, etc.)"
    echo "2. Find DNS/Nameserver settings for $DOMAIN"
    echo "3. Replace existing nameservers with the AWS nameservers above"
    echo "4. Wait 24-48 hours for DNS propagation"
    echo "5. Run this script again to verify"
    echo ""
    
    # Ask if user wants to check propagation
    read -p "Do you want to check DNS propagation now? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        check_dns_propagation
        test_domain_resolution
        check_ssl_certificate
        get_alb_dns_names
    fi
    
    echo ""
    echo "🎉 DNS setup script completed!"
    echo "For more information, see DNS_SETUP_GUIDE.md"
}

# Run main function
main "$@" 