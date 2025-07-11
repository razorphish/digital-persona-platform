#!/bin/bash

# Fix Workflow-AWS Synchronization Issues
# This script updates GitHub Actions workflows to match Terraform configuration

set -e

echo "🔧 Fixing Workflow-AWS Synchronization Issues..."

# 1. Fix region mismatch - Update workflows to use us-west-1
echo "📍 Fixing region mismatch..."

# Update deploy.yml
sed -i.bak 's/AWS_REGION: us-west-2/AWS_REGION: us-west-1/g' .github/workflows/deploy.yml
sed -i.bak 's/aws-region: \${{ env.AWS_REGION }}/aws-region: us-west-1/g' .github/workflows/deploy.yml

# Update ci.yml
sed -i.bak 's/AWS_REGION: us-west-2/AWS_REGION: us-west-1/g' .github/workflows/ci.yml
sed -i.bak 's/aws-region: \${{ env.AWS_REGION }}/aws-region: us-west-1/g' .github/workflows/ci.yml

# Update emergency-deploy.yml
sed -i.bak 's/AWS_REGION: us-west-2/AWS_REGION: us-west-1/g' .github/workflows/emergency-deploy.yml
sed -i.bak 's/aws-region: \${{ env.AWS_REGION }}/aws-region: us-west-1/g' .github/workflows/emergency-deploy.yml

echo "✅ Region mismatch fixed"

# 2. Fix ECS service names to match Terraform
echo "🔧 Fixing ECS service names..."

# Create a function to update service names based on environment
update_service_names() {
    local file=$1
    local env_var=""
    
    # Update cluster name pattern
    sed -i.bak 's/ECS_CLUSTER: dpp-cluster/ECS_CLUSTER: hibiji-\${ENVIRONMENT}-cluster/g' "$file"
    sed -i.bak 's/--cluster dpp-cluster/--cluster hibiji-\${ENVIRONMENT}-cluster/g' "$file"
    
    # Update service names
    sed -i.bak 's/BACKEND_SERVICE: dpp-backend-service/BACKEND_SERVICE: hibiji-\${ENVIRONMENT}-backend/g' "$file"
    sed -i.bak 's/FRONTEND_SERVICE: dpp-frontend-service/FRONTEND_SERVICE: hibiji-\${ENVIRONMENT}-frontend/g' "$file"
    sed -i.bak 's/--service dpp-backend-service/--service hibiji-\${ENVIRONMENT}-backend/g' "$file"
    sed -i.bak 's/--service dpp-frontend-service/--service hibiji-\${ENVIRONMENT}-frontend/g' "$file"
    sed -i.bak 's/--services dpp-backend-service dpp-frontend-service/--services hibiji-\${ENVIRONMENT}-backend hibiji-\${ENVIRONMENT}-frontend/g' "$file"
}

# Update each workflow file
update_service_names ".github/workflows/deploy.yml"
update_service_names ".github/workflows/emergency-deploy.yml"

echo "✅ ECS service names fixed"

# 3. Add environment variable extraction to workflows
echo "🔧 Adding environment variable extraction..."

# Function to add environment extraction
add_env_extraction() {
    local file=$1
    
    # Add environment extraction before ECS operations
    cat >> "$file" << 'EOF'

      - name: Extract Environment Variables
        id: env_vars
        run: |
          # Determine environment based on branch or manual input
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then
            ENVIRONMENT="prod"
          elif [[ "${{ github.ref }}" =~ refs/heads/dev[0-9]+ ]]; then
            ENVIRONMENT=$(echo "${{ github.ref_name }}" | sed 's/^refs\/heads\///')
          elif [[ "${{ github.ref }}" =~ refs/heads/qa[0-9]+ ]]; then
            ENVIRONMENT=$(echo "${{ github.ref_name }}" | sed 's/^refs\/heads\///')
          elif [[ "${{ github.ref }}" =~ refs/heads/staging[0-9]+ ]]; then
            ENVIRONMENT=$(echo "${{ github.ref_name }}" | sed 's/^refs\/heads\///')
          elif [[ "${{ github.ref }}" =~ refs/heads/hotfix[0-9]+ ]]; then
            ENVIRONMENT=$(echo "${{ github.ref_name }}" | sed 's/^refs\/heads\///')
          elif [[ "${{ github.ref }}" == "refs/heads/dev" ]]; then
            ENVIRONMENT="dev"
          elif [[ "${{ github.ref }}" == "refs/heads/qa" ]]; then
            ENVIRONMENT="qa"
          elif [[ "${{ github.ref }}" == "refs/heads/staging" ]]; then
            ENVIRONMENT="staging"
          else
            ENVIRONMENT="${{ github.event.inputs.environment || 'prod' }}"
          fi

          # Extract main environment (remove numbers)
          MAIN_ENV=$(echo $ENVIRONMENT | sed 's/[0-9]*$//')

          echo "ENVIRONMENT=$ENVIRONMENT" >> $GITHUB_ENV
          echo "MAIN_ENV=$MAIN_ENV" >> $GITHUB_ENV
          echo "environment=$ENVIRONMENT" >> $GITHUB_OUTPUT
          echo "main_env=$MAIN_ENV" >> $GITHUB_OUTPUT

          echo "Deploying to environment: $ENVIRONMENT"
          echo "Main environment: $MAIN_ENV"

EOF
}

# Add environment extraction to deploy.yml before ECS operations
sed -i.bak '/Update ECS services/i\
      - name: Extract Environment Variables\
        id: env_vars\
        run: |\
          # Determine environment based on branch or manual input\
          if [[ "${{ github.ref }}" == "refs/heads/main" ]]; then\
            ENVIRONMENT="prod"\
          elif [[ "${{ github.ref }}" =~ refs/heads/dev[0-9]+ ]]; then\
            ENVIRONMENT=$(echo "${{ github.ref_name }}" | sed "s/^refs\/heads\///")\
          elif [[ "${{ github.ref }}" =~ refs/heads/qa[0-9]+ ]]; then\
            ENVIRONMENT=$(echo "${{ github.ref_name }}" | sed "s/^refs\/heads\///")\
          elif [[ "${{ github.ref }}" =~ refs/heads/staging[0-9]+ ]]; then\
            ENVIRONMENT=$(echo "${{ github.ref_name }}" | sed "s/^refs\/heads\///")\
          elif [[ "${{ github.ref }}" =~ refs/heads/hotfix[0-9]+ ]]; then\
            ENVIRONMENT=$(echo "${{ github.ref_name }}" | sed "s/^refs\/heads\///")\
          elif [[ "${{ github.ref }}" == "refs/heads/dev" ]]; then\
            ENVIRONMENT="dev"\
          elif [[ "${{ github.ref }}" == "refs/heads/qa" ]]; then\
            ENVIRONMENT="qa"\
          elif [[ "${{ github.ref }}" == "refs/heads/staging" ]]; then\
            ENVIRONMENT="staging"\
          else\
            ENVIRONMENT="${{ github.event.inputs.environment || "prod" }}"\
          fi\
\
          # Extract main environment (remove numbers)\
          MAIN_ENV=$(echo $ENVIRONMENT | sed "s/[0-9]*$//")\
\
          echo "ENVIRONMENT=$ENVIRONMENT" >> $GITHUB_ENV\
          echo "MAIN_ENV=$MAIN_ENV" >> $GITHUB_ENV\
          echo "environment=$ENVIRONMENT" >> $GITHUB_OUTPUT\
          echo "main_env=$MAIN_ENV" >> $GITHUB_OUTPUT\
\
          echo "Deploying to environment: $ENVIRONMENT"\
          echo "Main environment: $MAIN_ENV"\
' .github/workflows/deploy.yml

echo "✅ Environment variable extraction added"

# 4. Update ECS service references to use environment variables
echo "🔧 Updating ECS service references..."

# Update deploy.yml ECS service references
sed -i.bak 's/\${{ env.ECS_CLUSTER }}/\${{ env.ENVIRONMENT }}-cluster/g' .github/workflows/deploy.yml
sed -i.bak 's/\${{ env.BACKEND_SERVICE }}/\${{ env.ENVIRONMENT }}-backend/g' .github/workflows/deploy.yml
sed -i.bak 's/\${{ env.FRONTEND_SERVICE }}/\${{ env.ENVIRONMENT }}-frontend/g' .github/workflows/deploy.yml

# Update emergency-deploy.yml ECS service references
sed -i.bak 's/dpp-cluster/\${{ env.ENVIRONMENT }}-cluster/g' .github/workflows/emergency-deploy.yml
sed -i.bak 's/dpp-backend-service/\${{ env.ENVIRONMENT }}-backend/g' .github/workflows/emergency-deploy.yml
sed -i.bak 's/dpp-frontend-service/\${{ env.ENVIRONMENT }}-frontend/g' .github/workflows/emergency-deploy.yml

echo "✅ ECS service references updated"

# 5. Clean up backup files
echo "🧹 Cleaning up backup files..."
find .github/workflows -name "*.bak" -delete

echo "✅ Backup files cleaned up"

# 6. Create validation script
echo "🔧 Creating validation script..."

cat > scripts/validate-workflow-sync.sh << 'EOF'
#!/bin/bash

# Validate Workflow-AWS Synchronization
set -e

echo "🔍 Validating Workflow-AWS Synchronization..."

# Check region consistency
echo "📍 Checking region consistency..."
if grep -q "us-west-2" .github/workflows/*.yml; then
    echo "❌ Found us-west-2 references in workflows"
    grep -n "us-west-2" .github/workflows/*.yml
    exit 1
else
    echo "✅ All workflows use us-west-1"
fi

# Check service name patterns
echo "🔧 Checking service name patterns..."
if grep -q "dpp-cluster\|dpp-backend-service\|dpp-frontend-service" .github/workflows/*.yml; then
    echo "❌ Found old service name patterns"
    grep -n "dpp-cluster\|dpp-backend-service\|dpp-frontend-service" .github/workflows/*.yml
    exit 1
else
    echo "✅ Service names use environment variables"
fi

# Check Terraform backend regions
echo "🏗️ Checking Terraform backend regions..."
if grep -q "region = \"us-west-2\"" terraform/**/*.tf; then
    echo "❌ Found us-west-2 in Terraform backends"
    grep -n "region = \"us-west-2\"" terraform/**/*.tf
    exit 1
else
    echo "✅ Terraform backends use us-west-1"
fi

echo "✅ All synchronization checks passed!"
EOF

chmod +x scripts/validate-workflow-sync.sh

echo "✅ Validation script created"

echo ""
echo "🎉 Workflow-AWS synchronization fixes completed!"
echo ""
echo "📋 Summary of changes:"
echo "  ✅ Fixed region mismatch (us-west-2 → us-west-1)"
echo "  ✅ Updated ECS service names to match Terraform"
echo "  ✅ Added environment variable extraction"
echo "  ✅ Updated service references to use environment variables"
echo "  ✅ Created validation script"
echo ""
echo "🔍 Next steps:"
echo "  1. Run: ./scripts/validate-workflow-sync.sh"
echo "  2. Test workflows with a small deployment"
echo "  3. Verify ECS services are found correctly"
echo "" 