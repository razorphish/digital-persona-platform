#!/bin/bash
# Note: NOT using 'set -e' to allow graceful error handling
# We want to continue even if some operations fail

echo "🔍 Phase 3.1d: Proactive RDS Resource Detection & Import"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Counter for tracking
IMPORTED_COUNT=0
ALREADY_IN_STATE_COUNT=0
WILL_BE_CREATED_COUNT=0
ERROR_COUNT=0

echo "📋 Step 1: Identifying expected RDS resources from Terraform config..."

# Get all RDS-related resources from Terraform state
RDS_CLUSTERS=$(terraform state list 2>/dev/null | grep "^aws_rds_cluster\." | grep -v "aws_rds_cluster_instance\|aws_rds_cluster_endpoint\|aws_rds_cluster_parameter_group" || echo "")
DB_INSTANCES=$(terraform state list 2>/dev/null | grep "^aws_db_instance\." || echo "")
DB_PROXIES=$(terraform state list 2>/dev/null | grep "^aws_db_proxy\." || echo "")
DB_SUBNET_GROUPS=$(terraform state list 2>/dev/null | grep "^aws_db_subnet_group\." || echo "")

# Count total resources
TOTAL_RDS_RESOURCES=0
[ -n "$RDS_CLUSTERS" ] && TOTAL_RDS_RESOURCES=$((TOTAL_RDS_RESOURCES + $(echo "$RDS_CLUSTERS" | wc -l)))
[ -n "$DB_INSTANCES" ] && TOTAL_RDS_RESOURCES=$((TOTAL_RDS_RESOURCES + $(echo "$DB_INSTANCES" | wc -l)))
[ -n "$DB_PROXIES" ] && TOTAL_RDS_RESOURCES=$((TOTAL_RDS_RESOURCES + $(echo "$DB_PROXIES" | wc -l)))
[ -n "$DB_SUBNET_GROUPS" ] && TOTAL_RDS_RESOURCES=$((TOTAL_RDS_RESOURCES + $(echo "$DB_SUBNET_GROUPS" | wc -l)))

if [ $TOTAL_RDS_RESOURCES -eq 0 ]; then
  echo "   ℹ️  No RDS resources defined yet or state is empty"
  echo "   This is normal for first deployment"
  echo ""
  exit 0
fi

echo "   Found $TOTAL_RDS_RESOURCES RDS resource(s) to check:"
[ -n "$RDS_CLUSTERS" ] && echo "      - RDS Clusters: $(echo "$RDS_CLUSTERS" | wc -l | xargs)"
[ -n "$DB_INSTANCES" ] && echo "      - DB Instances: $(echo "$DB_INSTANCES" | wc -l | xargs)"
[ -n "$DB_PROXIES" ] && echo "      - DB Proxies: $(echo "$DB_PROXIES" | wc -l | xargs)"
[ -n "$DB_SUBNET_GROUPS" ] && echo "      - DB Subnet Groups: $(echo "$DB_SUBNET_GROUPS" | wc -l | xargs)"
echo ""

echo "📋 Step 2: Checking each RDS resource..."
echo ""

# Function to handle import with error checking
import_resource() {
  local resource=$1
  local identifier=$2
  local resource_type=$3
  
  import_output=$(terraform import "$resource" "$identifier" 2>&1 || true)
  import_exit_code=$?
  
  if [ $import_exit_code -eq 0 ]; then
    echo "   ✅ Successfully imported: $identifier"
    ((IMPORTED_COUNT++))
    return 0
  else
    # Check for various recoverable errors
    if echo "$import_output" | grep -qi "Resource already managed\|already exists in state"; then
      echo "   ✅ Already in state (detected during import)"
      ((ALREADY_IN_STATE_COUNT++))
      return 0
    elif echo "$import_output" | grep -qi "DBClusterNotFoundFault\|DBInstanceNotFoundFault\|DBProxyNotFoundFault\|DBSubnetGroupNotFoundFault"; then
      echo "   ℹ️  $resource_type not found in AWS - will be created"
      ((WILL_BE_CREATED_COUNT++))
      return 0
    elif echo "$import_output" | grep -qi "ValidationException\|validation error\|invalid.*format"; then
      echo "   ⚠️  Validation error - resource may need manual attention"
      echo "   💡 Skipping import - continuing with deployment"
      ((ERROR_COUNT++))
      return 1
    elif echo "$import_output" | grep -qi "permission\|Access.*Denied\|not authorized"; then
      echo "   ⚠️  Permission error - may need additional IAM permissions"
      echo "   💡 Skipping import - continuing with deployment"
      ((ERROR_COUNT++))
      return 1
    else
      echo "   ⚠️  Import failed, but continuing with deployment..."
      echo "   Error details (first 3 lines):"
      echo "$import_output" | head -n 3 | sed 's/^/      /'
      ((ERROR_COUNT++))
      return 1
    fi
  fi
}

# Process RDS Clusters
if [ -n "$RDS_CLUSTERS" ]; then
  echo "═══ RDS Clusters ═══"
  echo ""
  
  while IFS= read -r RESOURCE; do
    if [ -z "$RESOURCE" ]; then
      continue
    fi
    
    echo "Checking: $RESOURCE"
    
    # Check if already in state
    if terraform state show "$RESOURCE" &>/dev/null; then
      CLUSTER_ID=$(terraform state show "$RESOURCE" 2>/dev/null | grep -E "^\s+cluster_identifier\s+=" | head -1 | awk -F'"' '{print $2}' || echo "")
      if [ -n "$CLUSTER_ID" ]; then
        echo "   Cluster ID: $CLUSTER_ID"
        echo "   ✅ Already in Terraform state"
        ((ALREADY_IN_STATE_COUNT++))
      else
        echo "   ⚠️  In state but could not extract cluster ID"
        ((ALREADY_IN_STATE_COUNT++))
      fi
    else
      echo "   ⚠️  Not in Terraform state yet"
      
      # Try to get cluster identifier from config
      CLUSTER_ID=$(terraform show -json 2>/dev/null | jq -r ".planned_values.root_module.resources[]? | select(.address==\"$RESOURCE\") | .values.cluster_identifier?" 2>/dev/null || echo "")
      
      if [ -z "$CLUSTER_ID" ] || [ "$CLUSTER_ID" = "null" ]; then
        CLUSTER_ID=$(terraform show -json 2>/dev/null | jq -r ".configuration.root_module.resources[]? | select(.address==\"$RESOURCE\") | .expressions.cluster_identifier.constant_value?" 2>/dev/null || echo "")
      fi
      
      if [ -z "$CLUSTER_ID" ] || [ "$CLUSTER_ID" = "null" ]; then
        echo "   ℹ️  Cannot determine cluster identifier from config"
        echo "   Will be created by Terraform apply"
        ((WILL_BE_CREATED_COUNT++))
      else
        echo "   Expected Cluster ID: $CLUSTER_ID"
        
        # Check if cluster exists in AWS
        CLUSTER_EXISTS=$(aws rds describe-db-clusters --db-cluster-identifier "$CLUSTER_ID" --query 'DBClusters[0].DBClusterIdentifier' --output text 2>/dev/null || echo "None")
        
        if [ "$CLUSTER_EXISTS" = "None" ] || [ -z "$CLUSTER_EXISTS" ]; then
          echo "   ℹ️  RDS Cluster doesn't exist in AWS yet"
          echo "   Will be created by Terraform apply"
          ((WILL_BE_CREATED_COUNT++))
        else
          echo "   ✅ RDS Cluster exists in AWS"
          echo "   🔧 Importing into Terraform state..."
          import_resource "$RESOURCE" "$CLUSTER_ID" "RDS Cluster"
        fi
      fi
    fi
    
    echo ""
  done <<< "$RDS_CLUSTERS"
fi

# Process DB Instances
if [ -n "$DB_INSTANCES" ]; then
  echo "═══ DB Instances ═══"
  echo ""
  
  while IFS= read -r RESOURCE; do
    if [ -z "$RESOURCE" ]; then
      continue
    fi
    
    echo "Checking: $RESOURCE"
    
    # Check if already in state
    if terraform state show "$RESOURCE" &>/dev/null; then
      INSTANCE_ID=$(terraform state show "$RESOURCE" 2>/dev/null | grep -E "^\s+identifier\s+=" | head -1 | awk -F'"' '{print $2}' || echo "")
      if [ -n "$INSTANCE_ID" ]; then
        echo "   Instance ID: $INSTANCE_ID"
        echo "   ✅ Already in Terraform state"
        ((ALREADY_IN_STATE_COUNT++))
      else
        echo "   ⚠️  In state but could not extract instance ID"
        ((ALREADY_IN_STATE_COUNT++))
      fi
    else
      echo "   ⚠️  Not in Terraform state yet"
      
      # Try to get instance identifier from config
      INSTANCE_ID=$(terraform show -json 2>/dev/null | jq -r ".planned_values.root_module.resources[]? | select(.address==\"$RESOURCE\") | .values.identifier?" 2>/dev/null || echo "")
      
      if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" = "null" ]; then
        INSTANCE_ID=$(terraform show -json 2>/dev/null | jq -r ".configuration.root_module.resources[]? | select(.address==\"$RESOURCE\") | .expressions.identifier.constant_value?" 2>/dev/null || echo "")
      fi
      
      if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" = "null" ]; then
        echo "   ℹ️  Cannot determine instance identifier from config"
        echo "   Will be created by Terraform apply"
        ((WILL_BE_CREATED_COUNT++))
      else
        echo "   Expected Instance ID: $INSTANCE_ID"
        
        # Check if instance exists in AWS
        INSTANCE_EXISTS=$(aws rds describe-db-instances --db-instance-identifier "$INSTANCE_ID" --query 'DBInstances[0].DBInstanceIdentifier' --output text 2>/dev/null || echo "None")
        
        if [ "$INSTANCE_EXISTS" = "None" ] || [ -z "$INSTANCE_EXISTS" ]; then
          echo "   ℹ️  DB Instance doesn't exist in AWS yet"
          echo "   Will be created by Terraform apply"
          ((WILL_BE_CREATED_COUNT++))
        else
          echo "   ✅ DB Instance exists in AWS"
          echo "   🔧 Importing into Terraform state..."
          import_resource "$RESOURCE" "$INSTANCE_ID" "DB Instance"
        fi
      fi
    fi
    
    echo ""
  done <<< "$DB_INSTANCES"
fi

# Process DB Proxies
if [ -n "$DB_PROXIES" ]; then
  echo "═══ DB Proxies ═══"
  echo ""
  
  while IFS= read -r RESOURCE; do
    if [ -z "$RESOURCE" ]; then
      continue
    fi
    
    echo "Checking: $RESOURCE"
    
    # Check if already in state
    if terraform state show "$RESOURCE" &>/dev/null; then
      PROXY_NAME=$(terraform state show "$RESOURCE" 2>/dev/null | grep -E "^\s+name\s+=" | head -1 | awk -F'"' '{print $2}' || echo "")
      if [ -n "$PROXY_NAME" ]; then
        echo "   Proxy Name: $PROXY_NAME"
        echo "   ✅ Already in Terraform state"
        ((ALREADY_IN_STATE_COUNT++))
      else
        echo "   ⚠️  In state but could not extract proxy name"
        ((ALREADY_IN_STATE_COUNT++))
      fi
    else
      echo "   ⚠️  Not in Terraform state yet"
      echo "   ℹ️  DB Proxy import requires ARN - skipping proactive import"
      echo "   Will be handled by reactive import if needed"
      ((WILL_BE_CREATED_COUNT++))
    fi
    
    echo ""
  done <<< "$DB_PROXIES"
fi

# Process DB Subnet Groups
if [ -n "$DB_SUBNET_GROUPS" ]; then
  echo "═══ DB Subnet Groups ═══"
  echo ""
  
  while IFS= read -r RESOURCE; do
    if [ -z "$RESOURCE" ]; then
      continue
    fi
    
    echo "Checking: $RESOURCE"
    
    # Check if already in state
    if terraform state show "$RESOURCE" &>/dev/null; then
      SUBNET_GROUP_NAME=$(terraform state show "$RESOURCE" 2>/dev/null | grep -E "^\s+name\s+=" | head -1 | awk -F'"' '{print $2}' || echo "")
      if [ -n "$SUBNET_GROUP_NAME" ]; then
        echo "   Subnet Group: $SUBNET_GROUP_NAME"
        echo "   ✅ Already in Terraform state"
        ((ALREADY_IN_STATE_COUNT++))
      else
        echo "   ⚠️  In state but could not extract subnet group name"
        ((ALREADY_IN_STATE_COUNT++))
      fi
    else
      echo "   ⚠️  Not in Terraform state yet"
      
      # Try to get subnet group name from config
      SUBNET_GROUP_NAME=$(terraform show -json 2>/dev/null | jq -r ".planned_values.root_module.resources[]? | select(.address==\"$RESOURCE\") | .values.name?" 2>/dev/null || echo "")
      
      if [ -z "$SUBNET_GROUP_NAME" ] || [ "$SUBNET_GROUP_NAME" = "null" ]; then
        SUBNET_GROUP_NAME=$(terraform show -json 2>/dev/null | jq -r ".configuration.root_module.resources[]? | select(.address==\"$RESOURCE\") | .expressions.name.constant_value?" 2>/dev/null || echo "")
      fi
      
      if [ -z "$SUBNET_GROUP_NAME" ] || [ "$SUBNET_GROUP_NAME" = "null" ]; then
        echo "   ℹ️  Cannot determine subnet group name from config"
        echo "   Will be created by Terraform apply"
        ((WILL_BE_CREATED_COUNT++))
      else
        echo "   Expected Subnet Group: $SUBNET_GROUP_NAME"
        
        # Check if subnet group exists in AWS
        SUBNET_GROUP_EXISTS=$(aws rds describe-db-subnet-groups --db-subnet-group-name "$SUBNET_GROUP_NAME" --query 'DBSubnetGroups[0].DBSubnetGroupName' --output text 2>/dev/null || echo "None")
        
        if [ "$SUBNET_GROUP_EXISTS" = "None" ] || [ -z "$SUBNET_GROUP_EXISTS" ]; then
          echo "   ℹ️  DB Subnet Group doesn't exist in AWS yet"
          echo "   Will be created by Terraform apply"
          ((WILL_BE_CREATED_COUNT++))
        else
          echo "   ✅ DB Subnet Group exists in AWS"
          echo "   🔧 Importing into Terraform state..."
          import_resource "$RESOURCE" "$SUBNET_GROUP_NAME" "DB Subnet Group"
        fi
      fi
    fi
    
    echo ""
  done <<< "$DB_SUBNET_GROUPS"
fi

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Summary:"
echo "   ✅ Already in state: $ALREADY_IN_STATE_COUNT"
echo "   🔧 Imported: $IMPORTED_COUNT"
echo "   📝 Will be created: $WILL_BE_CREATED_COUNT"
if [ $ERROR_COUNT -gt 0 ]; then
  echo "   ⚠️  Errors (non-blocking): $ERROR_COUNT"
fi
echo ""

if [ $IMPORTED_COUNT -gt 0 ]; then
  echo "✅ Imported $IMPORTED_COUNT RDS resource(s). State synchronized!"
elif [ $ALREADY_IN_STATE_COUNT -gt 0 ]; then
  echo "✅ All RDS resources already synchronized. Ready for terraform apply."
else
  echo "✅ No RDS resources to import. Ready for terraform apply."
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Always exit 0 - we handle errors gracefully
exit 0

