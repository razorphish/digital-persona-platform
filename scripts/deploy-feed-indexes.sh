#!/bin/bash

# Deploy feed performance indexes to production database
# This script adds critical indexes for feed query optimization

set -e

echo "🚀 Deploying feed performance indexes..."

# Check if environment is provided
if [ -z "$1" ]; then
    echo "❌ Usage: $0 <environment>"
    echo "   Example: $0 dev01"
    exit 1
fi

ENVIRONMENT=$1
echo "📍 Target environment: $ENVIRONMENT"

# Set database URL based on environment
case $ENVIRONMENT in
    "dev01")
        # Use AWS RDS connection for dev01
        if [ -z "$DEV01_DATABASE_URL" ]; then
            echo "❌ DEV01_DATABASE_URL environment variable is required"
            echo "   Set it to your AWS RDS connection string"
            exit 1
        fi
        DATABASE_URL=$DEV01_DATABASE_URL
        ;;
    "local")
        # Use local Docker database
        DATABASE_URL="postgresql://dpp_user:dpp_password@localhost:5432/digital_persona"
        ;;
    *)
        echo "❌ Unsupported environment: $ENVIRONMENT"
        echo "   Supported: dev01, local"
        exit 1
        ;;
esac

echo "🔧 Connecting to database..."

# Run the index migration
export DATABASE_URL
npm exec tsx packages/database/src/add-feed-indexes.ts

echo "✅ Feed indexes deployed successfully to $ENVIRONMENT!"
echo ""
echo "🎯 Next steps:"
echo "   1. Deploy the application code"
echo "   2. Test feed performance"
echo "   3. Monitor query execution times"
echo ""
echo "📊 Expected improvements:"
echo "   - Feed queries: 30+ seconds → <1 second"
echo "   - Database load: Significantly reduced"
echo "   - User experience: Much faster feed loading"
