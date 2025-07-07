#!/bin/bash

echo "🔧 AWS Setup for Digital Persona Platform"
echo "=========================================="
echo ""

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI is not installed. Please install it first:"
    echo "   https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

echo "✅ AWS CLI is installed: $(aws --version)"
echo ""

# Create AWS directory if it doesn't exist
mkdir -p ~/.aws

echo "📝 Setting up AWS credentials..."
echo ""

# Get AWS credentials from user
read -p "Enter your AWS Access Key ID: " AWS_ACCESS_KEY_ID
read -s -p "Enter your AWS Secret Access Key: " AWS_SECRET_ACCESS_KEY
echo ""
read -p "Enter your AWS Region (e.g., us-west-1): " AWS_REGION

# Set default region if empty
if [ -z "$AWS_REGION" ]; then
    AWS_REGION="us-west-1"
fi

echo ""
echo "🔧 Configuring AWS CLI..."

# Configure AWS CLI
aws configure set aws_access_key_id "$AWS_ACCESS_KEY_ID" --profile dpp-platform
aws configure set aws_secret_access_key "$AWS_SECRET_ACCESS_KEY" --profile dpp-platform
aws configure set region "$AWS_REGION" --profile dpp-platform

echo "✅ AWS CLI configured with profile 'dpp-platform'"
echo ""

# Test the configuration
echo "🧪 Testing AWS configuration..."
if aws sts get-caller-identity --profile dpp-platform &> /dev/null; then
    echo "✅ AWS credentials are working!"
    echo ""
    echo "📊 Account Information:"
    aws sts get-caller-identity --profile dpp-platform
    echo ""
    
    # Get account ID for bucket naming
    ACCOUNT_ID=$(aws sts get-caller-identity --profile dpp-platform --query Account --output text)
    BUCKET_NAME="dpp-persona-media-${ACCOUNT_ID}-${AWS_REGION//-}"
    
    echo "🪣 Suggested S3 bucket name: $BUCKET_NAME"
    echo ""
    
    # Create .env file with AWS settings
    echo "📝 Creating .env file with AWS settings..."
    cat > .env << EOF
# AWS Configuration
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
AWS_DEFAULT_REGION=$AWS_REGION
S3_BUCKET_NAME=$BUCKET_NAME

# Database
DATABASE_URL=sqlite+aiosqlite:///./dpp.db

# JWT
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# OpenAI
OPENAI_API_KEY=your-openai-api-key-here

# Redis (optional)
REDIS_URL=redis://localhost:6379
EOF

    echo "✅ .env file created with AWS settings"
    echo ""
    echo "🚀 Next steps:"
    echo "1. Create S3 bucket: aws s3 mb s3://$BUCKET_NAME --profile dpp-platform"
    echo "2. Update your .env file with your actual secret keys"
    echo "3. Run: python -m app.main"
    
else
    echo "❌ AWS credentials test failed. Please check your keys and try again."
    exit 1
fi 