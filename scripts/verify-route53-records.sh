#!/bin/bash
# verify-route53-records.sh - Verify Route53 records for hibiji.com

set -e

DOMAIN="hibiji.com"
ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name==\`$DOMAIN.\`].Id" --output text)

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🔍 Verifying Route53 Records for $DOMAIN"
echo "========================================"
echo "Zone ID: $ZONE_ID"
echo ""

if [ -z "$ZONE_ID" ]; then
    echo -e "${RED}❌ No Route53 hosted zone found for $DOMAIN${NC}"
    echo "Please deploy your Terraform infrastructure first:"
    echo "cd terraform/environments/main && terraform apply"
    exit 1
fi

# Function to display records in a formatted way
display_records() {
    local query=$1
    local title=$2
    local color=$3
    
    echo -e "${color}$title${NC}"
    echo "$(printf '%.0s-' {1..${#title}})"
    
    local records=$(aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID --query "$query" --output table 2>/dev/null)
    
    if [ ! -z "$records" ] && echo "$records" | grep -q -v "None"; then
        echo "$records"
    else
        echo -e "${YELLOW}No records found${NC}"
    fi
    echo ""
}

# Function to check specific record types
check_record_type() {
    local record_type=$1
    local title=$2
    
    echo -e "${BLUE}$title${NC}"
    echo "$(printf '%.0s-' {1..${#title}})"
    
    local records=$(aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID --query "ResourceRecordSets[?Type==\`$record_type\`].{Name:Name,Type:Type,Value:AliasTarget.DNSName,TTL:TTL}" --output table 2>/dev/null)
    
    if [ ! -z "$records" ] && echo "$records" | grep -q -v "None"; then
        echo "$records"
    else
        echo -e "${YELLOW}No $record_type records found${NC}"
    fi
    echo ""
}

# Function to check for specific patterns
check_pattern() {
    local pattern=$1
    local title=$2
    
    echo -e "${BLUE}$title${NC}"
    echo "$(printf '%.0s-' {1..${#title}})"
    
    local records=$(aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID --query "ResourceRecordSets[?contains(Name, \`$pattern\`)].{Name:Name,Type:Type,Value:AliasTarget.DNSName}" --output table 2>/dev/null)
    
    if [ ! -z "$records" ] && echo "$records" | grep -q -v "None"; then
        echo "$records"
    else
        echo -e "${YELLOW}No records matching '$pattern' found${NC}"
    fi
    echo ""
}

# List all A records
display_records "ResourceRecordSets[?Type==\`A\`].{Name:Name,Type:Type,Value:AliasTarget.DNSName,TTL:TTL}" "All A Records" "$GREEN"

# List all CNAME records
display_records "ResourceRecordSets[?Type==\`CNAME\`].{Name:Name,Type:Type,Value:ResourceRecords[0].Value,TTL:TTL}" "All CNAME Records" "$GREEN"

# List all NS records
display_records "ResourceRecordSets[?Type==\`NS\`].{Name:Name,Type:Type,Value:ResourceRecords[0].Value,TTL:TTL}" "All NS Records" "$GREEN"

# List all MX records
display_records "ResourceRecordSets[?Type==\`MX\`].{Name:Name,Type:Type,Value:ResourceRecords[0].Value,TTL:TTL}" "All MX Records" "$GREEN"

# List all TXT records
display_records "ResourceRecordSets[?Type==\`TXT\`].{Name:Name,Type:Type,Value:ResourceRecords[0].Value,TTL:TTL}" "All TXT Records" "$GREEN"

# Check for wildcard records
check_pattern "*" "Wildcard Records (*)"

# Check for environment-specific records
check_pattern "dev" "Development Environment Records (dev*)"
check_pattern "qa" "QA Environment Records (qa*)"
check_pattern "staging" "Staging Environment Records (staging*)"
check_pattern "prod" "Production Environment Records (prod*)"
check_pattern "main" "Main Environment Records (main*)"

# Check for specific subdomains
echo -e "${BLUE}Specific Subdomain Records${NC}"
echo "--------------------------------"
SPECIFIC_SUBDOMAINS=("www" "api" "mail" "dev01" "dev09" "qa01" "staging01" "main01" "prod01")

for subdomain in "${SPECIFIC_SUBDOMAINS[@]}"; do
    local records=$(aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID --query "ResourceRecordSets[?Name==\`$subdomain.$DOMAIN.\`].{Name:Name,Type:Type,Value:AliasTarget.DNSName}" --output table 2>/dev/null)
    
    if [ ! -z "$records" ] && echo "$records" | grep -q -v "None"; then
        echo -e "${GREEN}✅ $subdomain.$DOMAIN${NC}"
        echo "$records"
    else
        echo -e "${YELLOW}⚠️ $subdomain.$DOMAIN - Not found${NC}"
    fi
done
echo ""

# Check for ACM validation records
check_pattern "_acme-challenge" "ACM Certificate Validation Records"

# Check for health check records
check_pattern "health" "Health Check Records"

# Summary of record counts
echo -e "${BLUE}Record Count Summary${NC}"
echo "---------------------"

A_COUNT=$(aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID --query "length(ResourceRecordSets[?Type==\`A\`])" --output text)
CNAME_COUNT=$(aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID --query "length(ResourceRecordSets[?Type==\`CNAME\`])" --output text)
NS_COUNT=$(aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID --query "length(ResourceRecordSets[?Type==\`NS\`])" --output text)
MX_COUNT=$(aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID --query "length(ResourceRecordSets[?Type==\`MX\`])" --output text)
TXT_COUNT=$(aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID --query "length(ResourceRecordSets[?Type==\`TXT\`])" --output text)
WILDCARD_COUNT=$(aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID --query "length(ResourceRecordSets[?contains(Name, \`*\`)])" --output text)
TOTAL_COUNT=$(aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID --query "length(ResourceRecordSets)" --output text)

echo -e "A Records: ${GREEN}$A_COUNT${NC}"
echo -e "CNAME Records: ${GREEN}$CNAME_COUNT${NC}"
echo -e "NS Records: ${GREEN}$NS_COUNT${NC}"
echo -e "MX Records: ${GREEN}$MX_COUNT${NC}"
echo -e "TXT Records: ${GREEN}$TXT_COUNT${NC}"
echo -e "Wildcard Records: ${GREEN}$WILDCARD_COUNT${NC}"
echo -e "Total Records: ${BLUE}$TOTAL_COUNT${NC}"
echo ""

# Check for potential issues
echo -e "${BLUE}Potential Issues Check${NC}"
echo "-------------------------"

# Check if main domain has A record
MAIN_A_RECORD=$(aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID --query "ResourceRecordSets[?Name==\`$DOMAIN.\` && Type==\`A\`].Name" --output text)
if [ ! -z "$MAIN_A_RECORD" ]; then
    echo -e "${GREEN}✅ Main domain A record exists${NC}"
else
    echo -e "${RED}❌ Main domain A record missing${NC}"
fi

# Check if www subdomain exists
WWW_RECORD=$(aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID --query "ResourceRecordSets[?Name==\`www.$DOMAIN.\`].Name" --output text)
if [ ! -z "$WWW_RECORD" ]; then
    echo -e "${GREEN}✅ WWW subdomain record exists${NC}"
else
    echo -e "${YELLOW}⚠️ WWW subdomain record missing${NC}"
fi

# Check for wildcard certificate validation
ACM_VALIDATION=$(aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID --query "ResourceRecordSets[?contains(Name, \`_acme-challenge\`)].Name" --output text)
if [ ! -z "$ACM_VALIDATION" ]; then
    echo -e "${GREEN}✅ ACM validation records exist${NC}"
else
    echo -e "${YELLOW}⚠️ ACM validation records not found${NC}"
fi

# Check for environment records
ENV_RECORDS=$(aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID --query "ResourceRecordSets[?contains(Name, \`dev01.$DOMAIN.\`) || contains(Name, \`qa01.$DOMAIN.\`) || contains(Name, \`staging01.$DOMAIN.\`) || contains(Name, \`main01.$DOMAIN.\`)].Name" --output text)
if [ ! -z "$ENV_RECORDS" ]; then
    echo -e "${GREEN}✅ Environment subdomain records exist${NC}"
else
    echo -e "${YELLOW}⚠️ Environment subdomain records missing${NC}"
fi

# Check for wildcard records
WILDCARD_RECORDS=$(aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID --query "ResourceRecordSets[?contains(Name, \`*\`)].Name" --output text)
if [ ! -z "$WILDCARD_RECORDS" ]; then
    echo -e "${GREEN}✅ Wildcard records exist${NC}"
else
    echo -e "${YELLOW}⚠️ Wildcard records missing${NC}"
fi
echo ""

# Export records to JSON for backup
echo -e "${BLUE}Exporting Records to JSON${NC}"
echo "----------------------------"
BACKUP_FILE="route53-records-$(date +%Y%m%d-%H%M%S).json"
aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID --output json > "$BACKUP_FILE"
echo -e "${GREEN}✅ Records exported to $BACKUP_FILE${NC}"
echo ""

# Final summary
echo "🎉 Route53 Records Verification Complete!"
echo "========================================="
echo ""
echo "📋 Next Steps:"
echo "• Review any missing records above"
echo "• Verify ALB DNS names are correct"
echo "• Check SSL certificate validation"
echo "• Test domain resolution"
echo "• Run DNS health check: ./scripts/dns-health-check.sh"
echo ""
echo "For more information, see DNS_SETUP_GUIDE.md" 