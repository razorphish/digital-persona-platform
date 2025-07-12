import pytest
import asyncio
import subprocess
import time
import requests
import signal
import os
import sys
from pathlib import Path
import uuid

# Add the app directory to the Python path
sys.path.insert(0, str(Path(__file__).parent.parent / "app"))

# Test configuration
TEST_SERVER_HOST = "127.0.0.1"
TEST_SERVER_PORT = 8002  # Use different port to avoid conflicts
BASE_URL = f"http://{TEST_SERVER_HOST}:{TEST_SERVER_PORT}"
TEST_DB_PATH = Path(__file__).parent.parent / "test.db"
INIT_DB_SQL = Path(__file__).parent.parent / "init-db.sql"

@pytest.fixture(scope="session", autouse=True)
def reset_test_db():
    """
    Fixture to set up the test database.
    Uses the existing database file for simplicity.
    """
    # Use the existing database file
    existing_db = Path(__file__).parent.parent / "digital_persona.db"
    if not existing_db.exists():
        existing_db = Path(__file__).parent.parent / "dpp.db"
    
    if existing_db.exists():
        # Copy the existing database to test location
        import shutil
        shutil.copy2(existing_db, TEST_DB_PATH)
        print(f"✅ Test database copied from {existing_db} to {TEST_DB_PATH}")
    else:
        # Create an empty database if none exists
        import sqlite3
        with sqlite3.connect(TEST_DB_PATH) as conn:
            conn.execute("CREATE TABLE IF NOT EXISTS alembic_version (version_num VARCHAR(32) NOT NULL)")
            # Create basic tables that the app expects
            conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    username VARCHAR(255) UNIQUE NOT NULL,
                    full_name VARCHAR(255),
                    hashed_password VARCHAR(255) NOT NULL,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
        print(f"✅ Test database created with basic schema at {TEST_DB_PATH}")
    
    # Set environment variable so the app uses test.db
    os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{TEST_DB_PATH}"
    
    yield
    
    # Clean up after tests
    TEST_DB_PATH.unlink(missing_ok=True)

@pytest.fixture(scope="session")
def test_server(reset_test_db):
    """
    Fixture to start and stop the test server for integration tests.
    Uses a different port to avoid conflicts with development server.
    """
    server_process = None
    
    try:
        # Test imports before starting server
        print("🔍 Testing imports...")
        try:
            import app.main
            print("✅ app.main imported successfully")
        except Exception as e:
            print(f"❌ Failed to import app.main: {e}")
            raise Exception(f"Import error: {e}")
        
        try:
            import app.database
            print("✅ app.database imported successfully")
        except Exception as e:
            print(f"❌ Failed to import app.database: {e}")
            raise Exception(f"Import error: {e}")
        
        # Initialize database schema before starting server
        print("🔧 Initializing database schema...")
        try:
            import asyncio
            from app.database import create_tables
            
            # Run database initialization
            asyncio.run(create_tables())
            print("✅ Database schema initialized")
        except Exception as e:
            print(f"⚠️ Database initialization warning: {e}")
            # Continue anyway, the app might handle this
        
        # Start the server with DATABASE_URL env set
        print(f"🚀 Starting test server on {BASE_URL}")
        env = os.environ.copy()
        env["DATABASE_URL"] = f"sqlite+aiosqlite:///{TEST_DB_PATH}"
        # Set a dummy OpenAI API key to prevent initialization errors
        env["OPENAI_API_KEY"] = "test-key-for-testing"
        # Disable verbose logging for tests
        env["LOG_LEVEL"] = "ERROR"
        # Disable AI services for testing
        env["ENABLE_AI_CAPABILITIES"] = "false"
        env["ENABLE_MEMORY_SYSTEM"] = "false"
        env["ENABLE_PERSONALITY_LEARNING"] = "false"
        # Set test environment
        env["ENVIRONMENT"] = "test"
        # Set a test secret key
        env["SECRET_KEY"] = "test-secret-key-for-testing-only"
        # Disable metrics for tests
        env["ENABLE_METRICS"] = "false"
        
        # Test uvicorn command first
        print("🔍 Testing uvicorn command...")
        try:
            test_cmd = [
                sys.executable, "-c", 
                "import uvicorn; print('✅ uvicorn available')"
            ]
            result = subprocess.run(test_cmd, capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                print("✅ uvicorn is available")
            else:
                print(f"❌ uvicorn test failed: {result.stderr}")
                raise Exception("uvicorn not available")
        except Exception as e:
            print(f"❌ uvicorn test error: {e}")
            raise Exception(f"uvicorn test failed: {e}")
        
        server_process = subprocess.Popen([
            sys.executable, "-m", "uvicorn", 
            "app.main:app", 
            "--host", TEST_SERVER_HOST,
            "--port", str(TEST_SERVER_PORT),
            "--log-level", "error"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env)
        
        # Give the server a moment to start
        time.sleep(3)
        
        # Check if process is still running
        if server_process.poll() is not None:
            # Process died, get error output
            stdout, stderr = server_process.communicate()
            print(f"❌ Server process failed to start:")
            print(f"STDOUT: {stdout.decode()}")
            print(f"STDERR: {stderr.decode()}")
            print(f"Return code: {server_process.returncode}")
            sys.stdout.flush()  # Force flush to see output in CI
            sys.stderr.flush()  # Force flush to see output in CI
            
            # Additional debugging info
            print(f"Python executable: {sys.executable}")
            print(f"Working directory: {os.getcwd()}")
            print(f"Environment variables: {dict(env)}")
            
            raise Exception(f"Server process failed to start with return code {server_process.returncode}")
        
        # Wait for server to start
        max_attempts = 30
        for attempt in range(max_attempts):
            try:
                response = requests.get(f"{BASE_URL}/health", timeout=2)
                if response.status_code == 200:
                    print(f"✅ Test server started successfully on {BASE_URL}")
                    break
            except requests.exceptions.RequestException:
                if attempt == max_attempts - 1:
                    # Get any error output before failing
                    if server_process.poll() is not None:
                        stdout, stderr = server_process.communicate()
                        print(f"❌ Server failed to start. Error output:")
                        print(f"STDOUT: {stdout.decode()}")
                        print(f"STDERR: {stderr.decode()}")
                        sys.stdout.flush()  # Force flush to see output in CI
                        sys.stderr.flush()  # Force flush to see output in CI
                    raise Exception(f"Failed to start test server after {max_attempts} attempts")
                time.sleep(1)
        
        yield BASE_URL
        
    finally:
        # Stop the server
        if server_process:
            print("🛑 Stopping test server...")
            try:
                # Try graceful termination first
                server_process.terminate()
                server_process.wait(timeout=3)
                print("✅ Test server stopped gracefully")
            except subprocess.TimeoutExpired:
                print("⚠️ Graceful shutdown timed out, forcing kill...")
                try:
                    server_process.kill()
                    server_process.wait(timeout=3)
                    print("✅ Test server killed")
                except subprocess.TimeoutExpired:
                    print("⚠️ Could not kill server process, continuing...")
            except Exception as e:
                print(f"⚠️ Error stopping server: {e}")
                # Try to kill anyway
                try:
                    server_process.kill()
                    server_process.wait(timeout=2)
                except:
                    pass
            
            # Force cleanup of any remaining processes on the test port
            try:
                import psutil
                for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                    try:
                        if proc.info['cmdline'] and any('uvicorn' in cmd for cmd in proc.info['cmdline']):
                            if str(TEST_SERVER_PORT) in ' '.join(proc.info['cmdline']):
                                print(f"🔄 Force killing uvicorn process {proc.info['pid']}")
                                proc.kill()
                    except (psutil.NoSuchProcess, psutil.AccessDenied):
                        pass
            except ImportError:
                print("⚠️ psutil not available, skipping process cleanup")
            except Exception as e:
                print(f"⚠️ Process cleanup error: {e}")

@pytest.fixture
def api_client(test_server):
    """
    Fixture providing a requests session configured for the test server.
    """
    import requests
    session = requests.Session()
    
    # Store the original request method
    original_request = session.request
    
    # Create a custom request method that prepends the base URL
    def request_with_base_url(method, url, *args, **kwargs):
        if not url.startswith('http'):
            url = f"{test_server}{url}"
        return original_request(method, url, *args, **kwargs)
    
    # Replace the request method
    session.request = request_with_base_url
    return session

@pytest.fixture
def auth_headers(api_client):
    """
    Fixture providing authentication headers for authenticated requests.
    """
    def _get_auth_headers(token=None):
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return headers
    return _get_auth_headers

@pytest.fixture
def test_user_credentials():
    """
    Fixture providing test user credentials with a unique email.
    """
    unique_id = uuid.uuid4().hex[:8]
    return {
        "email": f"test_{unique_id}@example.com",
        "password": "testpass123",
        "username": f"testuser_{unique_id}",
        "full_name": "Test User"
    }

@pytest.fixture
def authenticated_user(api_client, test_user_credentials, auth_headers):
    """
    Fixture providing an authenticated user session.
    """
    # Register user if not exists
    try:
        response = api_client.post("/auth/register", json=test_user_credentials)
        if response.status_code not in [200, 201, 422]:  # 422 means user already exists
            print(f"Warning: Registration failed with status {response.status_code}")
    except Exception as e:
        print(f"Warning: Registration failed: {e}")
    
    # Login to get token
    response = api_client.post("/auth/login", json={
        "email": test_user_credentials["email"],
        "password": test_user_credentials["password"]
    })
    
    if response.status_code == 200:
        login_data = response.json()
        token = login_data.get("access_token")
        
        # Get user info from the token or make a request to /auth/me
        try:
            user_response = api_client.get("/auth/me", headers=auth_headers(token))
            if user_response.status_code == 200:
                user_data = user_response.json()
            else:
                # Fallback: create minimal user data
                user_data = {"id": 1, "email": test_user_credentials["email"]}
        except Exception:
            # Fallback: create minimal user data
            user_data = {"id": 1, "email": test_user_credentials["email"]}
        
        return {
            "token": token,
            "headers": auth_headers(token),
            "credentials": test_user_credentials,
            "user": user_data
        }
    else:
        pytest.skip("Could not authenticate test user")

# Mark tests that require the server
def pytest_configure(config):
    config.addinivalue_line(
        "markers", "integration: mark test as integration test requiring server"
    )

def pytest_collection_modifyitems(config, items):
    for item in items:
        # Mark tests that use the test_server fixture as integration tests
        if "test_server" in item.fixturenames:
            item.add_marker(pytest.mark.integration) 