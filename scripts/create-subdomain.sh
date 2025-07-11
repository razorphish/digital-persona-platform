#!/bin/bash
# create-subdomain.sh - Create new subdomains for hibiji.com

set -e

DOMAIN="hibiji.com"
ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name==\`$DOMAIN.\`].Id" --output text)

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to show usage
show_usage() {
    echo "Usage: $0 <subdomain> [alb-dns-name] [alb-zone-id]"
    echo ""
    echo "Examples:"
    echo "  $0 dev09"
    echo "  $0 dev09 hibiji-dev09-alb-123456.us-west-1.elb.amazonaws.com"
    echo "  $0 dev09 hibiji-dev09-alb-123456.us-west-1.elb.amazonaws.com Z1234567890ABC"
    echo ""
    echo "Environment patterns:"
    echo "  dev01-dev99: Development environments"
    echo "  qa01-qa99: QA environments"
    echo "  staging01-staging99: Staging environments"
    echo "  prod01-prod99: Production environments"
    echo "  main01-main99: Main environments"
    echo ""
    echo "If ALB DNS name is not provided, a default pattern will be used."
    echo "If ALB Zone ID is not provided, the default AWS ALB zone ID will be used."
}

# Function to validate subdomain format
validate_subdomain() {
    local subdomain=$1
    
    # Check if subdomain matches expected patterns
    if [[ $subdomain =~ ^(dev|qa|staging|prod|main)[0-9]{2}$ ]]; then
        return 0
    else
        echo -e "${RED}❌ Invalid subdomain format: $subdomain${NC}"
        echo "Valid formats: dev01, dev09, qa01, staging01, prod01, main01, etc."
        return 1
    fi
}

# Function to get ALB DNS name for environment
get_alb_dns_name() {
    local subdomain=$1
    local environment=${subdomain:0:${#subdomain}-2}  # Extract environment (dev, qa, etc.)
    
    # Try to find existing ALB for this environment
    local alb_dns=$(aws elbv2 describe-load-balancers --query "LoadBalancers[?contains(LoadBalancerName, \`hibiji-$environment\`)].DNSName" --output text 2>/dev/null | head -1)
    
    if [ ! -z "$alb_dns" ]; then
        echo "$alb_dns"
    else
        # Generate default pattern
        echo "hibiji-$subdomain-alb-123456.us-west-1.elb.amazonaws.com"
    fi
}

# Function to get ALB zone ID
get_alb_zone_id() {
    # Default AWS ALB zone ID for us-west-1
    echo "Z1H1FL5HABSF5"
}

# Function to check if subdomain already exists
check_subdomain_exists() {
    local subdomain=$1
    
    local existing_record=$(aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID --query "ResourceRecordSets[?Name==\`$subdomain.$DOMAIN.\`].Name" --output text 2>/dev/null)
    
    if [ ! -z "$existing_record" ]; then
        return 0  # Exists
    else
        return 1  # Doesn't exist
    fi
}

# Function to create subdomain
create_subdomain() {
    local subdomain=$1
    local alb_dns_name=$2
    local alb_zone_id=$3
    
    echo -e "${BLUE}Creating subdomain: $subdomain.$DOMAIN${NC}"
    echo "ALB DNS Name: $alb_dns_name"
    echo "ALB Zone ID: $alb_zone_id"
    echo ""
    
    # Create the DNS record
    local change_batch=$(cat <<EOF
{
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "$subdomain.$DOMAIN",
                "Type": "A",
                "AliasTarget": {
                    "HostedZoneId": "$alb_zone_id",
                    "DNSName": "$alb_dns_name",
                    "EvaluateTargetHealth": true
                }
            }
        }
    ]
}
EOF
)
    
    echo "Creating DNS record..."
    local result=$(aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch "$change_batch" 2>&1)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Subdomain $subdomain.$DOMAIN created successfully!${NC}"
        
        # Get the change ID for tracking
        local change_id=$(echo "$result" | grep -o 'PENDING\|INSYNC' | head -1)
        echo "Change status: $change_id"
        
        return 0
    else
        echo -e "${RED}❌ Failed to create subdomain: $subdomain.$DOMAIN${NC}"
        echo "Error: $result"
        return 1
    fi
}

# Function to verify subdomain creation
verify_subdomain() {
    local subdomain=$1
    local max_attempts=30
    local attempt=1
    
    echo -e "${BLUE}Verifying subdomain creation...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        echo -n "Attempt $attempt/$max_attempts: "
        
        # Check if DNS record exists
        local record=$(aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID --query "ResourceRecordSets[?Name==\`$subdomain.$DOMAIN.\`].Name" --output text 2>/dev/null)
        
        if [ ! -z "$record" ]; then
            echo -e "${GREEN}✅ DNS record created${NC}"
            
            # Test DNS resolution
            local ip=$(dig $subdomain.$DOMAIN A +short 2>/dev/null | head -1)
            if [ ! -z "$ip" ]; then
                echo -e "${GREEN}✅ DNS resolution working: $ip${NC}"
                return 0
            else
                echo -e "${YELLOW}⚠️ DNS resolution not yet propagated${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️ DNS record not yet created${NC}"
        fi
        
        sleep 10
        ((attempt++))
    done
    
    echo -e "${RED}❌ Verification timeout after $max_attempts attempts${NC}"
    return 1
}

# Function to create batch subdomains
create_batch_subdomains() {
    local environment=$1
    local start_num=$2
    local end_num=$3
    local alb_dns_name=$4
    local alb_zone_id=$5
    
    echo -e "${BLUE}Creating batch subdomains for $environment environment${NC}"
    echo "Range: $environment$start_num to $environment$end_num"
    echo ""
    
    local success_count=0
    local failure_count=0
    
    for i in $(seq -w $start_num $end_num); do
        local subdomain="${environment}${i}"
        
        echo -e "${BLUE}Processing $subdomain...${NC}"
        
        if check_subdomain_exists $subdomain; then
            echo -e "${YELLOW}⚠️ $subdomain.$DOMAIN already exists, skipping${NC}"
            continue
        fi
        
        if create_subdomain $subdomain $alb_dns_name $alb_zone_id; then
            ((success_count++))
        else
            ((failure_count++))
        fi
        
        echo ""
    done
    
    echo -e "${GREEN}🎉 Batch creation complete!${NC}"
    echo "Success: $success_count"
    echo "Failed: $failure_count"
}

# Main script
main() {
    # Check if zone ID exists
    if [ -z "$ZONE_ID" ]; then
        echo -e "${RED}❌ No Route53 hosted zone found for $DOMAIN${NC}"
        echo "Please deploy your Terraform infrastructure first:"
        echo "cd terraform/environments/main && terraform apply"
        exit 1
    fi
    
    # Check arguments
    if [ $# -eq 0 ]; then
        show_usage
        exit 1
    fi
    
    # Handle batch creation
    if [ "$1" = "batch" ]; then
        if [ $# -lt 4 ]; then
            echo -e "${RED}❌ Batch mode requires: environment start_num end_num [alb-dns-name] [alb-zone-id]${NC}"
            echo "Example: $0 batch dev 01 10"
            exit 1
        fi
        
        local environment=$2
        local start_num=$3
        local end_num=$4
        local alb_dns_name=${5:-$(get_alb_dns_name "${environment}01")}
        local alb_zone_id=${6:-$(get_alb_zone_id)}
        
        create_batch_subdomains $environment $start_num $end_num $alb_dns_name $alb_zone_id
        exit 0
    fi
    
    # Single subdomain creation
    local subdomain=$1
    local alb_dns_name=${2:-$(get_alb_dns_name $subdomain)}
    local alb_zone_id=${3:-$(get_alb_zone_id)}
    
    # Validate subdomain
    if ! validate_subdomain $subdomain; then
        exit 1
    fi
    
    # Check if subdomain already exists
    if check_subdomain_exists $subdomain; then
        echo -e "${YELLOW}⚠️ Subdomain $subdomain.$DOMAIN already exists${NC}"
        read -p "Do you want to update it? (y/n): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Operation cancelled."
            exit 0
        fi
    fi
    
    # Create subdomain
    if create_subdomain $subdomain $alb_dns_name $alb_zone_id; then
        # Verify creation
        if verify_subdomain $subdomain; then
            echo -e "${GREEN}🎉 Subdomain $subdomain.$DOMAIN is ready!${NC}"
            echo ""
            echo "📋 Next Steps:"
            echo "• Test the subdomain: curl -I https://$subdomain.$DOMAIN"
            echo "• Run DNS health check: ./scripts/dns-health-check.sh"
            echo "• Verify Route53 records: ./scripts/verify-route53-records.sh"
        else
            echo -e "${YELLOW}⚠️ Subdomain created but verification failed${NC}"
            echo "DNS propagation may take up to 24 hours."
        fi
    else
        echo -e "${RED}❌ Failed to create subdomain${NC}"
        exit 1
    fi
}

# Run main function
main "$@" 