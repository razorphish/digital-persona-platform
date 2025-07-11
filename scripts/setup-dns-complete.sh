#!/bin/bash
# setup-dns-complete.sh - Complete DNS setup for hibiji.com with wildcard support

set -e

DOMAIN="hibiji.com"
AWS_REGION="us-west-1"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🌐 Complete DNS Setup for $DOMAIN"
echo "=================================="
echo "This script will set up DNS configuration with wildcard subdomain support"
echo ""

# Function to check prerequisites
check_prerequisites() {
    echo -e "${BLUE}Checking Prerequisites...${NC}"
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}❌ AWS CLI is not installed${NC}"
        echo "Please install AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}❌ AWS CLI is not configured${NC}"
        echo "Please run 'aws configure' first"
        exit 1
    fi
    
    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        echo -e "${RED}❌ Terraform is not installed${NC}"
        echo "Please install Terraform: https://developer.hashicorp.com/terraform/downloads"
        exit 1
    fi
    
    # Check dig
    if ! command -v dig &> /dev/null; then
        echo -e "${RED}❌ dig command is not available${NC}"
        echo "Please install bind-utils or dnsutils"
        exit 1
    fi
    
    # Check curl
    if ! command -v curl &> /dev/null; then
        echo -e "${RED}❌ curl is not installed${NC}"
        echo "Please install curl"
        exit 1
    fi
    
    echo -e "${GREEN}✅ All prerequisites met${NC}"
    echo ""
}

# Function to select ECR repository from list
select_ecr_repo() {
    local prompt="$1"
    
    echo -e "${BLUE}$prompt${NC}"
    echo "Attempting to fetch ECR repositories..."
    
    # Create temporary file to capture output
    local temp_file=$(mktemp)
    
    # Try to get repositories and save to temp file
    aws ecr describe-repositories --query 'repositories[*].repositoryUri' --output text > "$temp_file" 2>/dev/null
    
    if [ $? -eq 0 ] && [ -s "$temp_file" ]; then
        # Read from temp file
        local repos_output=$(cat "$temp_file")
        rm "$temp_file"
        
        # Convert space-separated list to array
        local repos=($repos_output)
        local count=${#repos[@]}
        
        if [ $count -gt 0 ]; then
            echo "Available repositories:"
            for i in "${!repos[@]}"; do
                echo "  [$((i+1))] ${repos[$i]}"
            done
            
            local choice
            while true; do
                read -p "Select a repository [1-$count]: " choice
                if [[ $choice =~ ^[0-9]+$ ]] && [ $choice -ge 1 ] && [ $choice -le $count ]; then
                    echo "${repos[$((choice-1))]}"
                    return 0
                else
                    echo "Invalid selection. Please enter a number between 1 and $count."
                fi
            done
        fi
    else
        rm -f "$temp_file"
    fi
    
    # Fallback: manual entry
    echo -e "${YELLOW}⚠️ Could not fetch ECR repositories automatically${NC}"
    echo "Please enter the ECR repository URL manually."
    echo "Format: 123456789012.dkr.ecr.us-west-1.amazonaws.com/repository-name"
    
    local manual_url
    while true; do
        read -p "Enter ECR repository URL: " manual_url
        if [[ $manual_url == *".dkr.ecr."* ]]; then
            echo "$manual_url"
            return 0
        else
            echo -e "${RED}❌ Invalid ECR URL format. Please try again.${NC}"
        fi
    done
}

# Function to deploy Terraform infrastructure
deploy_terraform() {
    echo -e "${BLUE}Step 1: Deploying Terraform Infrastructure...${NC}"
    
    cd terraform/environments/main
    
    # Check if terraform is initialized
    if [ ! -d ".terraform" ]; then
        echo "Initializing Terraform..."
        terraform init
    fi
    
    # Prompt for ECR repository URLs interactively
    BACKEND_ECR_URL=$(select_ecr_repo "Select Backend ECR repository URL:")
    FRONTEND_ECR_URL=$(select_ecr_repo "Select Frontend ECR repository URL:")
    # Prompt for image tags (default to 'latest')
    read -p "Enter backend image tag [latest]: " BACKEND_IMAGE_TAG
    BACKEND_IMAGE_TAG=${BACKEND_IMAGE_TAG:-latest}
    read -p "Enter frontend image tag [latest]: " FRONTEND_IMAGE_TAG
    FRONTEND_IMAGE_TAG=${FRONTEND_IMAGE_TAG:-latest}
    # Plan the deployment
    echo "Planning Terraform deployment..."
    terraform plan \
      -var="ecr_repository_url=$BACKEND_ECR_URL" \
      -var="frontend_ecr_repository_url=$FRONTEND_ECR_URL" \
      -var="image_tag=$BACKEND_IMAGE_TAG" \
      -var="frontend_image_tag=$FRONTEND_IMAGE_TAG" \
      -out=tfplan
    
    # Ask for confirmation
    read -p "Do you want to apply this Terraform plan? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Applying Terraform configuration..."
        terraform apply tfplan
        echo -e "${GREEN}✅ Terraform deployment complete${NC}"
    else
        echo "Terraform deployment skipped"
    fi
    
    cd ../../..
    echo ""
}

# Function to get AWS nameservers
get_nameservers() {
    echo -e "${BLUE}Step 2: Getting AWS Nameservers...${NC}"
    
    ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name==\`$DOMAIN.\`].Id" --output text)
    
    if [ -z "$ZONE_ID" ]; then
        echo -e "${RED}❌ No Route53 hosted zone found for $DOMAIN${NC}"
        echo "Please deploy Terraform infrastructure first"
        exit 1
    fi
    
    NAMESERVERS=$(aws route53 get-hosted-zone --id $ZONE_ID --query 'DelegationSet.NameServers' --output text)
    
    if [ -z "$NAMESERVERS" ]; then
        echo -e "${RED}❌ No nameservers found for hosted zone${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Nameservers for $DOMAIN:${NC}"
    echo "$NAMESERVERS" | tr '\t' '\n' | while read ns; do
        echo "  - $ns"
    done
    echo ""
    
    # Save nameservers to file for reference
    echo "$NAMESERVERS" | tr '\t' '\n' > "nameservers-$DOMAIN.txt"
    echo -e "${YELLOW}📝 Nameservers saved to nameservers-$DOMAIN.txt${NC}"
    echo ""
}

# Function to check SSL certificate
check_ssl_certificate() {
    echo -e "${BLUE}Step 3: Checking SSL Certificate...${NC}"
    
    CERT_ARN=$(aws acm list-certificates --region $AWS_REGION --query "CertificateSummaryList[?DomainName==\`$DOMAIN\`].CertificateArn" --output text)
    
    if [ ! -z "$CERT_ARN" ]; then
        echo -e "${GREEN}✅ ACM certificate found: $CERT_ARN${NC}"
        
        # Check certificate status
        CERT_STATUS=$(aws acm describe-certificate --certificate-arn $CERT_ARN --region $AWS_REGION --query 'Certificate.Status' --output text)
        echo "Certificate status: $CERT_STATUS"
        
        if [ "$CERT_STATUS" = "ISSUED" ]; then
            echo -e "${GREEN}✅ SSL certificate is issued and valid${NC}"
        else
            echo -e "${YELLOW}⚠️ SSL certificate is not yet issued (status: $CERT_STATUS)${NC}"
            echo "This may take up to 24 hours for DNS validation"
        fi
        
        # Check subject alternative names
        echo "Subject Alternative Names:"
        aws acm describe-certificate --certificate-arn $CERT_ARN --region $AWS_REGION --query 'Certificate.SubjectAlternativeNames' --output text | tr '\t' '\n' | while read san; do
            echo "  - $san"
        done
    else
        echo -e "${RED}❌ No ACM certificate found for $DOMAIN${NC}"
        echo "Please deploy Terraform infrastructure to create the certificate"
    fi
    echo ""
}

# Function to create wildcard records
create_wildcard_records() {
    echo -e "${BLUE}Step 4: Creating Wildcard DNS Records...${NC}"
    
    ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name==\`$DOMAIN.\`].Id" --output text)
    
    # Get ALB DNS name
    ALB_DNS_NAME=$(aws elbv2 describe-load-balancers --query "LoadBalancers[?contains(LoadBalancerName, \`hibiji-main\`)].DNSName" --output text | head -1)
    
    if [ -z "$ALB_DNS_NAME" ]; then
        echo -e "${YELLOW}⚠️ No ALB found, using default pattern${NC}"
        ALB_DNS_NAME="hibiji-main01-alb-123456.us-west-1.elb.amazonaws.com"
    fi
    
    ALB_ZONE_ID="Z1H1FL5HABSF5"  # Default AWS ALB zone ID for us-west-1
    
    echo "ALB DNS Name: $ALB_DNS_NAME"
    echo "ALB Zone ID: $ALB_ZONE_ID"
    
    # Create wildcard record
    echo "Creating wildcard record (*.$DOMAIN)..."
    
    WILDCARD_BATCH=$(cat <<EOF
{
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "*.$DOMAIN",
                "Type": "A",
                "AliasTarget": {
                    "HostedZoneId": "$ALB_ZONE_ID",
                    "DNSName": "$ALB_DNS_NAME",
                    "EvaluateTargetHealth": true
                }
            }
        }
    ]
}
EOF
)
    
    aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch "$WILDCARD_BATCH" >/dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Wildcard record created successfully${NC}"
    else
        echo -e "${RED}❌ Failed to create wildcard record${NC}"
    fi
    echo ""
}

# Function to create environment subdomains
create_environment_subdomains() {
    echo -e "${BLUE}Step 5: Creating Environment Subdomains...${NC}"
    
    # Define subdomains to create
    SUBDOMAINS=(
        "dev01" "dev02" "dev03" "dev04" "dev05" "dev06" "dev07" "dev08" "dev09" "dev10"
        "qa01" "qa02" "qa03" "qa04" "qa05" "qa06" "qa07" "qa08" "qa09" "qa10"
        "staging01" "staging02" "staging03" "staging04" "staging05"
        "main01" "main02" "main03" "main04" "main05"
        "prod01" "prod02" "prod03" "prod04" "prod05"
    )
    
    ZONE_ID=$(aws route53 list-hosted-zones --query "HostedZones[?Name==\`$DOMAIN.\`].Id" --output text)
    ALB_DNS_NAME=$(aws elbv2 describe-load-balancers --query "LoadBalancers[?contains(LoadBalancerName, \`hibiji-main\`)].DNSName" --output text | head -1)
    ALB_ZONE_ID="Z1H1FL5HABSF5"
    
    if [ -z "$ALB_DNS_NAME" ]; then
        ALB_DNS_NAME="hibiji-main01-alb-123456.us-west-1.elb.amazonaws.com"
    fi
    
    echo "Creating subdomains..."
    
    for subdomain in "${SUBDOMAINS[@]}"; do
        echo -n "Creating $subdomain.$DOMAIN... "
        
        # Check if record already exists
        EXISTING=$(aws route53 list-resource-record-sets --hosted-zone-id $ZONE_ID --query "ResourceRecordSets[?Name==\`$subdomain.$DOMAIN.\`].Name" --output text 2>/dev/null)
        
        if [ ! -z "$EXISTING" ]; then
            echo -e "${YELLOW}Already exists${NC}"
            continue
        fi
        
        # Create the record
        SUBDOMAIN_BATCH=$(cat <<EOF
{
    "Changes": [
        {
            "Action": "UPSERT",
            "ResourceRecordSet": {
                "Name": "$subdomain.$DOMAIN",
                "Type": "A",
                "AliasTarget": {
                    "HostedZoneId": "$ALB_ZONE_ID",
                    "DNSName": "$ALB_DNS_NAME",
                    "EvaluateTargetHealth": true
                }
            }
        }
    ]
}
EOF
)
        
        aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch "$SUBDOMAIN_BATCH" >/dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Created${NC}"
        else
            echo -e "${RED}Failed${NC}"
        fi
    done
    echo ""
}

# Function to provide registrar instructions
show_registrar_instructions() {
    echo -e "${BLUE}Step 6: Domain Registrar Configuration${NC}"
    echo "=============================================="
    echo ""
    echo -e "${YELLOW}📋 IMPORTANT: You need to update your domain registrar with the AWS nameservers${NC}"
    echo ""
    echo "1. Log into your domain registrar (GoDaddy, Namecheap, etc.)"
    echo "2. Find DNS/Nameserver settings for $DOMAIN"
    echo "3. Replace existing nameservers with these AWS nameservers:"
    echo ""
    
    if [ -f "nameservers-$DOMAIN.txt" ]; then
        cat "nameservers-$DOMAIN.txt" | while read ns; do
            echo "   $ns"
        done
    else
        echo "   (Nameservers not available - run get_nameservers first)"
    fi
    
    echo ""
    echo "4. Save the changes"
    echo "5. Wait 24-48 hours for DNS propagation"
    echo ""
    echo -e "${YELLOW}⚠️ DNS propagation can take up to 48 hours globally${NC}"
    echo ""
}

# Function to run verification tests
run_verification_tests() {
    echo -e "${BLUE}Step 7: Running Verification Tests...${NC}"
    echo ""
    
    # Run DNS test script
    if [ -f "scripts/dns-test.sh" ]; then
        echo "Running DNS tests..."
        ./scripts/dns-test.sh
    else
        echo -e "${YELLOW}⚠️ DNS test script not found${NC}"
    fi
    
    echo ""
    
    # Run Route53 verification
    if [ -f "scripts/verify-route53-records.sh" ]; then
        echo "Verifying Route53 records..."
        ./scripts/verify-route53-records.sh
    else
        echo -e "${YELLOW}⚠️ Route53 verification script not found${NC}"
    fi
    
    echo ""
}

# Function to show next steps
show_next_steps() {
    echo -e "${BLUE}Next Steps${NC}"
    echo "=========="
    echo ""
    echo "1. Update your domain registrar with the AWS nameservers"
    echo "2. Wait 24-48 hours for DNS propagation"
    echo "3. Run verification tests:"
    echo "   ./scripts/dns-test.sh"
    echo "   ./scripts/dns-health-check.sh"
    echo "   ./scripts/verify-route53-records.sh"
    echo ""
    echo "4. Create additional subdomains as needed:"
    echo "   ./scripts/create-subdomain.sh dev11"
    echo "   ./scripts/create-subdomain.sh batch dev 11 20"
    echo ""
    echo "5. Monitor DNS health:"
    echo "   ./scripts/dns-health-check.sh"
    echo ""
    echo -e "${GREEN}🎉 DNS setup is complete!${NC}"
    echo ""
}

# Main script
main() {
    echo "Starting complete DNS setup for $DOMAIN..."
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Ask user what they want to do
    echo "What would you like to do?"
    echo "1. Deploy Terraform infrastructure"
    echo "2. Get AWS nameservers"
    echo "3. Check SSL certificate"
    echo "4. Create wildcard records"
    echo "5. Create environment subdomains"
    echo "6. Show registrar instructions"
    echo "7. Run verification tests"
    echo "8. Complete setup (all steps)"
    echo "9. Exit"
    echo ""
    
    read -p "Enter your choice (1-9): " choice
    
    case $choice in
        1)
            deploy_terraform
            ;;
        2)
            get_nameservers
            ;;
        3)
            check_ssl_certificate
            ;;
        4)
            create_wildcard_records
            ;;
        5)
            create_environment_subdomains
            ;;
        6)
            show_registrar_instructions
            ;;
        7)
            run_verification_tests
            ;;
        8)
            echo -e "${BLUE}Running complete DNS setup...${NC}"
            echo ""
            deploy_terraform
            get_nameservers
            check_ssl_certificate
            create_wildcard_records
            create_environment_subdomains
            show_registrar_instructions
            run_verification_tests
            show_next_steps
            ;;
        9)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid choice${NC}"
            exit 1
            ;;
    esac
}

# Run main function
main "$@" 