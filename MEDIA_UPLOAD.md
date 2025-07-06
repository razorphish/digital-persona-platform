# Media File Upload System

This document describes the media file upload system for persona images and videos.

## Overview

The media upload system provides:

- **Secure file uploads** with validation and size limits
- **Database tracking** of uploaded files
- **User-scoped access** (users can only access their own files)
- **Persona association** (files are linked to specific personas)
- **File download** and management capabilities
- **Comprehensive error handling**

## Features

### ✅ **File Types Supported**

- **Images**: JPEG, PNG, GIF, WebP, BMP, TIFF
- **Videos**: MP4, AVI, MOV, WMV, FLV, WebM, MKV, 3GP

### ✅ **File Size Limits**

- **Images**: Maximum 10MB
- **Videos**: Maximum 100MB
- **Overall**: Maximum 50MB per file

### ✅ **Security Features**

- File type validation
- File size validation
- Unique filename generation
- User-scoped access control
- Persona ownership verification

## Database Schema

### MediaFile Model

```sql
media_files:
  - id (PK)
  - filename (unique generated filename)
  - original_filename (original uploaded filename)
  - file_path (filesystem path)
  - file_size (bytes)
  - mime_type (MIME type)
  - media_type ('image' or 'video')
  - persona_id (FK to personas.id, CASCADE delete)
  - user_id (FK to users.id, CASCADE delete)
  - description (optional)
  - created_at
  - updated_at
```

## API Endpoints

### Upload Media File

```http
POST /media/upload/{persona_id}
Content-Type: multipart/form-data
Authorization: Bearer <token>

Parameters:
- file: UploadFile (required)
- description: string (optional)
```

**Response:**

```json
{
  "id": 1,
  "filename": "uuid-generated-name.png",
  "original_filename": "my-image.png",
  "file_size": 1024000,
  "mime_type": "image/png",
  "media_type": "image",
  "persona_id": 1,
  "user_id": 1,
  "description": "My image description",
  "created_at": "2024-01-01T12:00:00",
  "updated_at": "2024-01-01T12:00:00"
}
```

### List Media Files

```http
GET /media/files
GET /media/files?persona_id=1
GET /media/files?media_type=image
GET /media/files?media_type=video
Authorization: Bearer <token>
```

### Get Media File Info

```http
GET /media/files/{media_id}
Authorization: Bearer <token>
```

### Download Media File

```http
GET /media/download/{media_id}
Authorization: Bearer <token>
```

### Update Media File

```http
PUT /media/files/{media_id}
Content-Type: application/x-www-form-urlencoded
Authorization: Bearer <token>

Parameters:
- description: string (optional)
```

### Delete Media File

```http
DELETE /media/files/{media_id}
Authorization: Bearer <token>
```

### Get Media Statistics

```http
GET /media/stats
Authorization: Bearer <token>
```

**Response:**

```json
{
  "total_files": 5,
  "total_images": 3,
  "total_videos": 2,
  "total_size_bytes": 52428800,
  "total_size_mb": 50.0,
  "files_per_persona": {
    "1": 2,
    "2": 3
  }
}
```

## File Storage Structure

Files are organized in a hierarchical structure:

```
uploads/
├── images/
│   ├── {persona_id}/
│   │   └── {user_id}/
│   │       └── {uuid}.{ext}
└── videos/
    ├── {persona_id}/
    │   └── {user_id}/
    │       └── {uuid}.{ext}
```

### Benefits:

- **User isolation**: Each user's files are in separate directories
- **Persona organization**: Files are grouped by persona
- **No filename conflicts**: UUID-based filenames prevent collisions
- **Easy cleanup**: Deleting a persona/user removes all associated files

## Usage Examples

### Python Requests Example

```python
import requests

# Upload an image
with open('image.jpg', 'rb') as f:
    files = {'file': ('image.jpg', f, 'image/jpeg')}
    data = {'description': 'My persona image'}

    response = requests.post(
        'http://localhost:8000/media/upload/1',
        files=files,
        data=data,
        headers={'Authorization': f'Bearer {token}'}
    )

# Download a file
response = requests.get(
    'http://localhost:8000/media/download/1',
    headers={'Authorization': f'Bearer {token}'}
)

with open('downloaded_image.jpg', 'wb') as f:
    f.write(response.content)
```

### cURL Examples

```bash
# Upload image
curl -X POST "http://localhost:8000/media/upload/1" \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@image.jpg" \
  -F "description=My persona image"

# List files
curl -X GET "http://localhost:8000/media/files" \
  -H "Authorization: Bearer $TOKEN"

# Download file
curl -X GET "http://localhost:8000/media/download/1" \
  -H "Authorization: Bearer $TOKEN" \
  -o downloaded_file.jpg
```

## Error Handling

### Common Error Responses

**File Too Large (413)**

```json
{
  "detail": "Image file too large. Maximum size is 10MB"
}
```

**Invalid File Type (400)**

```json
{
  "detail": "Invalid image type. Allowed types: image/jpeg, image/png, image/gif, image/webp, image/bmp, image/tiff"
}
```

**Persona Not Found (404)**

```json
{
  "detail": "Persona 1 not found"
}
```

**File Not Found (404)**

```json
{
  "detail": "Media file 1 not found"
}
```

**Unauthorized (401)**

```json
{
  "detail": "Not authenticated"
}
```

## Testing

### Run Media Upload Tests

```bash
python test_media_upload.py
```

This test script:

- Creates test image and video files
- Tests all upload endpoints
- Verifies file storage and retrieval
- Tests file deletion and cleanup
- Validates error handling

### Manual Testing

1. Start the server: `./start.sh`
2. Open API docs: http://localhost:8000/docs
3. Navigate to `/media` endpoints
4. Test file uploads with different file types and sizes

## Configuration

### File Size Limits

Edit `app/services/upload.py`:

```python
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB
```

### Allowed File Types

```python
ALLOWED_IMAGE_TYPES = {
    "image/jpeg", "image/jpg", "image/png", "image/gif",
    "image/webp", "image/bmp", "image/tiff"
}

ALLOWED_VIDEO_TYPES = {
    "video/mp4", "video/avi", "video/mov", "video/wmv",
    "video/flv", "video/webm", "video/mkv", "video/3gp"
}
```

### Upload Directories

```python
UPLOAD_BASE = Path("uploads")
IMAGE_UPLOAD_DIR = UPLOAD_BASE / "images"
VIDEO_UPLOAD_DIR = UPLOAD_BASE / "videos"
```

## Production Considerations

### 1. Storage

- Consider using cloud storage (AWS S3, Google Cloud Storage)
- Implement CDN for file delivery
- Set up automated backups
- Monitor storage usage

### 2. Security

- Scan uploaded files for malware
- Implement virus scanning
- Validate file content (not just extension)
- Use HTTPS for all uploads

### 3. Performance

- Implement file compression
- Add image/video thumbnails
- Use async file processing
- Consider file streaming for large videos

### 4. Monitoring

- Track upload success/failure rates
- Monitor storage usage
- Log file access patterns
- Set up alerts for storage limits

## Troubleshooting

### Common Issues

1. **File Upload Fails**

   - Check file size limits
   - Verify file type is allowed
   - Ensure upload directory exists
   - Check disk space

2. **Download Fails**

   - Verify file exists on filesystem
   - Check file permissions
   - Ensure user has access to file

3. **Database Errors**

   - Check database connection
   - Verify media_files table exists
   - Check foreign key constraints

4. **Permission Errors**
   - Ensure upload directories are writable
   - Check user permissions
   - Verify file ownership

### Debug Commands

```bash
# Check upload directories
ls -la uploads/

# Check file permissions
ls -la uploads/images/*/1/

# Check database records
psql postgresql://david@localhost:5432/dpp_dev -c "SELECT * FROM media_files;"

# Check file sizes
du -sh uploads/
```
