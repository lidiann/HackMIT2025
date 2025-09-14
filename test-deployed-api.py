#!/usr/bin/env python3
"""
Test script for the deployed Render API
"""
import requests
import json

# Replace with your actual Render URL
API_URL = "https://eden-ai-sustainability-api.onrender.com"

def test_health():
    """Test the health endpoint"""
    try:
        response = requests.get(f"{API_URL}/health")
        print(f"Health check: {response.status_code}")
        print(f"Response: {response.json()}")
        return response.status_code == 200
    except Exception as e:
        print(f"Health check failed: {e}")
        return False

def test_count_tokens():
    """Test the token counting endpoint"""
    try:
        payload = {
            "text": "Hello, this is a test message for token counting.",
            "model": "claude-3-5-haiku-20241022",
            "expected_output_tokens": 200
        }
        
        response = requests.post(
            f"{API_URL}/count",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Token count: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2)}")
            return True
        else:
            print(f"Error: {response.text}")
            return False
            
    except Exception as e:
        print(f"Token count test failed: {e}")
        return False

if __name__ == "__main__":
    print("Testing deployed Render API...")
    print("=" * 50)
    
    # Test health endpoint
    print("1. Testing health endpoint...")
    health_ok = test_health()
    print()
    
    # Test token counting
    print("2. Testing token counting...")
    count_ok = test_count_tokens()
    print()
    
    # Summary
    print("=" * 50)
    if health_ok and count_ok:
        print("✅ All tests passed! Your API is working correctly.")
    else:
        print("❌ Some tests failed. Check your deployment.")
