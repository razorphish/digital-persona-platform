#!/usr/bin/env python3
"""
Test script for persona media upload functionality
"""
import os
import sys
import requests
import json
import tempfile
from pathlib import Path
from io import BytesIO

# Add the app directory to the path
sys.path.append(str(Path(__file__).parent / "app"))

# Test configuration
BASE_URL = "http://localhost:8000"
TEST_EMAIL = "upload_test@example.com"
TEST_USERNAME = "upload_test_user"
TEST_PASSWORD = "upload_test_password123"
TEST_FULL_NAME = "Upload Test User"

def print_section(title):
    """Print a section header."""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def print_test_result(test_name, success, details=None):
    """Print test result."""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} {test_name}")
    if details:
        print(f"    {details}")

def create_test_image(size_kb=100):
    """Create a test JPEG image."""
    # Create a simple JPEG header
    jpeg_header = b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00'
    # Add some dummy data to reach the desired size
    dummy_data = b'\x00' * (size_kb * 1024 - len(jpeg_header))
    return jpeg_header + dummy_data

def create_test_video(size_kb=100):
    """Create a test MP4 video."""
    # Create a simple MP4 header
    mp4_header = b'ftypmp41'
    # Add some dummy data to reach the desired size
    dummy_data = b'\x00' * (size_kb * 1024 - len(mp4_header))
    return mp4_header + dummy_data

def test_health_check():
    """Test the health check endpoint."""
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print_test_result("Health Check", True, f"Status: {data.get('status')}")
            return True
        else:
            print_test_result("Health Check", False, f"Status code: {response.status_code}")
            return False
    except Exception as e:
        print_test_result("Health Check", False, f"Error: {str(e)}")
        return False

def test_user_registration():
    """Test user registration for upload testing."""
    try:
        data = {
            "email": TEST_EMAIL,
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD,
            "full_name": TEST_FULL_NAME
        }
        response = requests.post(f"{BASE_URL}/auth/register", json=data)
        
        if response.status_code == 200:
            token_data = response.json()
            print_test_result("User Registration", True, f"Token received: {len(token_data.get('access_token', ''))} chars")
            return token_data.get('access_token')
        elif response.status_code == 400 and "already registered" in response.json().get('detail', ''):
            print_test_result("User Registration", True, "User already exists (expected behavior)")
            return None
        else:
            error_detail = response.json().get('detail', 'Unknown error')
            print_test_result("User Registration", False, f"Status: {response.status_code}, Error: {error_detail}")
            return None
    except Exception as e:
        print_test_result("User Registration", False, f"Error: {str(e)}")
        return None

def test_user_login():
    """Test user login for upload testing."""
    try:
        data = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        response = requests.post(f"{BASE_URL}/auth/login", json=data)
        
        if response.status_code == 200:
            token_data = response.json()
            print_test_result("User Login", True, f"Token received: {len(token_data.get('access_token', ''))} chars")
            return token_data.get('access_token')
        else:
            error_detail = response.json().get('detail', 'Unknown error')
            print_test_result("User Login", False, f"Status: {response.status_code}, Error: {error_detail}")
            return None
    except Exception as e:
        print_test_result("User Login", False, f"Error: {str(e)}")
        return None

def test_create_persona(access_token):
    """Test creating a persona for upload testing."""
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        data = {
            "name": "Upload Test Persona",
            "description": "A test persona for upload functionality",
            "relation_type": "friend"
        }
        response = requests.post(f"{BASE_URL}/personas/", json=data, headers=headers)
        
        if response.status_code == 200:
            persona_data = response.json()
            print_test_result("Create Persona", True, f"Persona: {persona_data.get('name')} (ID: {persona_data.get('id')})")
            return persona_data.get('id')
        else:
            error_detail = response.json().get('detail', 'Unknown error')
            print_test_result("Create Persona", False, f"Status: {response.status_code}, Error: {error_detail}")
            return None
    except Exception as e:
        print_test_result("Create Persona", False, f"Error: {str(e)}")
        return None

def test_upload_image(access_token, persona_id):
    """Test uploading an image file."""
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Create test image
        image_data = create_test_image(50)  # 50KB image
        
        files = {
            'file': ('test_image.jpg', BytesIO(image_data), 'image/jpeg')
        }
        data = {
            'description': 'Test image upload'
        }
        
        response = requests.post(
            f"{BASE_URL}/upload/persona/{persona_id}/image",
            files=files,
            data=data,
            headers=headers
        )
        
        if response.status_code == 200:
            upload_data = response.json()
            print_test_result("Upload Image", True, f"Image uploaded: {upload_data.get('original_filename')} ({upload_data.get('file_size')} bytes)")
            return upload_data.get('id')
        else:
            error_detail = response.json().get('detail', 'Unknown error')
            print_test_result("Upload Image", False, f"Status: {response.status_code}, Error: {error_detail}")
            return None
    except Exception as e:
        print_test_result("Upload Image", False, f"Error: {str(e)}")
        return None

def test_upload_video(access_token, persona_id):
    """Test uploading a video file."""
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Create test video
        video_data = create_test_video(100)  # 100KB video
        
        files = {
            'file': ('test_video.mp4', BytesIO(video_data), 'video/mp4')
        }
        data = {
            'description': 'Test video upload'
        }
        
        response = requests.post(
            f"{BASE_URL}/upload/persona/{persona_id}/video",
            files=files,
            data=data,
            headers=headers
        )
        
        if response.status_code == 200:
            upload_data = response.json()
            print_test_result("Upload Video", True, f"Video uploaded: {upload_data.get('original_filename')} ({upload_data.get('file_size')} bytes)")
            return upload_data.get('id')
        else:
            error_detail = response.json().get('detail', 'Unknown error')
            print_test_result("Upload Video", False, f"Status: {response.status_code}, Error: {error_detail}")
            return None
    except Exception as e:
        print_test_result("Upload Video", False, f"Error: {str(e)}")
        return None

def test_upload_invalid_file_type(access_token, persona_id):
    """Test uploading an invalid file type."""
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Create invalid file
        invalid_data = b'invalid file content'
        
        files = {
            'file': ('test_file.txt', BytesIO(invalid_data), 'text/plain')
        }
        
        response = requests.post(
            f"{BASE_URL}/upload/persona/{persona_id}/image",
            files=files,
            headers=headers
        )
        
        if response.status_code == 400:
            print_test_result("Upload Invalid File Type", True, "Properly rejected invalid file type")
            return True
        else:
            print_test_result("Upload Invalid File Type", False, f"Expected 400, got {response.status_code}")
            return False
    except Exception as e:
        print_test_result("Upload Invalid File Type", False, f"Error: {str(e)}")
        return False

def test_upload_large_file(access_token, persona_id):
    """Test uploading a file that exceeds the 10MB limit."""
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # Create large image (11MB)
        large_image_data = create_test_image(11 * 1024)  # 11MB
        
        files = {
            'file': ('large_image.jpg', BytesIO(large_image_data), 'image/jpeg')
        }
        
        response = requests.post(
            f"{BASE_URL}/upload/persona/{persona_id}/image",
            files=files,
            headers=headers
        )
        
        if response.status_code == 413:
            print_test_result("Upload Large File", True, "Properly rejected file exceeding 10MB limit")
            return True
        else:
            print_test_result("Upload Large File", False, f"Expected 413, got {response.status_code}")
            return False
    except Exception as e:
        print_test_result("Upload Large File", False, f"Error: {str(e)}")
        return False

def test_list_persona_files(access_token, persona_id):
    """Test listing files for a persona."""
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        
        response = requests.get(f"{BASE_URL}/upload/persona/{persona_id}/files", headers=headers)
        
        if response.status_code == 200:
            files_data = response.json()
            print_test_result("List Persona Files", True, f"Found {len(files_data)} files")
            return files_data
        else:
            error_detail = response.json().get('detail', 'Unknown error')
            print_test_result("List Persona Files", False, f"Status: {response.status_code}, Error: {error_detail}")
            return None
    except Exception as e:
        print_test_result("List Persona Files", False, f"Error: {str(e)}")
        return None

def test_download_file(access_token, file_id):
    """Test downloading a file."""
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        
        response = requests.get(f"{BASE_URL}/upload/files/{file_id}/download", headers=headers)
        
        if response.status_code == 200:
            print_test_result("Download File", True, f"File downloaded successfully ({len(response.content)} bytes)")
            return True
        else:
            error_detail = response.json().get('detail', 'Unknown error')
            print_test_result("Download File", False, f"Status: {response.status_code}, Error: {error_detail}")
            return False
    except Exception as e:
        print_test_result("Download File", False, f"Error: {str(e)}")
        return False

def test_delete_file(access_token, file_id):
    """Test deleting a file."""
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        
        response = requests.delete(f"{BASE_URL}/upload/files/{file_id}", headers=headers)
        
        if response.status_code == 200:
            print_test_result("Delete File", True, "File deleted successfully")
            return True
        else:
            error_detail = response.json().get('detail', 'Unknown error')
            print_test_result("Delete File", False, f"Status: {response.status_code}, Error: {error_detail}")
            return False
    except Exception as e:
        print_test_result("Delete File", False, f"Error: {str(e)}")
        return False

def test_upload_stats(access_token):
    """Test getting upload statistics."""
    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        
        response = requests.get(f"{BASE_URL}/upload/stats", headers=headers)
        
        if response.status_code == 200:
            stats_data = response.json()
            print_test_result("Upload Stats", True, f"Total files: {stats_data.get('total_files')}, Total size: {stats_data.get('total_size_mb')}MB")
            return stats_data
        else:
            error_detail = response.json().get('detail', 'Unknown error')
            print_test_result("Upload Stats", False, f"Status: {response.status_code}, Error: {error_detail}")
            return None
    except Exception as e:
        print_test_result("Upload Stats", False, f"Error: {str(e)}")
        return None

def test_unauthorized_upload():
    """Test uploading without authentication."""
    try:
        # Create test image
        image_data = create_test_image(50)
        
        files = {
            'file': ('test_image.jpg', BytesIO(image_data), 'image/jpeg')
        }
        
        response = requests.post(
            f"{BASE_URL}/upload/persona/1/image",
            files=files
        )
        
        if response.status_code == 403:
            print_test_result("Unauthorized Upload", True, "Properly rejected unauthorized upload")
            return True
        else:
            print_test_result("Unauthorized Upload", False, f"Expected 403, got {response.status_code}")
            return False
    except Exception as e:
        print_test_result("Unauthorized Upload", False, f"Error: {str(e)}")
        return False

def main():
    """Run all upload tests."""
    print_section("Persona Media Upload System Test")
    print(f"Testing against: {BASE_URL}")
    
    # Test results tracking
    tests_passed = 0
    total_tests = 0
    
    # Test 1: Health check
    total_tests += 1
    if test_health_check():
        tests_passed += 1
    
    # Test 2: User registration/login
    total_tests += 1
    access_token = test_user_registration()
    if not access_token:
        access_token = test_user_login()
    if access_token:
        tests_passed += 1
    
    # Test 3: Create persona
    total_tests += 1
    persona_id = None
    if access_token:
        persona_id = test_create_persona(access_token)
    if persona_id:
        tests_passed += 1
    
    # Test 4: Upload image
    total_tests += 1
    image_file_id = None
    if access_token and persona_id:
        image_file_id = test_upload_image(access_token, persona_id)
    if image_file_id:
        tests_passed += 1
    
    # Test 5: Upload video
    total_tests += 1
    video_file_id = None
    if access_token and persona_id:
        video_file_id = test_upload_video(access_token, persona_id)
    if video_file_id:
        tests_passed += 1
    
    # Test 6: Upload invalid file type
    total_tests += 1
    if access_token and persona_id:
        if test_upload_invalid_file_type(access_token, persona_id):
            tests_passed += 1
    
    # Test 7: Upload large file
    total_tests += 1
    if access_token and persona_id:
        if test_upload_large_file(access_token, persona_id):
            tests_passed += 1
    
    # Test 8: List persona files
    total_tests += 1
    if access_token and persona_id:
        if test_list_persona_files(access_token, persona_id):
            tests_passed += 1
    
    # Test 9: Download file
    total_tests += 1
    if access_token and image_file_id:
        if test_download_file(access_token, image_file_id):
            tests_passed += 1
    
    # Test 10: Upload stats
    total_tests += 1
    if access_token:
        if test_upload_stats(access_token):
            tests_passed += 1
    
    # Test 11: Delete file
    total_tests += 1
    if access_token and video_file_id:
        if test_delete_file(access_token, video_file_id):
            tests_passed += 1
    
    # Test 12: Unauthorized upload
    total_tests += 1
    if test_unauthorized_upload():
        tests_passed += 1
    
    # Summary
    print_section("Test Summary")
    print(f"Tests Passed: {tests_passed}/{total_tests}")
    print(f"Success Rate: {(tests_passed/total_tests)*100:.1f}%")
    
    if tests_passed == total_tests:
        print("\n🎉 All tests passed! Upload system is working correctly.")
    else:
        print(f"\n⚠️  {total_tests - tests_passed} test(s) failed. Please check the implementation.")
    
    print(f"\nUpload directory structure: uploads/{{user_id}}/{{persona_id}}/")
    print(f"File size limit: 10MB")
    print(f"Supported formats: JPEG, PNG images and MP4 videos")

if __name__ == "__main__":
    main() 