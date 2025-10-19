# Local Development with AWS S3

After removing MinIO, your local development environment now uses real AWS S3 for file storage. This provides better consistency with production environments.

## 🔧 Setup Instructions

### 1. Create Local Environment File

Copy the example environment file and configure it with your AWS credentials:

```bash
cp env.local.docker.example .env
```

### 2. Configure AWS Credentials

Edit `.env` and set your AWS credentials:

```bash
# AWS S3 Configuration (using real AWS S3)
AWS_REGION=us-west-1
AWS_ACCESS_KEY_ID=your-actual-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-actual-aws-secret-access-key
S3_BUCKET=local-mars-dpp-uploads
# Note: No AWS_ENDPOINT_URL - uses real AWS S3
```

### 3. Ensure S3 Bucket Exists

Make sure your S3 bucket exists and is accessible:

```bash
# Check if bucket exists
aws s3 ls s3://local-mars-dpp-uploads

# Create bucket if it doesn't exist
aws s3 mb s3://local-mars-dpp-uploads --region us-west-1

# Set CORS configuration for web uploads
aws s3api put-bucket-cors --bucket local-mars-dpp-uploads --cors-configuration file://s3-cors.json
```

### 4. Start Local Development

```bash
./scripts/start-local-docker.sh
```

## 🎯 Benefits of Using Real AWS S3

1. **Production Consistency**: Same storage behavior as production
2. **No Local Storage**: No need for local MinIO containers
3. **Real AWS Features**: Access to all AWS S3 features and performance
4. **Simplified Setup**: One less service to manage locally

## 📋 Troubleshooting

### File Upload Issues

If you encounter file upload issues:

1. Check AWS credentials are correctly set
2. Verify S3 bucket exists and is accessible
3. Ensure CORS is configured for the bucket
4. Check CloudWatch logs for detailed error messages

### AWS Credentials

You can use any of these methods for AWS credentials:

1. **Environment variables** (in .env file) - Recommended for local dev
2. **AWS credentials file** (`~/.aws/credentials`)
3. **IAM roles** (when running on EC2)

## 🔗 Related Files

- `docker-compose.local.yml` - Local development services
- `env.local.docker.example` - Environment variables template
- `apps/server/src/utils/s3.ts` - S3 utility functions