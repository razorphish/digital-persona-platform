"""
S3 utility module for file upload, download, and management with multipart upload support
"""
import os
import uuid
import mimetypes
from typing import Optional, Dict, List, Tuple, BinaryIO
from pathlib import Path
import aioboto3
import boto3
from botocore.exceptions import ClientError, NoCredentialsError
from fastapi import HTTPException, status
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# S3 Configuration
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET", "digital-persona-platform")
AWS_REGION = os.getenv("AWS_REGION", "us-west-1")
AWS_ENDPOINT_URL = os.getenv("AWS_ENDPOINT_URL")  # For localstack testing

# Upload configuration
MULTIPART_THRESHOLD = 5 * 1024 * 1024  # 5MB - S3 minimum for multipart
CHUNK_SIZE = 8 * 1024 * 1024  # 8MB chunks for multipart upload
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB max file size

# Allowed file types
ALLOWED_IMAGE_TYPES = {
    "image/jpeg", "image/jpg", "image/png", "image/gif", 
    "image/webp", "image/bmp", "image/tiff"
}

ALLOWED_VIDEO_TYPES = {
    "video/mp4", "video/avi", "video/mov", "video/wmv", 
    "video/flv", "video/webm", "video/mkv", "video/3gp"
}

ALLOWED_TYPES = ALLOWED_IMAGE_TYPES | ALLOWED_VIDEO_TYPES


class S3Service:
    """S3 service for file operations with multipart upload support."""
    
    def __init__(self):
        self.bucket = AWS_S3_BUCKET
        self.region = AWS_REGION
        self.session = aioboto3.Session()
        
    def _get_s3_key(self, user_id: int, persona_id: int, media_type: str, 
                   original_filename: str, file_id: Optional[str] = None) -> str:
        """Generate S3 key for persona-based file organization."""
        if not file_id:
            file_id = str(uuid.uuid4())
        
        # Get file extension
        ext = Path(original_filename).suffix
        if not ext:
            # Try to get extension from mimetype
            mime_type, _ = mimetypes.guess_type(original_filename)
            if mime_type:
                ext = mimetypes.guess_extension(mime_type) or ""
        
        # Clean filename (remove special characters)
        clean_filename = "".join(c for c in original_filename if c.isalnum() or c in "._-")
        
        return f"uploads/{user_id}/{persona_id}/{media_type}/{file_id}_{clean_filename}"
    
    def _get_media_type(self, mime_type: str) -> str:
        """Determine media type from MIME type."""
        if mime_type in ALLOWED_IMAGE_TYPES:
            return "images"
        elif mime_type in ALLOWED_VIDEO_TYPES:
            return "videos"
        else:
            return "other"
    
    async def upload_file(self, file_obj: BinaryIO, user_id: int, persona_id: int,
                         original_filename: str, mime_type: str, 
                         file_size: int, description: Optional[str] = None) -> Dict:
        """
        Upload file to S3 with automatic multipart upload for large files.
        
        Returns:
            Dict with upload details including S3 key, URL, and metadata
        """
        try:
            # Validate file type
            if mime_type not in ALLOWED_TYPES:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File type {mime_type} not allowed"
                )
            
            # Validate file size
            if file_size > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File size {file_size} exceeds maximum {MAX_FILE_SIZE}"
                )
            
            # Generate S3 key
            media_type = self._get_media_type(mime_type)
            file_id = str(uuid.uuid4())
            s3_key = self._get_s3_key(user_id, persona_id, media_type, original_filename, file_id)
            
            # Determine upload method
            if file_size >= MULTIPART_THRESHOLD:
                result = await self._multipart_upload(
                    file_obj, s3_key, mime_type, file_size
                )
            else:
                result = await self._simple_upload(
                    file_obj, s3_key, mime_type
                )
            
            # Add metadata
            result.update({
                "file_id": file_id,
                "s3_key": s3_key,
                "original_filename": original_filename,
                "mime_type": mime_type,
                "file_size": file_size,
                "media_type": media_type,
                "user_id": user_id,
                "persona_id": persona_id,
                "description": description,
                "s3_url": f"s3://{self.bucket}/{s3_key}",
                "public_url": await self._get_public_url(s3_key)
            })
            
            logger.info(f"Successfully uploaded {original_filename} to S3: {s3_key}")
            return result
            
        except Exception as e:
            logger.error(f"Error uploading file {original_filename}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Upload failed: {str(e)}"
            )
    
    async def _simple_upload(self, file_obj: BinaryIO, s3_key: str, 
                           mime_type: str) -> Dict:
        """Simple upload for files smaller than multipart threshold."""
        session = aioboto3.Session()
        async with session.client(
            "s3",
            region_name=self.region,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            endpoint_url=AWS_ENDPOINT_URL
        ) as s3:
            await s3.upload_fileobj(
                Fileobj=file_obj,
                Bucket=self.bucket,
                Key=s3_key,
                ExtraArgs={
                    "ContentType": mime_type,
                    "ACL": "private"
                }
            )
            
            return {
                "upload_method": "simple",
                "status": "completed"
            }
    
    async def _multipart_upload(self, file_obj: BinaryIO, s3_key: str, 
                              mime_type: str, file_size: int) -> Dict:
        """Multipart upload for large files."""
        async with self.session.client(
            "s3",
            region_name=self.region,
            aws_access_key_id=AWS_ACCESS_KEY_ID,
            aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            endpoint_url=AWS_ENDPOINT_URL
        ) as s3:
            # Initiate multipart upload
            response = await s3.create_multipart_upload(
                Bucket=self.bucket,
                Key=s3_key,
                ContentType=mime_type,
                ACL="private"
            )
            
            upload_id = response["UploadId"]
            parts = []
            
            try:
                part_number = 1
                while True:
                    # Read chunk
                    chunk = file_obj.read(CHUNK_SIZE)
                    if not chunk:
                        break
                    
                    # Upload part
                    part_response = await s3.upload_part(
                        Bucket=self.bucket,
                        Key=s3_key,
                        PartNumber=part_number,
                        UploadId=upload_id,
                        Body=chunk
                    )
                    
                    parts.append({
                        "ETag": part_response["ETag"],
                        "PartNumber": part_number
                    })
                    
                    part_number += 1
                
                # Complete multipart upload
                await s3.complete_multipart_upload(
                    Bucket=self.bucket,
                    Key=s3_key,
                    UploadId=upload_id,
                    MultipartUpload={"Parts": parts}
                )
                
                return {
                    "upload_method": "multipart",
                    "status": "completed",
                    "parts_count": len(parts),
                    "upload_id": upload_id
                }
                
            except Exception as e:
                # Abort multipart upload on error
                try:
                    await s3.abort_multipart_upload(
                        Bucket=self.bucket,
                        Key=s3_key,
                        UploadId=upload_id
                    )
                except:
                    pass
                raise e
    
    async def delete_file(self, s3_key: str) -> bool:
        """Delete file from S3."""
        try:
            async with self.session.client(
                "s3",
                region_name=self.region,
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                endpoint_url=AWS_ENDPOINT_URL
            ) as s3:
                await s3.delete_object(Bucket=self.bucket, Key=s3_key)
                logger.info(f"Successfully deleted file from S3: {s3_key}")
                return True
        except Exception as e:
            logger.error(f"Error deleting file {s3_key}: {str(e)}")
            return False
    
    async def get_file_url(self, s3_key: str, expires_in: int = 3600) -> str:
        """Generate presigned URL for file download."""
        try:
            async with self.session.client(
                "s3",
                region_name=self.region,
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                endpoint_url=AWS_ENDPOINT_URL
            ) as s3:
                url = await s3.generate_presigned_url(
                    "get_object",
                    Params={"Bucket": self.bucket, "Key": s3_key},
                    ExpiresIn=expires_in
                )
                return url
        except Exception as e:
            logger.error(f"Error generating presigned URL for {s3_key}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate download URL"
            )
    
    async def get_upload_url(self, s3_key: str, mime_type: str, 
                           expires_in: int = 3600) -> str:
        """Generate presigned URL for direct file upload."""
        try:
            async with self.session.client(
                "s3",
                region_name=self.region,
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                endpoint_url=AWS_ENDPOINT_URL
            ) as s3:
                url = await s3.generate_presigned_url(
                    "put_object",
                    Params={
                        "Bucket": self.bucket,
                        "Key": s3_key,
                        "ContentType": mime_type
                    },
                    ExpiresIn=expires_in
                )
                return url
        except Exception as e:
            logger.error(f"Error generating upload URL for {s3_key}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate upload URL"
            )
    
    async def _get_public_url(self, s3_key: str) -> Optional[str]:
        """Get public URL if bucket is configured for public access."""
        if AWS_ENDPOINT_URL:
            # For localstack/testing
            return f"{AWS_ENDPOINT_URL}/{self.bucket}/{s3_key}"
        else:
            # For production S3
            return f"https://{self.bucket}.s3.{self.region}.amazonaws.com/{s3_key}"
    
    async def list_persona_files(self, user_id: int, persona_id: int, 
                               media_type: Optional[str] = None) -> List[Dict]:
        """List all files for a specific persona."""
        try:
            prefix = f"uploads/{user_id}/{persona_id}/"
            if media_type:
                prefix += f"{media_type}/"
            
            async with self.session.client(
                "s3",
                region_name=self.region,
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                endpoint_url=AWS_ENDPOINT_URL
            ) as s3:
                response = await s3.list_objects_v2(
                    Bucket=self.bucket,
                    Prefix=prefix
                )
                
                files = []
                if "Contents" in response:
                    for obj in response["Contents"]:
                        files.append({
                            "s3_key": obj["Key"],
                            "size": obj["Size"],
                            "last_modified": obj["LastModified"].isoformat(),
                            "url": await self.get_file_url(obj["Key"])
                        })
                
                return files
        except Exception as e:
            logger.error(f"Error listing files for persona {persona_id}: {str(e)}")
            return []
    
    async def get_file_info(self, s3_key: str) -> Optional[Dict]:
        """Get file information from S3."""
        try:
            async with self.session.client(
                "s3",
                region_name=self.region,
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                endpoint_url=AWS_ENDPOINT_URL
            ) as s3:
                response = await s3.head_object(Bucket=self.bucket, Key=s3_key)
                
                return {
                    "size": response["ContentLength"],
                    "mime_type": response.get("ContentType"),
                    "last_modified": response["LastModified"].isoformat(),
                    "etag": response["ETag"]
                }
        except ClientError as e:
            if e.response["Error"]["Code"] == "404":
                return None
            raise e
        except Exception as e:
            logger.error(f"Error getting file info for {s3_key}: {str(e)}")
            return None
    
    async def copy_file(self, source_key: str, dest_key: str) -> bool:
        """Copy file within S3."""
        try:
            async with self.session.client(
                "s3",
                region_name=self.region,
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
                endpoint_url=AWS_ENDPOINT_URL
            ) as s3:
                await s3.copy_object(
                    Bucket=self.bucket,
                    CopySource={"Bucket": self.bucket, "Key": source_key},
                    Key=dest_key
                )
                return True
        except Exception as e:
            logger.error(f"Error copying file from {source_key} to {dest_key}: {str(e)}")
            return False


# Global S3 service instance
s3_service = S3Service()


# Convenience functions
async def upload_file_to_s3(file_obj: BinaryIO, user_id: int, persona_id: int,
                           original_filename: str, mime_type: str, 
                           file_size: int, description: Optional[str] = None) -> Dict:
    """Upload file to S3 using the global service."""
    return await s3_service.upload_file(
        file_obj, user_id, persona_id, original_filename, 
        mime_type, file_size, description
    )


async def delete_file_from_s3(s3_key: str) -> bool:
    """Delete file from S3 using the global service."""
    return await s3_service.delete_file(s3_key)


async def get_file_download_url(s3_key: str, expires_in: int = 3600) -> str:
    """Get presigned download URL using the global service."""
    return await s3_service.get_file_url(s3_key, expires_in)


async def get_file_upload_url(s3_key: str, mime_type: str, 
                            expires_in: int = 3600) -> str:
    """Get presigned upload URL using the global service."""
    return await s3_service.get_upload_url(s3_key, mime_type, expires_in)


async def list_persona_files_s3(user_id: int, persona_id: int, 
                              media_type: Optional[str] = None) -> List[Dict]:
    """List persona files using the global service."""
    return await s3_service.list_persona_files(user_id, persona_id, media_type) 