# S3 SPA Deployment Guide

## Overview

The Digital Persona Platform frontend has been converted from a standalone Next.js application to a static Single Page Application (SPA) that can be deployed to Amazon S3 with CloudFront for optimal performance and cost-effectiveness.

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CloudFront    │    │       S3         │    │   tRPC Server   │
│   (CDN/Edge)    │◄───┤  Static Files    │    │   (Backend)     │
│                 │    │  (React SPA)     │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                               ▲
         │                                               │
         ▼                                               │
┌─────────────────┐                               ┌─────────────────┐
│     Users       │                               │   ECS/Lambda    │
│   (Browsers)    │───────────────────────────────┤   API Hosting   │
└─────────────────┘            API Calls          └─────────────────┘
```

## Changes Made

### 1. Next.js Configuration Updates

**File: `apps/web/next.config.js`**

- Changed `output: "standalone"` to `output: "export"`
- Added `trailingSlash: true` for S3 compatibility
- Added `images: { unoptimized: true }` for static images

### 2. Package.json Updates

**File: `apps/web/package.json`**

- Added `build:export` script for static builds
- Updated `clean` script to include `out` directory

### 3. Build Output

The static export generates:

- `out/` directory with all static files
- `index.html` files for each route
- Optimized JavaScript bundles
- CSS files and assets

## Deployment Process

### Step 1: Build the Static App

```bash
cd apps/web
npm run build:export
```

This creates the `out/` directory with all static files.

### Step 2: S3 Bucket Setup

1. **Create S3 Bucket** (if not exists):

```bash
aws s3 mb s3://your-frontend-bucket-name
```

2. **Configure as Static Website**:

```bash
aws s3 website s3://your-frontend-bucket-name \
  --index-document index.html \
  --error-document 404.html
```

3. **Set Bucket Policy** for public read access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-frontend-bucket-name/*"
    }
  ]
}
```

### Step 3: Upload Static Files

```bash
cd apps/web
aws s3 sync out/ s3://your-frontend-bucket-name/ \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "*.html" \
  --exclude "*.txt"

# Upload HTML files with shorter cache
aws s3 sync out/ s3://your-frontend-bucket-name/ \
  --delete \
  --cache-control "public, max-age=3600" \
  --exclude "*" \
  --include "*.html"
```

### Step 4: CloudFront Setup

1. **Create CloudFront Distribution**:

```bash
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

**Sample `cloudfront-config.json`**:

```json
{
  "CallerReference": "spa-deployment-$(date +%s)",
  "Comment": "Digital Persona Platform SPA",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-Origin",
        "DomainName": "your-frontend-bucket-name.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-Origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "Compress": true,
    "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "Enabled": true,
  "PriceClass": "PriceClass_100"
}
```

## Automated Deployment Script

Create `deploy-spa.sh`:

```bash
#!/bin/bash

set -e

BUCKET_NAME="your-frontend-bucket-name"
DISTRIBUTION_ID="your-cloudfront-distribution-id"

echo "🏗️  Building SPA..."
cd apps/web
npm run build:export

echo "📤 Uploading to S3..."
# Upload assets with long cache
aws s3 sync out/ s3://$BUCKET_NAME/ \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "*.html" \
  --exclude "*.txt"

# Upload HTML with short cache
aws s3 sync out/ s3://$BUCKET_NAME/ \
  --delete \
  --cache-control "public, max-age=3600" \
  --exclude "*" \
  --include "*.html"

echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id $DISTRIBUTION_ID \
  --paths "/*"

echo "✅ Deployment complete!"
echo "🌐 Your app is available at: https://your-domain.com"
```

## Environment Variables

The SPA will need these environment variables accessible at build time:

```bash
# Add to apps/web/.env.local for build
NEXT_PUBLIC_API_URL=https://api.your-domain.com
BETTER_AUTH_URL=https://api.your-domain.com/api/auth
```

## DNS Setup

Point your domain to CloudFront:

```bash
# Example with Route 53
aws route53 change-resource-record-sets \
  --hosted-zone-id Z123456789 \
  --change-batch '{
    "Changes": [{
      "Action": "UPSERT",
      "ResourceRecordSet": {
        "Name": "app.your-domain.com",
        "Type": "CNAME",
        "TTL": 300,
        "ResourceRecords": [{"Value": "d123456abcdef8.cloudfront.net"}]
      }
    }]
  }'
```

## Cost Benefits

### Before (Standalone):

- ECS/EC2 instances running 24/7
- Load balancer costs
- Higher compute costs

### After (SPA + S3):

- S3 storage: ~$0.023/GB/month
- CloudFront: ~$0.085/GB for first 10TB
- No compute costs for frontend
- **Estimated 60-80% cost reduction for frontend hosting**

## Performance Benefits

- **Global CDN**: CloudFront edge locations worldwide
- **Faster Load Times**: Static assets served from edge
- **Better Caching**: Aggressive caching for assets
- **Scalability**: Handles traffic spikes automatically

## CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Deploy Frontend to S3
  run: |
    cd apps/web
    npm run build:export
    aws s3 sync out/ s3://${{ secrets.FRONTEND_BUCKET }}/ --delete
    aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_ID }} --paths "/*"
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
    AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
    NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
```

## Troubleshooting

### Issue: 404 on Direct URL Access

**Solution**: Ensure CloudFront error pages redirect 404 to `/index.html`

### Issue: API Calls Failing

**Solution**: Check `NEXT_PUBLIC_API_URL` environment variable

### Issue: Images Not Loading

**Solution**: Verify `images: { unoptimized: true }` in `next.config.js`

## Next Steps

1. Set up your S3 bucket and CloudFront distribution
2. Configure your domain and SSL certificate
3. Update your CI/CD pipeline
4. Deploy and test!

The frontend is now ready for cost-effective, high-performance static hosting! 🚀
