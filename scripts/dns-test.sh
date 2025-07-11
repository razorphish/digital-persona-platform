#!/bin/bash
# dns-test.sh - Comprehensive DNS testing for hibiji.com

set -e

DOMAIN="hibiji.com"
ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name==\`$DOMAIN.\`].Id" --output text)

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🌐 DNS Testing for $DOMAIN"
echo "=========================="
echo "Zone ID: $ZONE_ID"
echo ""

# Function to test DNS resolution
test_dns() {
    local domain=$1
    local description=$2
    
    echo -e "${BLUE}Testing $description: $domain${NC}"
    
    # Test DNS resolution
    local result=$(dig $domain A +short 2>/dev/null | head -1)
    if [ ! -z "$result" ]; then
        echo -e "  ${GREEN}✅ DNS: $result${NC}"
        return 0
    else
        echo -e "  ${RED}❌ DNS: FAILED${NC}"
        return 1
    fi
}

# Function to test HTTPS access
test_https() {
    local domain=$1
    
    if curl -fs --max-time 10 https://$domain/health >/dev/null 2>&1; then
        echo -e "  ${GREEN}✅ HTTPS: OK${NC}"
        return 0
    else
        echo -e "  ${YELLOW}⚠️ HTTPS: Failed (may be expected)${NC}"
        return 1
    fi
}

# Function to test SSL certificate
test_ssl() {
    local domain=$1
    
    if openssl s_client -connect $domain:443 -servername $domain </dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
        echo -e "  ${GREEN}✅ SSL: OK${NC}"
        return 0
    else
        echo -e "  ${YELLOW}⚠️ SSL: Failed (may be expected)${NC}"
        return 1
    fi
}

# Test main domain
echo "🔍 Main Domain Tests"
echo "-------------------"
test_dns $DOMAIN "Main domain"
test_https $DOMAIN
test_ssl $DOMAIN
echo ""

# Test www subdomain
echo "🔍 WWW Subdomain Tests"
echo "---------------------"
test_dns "www.$DOMAIN" "WWW subdomain"
test_https "www.$DOMAIN"
test_ssl "www.$DOMAIN"
echo ""

# Test environment subdomains
echo "🔍 Environment Subdomain Tests"
echo "-----------------------------"
ENVIRONMENTS=("dev01" "dev02" "dev03" "dev09" "dev10" "qa01" "qa02" "qa03" "staging01" "staging02" "main01" "prod01")

for env in "${ENVIRONMENTS[@]}"; do
    test_dns "$env.$DOMAIN" "$env subdomain"
    test_https "$env.$DOMAIN"
    test_ssl "$env.$DOMAIN"
    echo ""
done

# Test wildcard subdomains
echo "🔍 Wildcard Subdomain Tests"
echo "---------------------------"
WILDCARD_TESTS=("random" "test" "demo" "temp" "check")

for test in "${WILDCARD_TESTS[@]}"; do
    test_dns "$test.$DOMAIN" "Wildcard $test"
    test_https "$test.$DOMAIN"
    test_ssl "$test.$DOMAIN"
    echo ""
done

# Test environment-specific wildcards
echo "🔍 Environment Wildcard Tests"
echo "-----------------------------"
test_dns "test.dev.$DOMAIN" "Dev wildcard"
test_https "test.dev.$DOMAIN"
test_ssl "test.dev.$DOMAIN"
echo ""

test_dns "test.qa.$DOMAIN" "QA wildcard"
test_https "test.qa.$DOMAIN"
test_ssl "test.qa.$DOMAIN"
echo ""

test_dns "test.staging.$DOMAIN" "Staging wildcard"
test_https "test.staging.$DOMAIN"
test_ssl "test.staging.$DOMAIN"
echo ""

# Test nameservers
echo "🔍 Nameserver Tests"
echo "------------------"
echo "Checking nameservers..."
NS_RESULT=$(dig $DOMAIN NS +short)
if echo "$NS_RESULT" | grep -q "awsdns"; then
    echo -e "${GREEN}✅ Nameservers are pointing to AWS${NC}"
    echo "Nameservers:"
    echo "$NS_RESULT" | while read ns; do
        echo "  - $ns"
    done
else
    echo -e "${RED}❌ Nameservers are not pointing to AWS${NC}"
    echo "Current nameservers:"
    echo "$NS_RESULT" | while read ns; do
        echo "  - $ns"
    done
fi
echo ""

# Test DNS propagation from multiple sources
echo "🔍 DNS Propagation Tests"
echo "-----------------------"
echo "Testing DNS resolution from different sources..."

# Test from Google DNS
GOOGLE_RESULT=$(dig @8.8.8.8 $DOMAIN A +short | head -1)
if [ ! -z "$GOOGLE_RESULT" ]; then
    echo -e "  ${GREEN}✅ Google DNS (8.8.8.8): $GOOGLE_RESULT${NC}"
else
    echo -e "  ${RED}❌ Google DNS: FAILED${NC}"
fi

# Test from Cloudflare DNS
CLOUDFLARE_RESULT=$(dig @1.1.1.1 $DOMAIN A +short | head -1)
if [ ! -z "$CLOUDFLARE_RESULT" ]; then
    echo -e "  ${GREEN}✅ Cloudflare DNS (1.1.1.1): $CLOUDFLARE_RESULT${NC}"
else
    echo -e "  ${RED}❌ Cloudflare DNS: FAILED${NC}"
fi

# Test from OpenDNS
OPENDNS_RESULT=$(dig @208.67.222.222 $DOMAIN A +short | head -1)
if [ ! -z "$OPENDNS_RESULT" ]; then
    echo -e "  ${GREEN}✅ OpenDNS (208.67.222.222): $OPENDNS_RESULT${NC}"
else
    echo -e "  ${RED}❌ OpenDNS: FAILED${NC}"
fi
echo ""

# Test Route53 health
echo "🔍 Route53 Health Check"
echo "----------------------"
if aws route53 list-health-checks --query 'HealthChecks[?contains(HealthCheckConfig.FullyQualifiedDomainName, `hibiji`)].{Id:Id,Status:HealthCheckConfig.FullyQualifiedDomainName}' --output table 2>/dev/null | grep -q "hibiji"; then
    echo -e "${GREEN}✅ Route53 health checks found${NC}"
    aws route53 list-health-checks --query 'HealthChecks[?contains(HealthCheckConfig.FullyQualifiedDomainName, `hibiji`)].{Id:Id,Status:HealthCheckConfig.FullyQualifiedDomainName}' --output table
else
    echo -e "${YELLOW}⚠️ No Route53 health checks found for hibiji${NC}"
fi
echo ""

# Test ACM certificate
echo "🔍 SSL Certificate Tests"
echo "-----------------------"
CERT_ARN=$(aws acm list-certificates --query "CertificateSummaryList[?DomainName==\`$DOMAIN\`].CertificateArn" --output text)

if [ ! -z "$CERT_ARN" ]; then
    echo -e "${GREEN}✅ ACM certificate found: $CERT_ARN${NC}"
    
    # Check certificate status
    CERT_STATUS=$(aws acm describe-certificate --certificate-arn $CERT_ARN --query 'Certificate.Status' --output text)
    echo "Certificate status: $CERT_STATUS"
    
    # Check subject alternative names
    echo "Subject Alternative Names:"
    aws acm describe-certificate --certificate-arn $CERT_ARN --query 'Certificate.SubjectAlternativeNames' --output text | tr '\t' '\n' | while read san; do
        echo "  - $san"
    done
    
    if [ "$CERT_STATUS" = "ISSUED" ]; then
        echo -e "${GREEN}✅ Certificate is issued and valid${NC}"
    else
        echo -e "${YELLOW}⚠️ Certificate is not yet issued (status: $CERT_STATUS)${NC}"
    fi
else
    echo -e "${RED}❌ No ACM certificate found for $DOMAIN${NC}"
fi
echo ""

# Summary
echo "🎉 DNS testing complete!"
echo "========================"
echo ""
echo "📋 Next Steps:"
echo "1. If any tests failed, check your DNS configuration"
echo "2. Verify nameservers are correctly set at your domain registrar"
echo "3. Wait for DNS propagation (can take 24-48 hours)"
echo "4. Run this script again to verify changes"
echo ""
echo "For more information, see DNS_SETUP_GUIDE.md" 