#!/usr/bin/env python3
"""
Test runner script for Digital Persona Platform.
Provides easy commands to run different types of tests.
"""

import sys
import subprocess
import argparse
from pathlib import Path

def run_command(cmd, description):
    """Run a command and handle errors."""
    print(f"\n{'='*60}")
    print(f"🚀 {description}")
    print(f"{'='*60}")
    print(f"Running: {' '.join(cmd)}")
    print()
    
    try:
        result = subprocess.run(cmd, check=True, capture_output=False)
        print(f"\n✅ {description} completed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"\n❌ {description} failed with exit code {e.returncode}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Run tests for Digital Persona Platform")
    parser.add_argument(
        "test_type",
        choices=["unit", "integration", "all", "coverage"],
        help="Type of tests to run"
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Run with verbose output"
    )
    parser.add_argument(
        "--stop-on-failure", "-x",
        action="store_true",
        help="Stop on first failure"
    )
    
    args = parser.parse_args()
    
    # Base pytest command
    base_cmd = [sys.executable, "-m", "pytest"]
    
    if args.verbose:
        base_cmd.append("-v")
    
    if args.stop_on_failure:
        base_cmd.append("-x")
    
    success = True
    
    if args.test_type == "unit":
        # Run only unit tests (exclude integration tests)
        cmd = base_cmd + ["-m", "not integration", "tests/"]
        success = run_command(cmd, "Unit Tests")
        
    elif args.test_type == "integration":
        # Run only integration tests
        cmd = base_cmd + ["-m", "integration", "tests/"]
        success = run_command(cmd, "Integration Tests")
        
    elif args.test_type == "all":
        # Run all tests
        cmd = base_cmd + ["tests/"]
        success = run_command(cmd, "All Tests")
        
    elif args.test_type == "coverage":
        # Run tests with coverage
        cmd = base_cmd + [
            "--cov=app",
            "--cov-report=term-missing",
            "--cov-report=html",
            "tests/"
        ]
        success = run_command(cmd, "Tests with Coverage")
        
        if success:
            print("\n📊 Coverage report generated in htmlcov/")
            print("Open htmlcov/index.html in your browser to view detailed coverage")
    
    if success:
        print(f"\n🎉 All {args.test_type} tests passed!")
        sys.exit(0)
    else:
        print(f"\n💥 Some {args.test_type} tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main() 