#!/usr/bin/env python3
"""
Simple script to test server startup locally
"""
import subprocess
import time
import requests
import sys
import os
from pathlib import Path

def test_server_startup():
    """Test server startup and basic functionality."""
    print("🧪 Testing server startup...")
    
    # Set test environment variables
    env = os.environ.copy()
    env["DATABASE_URL"] = "sqlite+aiosqlite:///./test_startup.db"
    env["OPENAI_API_KEY"] = "test-key-for-testing"
    env["LOG_LEVEL"] = "ERROR"
    env["ENABLE_AI_CAPABILITIES"] = "false"
    env["ENABLE_MEMORY_SYSTEM"] = "false"
    env["ENABLE_PERSONALITY_LEARNING"] = "false"
    env["ENVIRONMENT"] = "test"
    env["SECRET_KEY"] = "test-secret-key-for-testing-only"
    env["ENABLE_METRICS"] = "false"
    
    server_process = None
    
    try:
        print("🚀 Starting server...")
        server_process = subprocess.Popen([
            sys.executable, "-m", "uvicorn", 
            "app.main:app", 
            "--host", "127.0.0.1",
            "--port", "8001",
            "--log-level", "error"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env)
        
        # Wait for server to start
        print("⏳ Waiting for server to start...")
        time.sleep(5)
        
        # Check if process is still running
        if server_process.poll() is not None:
            stdout, stderr = server_process.communicate()
            print("❌ Server failed to start!")
            print(f"STDOUT: {stdout.decode()}")
            print(f"STDERR: {stderr.decode()}")
            return False
        
        # Test health endpoint
        print("🔍 Testing health endpoint...")
        try:
            response = requests.get("http://127.0.0.1:8001/health", timeout=10)
            if response.status_code == 200:
                print("✅ Server started successfully!")
                print(f"Health response: {response.json()}")
                return True
            else:
                print(f"❌ Health check failed with status {response.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"❌ Health check failed: {e}")
            return False
            
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        return False
        
    finally:
        # Clean up
        if server_process:
            print("🛑 Stopping server...")
            server_process.terminate()
            try:
                server_process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                server_process.kill()
                server_process.wait()
        
        # Clean up test database
        test_db = Path("test_startup.db")
        if test_db.exists():
            test_db.unlink()

if __name__ == "__main__":
    success = test_server_startup()
    sys.exit(0 if success else 1) 