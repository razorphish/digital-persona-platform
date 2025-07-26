#!/bin/bash

# CloudFront Distribution Cleanup Script
# Safely identifies and removes unused CloudFront distributions

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧹 CloudFront Distribution Cleanup Tool${NC}"
echo "============================================="

# Check if AWS CLI is available
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install AWS CLI first.${NC}"
    exit 1
fi

# Function to get all CloudFront distributions with details
get_cloudfront_details() {
    echo -e "${YELLOW}📋 Analyzing all CloudFront distributions...${NC}"
    aws cloudfront list-distributions --query 'DistributionList.Items[*].{
        Id:Id,
        DomainName:DomainName,
        Status:Status,
        Origins:Origins.Items[0].DomainName,
        Aliases:Aliases.Items[0],
        Enabled:Enabled,
        Comment:Comment,
        LastModified:LastModifiedTime
    }' --output table
}

# Function to get distributions grouped by origin
analyze_duplicates() {
    echo -e "${YELLOW}🔍 Analyzing duplicate distributions by origin...${NC}"
    
    # Get all distributions in JSON format
    aws cloudfront list-distributions --query 'DistributionList.Items[*].{
        Id:Id,
        DomainName:DomainName,
        Status:Status,
        Origins:Origins.Items[0].DomainName,
        Aliases:Aliases.Items,
        Enabled:Enabled,
        LastModified:LastModifiedTime
    }' --output json > /tmp/cloudfront_distributions.json
    
    # Group by origin and show duplicates
    echo -e "${BLUE}📊 Distributions grouped by origin:${NC}"
    jq -r 'group_by(.Origins) | .[] | 
        select(length > 1) | 
        "=== Origin: " + .[0].Origins + " ===" as $header |
        $header,
        (.[] | "  " + .DomainName + " (" + .Id + ") - Status: " + .Status + " - Enabled: " + (.Enabled | tostring) + " - Modified: " + .LastModified)' \
        /tmp/cloudfront_distributions.json || echo "No duplicates found or JSON parsing failed"
}

# Function to check if distribution has custom domains (Route53 records)
check_route53_usage() {
    local distribution_id=$1
    local domain_name=$2
    
    echo -e "${YELLOW}🔍 Checking Route53 usage for $domain_name...${NC}"
    
    # Get hosted zones and check for records pointing to this distribution
    aws route53 list-hosted-zones --query 'HostedZones[*].Id' --output text | while read zone_id; do
        if [ -n "$zone_id" ]; then
            # Remove /hostedzone/ prefix
            clean_zone_id=${zone_id#/hostedzone/}
            records=$(aws route53 list-resource-record-sets --hosted-zone-id "$clean_zone_id" \
                --query "ResourceRecordSets[?contains(AliasTarget.DNSName, '$domain_name')].Name" \
                --output text 2>/dev/null || echo "")
            if [ -n "$records" ] && [ "$records" != "None" ]; then
                echo -e "${GREEN}  ✅ Used by Route53 records: $records${NC}"
                return 0
            fi
        fi
    done
    echo -e "${YELLOW}  ⚠️ No Route53 records found${NC}"
    return 1
}

# Function to check if S3 bucket exists
check_s3_bucket_exists() {
    local origin=$1
    local bucket_name=$(echo "$origin" | cut -d'.' -f1)
    
    if aws s3api head-bucket --bucket "$bucket_name" 2>/dev/null; then
        echo -e "${GREEN}  ✅ S3 bucket exists: $bucket_name${NC}"
        return 0
    else
        echo -e "${RED}  ❌ S3 bucket missing: $bucket_name${NC}"
        return 1
    fi
}

# Function to safely disable a distribution
disable_distribution() {
    local distribution_id=$1
    local domain_name=$2
    
    echo -e "${YELLOW}⏳ Disabling distribution $domain_name ($distribution_id)...${NC}"
    
    # Get current distribution config
    aws cloudfront get-distribution-config --id "$distribution_id" --output json > "/tmp/dist_config_${distribution_id}.json"
    
    # Update enabled to false
    jq '.DistributionConfig.Enabled = false' "/tmp/dist_config_${distribution_id}.json" > "/tmp/dist_config_disabled_${distribution_id}.json"
    
    # Extract ETag
    etag=$(jq -r '.ETag' "/tmp/dist_config_${distribution_id}.json")
    
    # Update distribution
    aws cloudfront update-distribution \
        --id "$distribution_id" \
        --distribution-config file:///tmp/dist_config_disabled_${distribution_id}.json \
        --if-match "$etag" > /dev/null
    
    echo -e "${GREEN}✅ Distribution disabled. Wait 15-20 minutes before deletion.${NC}"
}

# Function to delete a distribution
delete_distribution() {
    local distribution_id=$1
    local domain_name=$2
    
    echo -e "${YELLOW}🗑️ Deleting distribution $domain_name ($distribution_id)...${NC}"
    
    # Check if distribution is disabled
    status=$(aws cloudfront get-distribution --id "$distribution_id" --query 'Distribution.Status' --output text)
    enabled=$(aws cloudfront get-distribution --id "$distribution_id" --query 'Distribution.DistributionConfig.Enabled' --output text)
    
    if [ "$enabled" = "true" ]; then
        echo -e "${RED}❌ Distribution must be disabled first${NC}"
        return 1
    fi
    
    if [ "$status" != "Deployed" ]; then
        echo -e "${YELLOW}⏳ Distribution status: $status. Waiting for deployment...${NC}"
        return 1
    fi
    
    # Get ETag for deletion
    etag=$(aws cloudfront get-distribution --id "$distribution_id" --query 'ETag' --output text)
    
    # Delete distribution
    aws cloudfront delete-distribution --id "$distribution_id" --if-match "$etag"
    
    echo -e "${GREEN}✅ Distribution deleted successfully${NC}"
}

# Main menu
show_menu() {
    echo ""
    echo -e "${BLUE}🛠️ CloudFront Cleanup Options:${NC}"
    echo "1. List all CloudFront distributions"
    echo "2. Analyze duplicate distributions"
    echo "3. Interactive cleanup (safe)"
    echo "4. Exit"
    echo ""
}

# Interactive cleanup function
interactive_cleanup() {
    echo -e "${YELLOW}🎯 Interactive CloudFront Cleanup${NC}"
    echo "This will help you safely identify and remove unused distributions."
    echo ""
    
    # Get all distributions
    aws cloudfront list-distributions --query 'DistributionList.Items[*].{
        Id:Id,
        DomainName:DomainName,
        Status:Status,
        Origins:Origins.Items[0].DomainName,
        Enabled:Enabled,
        LastModified:LastModifiedTime
    }' --output json > /tmp/all_distributions.json
    
    # Process each distribution
    jq -c '.[]' /tmp/all_distributions.json | while read distribution; do
        id=$(echo "$distribution" | jq -r '.Id')
        domain=$(echo "$distribution" | jq -r '.DomainName')
        origin=$(echo "$distribution" | jq -r '.Origins')
        enabled=$(echo "$distribution" | jq -r '.Enabled')
        status=$(echo "$distribution" | jq -r '.Status')
        modified=$(echo "$distribution" | jq -r '.LastModified')
        
        echo ""
        echo -e "${BLUE}=== Distribution: $domain ===${NC}"
        echo "  ID: $id"
        echo "  Origin: $origin"
        echo "  Status: $status"
        echo "  Enabled: $enabled"
        echo "  Last Modified: $modified"
        
        # Check if S3 bucket exists
        if ! check_s3_bucket_exists "$origin"; then
            echo -e "${RED}🚨 This distribution points to a non-existent S3 bucket!${NC}"
            read -p "❓ Delete this unused distribution? (y/N): " delete_choice
            if [[ $delete_choice =~ ^[Yy]$ ]]; then
                if [ "$enabled" = "true" ]; then
                    echo "First disabling the distribution..."
                    disable_distribution "$id" "$domain"
                    echo "⏳ Please wait 15-20 minutes and run the script again to delete."
                else
                    delete_distribution "$id" "$domain"
                fi
            fi
            continue
        fi
        
        # Check Route53 usage
        if check_route53_usage "$id" "$domain"; then
            echo -e "${GREEN}✅ This distribution is actively used by Route53${NC}"
            continue
        fi
        
        echo -e "${YELLOW}⚠️ This distribution has no Route53 records pointing to it${NC}"
        
        # Check if this is a duplicate (same origin as others)
        origin_count=$(jq -c '.[]' /tmp/all_distributions.json | grep -c "$(echo "$origin" | sed 's/[.*[\]/\\&/g')")
        if [ "$origin_count" -gt 1 ]; then
            echo -e "${YELLOW}📊 Found $origin_count distributions pointing to the same origin${NC}"
            echo -e "${YELLOW}💡 This appears to be a duplicate distribution${NC}"
        fi
        
        read -p "❓ Delete this distribution? (y/N): " delete_choice
        if [[ $delete_choice =~ ^[Yy]$ ]]; then
            if [ "$enabled" = "true" ]; then
                echo "First disabling the distribution..."
                disable_distribution "$id" "$domain"
                echo "⏳ Please wait 15-20 minutes and run the script again to delete."
            else
                delete_distribution "$id" "$domain"
            fi
        else
            echo "Skipping $domain"
        fi
    done
}

# Main script execution
main() {
    while true; do
        show_menu
        read -p "Choose an option (1-4): " choice
        
        case $choice in
            1)
                get_cloudfront_details
                ;;
            2)
                analyze_duplicates
                ;;
            3)
                interactive_cleanup
                ;;
            4)
                echo -e "${GREEN}✅ Cleanup tool completed${NC}"
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
trap 'rm -f /tmp/cloudfront_distributions.json /tmp/all_distributions.json /tmp/dist_config_*.json' EXIT

# Run main function
main 