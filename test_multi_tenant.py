"""
Test script for multi-tenant Career Agent API
Demonstrates the full user flow: create user, upload context, generate content
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_full_flow():
    """Test the complete user flow"""
    
    print("=" * 60)
    print("Testing Multi-Tenant Career Agent API")
    print("=" * 60)
    
    # Step 1: Create user
    print("\n1. Creating user...")
    response = requests.post(
        f"{BASE_URL}/api/v1/users",
        json={"email": "test@example.com", "name": "Test User"}
    )
    assert response.status_code == 200, f"Failed to create user: {response.text}"
    user_data = response.json()
    api_key = user_data["api_key"]
    user_id = user_data["user_id"]
    print(f"✅ User created: {user_id}")
    print(f"📝 API Key: {api_key[:20]}...")
    
    # Step 2: Upload context
    print("\n2. Uploading career context...")
    sample_context = """# Career Context - Test User

## Experience

### Senior Product Manager at TechCorp (2020-2024)
- Led product strategy for AI platform, increasing revenue by 40%
- Managed cross-functional team of 15 engineers and designers
- Launched 5 major features, reaching 100K+ users

### Product Manager at StartupXYZ (2018-2020)
- Built MVP from scratch to 10K users in 6 months
- Implemented agile processes, reducing release cycles by 50%

## Education
- MBA from Top University
- BS in Computer Science

## Skills
- Product Management
- AI/ML
- Agile/Scrum
- Python, SQL
"""
    
    response = requests.post(
        f"{BASE_URL}/api/v1/upload-context",
        headers={"X-API-Key": api_key},
        data={"context_text": sample_context}
    )
    assert response.status_code == 200, f"Failed to upload context: {response.text}"
    context_data = response.json()
    print(f"✅ Context uploaded: {context_data['context_id']}")
    
    # Wait for agent initialization
    print("\n⏳ Waiting for agent initialization...")
    time.sleep(2)
    
    # Step 3: Generate cover letter
    print("\n3. Generating cover letter...")
    response = requests.post(
        f"{BASE_URL}/api/v1/cover-letter",
        headers={
            "X-API-Key": api_key,
            "Content-Type": "application/json"
        },
        json={
            "company_name": "Google",
            "role_title": "Senior Product Manager",
            "job_description": "Looking for PM with AI/ML experience",
            "tone": "professional",
            "length": "medium"
        }
    )
    assert response.status_code == 200, f"Failed to generate cover letter: {response.text}"
    cover_letter = response.json()
    print("✅ Cover letter generated:")
    print("-" * 60)
    print(cover_letter["content"][:500] + "...")
    print("-" * 60)
    
    # Step 4: Generate blurb
    print("\n4. Generating LinkedIn blurb...")
    response = requests.post(
        f"{BASE_URL}/api/v1/blurb",
        headers={
            "X-API-Key": api_key,
            "Content-Type": "application/json"
        },
        json={
            "purpose": "LinkedIn introduction",
            "max_words": 150,
            "style": "linkedin"
        }
    )
    assert response.status_code == 200, f"Failed to generate blurb: {response.text}"
    blurb = response.json()
    print("✅ Blurb generated:")
    print("-" * 60)
    print(blurb["content"])
    print("-" * 60)
    
    # Step 5: Query
    print("\n5. Testing query endpoint...")
    response = requests.post(
        f"{BASE_URL}/api/v1/query",
        headers={
            "X-API-Key": api_key,
            "Content-Type": "application/json"
        },
        json={
            "question": "What are my key achievements?"
        }
    )
    assert response.status_code == 200, f"Failed to query: {response.text}"
    query_result = response.json()
    print("✅ Query answered:")
    print("-" * 60)
    print(query_result["content"][:300] + "...")
    print("-" * 60)
    
    # Health check
    print("\n6. Checking health...")
    response = requests.get(f"{BASE_URL}/health")
    assert response.status_code == 200
    health = response.json()
    print(f"✅ Health: {health['status']}")
    print(f"📊 Active agents: {health['agent_cache_size']}")
    
    print("\n" + "=" * 60)
    print("✅ All tests passed!")
    print("=" * 60)
    print(f"\n📝 Save your API key for future use: {api_key}")


if __name__ == "__main__":
    try:
        test_full_flow()
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to API server.")
        print("Make sure the server is running: python3 api_server_multi_tenant.py")
    except AssertionError as e:
        print(f"❌ Test failed: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")


