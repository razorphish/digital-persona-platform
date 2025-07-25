#!/bin/bash
# dns-health-check.sh - Automated DNS health check for hibiji.com

set -e

DOMAIN="hibiji.com"
HEALTH_ENDPOINT="/health"

# Cross-platform date function
parse_date_to_timestamp() {
    local date_string=$1
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS (BSD date) - try different formats
        date -j -f "%Y-%m-%dT%H:%M:%S%z" "$date_string" +%s 2>/dev/null || \
        date -j -f "%Y-%m-%dT%H:%M:%S" "$date_string" +%s 2>/dev/null || \
        echo "0"
    else
        # Linux (GNU date)
        date -d "$date_string" +%s 2>/dev/null || echo "0"
    fi
}

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNING=0

echo "🏥 DNS Health Check for $DOMAIN"
echo "================================"
echo ""

# Function to test domain health
test_domain_health() {
    local domain=$1
    local description=$2
    
    echo -e "${BLUE}Checking $description: $domain${NC}"
    local domain_passed=0
    local domain_failed=0
    local domain_warning=0
    
    # DNS resolution
    if nslookup $domain >/dev/null 2>&1; then
        echo -e "  ${GREEN}✅ DNS: OK${NC}"
        ((domain_passed++))
    else
        echo -e "  ${RED}❌ DNS: FAILED${NC}"
        ((domain_failed++))
        return 1
    fi
    
    # HTTPS access
    if curl -fs --max-time 10 https://$domain$HEALTH_ENDPOINT >/dev/null 2>&1; then
        echo -e "  ${GREEN}✅ HTTPS: OK${NC}"
        ((domain_passed++))
    else
        echo -e "  ${YELLOW}⚠️ HTTPS: Failed (may be expected)${NC}"
        ((domain_warning++))
    fi
    
    # SSL certificate
    if openssl s_client -connect $domain:443 -servername $domain </dev/null 2>/dev/null | grep -q "Verify return code: 0"; then
        echo -e "  ${GREEN}✅ SSL: OK${NC}"
        ((domain_passed++))
    else
        echo -e "  ${YELLOW}⚠️ SSL: Failed (may be expected)${NC}"
        ((domain_warning++))
    fi
    
    # Update global counters
    ((TESTS_PASSED += domain_passed))
    ((TESTS_FAILED += domain_failed))
    ((TESTS_WARNING += domain_warning))
    
    echo ""
    return $domain_failed
}

# Function to test domain with detailed output
test_domain_detailed() {
    local domain=$1
    local description=$2
    
    echo -e "${BLUE}Checking $description: $domain${NC}"
    
    # DNS resolution with IP
    local ip=$(dig $domain A +short 2>/dev/null | head -1)
    if [ ! -z "$ip" ]; then
        echo -e "  ${GREEN}✅ DNS: $ip${NC}"
    else
        echo -e "  ${RED}❌ DNS: FAILED${NC}"
        return 1
    fi
    
    # HTTPS response time
    local start_time=$(date +%s.%N)
    if curl -fs --max-time 10 https://$domain$HEALTH_ENDPOINT >/dev/null 2>&1; then
        local end_time=$(date +%s.%N)
        local response_time=$(echo "$end_time - $start_time" | bc -l 2>/dev/null || echo "N/A")
        echo -e "  ${GREEN}✅ HTTPS: OK (${response_time}s)${NC}"
    else
        echo -e "  ${YELLOW}⚠️ HTTPS: Failed (may be expected)${NC}"
    fi
    
    # SSL certificate details
    local cert_info=$(openssl s_client -connect $domain:443 -servername $domain </dev/null 2>/dev/null | grep -E "(subject=|issuer=|Not After)" | head -3)
    if [ ! -z "$cert_info" ]; then
        echo -e "  ${GREEN}✅ SSL: Valid certificate${NC}"
        echo "$cert_info" | while read line; do
            echo "    $line"
        done
    else
        echo -e "  ${YELLOW}⚠️ SSL: Failed (may be expected)${NC}"
    fi
    
    echo ""
}

# Test main domains
echo "🔍 Main Domain Health Check"
echo "---------------------------"
test_domain_health $DOMAIN "Main domain"
test_domain_health "www.$DOMAIN" "WWW subdomain"

# Test critical environment subdomains
echo "🔍 Critical Environment Health Check"
echo "-----------------------------------"
CRITICAL_ENVIRONMENTS=("dev01" "dev09" "qa01" "staging01" "main01" "prod01")

for env in "${CRITICAL_ENVIRONMENTS[@]}"; do
    test_domain_health "$env.$DOMAIN" "$env subdomain"
done

# Test all environment subdomains
echo "🔍 All Environment Health Check"
echo "------------------------------"
ALL_ENVIRONMENTS=("dev01" "dev02" "dev03" "dev04" "dev05" "dev06" "dev07" "dev08" "dev09" "dev10" "qa01" "qa02" "qa03" "qa04" "qa05" "staging01" "staging02" "staging03" "main01" "prod01" "prod02")

for env in "${ALL_ENVIRONMENTS[@]}"; do
    test_domain_health "$env.$DOMAIN" "$env subdomain"
done

# Test wildcard subdomains
echo "🔍 Wildcard Subdomain Health Check"
echo "---------------------------------"
WILDCARD_TESTS=("random" "test" "demo" "temp" "check" "api" "admin" "app")

for test in "${WILDCARD_TESTS[@]}"; do
    test_domain_health "$test.$DOMAIN" "Wildcard $test"
done

# Test environment-specific wildcards
echo "🔍 Environment Wildcard Health Check"
echo "-----------------------------------"
test_domain_health "test.dev.$DOMAIN" "Dev wildcard"
test_domain_health "test.qa.$DOMAIN" "QA wildcard"
test_domain_health "test.staging.$DOMAIN" "Staging wildcard"
test_domain_health "test.prod.$DOMAIN" "Prod wildcard"

# Detailed health check for main domain
echo "🔍 Detailed Main Domain Health Check"
echo "-----------------------------------"
test_domain_detailed $DOMAIN "Main domain (detailed)"

# Test DNS propagation
echo "🔍 DNS Propagation Health Check"
echo "-------------------------------"
echo "Testing DNS resolution from multiple sources..."

# Test from different DNS servers
DNS_SERVERS=(
    "8.8.8.8:Google"
    "1.1.1.1:Cloudflare"
    "208.67.222.222:OpenDNS"
    "9.9.9.9:Quad9"
)

for dns_server in "${DNS_SERVERS[@]}"; do
    IFS=':' read -r ip provider <<< "$dns_server"
    local result=$(dig @$ip $DOMAIN A +short | head -1)
    if [ ! -z "$result" ]; then
        echo -e "  ${GREEN}✅ $provider ($ip): $result${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "  ${RED}❌ $provider ($ip): FAILED${NC}"
        ((TESTS_FAILED++))
    fi
done
echo ""

# Test Route53 health checks
echo "🔍 Route53 Health Check Status"
echo "-----------------------------"
HEALTH_CHECKS=$(aws route53 list-health-checks --query 'HealthChecks[?contains(HealthCheckConfig.FullyQualifiedDomainName, `hibiji`)].{Id:Id,Status:HealthCheckConfig.FullyQualifiedDomainName,Health:HealthCheckStatus}' --output table 2>/dev/null)

if echo "$HEALTH_CHECKS" | grep -q "hibiji"; then
    echo -e "${GREEN}✅ Route53 health checks found:${NC}"
    echo "$HEALTH_CHECKS"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠️ No Route53 health checks found for hibiji${NC}"
    ((TESTS_WARNING++))
fi
echo ""

# Test ACM certificate health
echo "🔍 SSL Certificate Health Check"
echo "-------------------------------"
CERT_ARN=$(aws acm list-certificates --query "CertificateSummaryList[?DomainName==\`$DOMAIN\`].CertificateArn" --output text)

if [ ! -z "$CERT_ARN" ]; then
    echo -e "${GREEN}✅ ACM certificate found: $CERT_ARN${NC}"
    ((TESTS_PASSED++))
    
    # Check certificate status
    CERT_STATUS=$(aws acm describe-certificate --certificate-arn $CERT_ARN --query 'Certificate.Status' --output text)
    echo "Certificate status: $CERT_STATUS"
    
    if [ "$CERT_STATUS" = "ISSUED" ]; then
        echo -e "${GREEN}✅ Certificate is issued and valid${NC}"
        ((TESTS_PASSED++))
    else
        echo -e "${YELLOW}⚠️ Certificate is not yet issued (status: $CERT_STATUS)${NC}"
        ((TESTS_WARNING++))
    fi
    
    # Check expiration
    EXPIRATION=$(aws acm describe-certificate --certificate-arn $CERT_ARN --query 'Certificate.NotAfter' --output text)
    if [ ! -z "$EXPIRATION" ]; then
        echo "Certificate expires: $EXPIRATION"
        
        # Check if certificate expires within 30 days
        EXPIRATION_DATE=$(parse_date_to_timestamp "$EXPIRATION")
        CURRENT_DATE=$(date +%s)
        DAYS_UNTIL_EXPIRY=$(( (EXPIRATION_DATE - CURRENT_DATE) / 86400 ))
        
        if [ $DAYS_UNTIL_EXPIRY -lt 30 ] && [ $DAYS_UNTIL_EXPIRY -gt 0 ]; then
            echo -e "${YELLOW}⚠️ Certificate expires in $DAYS_UNTIL_EXPIRY days${NC}"
            ((TESTS_WARNING++))
        elif [ $DAYS_UNTIL_EXPIRY -le 0 ]; then
            echo -e "${RED}❌ Certificate has expired${NC}"
            ((TESTS_FAILED++))
        else
            echo -e "${GREEN}✅ Certificate expires in $DAYS_UNTIL_EXPIRY days${NC}"
            ((TESTS_PASSED++))
        fi
    fi
else
    echo -e "${RED}❌ No ACM certificate found for $DOMAIN${NC}"
    ((TESTS_FAILED++))
fi
echo ""

# Test ALB health
echo "🔍 Application Load Balancer Health Check"
echo "----------------------------------------"
ALBS=$(aws elbv2 describe-load-balancers --query 'LoadBalancers[?contains(LoadBalancerName, `hibiji`)].{Name:LoadBalancerName,DNS:DNSName,State:State.Code}' --output table 2>/dev/null)

if echo "$ALBS" | grep -q "hibiji"; then
    echo -e "${GREEN}✅ ALBs found:${NC}"
    echo "$ALBS"
    ((TESTS_PASSED++))
    
    # Check if any ALBs are not active
    if echo "$ALBS" | grep -q "failed"; then
        echo -e "${RED}❌ Some ALBs are in failed state${NC}"
        ((TESTS_FAILED++))
    else
        echo -e "${GREEN}✅ All ALBs are active${NC}"
        ((TESTS_PASSED++))
    fi
else
    echo -e "${YELLOW}⚠️ No ALBs found for hibiji${NC}"
    ((TESTS_WARNING++))
fi
echo ""

# Summary
echo "🎉 DNS Health Check Summary"
echo "==========================="
echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
echo -e "${YELLOW}⚠️ Tests Warning: $TESTS_WARNING${NC}"
echo -e "${BLUE}Total Tests: $((TESTS_PASSED + TESTS_FAILED + TESTS_WARNING))${NC}"

# Calculate health percentage
TOTAL_TESTS=$((TESTS_PASSED + TESTS_FAILED + TESTS_WARNING))
if [ $TOTAL_TESTS -gt 0 ]; then
    HEALTH_PERCENTAGE=$(( (TESTS_PASSED * 100) / TOTAL_TESTS ))
    echo -e "${BLUE}Health Score: $HEALTH_PERCENTAGE%${NC}"
    
    if [ $HEALTH_PERCENTAGE -ge 90 ]; then
        echo -e "${GREEN}🎉 Excellent DNS health!${NC}"
    elif [ $HEALTH_PERCENTAGE -ge 75 ]; then
        echo -e "${YELLOW}⚠️ Good DNS health with some issues${NC}"
    elif [ $HEALTH_PERCENTAGE -ge 50 ]; then
        echo -e "${YELLOW}⚠️ Fair DNS health - review needed${NC}"
    else
        echo -e "${RED}❌ Poor DNS health - immediate attention required${NC}"
    fi
fi

echo ""
echo "📋 Recommendations:"
if [ $TESTS_FAILED -gt 0 ]; then
    echo "• Address failed tests immediately"
fi
if [ $TESTS_WARNING -gt 0 ]; then
    echo "• Review warning conditions"
fi
echo "• Run this check regularly to monitor DNS health"
echo "• Set up automated monitoring for critical domains"
echo ""
echo "For more information, see DNS_SETUP_GUIDE.md" 