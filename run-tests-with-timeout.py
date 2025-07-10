#!/usr/bin/env python3
"""
Script to run pytest with timeout protection
"""
import subprocess
import signal
import sys
import os

def timeout_handler(signum, frame):
    print('⚠️ Test timeout reached, forcing exit...')
    sys.exit(1)

def main():
    # Set up timeout handler
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(300)  # 5 minute timeout
    
    try:
        # Set test environment variables
        os.environ["ENVIRONMENT"] = "test"
        os.environ["LOG_LEVEL"] = "ERROR"
        os.environ["ENABLE_AI_CAPABILITIES"] = "false"
        os.environ["ENABLE_MEMORY_SYSTEM"] = "false"
        os.environ["ENABLE_PERSONALITY_LEARNING"] = "false"
        os.environ["ENABLE_METRICS"] = "false"
        
        # Run pytest
        result = subprocess.run([
            'pytest', 'tests/', '-v', '-s', 
            '--cov=app', '--cov-report=xml', '--tb=short'
        ], capture_output=False)
        
        # Cancel timeout
        signal.alarm(0)
        
        # Exit with pytest's return code
        sys.exit(result.returncode)
        
    except Exception as e:
        print(f'❌ Test execution error: {e}')
        signal.alarm(0)
        sys.exit(1)

if __name__ == "__main__":
    main() 