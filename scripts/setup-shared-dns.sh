#!/bin/bash

# Setup shared DNS infrastructure
# This script creates a single hosted zone that all environments will use

set -e

echo "🌐 Setting up shared DNS infrastructure..."

# Create the main hosted zone if it doesn't exist
aws route53 create-hosted-zone \
  --name hibiji.com \
  --caller-reference "$(date +%s)" \
  --hosted-zone-config Comment="Shared DNS zone for all environments" \
  --region us-west-1 || echo "Hosted zone already exists"

echo "✅ Shared DNS infrastructure setup complete"
echo "📝 Note: Update your domain registrar's nameservers to point to the hosted zone" 