#!/bin/bash

# Fix S3 CORS configuration for file uploads
BUCKET_NAME="${S3_BUCKET:-digital-persona-uploads}"

echo "🔧 Adding CORS configuration to S3 bucket: $BUCKET_NAME"

# Create CORS configuration
cat > /tmp/cors-config.json << 'EOF'
{
    "CORSRules": [
        {
            "AllowedOrigins": [
                "http://localhost:3000",
                "http://localhost:4000",
                "http://localhost:3100",
                "http://127.0.0.1:3000",
                "http://127.0.0.1:4000",
                "http://127.0.0.1:3100",
                "https://localhost:3000",
                "https://localhost:4000",
                "https://localhost:3100",
                "https://*.amazonaws.com",
                "https://*.cloudfront.net"
            ],
            "AllowedMethods": [
                "GET",
                "PUT",
                "POST",
                "DELETE",
                "HEAD"
            ],
            "AllowedHeaders": [
                "*"
            ],
            "ExposeHeaders": [
                "ETag",
                "x-amz-server-side-encryption",
                "x-amz-request-id",
                "x-amz-id-2"
            ],
            "MaxAgeSeconds": 86400
        }
    ]
}
EOF

# Apply CORS configuration
aws s3api put-bucket-cors --bucket "$BUCKET_NAME" --cors-configuration file:///tmp/cors-config.json

if [ $? -eq 0 ]; then
    echo "✅ CORS configuration applied successfully!"
    echo "🎉 You should now be able to upload files from localhost:3000"
else
    echo "❌ Failed to apply CORS configuration"
    echo "Make sure you have AWS CLI configured and proper permissions"
fi

# Clean up
rm -f /tmp/cors-config.json

# Verify CORS configuration
echo ""
echo "📋 Current CORS configuration:"
aws s3api get-bucket-cors --bucket "$BUCKET_NAME" 2>/dev/null || echo "No CORS configuration found"