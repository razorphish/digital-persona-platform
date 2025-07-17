# 📁 Persona Media Upload System

## Overview

The Digital Persona Platform includes a comprehensive file upload system for persona media files. The system supports JPEG and PNG images, and MP4 videos with a 10MB file size limit, organized in a user-specific directory structure.

## 🏗️ Architecture

### Components

1. **Upload Router** (`app/routers/upload.py`)

   - Dedicated endpoints for image and video uploads
   - File validation and security checks
   - User and persona scoping

2. **MediaFile Model** (`app/models/media_db.py`)

   - Database model for tracking uploaded files
   - Relationships to User and Persona models
   - File metadata storage

3. **Media CRUD** (`app/crud/media.py`)

   - Database operations for media files
   - User-scoped queries
   - File management operations

4. **Upload Service** (`app/services/upload.py`)
   - File validation and security
   - File system operations
   - MIME type detection

## 📋 File Requirements

### Supported Formats

**Images:**

- JPEG (.jpg, .jpeg)
- PNG (.png)

**Videos:**

- MP4 (.mp4)

### File Size Limits

- **Maximum file size:** 10MB per file
- **Validation:** Both file extension and MIME type checked
- **Security:** Prevents upload of executable files

## 🗂️ Directory Structure

Files are organized in a hierarchical structure:

```
uploads/
├── {user_id}/
│   ├── {persona_id}/
│   │   ├── {unique_filename}.jpg
│   │   ├── {unique_filename}.png
│   │   └── {unique_filename}.mp4
│   └── {another_persona_id}/
│       └── ...
└── {another_user_id}/
    └── ...
```

### Security Features

- **User isolation:** Each user's files are in separate directories
- **Persona scoping:** Files are organized by persona
- **Unique filenames:** UUID-based filenames prevent conflicts
- **Access control:** Users can only access their own files

## 🔑 API Endpoints

### Upload Endpoints

| Method | Endpoint                             | Description              | Auth Required |
| ------ | ------------------------------------ | ------------------------ | ------------- |
| POST   | `/upload/persona/{persona_id}/image` | Upload image for persona | Yes           |
| POST   | `/upload/persona/{persona_id}/video` | Upload video for persona | Yes           |

### Management Endpoints

| Method | Endpoint                             | Description             | Auth Required |
| ------ | ------------------------------------ | ----------------------- | ------------- |
| GET    | `/upload/persona/{persona_id}/files` | List persona files      | Yes           |
| GET    | `/upload/files/{file_id}`            | Get file info           | Yes           |
| GET    | `/upload/files/{file_id}/download`   | Download file           | Yes           |
| PUT    | `/upload/files/{file_id}`            | Update file description | Yes           |
| DELETE | `/upload/files/{file_id}`            | Delete file             | Yes           |
| GET    | `/upload/stats`                      | Get upload statistics   | Yes           |

## 📤 Upload Examples

### Upload Image

```bash
curl -X POST "http://localhost:8000/upload/persona/1/image" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@image.jpg" \
  -F "description=Profile picture"
```

**Response:**

```json
{
  "id": 1,
  "filename": "uuid-generated-filename.jpg",
  "original_filename": "image.jpg",
  "file_size": 1024000,
  "mime_type": "image/jpeg",
  "media_type": "image",
  "persona_id": 1,
  "user_id": 1,
  "description": "Profile picture",
  "created_at": "2024-01-01T12:00:00",
  "updated_at": "2024-01-01T12:00:00"
}
```

### Upload Video

```bash
curl -X POST "http://localhost:8000/upload/persona/1/video" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@video.mp4" \
  -F "description=Introduction video"
```

### List Persona Files

```bash
curl -X GET "http://localhost:8000/upload/persona/1/files" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Download File

```bash
curl -X GET "http://localhost:8000/upload/files/1/download" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -o downloaded_file.jpg
```

## 🛡️ Security Features

### File Validation

1. **File Extension Check**

   - Validates against allowed extensions (.jpg, .jpeg, .png, .mp4)
   - Prevents upload of executable files

2. **MIME Type Validation**

   - Checks actual file content type
   - Prevents file type spoofing

3. **File Size Limits**
   - 10MB maximum per file
   - Prevents storage abuse

### Access Control

1. **Authentication Required**

   - All upload endpoints require JWT token
   - Unauthorized requests return 403

2. **User Scoping**

   - Users can only upload to their own personas
   - Users can only access their own files

3. **Persona Ownership**
   - Verifies persona belongs to user before upload
   - Prevents cross-user file access

### File System Security

1. **Unique Filenames**

   - UUID-based filenames prevent conflicts
   - Prevents path traversal attacks

2. **Directory Isolation**

   - User-specific directories
   - Persona-specific subdirectories

3. **Safe File Operations**
   - Async file operations
   - Proper error handling
   - File cleanup on deletion

## 🧪 Testing

### Run Upload Tests

```bash
python test_upload.py
```

This comprehensive test suite covers:

- ✅ File upload (images and videos)
- ✅ File validation (type and size)
- ✅ File download and deletion
- ✅ Unauthorized access prevention
- ✅ File listing and statistics
- ✅ Error handling

### Test Coverage

1. **Valid Uploads**

   - JPEG image upload
   - PNG image upload
   - MP4 video upload

2. **Invalid Uploads**

   - Unsupported file types
   - Files exceeding size limit
   - Unauthorized access

3. **File Management**

   - List files by persona
   - Download files
   - Update file descriptions
   - Delete files

4. **Statistics**
   - Upload statistics
   - File counts and sizes
   - Per-persona breakdown

## 🔧 Configuration

### Environment Variables

```bash
# No additional environment variables required
# File size limits are hardcoded for security
```

### File Size Limits

```python
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
```

### Allowed File Types

```python
ALLOWED_IMAGE_TYPES = {
    "image/jpeg", "image/jpg", "image/png"
}

ALLOWED_VIDEO_TYPES = {
    "video/mp4"
}

ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".mp4"
}
```

## 🚀 Usage Examples

### Python Requests

```python
import requests

# Upload image
with open('image.jpg', 'rb') as f:
    files = {'file': ('image.jpg', f, 'image/jpeg')}
    data = {'description': 'Profile picture'}

    response = requests.post(
        'http://localhost:8000/upload/persona/1/image',
        files=files,
        data=data,
        headers={'Authorization': f'Bearer {token}'}
    )

# List files
response = requests.get(
    'http://localhost:8000/upload/persona/1/files',
    headers={'Authorization': f'Bearer {token}'}
)

# Download file
response = requests.get(
    'http://localhost:8000/upload/files/1/download',
    headers={'Authorization': f'Bearer {token}'}
)

with open('downloaded_file.jpg', 'wb') as f:
    f.write(response.content)
```

### JavaScript/Fetch

```javascript
// Upload image
const formData = new FormData();
formData.append("file", fileInput.files[0]);
formData.append("description", "Profile picture");

const response = await fetch("http://localhost:8000/upload/persona/1/image", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});

// List files
const files = await fetch("http://localhost:8000/upload/persona/1/files", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

// Download file
const download = await fetch("http://localhost:8000/upload/files/1/download", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const blob = await download.blob();
const url = URL.createObjectURL(blob);
```

## 📊 Statistics

### Upload Statistics Response

```json
{
  "total_files": 5,
  "total_size_bytes": 52428800,
  "total_size_mb": 50.0,
  "image_count": 3,
  "video_count": 2,
  "persona_stats": {
    "1": {
      "images": 2,
      "videos": 1,
      "total_size": 31457280
    },
    "2": {
      "images": 1,
      "videos": 1,
      "total_size": 20971520
    }
  },
  "file_size_limit_mb": 10
}
```

## 🐛 Troubleshooting

### Common Issues

1. **File Too Large**

   - Error: 413 Request Entity Too Large
   - Solution: Reduce file size to under 10MB

2. **Invalid File Type**

   - Error: 400 Bad Request
   - Solution: Use only JPEG, PNG, or MP4 files

3. **Unauthorized Access**

   - Error: 403 Forbidden
   - Solution: Include valid JWT token

4. **Persona Not Found**
   - Error: 404 Not Found
   - Solution: Verify persona ID and ownership

### Debug Mode

Enable debug logging by setting:

```python
# In app/database.py
engine = create_async_engine(
    DATABASE_URL,
    echo=True,  # Set to True for SQL logging
    future=True
)
```

## 📚 Additional Resources

- [FastAPI File Uploads](https://fastapi.tiangolo.com/tutorial/request-files/)
- [Python aiofiles](https://github.com/Tinche/aiofiles)
- [SQLAlchemy File Handling](https://docs.sqlalchemy.org/)

---

**Note**: This upload system is production-ready with comprehensive security measures and validation.
