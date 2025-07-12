#!/bin/bash

# Cost Optimization Script for Hibiji Platform
# This script analyzes AWS resources and provides cost optimization recommendations

set -e

# Cross-platform date function
get_date_90_days_ago() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS (BSD date)
        date -v-90d -Iseconds
    else
        # Linux (GNU date)
        date -d '90 days ago' -Iseconds
    fi
}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="us-west-1"
PROJECT_TAG="hibiji"
REPORT_FILE="cost_optimization_report_$(date +%Y%m%d_%H%M%S).md"
TOTAL_SAVINGS=0

# Functions
print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_savings() {
    echo -e "${GREEN}💰 Potential Savings: \$$1${NC}"
}

# Initialize report
init_report() {
    cat > "$REPORT_FILE" << EOF
# AWS Cost Optimization Report
Generated on: $(date)

## Executive Summary

This report provides cost optimization recommendations for the Hibiji platform.

## Recommendations

EOF
}

# Check for unused EBS volumes
check_unused_ebs() {
    print_header "Checking for unused EBS volumes"
    
    local unused_volumes=$(aws ec2 describe-volumes \
        --region "$AWS_REGION" \
        --filters "Name=status,Values=available" \
        --query 'Volumes[?Tags[?Key==`Project` && Value==`'$PROJECT_TAG'`]].[VolumeId,Size,VolumeType]' \
        --output table)
    
    if [ ! -z "$unused_volumes" ] && [ "$unused_volumes" != "None" ]; then
        print_warning "Found unused EBS volumes:"
        echo "$unused_volumes"
        
        # Calculate potential savings (rough estimate)
        local total_size=$(echo "$unused_volumes" | grep -v "VolumeId" | awk '{sum += $2} END {print sum}')
        local estimated_savings=$(echo "$total_size * 0.10" | bc -l)  # Rough estimate
        
        echo "" >> "$REPORT_FILE"
        echo "### Unused EBS Volumes" >> "$REPORT_FILE"
        echo "Consider deleting unused EBS volumes to reduce costs." >> "$REPORT_FILE"
        echo "- Total unused storage: ${total_size}GB" >> "$REPORT_FILE"
        echo "- Estimated monthly savings: \$$estimated_savings" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        
        TOTAL_SAVINGS=$(echo "$TOTAL_SAVINGS + $estimated_savings" | bc -l)
        print_savings "$estimated_savings"
    else
        print_status "No unused EBS volumes found"
    fi
}

# Check for underutilized EC2 instances
check_underutilized_ec2() {
    print_header "Checking for underutilized EC2 instances"
    
    # Get EC2 instances with hibiji tag
    local instances=$(aws ec2 describe-instances \
        --region "$AWS_REGION" \
        --filters "Name=tag:Project,Values=$PROJECT_TAG" \
        --query 'Reservations[].Instances[?State.Name==`running`].[InstanceId,InstanceType,State.Name]' \
        --output table)
    
    if [ ! -z "$instances" ] && [ "$instances" != "None" ]; then
        print_warning "Found running EC2 instances:"
        echo "$instances"
        
        echo "" >> "$REPORT_FILE"
        echo "### EC2 Instance Optimization" >> "$REPORT_FILE"
        echo "Consider the following optimizations:" >> "$REPORT_FILE"
        echo "- Review instance sizes based on actual usage" >> "$REPORT_FILE"
        echo "- Consider using Spot instances for non-production workloads" >> "$REPORT_FILE"
        echo "- Implement auto-scaling policies" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        
        # Rough estimate for potential savings
        local estimated_savings=50
        TOTAL_SAVINGS=$(echo "$TOTAL_SAVINGS + $estimated_savings" | bc -l)
        print_savings "$estimated_savings"
    else
        print_status "No EC2 instances found (using ECS Fargate)"
    fi
}

# Check for unused ECS services
check_unused_ecs() {
    print_header "Checking for unused ECS services"
    
    local clusters=$(aws ecs list-clusters --region "$AWS_REGION" --query 'clusterArns[?contains(@, `hibiji`)]' --output text)
    
    for cluster in $clusters; do
        local cluster_name=$(echo "$cluster" | cut -d'/' -f2)
        local services=$(aws ecs list-services --cluster "$cluster_name" --region "$AWS_REGION" --output text)
        
        for service in $services; do
            local service_status=$(aws ecs describe-services \
                --cluster "$cluster_name" \
                --services "$service" \
                --region "$AWS_REGION" \
                --query 'services[0].status' \
                --output text)
            
            if [ "$service_status" = "INACTIVE" ]; then
                print_warning "Found inactive ECS service: $service in cluster $cluster_name"
                
                echo "" >> "$REPORT_FILE"
                echo "### Inactive ECS Service" >> "$REPORT_FILE"
                echo "- Service: $service" >> "$REPORT_FILE"
                echo "- Cluster: $cluster_name" >> "$REPORT_FILE"
                echo "- Recommendation: Consider deleting inactive services" >> "$REPORT_FILE"
                echo "" >> "$REPORT_FILE"
            fi
        done
    done
    
    print_status "ECS service analysis complete"
}

# Check for unused RDS instances
check_unused_rds() {
    print_header "Checking for unused RDS instances"
    
    local rds_instances=$(aws rds describe-db-instances \
        --region "$AWS_REGION" \
        --query 'DBInstances[?contains(DBInstanceIdentifier, `hibiji`) && DBInstanceStatus==`stopped`].[DBInstanceIdentifier,DBInstanceClass,AllocatedStorage]' \
        --output table)
    
    if [ ! -z "$rds_instances" ] && [ "$rds_instances" != "None" ]; then
        print_warning "Found stopped RDS instances:"
        echo "$rds_instances"
        
        echo "" >> "$REPORT_FILE"
        echo "### Stopped RDS Instances" >> "$REPORT_FILE"
        echo "Consider deleting stopped RDS instances to reduce costs." >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
        
        # Rough estimate for potential savings
        local estimated_savings=100
        TOTAL_SAVINGS=$(echo "$TOTAL_SAVINGS + $estimated_savings" | bc -l)
        print_savings "$estimated_savings"
    else
        print_status "No stopped RDS instances found"
    fi
}

# Check for unused S3 objects
check_unused_s3() {
    print_header "Checking for unused S3 objects"
    
    local buckets=$(aws s3api list-buckets \
        --query 'Buckets[?contains(Name, `hibiji`)].Name' \
        --output text)
    
    for bucket in $buckets; do
        local object_count=$(aws s3api list-objects-v2 \
            --bucket "$bucket" \
            --query 'KeyCount' \
            --output text)
        
        if [ "$object_count" -gt 0 ]; then
            print_warning "Bucket $bucket contains $object_count objects"
            
            # Check for old objects (older than 90 days)
            local old_objects=$(aws s3api list-objects-v2 \
                --bucket "$bucket" \
                --query 'Contents[?LastModified<`'$(get_date_90_days_ago)'`].Key' \
                --output text)
            
            if [ ! -z "$old_objects" ] && [ "$old_objects" != "None" ]; then
                echo "" >> "$REPORT_FILE"
                echo "### S3 Optimization - Bucket: $bucket" >> "$REPORT_FILE"
                echo "- Total objects: $object_count" >> "$REPORT_FILE"
                echo "- Old objects (>90 days): Found" >> "$REPORT_FILE"
                echo "- Recommendation: Implement lifecycle policies" >> "$REPORT_FILE"
                echo "" >> "$REPORT_FILE"
            fi
        fi
    done
    
    print_status "S3 analysis complete"
}

# Check for unused load balancers
check_unused_alb() {
    print_header "Checking for unused load balancers"
    
    local load_balancers=$(aws elbv2 describe-load-balancers \
        --region "$AWS_REGION" \
        --query 'LoadBalancers[?contains(LoadBalancerName, `hibiji`) && State.Code==`active`].[LoadBalancerName,Type,State.Code]' \
        --output table)
    
    if [ ! -z "$load_balancers" ] && [ "$load_balancers" != "None" ]; then
        print_warning "Found active load balancers:"
        echo "$load_balancers"
        
        echo "" >> "$REPORT_FILE"
        echo "### Load Balancer Optimization" >> "$REPORT_FILE"
        echo "Consider the following optimizations:" >> "$REPORT_FILE"
        echo "- Use deletion protection only for production" >> "$REPORT_FILE"
        echo "- Review target group configurations" >> "$REPORT_FILE"
        echo "- Consider using Application Load Balancer for cost efficiency" >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    else
        print_status "No load balancers found"
    fi
}

# Check for unused security groups
check_unused_security_groups() {
    print_header "Checking for unused security groups"
    
    local security_groups=$(aws ec2 describe-security-groups \
        --region "$AWS_REGION" \
        --filters "Name=group-name,Values=*hibiji*" \
        --query 'SecurityGroups[?length(Attachments)==`0`].[GroupId,GroupName]' \
        --output table)
    
    if [ ! -z "$security_groups" ] && [ "$security_groups" != "None" ]; then
        print_warning "Found unused security groups:"
        echo "$security_groups"
        
        echo "" >> "$REPORT_FILE"
        echo "### Unused Security Groups" >> "$REPORT_FILE"
        echo "Consider deleting unused security groups to improve security posture." >> "$REPORT_FILE"
        echo "" >> "$REPORT_FILE"
    else
        print_status "No unused security groups found"
    fi
}

# Check for cost optimization opportunities
check_cost_optimization() {
    print_header "Checking for cost optimization opportunities"
    
    echo "" >> "$REPORT_FILE"
    echo "### General Cost Optimization Recommendations" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "1. **Reserved Instances**: Consider purchasing reserved instances for predictable workloads" >> "$REPORT_FILE"
    echo "2. **Spot Instances**: Use Spot instances for non-production workloads" >> "$REPORT_FILE"
    echo "3. **Auto Scaling**: Implement auto-scaling policies to optimize resource usage" >> "$REPORT_FILE"
    echo "4. **Storage Optimization**: Use appropriate storage classes for S3 objects" >> "$REPORT_FILE"
    echo "5. **Database Optimization**: Consider using RDS Aurora for better cost efficiency" >> "$REPORT_FILE"
    echo "6. **Monitoring**: Set up cost alerts and monitoring" >> "$REPORT_FILE"
    echo "7. **Tagging**: Ensure all resources are properly tagged for cost allocation" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    print_status "Cost optimization analysis complete"
}

# Generate summary
generate_summary() {
    print_header "Generating Summary"
    
    echo "" >> "$REPORT_FILE"
    echo "## Summary" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "- **Total Potential Monthly Savings**: \$$TOTAL_SAVINGS" >> "$REPORT_FILE"
    echo "- **Report Generated**: $(date)" >> "$REPORT_FILE"
    echo "- **AWS Region**: $AWS_REGION" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "## Next Steps" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    echo "1. Review all recommendations" >> "$REPORT_FILE"
    echo "2. Prioritize high-impact changes" >> "$REPORT_FILE"
    echo "3. Test changes in non-production environments" >> "$REPORT_FILE"
    echo "4. Monitor cost impact after implementation" >> "$REPORT_FILE"
    echo "5. Schedule regular cost optimization reviews" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"
    
    print_status "Report generated: $REPORT_FILE"
    print_savings "$TOTAL_SAVINGS"
}

# Main execution
main() {
    print_header "AWS Cost Optimization Analysis"
    print_header "Hibiji Platform"
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        print_error "AWS CLI is not installed"
        exit 1
    fi
    
    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS credentials not configured"
        exit 1
    fi
    
    # Initialize report
    init_report
    
    # Run all checks
    check_unused_ebs
    check_underutilized_ec2
    check_unused_ecs
    check_unused_rds
    check_unused_s3
    check_unused_alb
    check_unused_security_groups
    check_cost_optimization
    
    # Generate summary
    generate_summary
    
    print_header "Analysis Complete"
    echo -e "${GREEN}Report saved to: $REPORT_FILE${NC}"
    echo -e "${GREEN}Total potential monthly savings: \$$TOTAL_SAVINGS${NC}"
}

# Run main function
main "$@" 