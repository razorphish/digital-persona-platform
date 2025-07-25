#!/bin/bash

# Setup OIDC Provider for GitHub Actions
# This script creates the OIDC provider in AWS for GitHub Actions authentication

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up OIDC Provider for GitHub Actions...${NC}"

# Get AWS account ID
echo -e "${YELLOW}Getting AWS account ID...${NC}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "ERROR")
if [ "$ACCOUNT_ID" = "ERROR" ]; then
    echo -e "${RED}❌ Could not get AWS account ID. Please ensure AWS CLI is configured properly.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ AWS Account ID: $ACCOUNT_ID${NC}"

# Create OIDC provider for GitHub Actions
echo -e "${YELLOW}Creating OIDC provider for GitHub Actions...${NC}"

# Check if OIDC provider already exists
if aws iam get-open-id-connect-provider --open-id-connect-provider-arn "arn:aws:iam::$ACCOUNT_ID:oidc-provider/token.actions.githubusercontent.com" >/dev/null 2>&1; then
    echo -e "${YELLOW}OIDC provider already exists${NC}"
else
    # Create the OIDC provider
    aws iam create-open-id-connect-provider \
        --url https://token.actions.githubusercontent.com \
        --client-id-list sts.amazonaws.com \
        --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1 \
        --tags Key=Name,Value=GitHubActionsOIDCProvider
    echo -e "${GREEN}✅ OIDC provider created successfully${NC}"
fi

echo -e "${GREEN}✅ OIDC provider setup complete!${NC}"
echo ""
echo -e "${YELLOW}Your GitHub Actions should now be able to authenticate with AWS using OIDC.${NC}"
echo -e "${YELLOW}Make sure you've added the AWS_ROLE_ARN secret to your GitHub repository.${NC}" 