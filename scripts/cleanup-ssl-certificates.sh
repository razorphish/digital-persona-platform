#!/bin/bash

# SSL Certificate Cleanup Script
# Safely identifies and removes unused ACM SSL certificates

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔒 SSL Certificate Cleanup Tool${NC}"
echo "============================================="

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install AWS CLI first.${NC}"
    exit 1
fi

# Function to check if certificate is in use by CloudFront
check_cloudfront_usage() {
    local cert_arn=$1
    
    # Get all distributions and check each one's certificate
    local distributions
    distributions=$(aws cloudfront list-distributions --query 'DistributionList.Items[*].Id' --output text)
    
    local result="[]"
    
    for dist_id in $distributions; do
        if [ -n "$dist_id" ] && [ "$dist_id" != "None" ]; then
            local dist_cert
            dist_cert=$(aws cloudfront get-distribution --id "$dist_id" \
                --query 'Distribution.DistributionConfig.ViewerCertificate.ACMCertificateArn' \
                --output text 2>/dev/null || echo "None")
            
            if [ "$dist_cert" = "$cert_arn" ]; then
                local dist_info
                dist_info=$(aws cloudfront get-distribution --id "$dist_id" \
                    --query 'Distribution.{Id:Id,DomainName:DomainName,Status:Status,Aliases:DistributionConfig.Aliases.Items}' \
                    --output json)
                
                # Add this distribution to results
                if [ "$result" = "[]" ]; then
                    result="[$dist_info]"
                else
                    result=$(echo "$result" | jq ". + [$dist_info]")
                fi
            fi
        fi
    done
    
    echo "$result"
}

# Function to check if certificate is in use by ALB/ELB
check_loadbalancer_usage() {
    local cert_arn=$1
    
    # Check ALBs
    local alb_usage
    alb_usage=$(aws elbv2 describe-listeners \
        --query "Listeners[?Certificates[?CertificateArn=='${cert_arn}']].{LoadBalancerArn:LoadBalancerArn,Protocol:Protocol}" \
        --output json 2>/dev/null || echo "[]")
    
    # Check Classic ELBs
    local clb_usage
    clb_usage=$(aws elb describe-load-balancers \
        --query "LoadBalancerDescriptions[?ListenerDescriptions[?Listener.SSLCertificateId=='${cert_arn}']].LoadBalancerName" \
        --output json 2>/dev/null || echo "[]")
    
    # Combine results
    echo "{\"ALB\": $alb_usage, \"CLB\": $clb_usage}"
}

# Function to check certificate validation status
check_certificate_validation() {
    local cert_arn=$1
    aws acm describe-certificate --certificate-arn "$cert_arn" --region us-east-1 \
        --query '{Status:Certificate.Status,DomainValidationOptions:Certificate.DomainValidationOptions[*].{Domain:DomainName,Status:ValidationStatus,Method:ValidationMethod}}' \
        --output json
}

# Function to list all certificates with details
list_certificates() {
    echo -e "${YELLOW}📋 Analyzing all SSL certificates...${NC}"
    
    local certificates
    certificates=$(aws acm list-certificates --region us-east-1 \
        --query 'CertificateSummaryList[*].{Arn:CertificateArn,Domain:DomainName,Status:Status,InUse:InUse}' \
        --output json)
    
    if [ -z "$certificates" ] || [ "$certificates" = "[]" ]; then
        echo -e "${BLUE}💡 No SSL certificates found${NC}"
        return
    fi
    
    echo -e "${BLUE}📊 Certificate Summary:${NC}"
    echo "$certificates" | jq -r '.[] | "  \(.Domain) (\(.Status)) - In Use: \(.InUse)"'
    
    echo ""
    echo "$certificates" | jq -c '.[]' | while read -r cert; do
        local cert_arn domain_name status in_use
        cert_arn=$(echo "$cert" | jq -r '.Arn')
        domain_name=$(echo "$cert" | jq -r '.Domain')
        status=$(echo "$cert" | jq -r '.Status')
        in_use=$(echo "$cert" | jq -r '.InUse')
        
        echo -e "${BLUE}=== Certificate: $domain_name ===${NC}"
        echo "  ARN: $cert_arn"
        echo "  Status: $status"
        echo "  AWS InUse Flag: $in_use"
        
        # Check CloudFront usage
        local cf_usage
        cf_usage=$(check_cloudfront_usage "$cert_arn")
        if [ "$cf_usage" != "[]" ]; then
            echo -e "  ${GREEN}✅ Used by CloudFront distributions:${NC}"
            echo "$cf_usage" | jq -r '.[] | "    - \(.DomainName) (\(.Id)) - \(.Status)"'
        fi
        
        # Check Load Balancer usage
        local lb_usage
        lb_usage=$(check_loadbalancer_usage "$cert_arn")
        local alb_count
        local clb_count
        alb_count=$(echo "$lb_usage" | jq '.ALB | length')
        clb_count=$(echo "$lb_usage" | jq '.CLB | length')
        
        if [ "$alb_count" -gt 0 ] || [ "$clb_count" -gt 0 ]; then
            echo -e "  ${GREEN}✅ Used by Load Balancers:${NC}"
            if [ "$alb_count" -gt 0 ]; then
                echo "$lb_usage" | jq -r '.ALB[] | "    - ALB: \(.LoadBalancerArn) (\(.Protocol))"'
            fi
            if [ "$clb_count" -gt 0 ]; then
                echo "$lb_usage" | jq -r '.CLB[] | "    - CLB: \(.)"'
            fi
        fi
        
        # If certificate appears unused, get validation details
        if [ "$cf_usage" = "[]" ] && [ "$alb_count" -eq 0 ] && [ "$clb_count" -eq 0 ]; then
            echo -e "  ${YELLOW}⚠️ Certificate appears unused${NC}"
            
            # Check validation status
            local validation
            validation=$(check_certificate_validation "$cert_arn")
            echo -e "  ${BLUE}📋 Validation Status:${NC}"
            echo "$validation" | jq -r '.DomainValidationOptions[] | "    - \(.Domain): \(.Status) (\(.Method))"'
        fi
        
        echo ""
    done
}

# Function to clean up specific certificate
cleanup_certificate() {
    local cert_arn=$1
    local domain_name=$2
    
    echo -e "${YELLOW}🔍 Analyzing certificate: $domain_name${NC}"
    
    # Double-check usage
    local cf_usage
    cf_usage=$(check_cloudfront_usage "$cert_arn")
    
    local lb_usage
    lb_usage=$(check_loadbalancer_usage "$cert_arn")
    local alb_count
    local clb_count
    alb_count=$(echo "$lb_usage" | jq '.ALB | length')
    clb_count=$(echo "$lb_usage" | jq '.CLB | length')
    
    if [ "$cf_usage" != "[]" ] || [ "$alb_count" -gt 0 ] || [ "$clb_count" -gt 0 ]; then
        echo -e "${RED}❌ Certificate is still in use. Cannot delete.${NC}"
        if [ "$cf_usage" != "[]" ]; then
            echo "  Used by CloudFront distributions:"
            echo "$cf_usage" | jq -r '.[] | "    - \(.DomainName) (\(.Id))"'
        fi
        if [ "$alb_count" -gt 0 ] || [ "$clb_count" -gt 0 ]; then
            echo "  Used by Load Balancers: $alb_count ALBs, $clb_count CLBs"
        fi
        return 1
    fi
    
    # Check if it's a development certificate
    if [[ "$domain_name" =~ (dev|staging|test|qa)[0-9]*\. ]]; then
        echo -e "${YELLOW}🔍 Development/testing certificate detected${NC}"
    else
        echo -e "${RED}⚠️ Production certificate - please verify before deletion${NC}"
    fi
    
    # Get validation records that may need cleanup
    local validation
    validation=$(check_certificate_validation "$cert_arn")
    local has_dns_validation
    has_dns_validation=$(echo "$validation" | jq '.DomainValidationOptions[] | select(.Method=="DNS")' | wc -l)
    
    if [ "$has_dns_validation" -gt 0 ]; then
        echo -e "${BLUE}📋 This certificate has DNS validation records that may need cleanup${NC}"
    fi
    
    echo -e "${YELLOW}🗑️ Deleting certificate: $domain_name${NC}"
    aws acm delete-certificate --certificate-arn "$cert_arn" --region us-east-1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Certificate deleted successfully${NC}"
        
        if [ "$has_dns_validation" -gt 0 ]; then
            echo -e "${YELLOW}💡 Don't forget to clean up DNS validation records if no longer needed${NC}"
        fi
    else
        echo -e "${RED}❌ Failed to delete certificate${NC}"
    fi
}

# Function for interactive cleanup
interactive_cleanup() {
    echo -e "${YELLOW}🔍 Starting interactive SSL certificate cleanup...${NC}"
    
    local certificates
    certificates=$(aws acm list-certificates --region us-east-1 \
        --query 'CertificateSummaryList[*].{Arn:CertificateArn,Domain:DomainName,Status:Status}' \
        --output json)
    
    if [ -z "$certificates" ] || [ "$certificates" = "[]" ]; then
        echo -e "${BLUE}💡 No SSL certificates found${NC}"
        return
    fi
    
    echo "$certificates" | jq -c '.[]' | while read -r cert; do
        local cert_arn domain_name status
        cert_arn=$(echo "$cert" | jq -r '.Arn')
        domain_name=$(echo "$cert" | jq -r '.Domain')
        status=$(echo "$cert" | jq -r '.Status')
        
        echo ""
        echo -e "${BLUE}=== Certificate: $domain_name ===${NC}"
        echo "  Status: $status"
        
        # Quick usage check
        local cf_usage
        cf_usage=$(check_cloudfront_usage "$cert_arn")
        
        local lb_usage
        lb_usage=$(check_loadbalancer_usage "$cert_arn")
        local alb_count
        local clb_count
        alb_count=$(echo "$lb_usage" | jq '.ALB | length')
        clb_count=$(echo "$lb_usage" | jq '.CLB | length')
        
        if [ "$cf_usage" != "[]" ] || [ "$alb_count" -gt 0 ] || [ "$clb_count" -gt 0 ]; then
            echo -e "${GREEN}✅ Certificate is in use - skipping${NC}"
            continue
        fi
        
        echo -e "${YELLOW}⚠️ Certificate appears unused${NC}"
        
        read -p "❓ Delete this certificate? (y/N): " delete_choice
        if [[ $delete_choice =~ ^[Yy]$ ]]; then
            cleanup_certificate "$cert_arn" "$domain_name"
        else
            echo "Skipping $domain_name"
        fi
    done
}

# Main menu
show_menu() {
    echo ""
    echo -e "${BLUE}🛠️ SSL Certificate Cleanup Options:${NC}"
    echo "1. List all SSL certificates with usage details"
    echo "2. Interactive cleanup (safe)"
    echo "3. Clean up certificates for specific environment"
    echo "4. Exit"
    echo ""
}

# Environment-specific cleanup
cleanup_environment() {
    read -p "Enter environment name (e.g., dev01, staging, qa03): " env_name
    
    if [ -z "$env_name" ]; then
        echo -e "${RED}❌ Environment name is required${NC}"
        return
    fi
    
    echo -e "${YELLOW}🔍 Looking for certificates matching pattern: *${env_name}*${NC}"
    
    local matching_certs
    matching_certs=$(aws acm list-certificates --region us-east-1 \
        --query "CertificateSummaryList[?contains(DomainName, '${env_name}')].{Arn:CertificateArn,Domain:DomainName}" \
        --output json)
    
    if [ -z "$matching_certs" ] || [ "$matching_certs" = "[]" ]; then
        echo -e "${BLUE}💡 No certificates found for environment: $env_name${NC}"
        return
    fi
    
    echo -e "${BLUE}📋 Found certificates:${NC}"
    echo "$matching_certs" | jq -r '.[] | "  - \(.Domain)"'
    
    echo ""
    read -p "❓ Proceed with cleanup for these certificates? (y/N): " proceed_choice
    if [[ ! $proceed_choice =~ ^[Yy]$ ]]; then
        echo "Cancelled"
        return
    fi
    
    echo "$matching_certs" | jq -c '.[]' | while read -r cert; do
        local cert_arn domain_name
        cert_arn=$(echo "$cert" | jq -r '.Arn')
        domain_name=$(echo "$cert" | jq -r '.Domain')
        
        cleanup_certificate "$cert_arn" "$domain_name"
    done
}

# Main script execution
main() {
    while true; do
        show_menu
        read -p "Choose an option (1-4): " choice
        
        case $choice in
            1)
                list_certificates
                ;;
            2)
                interactive_cleanup
                ;;
            3)
                cleanup_environment
                ;;
            4)
                echo -e "${GREEN}✅ SSL cleanup tool completed${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}❌ Invalid option. Please choose 1-4.${NC}"
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Cleanup temp files on exit
trap 'rm -f /tmp/ssl_*.json' EXIT

# Run main function
main 