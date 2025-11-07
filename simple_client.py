"""
Simple Python client examples for Career Agent API
Use these examples to interact with the API server
"""

import requests
import json

API_BASE_URL = "http://localhost:8000"


def test_api_connection():
    """Test if API server is running."""
    try:
        response = requests.get(f"{API_BASE_URL}/health")
        print("✅ API Server is running!")
        print(f"Response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Cannot connect to API: {e}")
        print("Make sure the server is running: python3 api_server.py")
        return False


def generate_cover_letter(company, role, job_desc=None):
    """Generate a cover letter via API."""
    url = f"{API_BASE_URL}/api/v1/cover-letter"
    payload = {
        "company_name": company,
        "role_title": role,
        "job_description": job_desc,
        "tone": "professional",
        "length": "medium",
        "format": "text"
    }
    
    print(f"\n📝 Generating cover letter for {company} - {role}...")
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        result = response.json()
        print("\n" + "="*70)
        print(result["content"])
        print("="*70)
        return result
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
        return None


def generate_blurb(purpose, target_role=None, max_words=200):
    """Generate a blurb via API."""
    url = f"{API_BASE_URL}/api/v1/blurb"
    payload = {
        "purpose": purpose,
        "target_role": target_role,
        "max_words": max_words,
        "style": "linkedin",
        "format": "text"
    }
    
    print(f"\n📝 Generating blurb: {purpose}...")
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        result = response.json()
        print("\n" + "="*70)
        print(result["content"])
        print("="*70)
        return result
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
        return None


def query_agent(question):
    """Send a custom query to the agent via API."""
    url = f"{API_BASE_URL}/api/v1/query"
    payload = {
        "question": question,
        "format": "text"
    }
    
    print(f"\n❓ Query: {question}")
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        result = response.json()
        print("\n" + "="*70)
        print(result["content"])
        print("="*70)
        return result
    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)
        return None


def save_response_to_file(response, filename):
    """Save API response to a file."""
    with open(filename, 'w', encoding='utf-8') as f:
        if isinstance(response, dict):
            f.write(response.get("content", ""))
        else:
            f.write(str(response))
    print(f"✅ Saved to {filename}")


if __name__ == "__main__":
    print("🚀 Career Agent API Client Examples\n")
    
    # Test connection
    if not test_api_connection():
        exit(1)
    
    # Example 1: Generate cover letter
    print("\n" + "="*70)
    print("EXAMPLE 1: Generate Cover Letter")
    print("="*70)
    cover_letter = generate_cover_letter(
        company="Google",
        role="Senior Product Manager",
        job_desc="Looking for PM with AI/ML experience and cloud platform expertise"
    )
    if cover_letter:
        save_response_to_file(cover_letter, "cover_letter_google.txt")
    
    # Example 2: Generate LinkedIn blurb
    print("\n" + "="*70)
    print("EXAMPLE 2: Generate LinkedIn Blurb")
    print("="*70)
    blurb = generate_blurb(
        purpose="LinkedIn introduction post",
        target_role="Engineering Manager",
        max_words=200
    )
    if blurb:
        save_response_to_file(blurb, "linkedin_blurb.txt")
    
    # Example 3: Custom query
    print("\n" + "="*70)
    print("EXAMPLE 3: Custom Query")
    print("="*70)
    query_result = query_agent(
        "What are Ram's key achievements at ACE Hardware?"
    )
    
    print("\n✅ Examples complete!")









