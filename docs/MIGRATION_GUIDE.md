# Database Migration Guide

## Overview

This project uses two migration approaches:
1. **Custom Migration Script** (`apps/server/src/migrate.ts`) - Currently used for deployments
2. **Drizzle Kit Migrations** - Proper incremental migrations (recommended for production)

## Current State (Phase 1)

✅ **Working**: Custom migration script with all required tables
- Used by GitHub Actions deployment workflow
- Creates entire schema from scratch
- Works for dev environments
- ⚠️ **Not production-safe** (would lose data)

## Proper Migration System (Phase 2)

### Setup Drizzle Kit Migrations

1. **Generate Initial Migration from Current Schema**
```bash
cd packages/database
npx drizzle-kit generate:pg --config=drizzle.config.ts
```

2. **Apply Migrations**
```bash
npx drizzle-kit push:pg --config=drizzle.config.ts
```

3. **Verify Migration Status**
```bash
npx drizzle-kit up:pg --config=drizzle.config.ts
```

### Migration Workflow

#### Adding New Tables/Columns
```bash
# 1. Modify schema.ts
# 2. Generate migration
npx drizzle-kit generate:pg --config=drizzle.config.ts

# 3. Review generated SQL in drizzle/ folder
# 4. Apply migration
npx drizzle-kit push:pg --config=drizzle.config.ts
```

#### Example Migration Files
```
packages/database/drizzle/
├── 0000_initial_schema.sql
├── 0001_add_social_tables.sql
├── 0002_add_user_preferences.sql
└── meta/
    ├── _journal.json
    └── 0001_snapshot.json
```

### Integration with Deployment

#### Option A: Replace Custom Migration (Recommended)
```yaml
# In .github/workflows/deploy-serverless.yml
- name: Run Database Migrations via Drizzle
  run: |
    cd packages/database
    npx drizzle-kit push:pg --config=drizzle.config.ts
```

#### Option B: Hybrid Approach
- Keep custom migration for initial setup
- Use Drizzle for incremental changes
- Detect if schema exists, then use appropriate method

### Migration Safety

#### Production Checklist
- [ ] Test migration on staging environment
- [ ] Backup database before migration
- [ ] Use transactions for complex migrations
- [ ] Test rollback procedures
- [ ] Monitor application after migration

#### Schema Change Guidelines
1. **Additive Changes** (Safe)
   - Adding new tables
   - Adding new columns with defaults
   - Adding new indexes

2. **Destructive Changes** (Requires Planning)
   - Dropping tables/columns
   - Changing data types
   - Renaming columns

## Schema Change Process

### 1. Development
```bash
# Modify packages/database/src/schema.ts
# Generate migration
cd packages/database
npx drizzle-kit generate:pg
```

### 2. Testing
```bash
# Apply to local/dev environment
npx drizzle-kit push:pg --config=drizzle.config.ts
```

### 3. Production Deployment
```bash
# Review generated SQL
cat drizzle/XXXX_migration_name.sql

# Apply via CI/CD or manual deployment
npx drizzle-kit push:pg --config=drizzle.config.ts
```

## Troubleshooting

### Common Issues
1. **Migration conflicts**: Resolve schema drift
2. **Failed migrations**: Check logs and rollback if needed
3. **Missing tables**: Ensure all dependencies are migrated

### Recovery Procedures
```bash
# Check migration status
npx drizzle-kit up:pg --config=drizzle.config.ts

# Force migration state (use with caution)
npx drizzle-kit drop --config=drizzle.config.ts
```

## Best Practices

1. **Always backup before migrations**
2. **Test migrations in staging first**
3. **Use descriptive migration names**
4. **Keep migrations small and focused**
5. **Document breaking changes**
6. **Use transactions for complex operations**

## Migration Commands Reference

```bash
# Generate new migration from schema changes
npx drizzle-kit generate:pg --config=drizzle.config.ts

# Apply all pending migrations
npx drizzle-kit push:pg --config=drizzle.config.ts

# Check migration status
npx drizzle-kit up:pg --config=drizzle.config.ts

# Drop all tables (DESTRUCTIVE)
npx drizzle-kit drop --config=drizzle.config.ts

# Introspect existing database
npx drizzle-kit introspect:pg --config=drizzle.config.ts
```
