"""
Comprehensive tests for S3 file upload functionality
"""
import pytest
import asyncio
import os
import tempfile
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession
import json

# Import your app and test utilities
from app.main import app
from app.models.user_db import User
from app.models.persona_db import Persona
from app.models.media_db import MediaFile
from app.crud import user as user_crud, persona as persona_crud, media as media_crud
from app.database import get_db
from app.services.auth_db import create_access_token

client = TestClient(app)

# Test data
TEST_USER_DATA = {
    "email": "test@example.com",
    "username": "testuser",
    "password": "testpass123",
    "full_name": "Test User"
}

TEST_PERSONA_DATA = {
    "name": "Test Persona",
    "description": "A test persona for S3 uploads",
    "relation_type": "friend"
}

# Mock S3 responses
MOCK_S3_UPLOAD_RESPONSE = {
    "file_id": "test-uuid-123",
    "s3_key": "uploads/1/1/images/test-uuid-123_test.jpg",
    "original_filename": "test.jpg",
    "mime_type": "image/jpeg",
    "file_size": 1024,
    "media_type": "images",
    "user_id": 1,
    "persona_id": 1,
    "description": "Test image",
    "s3_url": "s3://test-bucket/uploads/1/1/images/test-uuid-123_test.jpg",
    "public_url": "https://test-bucket.s3.amazonaws.com/uploads/1/1/images/test-uuid-123_test.jpg",
    "upload_method": "simple",
    "status": "completed"
}

MOCK_PRESIGNED_URL = "https://test-bucket.s3.amazonaws.com/test-file?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=..."


class TestS3Upload:
    """Test suite for S3 file upload functionality"""
    
    @pytest.fixture
    async def test_user(self):
        """Create a test user"""
        # This would be set up in your test database
        return {
            "id": 1,
            "email": TEST_USER_DATA["email"],
            "username": TEST_USER_DATA["username"],
            "full_name": TEST_USER_DATA["full_name"]
        }
    
    @pytest.fixture
    async def test_persona(self):
        """Create a test persona"""
        return {
            "id": 1,
            "name": TEST_PERSONA_DATA["name"],
            "description": TEST_PERSONA_DATA["description"],
            "relation_type": TEST_PERSONA_DATA["relation_type"],
            "user_id": 1
        }
    
    @pytest.fixture
    def auth_token(self, test_user):
        """Generate auth token for test user"""
        return create_access_token({"sub": test_user["username"], "user_id": test_user["id"]})
    
    @pytest.fixture
    def auth_headers(self, auth_token):
        """Return headers with auth token"""
        return {"Authorization": f"Bearer {auth_token}"}
    
    def test_health_check(self):
        """Test that the server is running"""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
    
    @patch('app.services.upload.upload_file_to_s3')
    def test_direct_image_upload(self, mock_s3_upload, auth_headers):
        """Test direct image upload via API"""
        # Mock S3 upload response
        mock_s3_upload.return_value = MOCK_S3_UPLOAD_RESPONSE
        
        # Create test image file
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp_file:
            tmp_file.write(b'fake image data')
            tmp_file.flush()
            
            # Upload image
            with open(tmp_file.name, 'rb') as f:
                response = client.post(
                    "/upload/persona/1/image",
                    headers=auth_headers,
                    files={"file": ("test.jpg", f, "image/jpeg")},
                    data={"description": "Test image"}
                )
            
            # Clean up
            os.unlink(tmp_file.name)
        
        assert response.status_code == 200
        data = response.json()
        assert data["filename"] == "test-uuid-123_test.jpg"
        assert data["mime_type"] == "image/jpeg"
        assert data["media_type"] == "image"
        assert data["persona_id"] == 1
        assert data["user_id"] == 1
        
        # Verify S3 upload was called
        mock_s3_upload.assert_called_once()
    
    @patch('app.utils.s3_util.get_file_upload_url')
    def test_presigned_upload_url(self, mock_presigned_url, auth_headers):
        """Test getting presigned upload URL"""
        # Mock presigned URL response
        mock_presigned_url.return_value = MOCK_PRESIGNED_URL
        
        response = client.post(
            "/upload/persona/1/presigned-upload",
            headers=auth_headers,
            json={
                "filename": "test.jpg",
                "mime_type": "image/jpeg"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "upload_url" in data
        assert "s3_key" in data
        assert "file_id" in data
        assert "bucket" in data
        assert data["upload_url"] == MOCK_PRESIGNED_URL
        
        # Verify presigned URL was generated
        mock_presigned_url.assert_called_once()
    
    def test_register_file_metadata(self, auth_headers):
        """Test registering file metadata after S3 upload"""
        register_data = {
            "file_id": "test-uuid-123",
            "s3_key": "uploads/1/1/images/test-uuid-123_test.jpg",
            "filename": "test-uuid-123_test.jpg",
            "original_filename": "test.jpg",
            "mime_type": "image/jpeg",
            "file_size": 1024,
            "media_type": "image",
            "upload_method": "presigned",
            "description": "Test image uploaded via presigned URL"
        }
        
        response = client.post(
            "/upload/persona/1/register",
            headers=auth_headers,
            json=register_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["filename"] == register_data["filename"]
        assert data["original_filename"] == register_data["original_filename"]
        assert data["mime_type"] == register_data["mime_type"]
        assert data["file_size"] == register_data["file_size"]
        assert data["media_type"] == register_data["media_type"]
    
    @patch('app.utils.s3_util.get_file_download_url')
    def test_file_download(self, mock_download_url, auth_headers):
        """Test getting presigned download URL"""
        # Mock download URL response
        mock_download_url.return_value = MOCK_PRESIGNED_URL
        
        response = client.get(
            "/upload/files/1/download",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "download_url" in data
        assert data["download_url"] == MOCK_PRESIGNED_URL
        
        # Verify download URL was generated
        mock_download_url.assert_called_once()
    
    @patch('app.utils.s3_util.delete_file_from_s3')
    def test_file_deletion(self, mock_delete_s3, auth_headers):
        """Test deleting file from S3 and database"""
        # Mock S3 deletion
        mock_delete_s3.return_value = True
        
        response = client.delete(
            "/upload/files/1",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["detail"] == "File deleted"
        
        # Verify S3 deletion was called
        mock_delete_s3.assert_called_once()
    
    def test_list_persona_files(self, auth_headers):
        """Test listing files for a persona"""
        response = client.get(
            "/upload/persona/1/files",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_upload_stats(self, auth_headers):
        """Test getting upload statistics"""
        response = client.get(
            "/upload/stats",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "total_files" in data
        assert "total_size_bytes" in data
        assert "image_count" in data
        assert "video_count" in data
        assert "persona_stats" in data
    
    def test_invalid_file_type(self, auth_headers):
        """Test upload with invalid file type"""
        with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as tmp_file:
            tmp_file.write(b'not an image')
            tmp_file.flush()
            
            with open(tmp_file.name, 'rb') as f:
                response = client.post(
                    "/upload/persona/1/image",
                    headers=auth_headers,
                    files={"file": ("test.txt", f, "text/plain")}
                )
            
            os.unlink(tmp_file.name)
        
        assert response.status_code == 400
        assert "Only JPEG and PNG images are allowed" in response.json()["detail"]
    
    def test_unauthorized_access(self):
        """Test upload without authentication"""
        response = client.post("/upload/persona/1/image")
        assert response.status_code == 401
    
    def test_nonexistent_persona(self, auth_headers):
        """Test upload to non-existent persona"""
        with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as tmp_file:
            tmp_file.write(b'fake image data')
            tmp_file.flush()
            
            with open(tmp_file.name, 'rb') as f:
                response = client.post(
                    "/upload/persona/999/image",
                    headers=auth_headers,
                    files={"file": ("test.jpg", f, "image/jpeg")}
                )
            
            os.unlink(tmp_file.name)
        
        assert response.status_code == 404
        assert "Persona 999 not found" in response.json()["detail"]


class TestS3Integration:
    """Integration tests for S3 functionality"""
    
    @patch('app.utils.s3_util.s3_service.upload_file')
    def test_multipart_upload_large_file(self, mock_upload):
        """Test multipart upload for large files"""
        # Mock multipart upload response
        mock_upload.return_value = {
            **MOCK_S3_UPLOAD_RESPONSE,
            "upload_method": "multipart",
            "parts_count": 3,
            "upload_id": "test-upload-id"
        }
        
        # This would test actual multipart upload logic
        # Implementation depends on your specific multipart handling
    
    @patch('app.utils.s3_util.s3_service.list_persona_files')
    def test_s3_file_listing(self, mock_list):
        """Test listing files directly from S3"""
        mock_list.return_value = [
            {
                "s3_key": "uploads/1/1/images/file1.jpg",
                "size": 1024,
                "last_modified": "2023-01-01T00:00:00",
                "url": "https://presigned-url-1"
            },
            {
                "s3_key": "uploads/1/1/videos/file2.mp4",
                "size": 2048,
                "last_modified": "2023-01-02T00:00:00",
                "url": "https://presigned-url-2"
            }
        ]
        
        # Test S3 listing functionality
        # This would verify S3 integration works correctly


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"]) 