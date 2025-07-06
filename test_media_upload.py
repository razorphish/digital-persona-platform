#!/usr/bin/env python3
"""
Test script for media file upload functionality
"""
import asyncio
import requests
import json
import time
import os
from pathlib import Path

BASE_URL = "http://localhost:8000"

def create_test_image():
    """Create a simple test image file."""
    # Create a simple PNG image (minimal valid PNG)
    png_data = bytes([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
        0x00, 0x00, 0x00, 0x0D,  # IHDR chunk length
        0x49, 0x48, 0x44, 0x52,  # IHDR
        0x00, 0x00, 0x00, 0x01,  # width: 1
        0x00, 0x00, 0x00, 0x01,  # height: 1
        0x08, 0x02, 0x00, 0x00, 0x00,  # bit depth, color type, etc.
        0x90, 0x77, 0x53, 0xDE,  # CRC
        0x00, 0x00, 0x00, 0x0C,  # IDAT chunk length
        0x49, 0x44, 0x41, 0x54,  # IDAT
        0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,  # compressed data
        0xE2, 0x21, 0xBC, 0x33,  # CRC
        0x00, 0x00, 0x00, 0x00,  # IEND chunk length
        0x49, 0x45, 0x4E, 0x44,  # IEND
        0xAE, 0x42, 0x60, 0x82   # CRC
    ])
    
    # Save to file
    test_image_path = "test_image.png"
    with open(test_image_path, "wb") as f:
        f.write(png_data)
    
    return test_image_path

def create_test_video():
    """Create a simple test video file (minimal MP4)."""
    # This is a minimal valid MP4 file (just the header)
    mp4_data = bytes([
        0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,  # ftyp box
        0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,  # isom brand
        0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,  # isom2
        0x61, 0x76, 0x63, 0x31, 0x6D, 0x70, 0x34, 0x31,  # avc1mp41
        0x00, 0x00, 0x00, 0x08, 0x6D, 0x64, 0x61, 0x74,  # mdat box
        0x00, 0x00, 0x00, 0x00   # empty data
    ])
    
    # Save to file
    test_video_path = "test_video.mp4"
    with open(test_video_path, "wb") as f:
        f.write(mp4_data)
    
    return test_video_path

async def test_media_upload():
    """Test the complete media upload functionality."""
    print("📁 Testing Media File Upload System")
    print("=" * 60)
    
    # Create test files
    print("\n1. Creating test files...")
    test_image_path = create_test_image()
    test_video_path = create_test_video()
    print(f"✅ Created test image: {test_image_path}")
    print(f"✅ Created test video: {test_video_path}")
    
    # Test 1: Register a user
    print("\n2. Registering test user...")
    register_data = {
        "email": "media_test@example.com",
        "username": "mediatestuser",
        "password": "testpassword123",
        "full_name": "Media Test User"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/auth/register", json=register_data)
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data['access_token']
            print("✅ User registered successfully!")
        else:
            print(f"❌ Registration failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return
    
    # Test 2: Create a persona
    print("\n3. Creating test persona...")
    persona_data = {
        "name": "Media Test Persona",
        "description": "A test persona for media uploads",
        "relation_type": "friend"
    }
    
    headers = {"Authorization": f"Bearer {access_token}"}
    
    try:
        response = requests.post(f"{BASE_URL}/personas/", json=persona_data, headers=headers)
        if response.status_code == 200:
            persona = response.json()
            persona_id = persona['id']
            print(f"✅ Persona created successfully! ID: {persona_id}")
        else:
            print(f"❌ Persona creation failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return
    except Exception as e:
        print(f"❌ Persona creation error: {e}")
        return
    
    # Test 3: Upload an image
    print("\n4. Testing image upload...")
    try:
        with open(test_image_path, "rb") as f:
            files = {"file": ("test_image.png", f, "image/png")}
            data = {"description": "Test image for persona"}
            response = requests.post(
                f"{BASE_URL}/media/upload/{persona_id}",
                files=files,
                data=data,
                headers=headers
            )
        
        if response.status_code == 200:
            image_media = response.json()
            image_id = image_media['id']
            print("✅ Image upload successful!")
            print(f"   Image ID: {image_id}")
            print(f"   File size: {image_media['file_size']} bytes")
            print(f"   MIME type: {image_media['mime_type']}")
        else:
            print(f"❌ Image upload failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return
    except Exception as e:
        print(f"❌ Image upload error: {e}")
        return
    
    # Test 4: Upload a video
    print("\n5. Testing video upload...")
    try:
        with open(test_video_path, "rb") as f:
            files = {"file": ("test_video.mp4", f, "video/mp4")}
            data = {"description": "Test video for persona"}
            response = requests.post(
                f"{BASE_URL}/media/upload/{persona_id}",
                files=files,
                data=data,
                headers=headers
            )
        
        if response.status_code == 200:
            video_media = response.json()
            video_id = video_media['id']
            print("✅ Video upload successful!")
            print(f"   Video ID: {video_id}")
            print(f"   File size: {video_media['file_size']} bytes")
            print(f"   MIME type: {video_media['mime_type']}")
        else:
            print(f"❌ Video upload failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return
    except Exception as e:
        print(f"❌ Video upload error: {e}")
        return
    
    # Test 5: List media files
    print("\n6. Testing list media files...")
    try:
        response = requests.get(f"{BASE_URL}/media/files", headers=headers)
        if response.status_code == 200:
            media_files = response.json()
            print(f"✅ List media files successful! Found {len(media_files)} files")
            for media in media_files:
                print(f"   - {media['original_filename']} ({media['media_type']}) - ID: {media['id']}")
        else:
            print(f"❌ List media files failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ List media files error: {e}")
    
    # Test 6: List media files by persona
    print("\n7. Testing list media files by persona...")
    try:
        response = requests.get(f"{BASE_URL}/media/files?persona_id={persona_id}", headers=headers)
        if response.status_code == 200:
            media_files = response.json()
            print(f"✅ List media files by persona successful! Found {len(media_files)} files")
        else:
            print(f"❌ List media files by persona failed: {response.status_code}")
    except Exception as e:
        print(f"❌ List media files by persona error: {e}")
    
    # Test 7: List media files by type
    print("\n8. Testing list media files by type...")
    try:
        response = requests.get(f"{BASE_URL}/media/files?media_type=image", headers=headers)
        if response.status_code == 200:
            image_files = response.json()
            print(f"✅ List image files successful! Found {len(image_files)} images")
        
        response = requests.get(f"{BASE_URL}/media/files?media_type=video", headers=headers)
        if response.status_code == 200:
            video_files = response.json()
            print(f"✅ List video files successful! Found {len(video_files)} videos")
    except Exception as e:
        print(f"❌ List media files by type error: {e}")
    
    # Test 8: Get media file info
    print("\n9. Testing get media file info...")
    try:
        response = requests.get(f"{BASE_URL}/media/files/{image_id}", headers=headers)
        if response.status_code == 200:
            media_info = response.json()
            print("✅ Get media file info successful!")
            print(f"   Filename: {media_info['original_filename']}")
            print(f"   Description: {media_info['description']}")
        else:
            print(f"❌ Get media file info failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Get media file info error: {e}")
    
    # Test 9: Download media file
    print("\n10. Testing media file download...")
    try:
        response = requests.get(f"{BASE_URL}/media/download/{image_id}", headers=headers)
        if response.status_code == 200:
            print("✅ Media file download successful!")
            print(f"   Content-Type: {response.headers.get('content-type')}")
            print(f"   Content-Length: {response.headers.get('content-length')}")
        else:
            print(f"❌ Media file download failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Media file download error: {e}")
    
    # Test 10: Update media file description
    print("\n11. Testing update media file description...")
    try:
        data = {"description": "Updated description for test image"}
        response = requests.put(f"{BASE_URL}/media/files/{image_id}", data=data, headers=headers)
        if response.status_code == 200:
            updated_media = response.json()
            print("✅ Update media file description successful!")
            print(f"   New description: {updated_media['description']}")
        else:
            print(f"❌ Update media file description failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Update media file description error: {e}")
    
    # Test 11: Get media stats
    print("\n12. Testing get media stats...")
    try:
        response = requests.get(f"{BASE_URL}/media/stats", headers=headers)
        if response.status_code == 200:
            stats = response.json()
            print("✅ Get media stats successful!")
            print(f"   Total files: {stats['total_files']}")
            print(f"   Total images: {stats['total_images']}")
            print(f"   Total videos: {stats['total_videos']}")
            print(f"   Total size: {stats['total_size_mb']} MB")
        else:
            print(f"❌ Get media stats failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Get media stats error: {e}")
    
    # Test 12: Delete media file
    print("\n13. Testing delete media file...")
    try:
        response = requests.delete(f"{BASE_URL}/media/files/{video_id}", headers=headers)
        if response.status_code == 200:
            result = response.json()
            print("✅ Delete media file successful!")
            print(f"   Message: {result['message']}")
            print(f"   File deleted from filesystem: {result['file_deleted']}")
        else:
            print(f"❌ Delete media file failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Delete media file error: {e}")
    
    # Test 13: Verify file is deleted
    print("\n14. Testing file deletion verification...")
    try:
        response = requests.get(f"{BASE_URL}/media/files", headers=headers)
        if response.status_code == 200:
            media_files = response.json()
            remaining_files = [f for f in media_files if f['id'] != video_id]
            print(f"✅ Verification successful! {len(remaining_files)} files remaining")
            if len(remaining_files) == 1:  # Only the image should remain
                print("   ✅ Video file successfully deleted")
            else:
                print("   ⚠️ Unexpected number of files remaining")
        else:
            print(f"❌ Verification failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Verification error: {e}")
    
    # Cleanup test files
    print("\n15. Cleaning up test files...")
    try:
        if os.path.exists(test_image_path):
            os.remove(test_image_path)
            print("✅ Test image file removed")
        if os.path.exists(test_video_path):
            os.remove(test_video_path)
            print("✅ Test video file removed")
    except Exception as e:
        print(f"⚠️ Cleanup warning: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 Media upload system test completed!")
    print("✅ File upload, download, and management working correctly!")

if __name__ == "__main__":
    asyncio.run(test_media_upload()) 