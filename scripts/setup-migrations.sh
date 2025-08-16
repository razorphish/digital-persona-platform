#!/bin/bash
# Setup Proper Drizzle Migrations
# This script transitions from custom migration to proper Drizzle migrations

set -e

echo "🚀 Setting up proper Drizzle migrations..."

# Check if we're in the project root
if [[ ! -f "package.json" ]]; then
  echo "❌ Please run this script from the project root"
  exit 1
fi

echo "📦 Installing drizzle-kit if not present..."
cd packages/database
npm install drizzle-kit --save-dev || true

echo "🔍 Checking current database state..."
if [[ -z "$DATABASE_URL" ]]; then
  echo "⚠️  DATABASE_URL not set. Please set it first:"
  echo "   export DATABASE_URL='your_database_connection_string'"
  exit 1
fi

echo "📋 Current migration files:"
ls -la drizzle/ 2>/dev/null || echo "No migration files found"

echo "🔧 Generating initial migration from current schema..."
# This will generate migration files based on schema.ts
npx drizzle-kit generate:pg --config=drizzle.config.ts

echo "📋 Generated migration files:"
ls -la drizzle/

echo "⚡ Setting up migration workflow integration..."

# Create migration workflow script
cat > ../../scripts/migrate-database.sh << 'EOF'
#!/bin/bash
# Database Migration Script using Drizzle Kit
# Usage: ./scripts/migrate-database.sh [environment]

set -e

ENVIRONMENT=${1:-dev}

echo "🗄️ Running database migrations for environment: $ENVIRONMENT"

# Set database URL based on environment
case $ENVIRONMENT in
  dev|staging)
    echo "📊 Using development database configuration"
    ;;
  prod|production)
    echo "🏭 Using production database configuration"
    echo "⚠️  Production migration requires manual confirmation"
    read -p "Are you sure you want to migrate production? (yes/NO): " confirm
    if [[ $confirm != "yes" ]]; then
      echo "❌ Migration cancelled"
      exit 1
    fi
    ;;
esac

# Navigate to database package
cd packages/database

# Check migration status
echo "🔍 Checking migration status..."
npx drizzle-kit up:pg --config=drizzle.config.ts || true

# Apply migrations
echo "📤 Applying pending migrations..."
npx drizzle-kit push:pg --config=drizzle.config.ts

echo "✅ Database migrations completed successfully"

# Verify table structure
echo "🔍 Verifying critical tables exist..."
psql "$DATABASE_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;" || echo "⚠️ Could not verify tables (no psql)"

echo "🎉 Migration workflow completed!"
EOF

chmod +x ../../scripts/migrate-database.sh

echo "📝 Creating migration documentation..."
cat > MIGRATION_README.md << 'EOF'
# Database Migrations

## Quick Start

### Generate New Migration
```bash
cd packages/database
npx drizzle-kit generate:pg --config=drizzle.config.ts
```

### Apply Migrations
```bash
./scripts/migrate-database.sh dev
```

### Production Migration
```bash
./scripts/migrate-database.sh production
```

## Migration Files
- `drizzle/` - Contains all migration SQL files
- `drizzle/meta/` - Migration metadata and snapshots

## Workflow
1. Modify `src/schema.ts`
2. Generate migration: `npx drizzle-kit generate:pg`
3. Review generated SQL
4. Apply: `./scripts/migrate-database.sh dev`
5. Test thoroughly
6. Deploy to production

See `docs/MIGRATION_GUIDE.md` for complete documentation.
EOF

echo "✅ Drizzle migrations setup complete!"
echo ""
echo "📚 Next steps:"
echo "1. Review generated migration files in packages/database/drizzle/"
echo "2. Test migrations: ./scripts/migrate-database.sh dev"
echo "3. Read documentation: docs/MIGRATION_GUIDE.md"
echo "4. Consider updating CI/CD workflow to use proper migrations"
echo ""
echo "🎯 Current status:"
echo "   ✅ Phase 1: Custom migration (working for dev)"
echo "   ✅ Phase 2: Proper Drizzle setup (ready to use)"
echo ""
echo "🔄 To transition fully to Drizzle migrations:"
echo "   1. Test the new system thoroughly"
echo "   2. Update .github/workflows/deploy-serverless.yml"
echo "   3. Replace custom migration with: ./scripts/migrate-database.sh"
