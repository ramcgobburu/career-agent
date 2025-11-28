"""
Quick test to verify the Career Agent setup is working
"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

print("🧪 Testing Career Agent Setup...")
print("=" * 60)

# Test 1: Check API key
print("\n1. Checking OpenAI API Key...")
api_key = os.getenv("OPENAI_API_KEY")
if api_key and api_key.startswith("sk-"):
    print("   ✅ API Key found and appears valid")
else:
    print("   ❌ API Key missing or invalid")
    exit(1)

# Test 2: Check career context file
print("\n2. Checking career context file...")
career_path = Path(os.path.expanduser(
    "~/Desktop/Resumes/Career Buddy Resumes/ram_career_context.md"
))
if career_path.exists():
    print(f"   ✅ Career context file found: {career_path}")
    print(f"   📄 File size: {career_path.stat().st_size:,} bytes")
else:
    print(f"   ❌ Career context file not found: {career_path}")
    exit(1)

# Test 3: Test imports
print("\n3. Testing Python imports...")
try:
    from career_agent import CareerAgent
    print("   ✅ CareerAgent imported successfully")
except Exception as e:
    print(f"   ❌ Import failed: {e}")
    exit(1)

# Test 4: Initialize agent (this will take a moment)
print("\n4. Initializing Career Agent...")
print("   (This will load and index your career context - may take 30-60 seconds)")
try:
    agent = CareerAgent(
        career_context_path=str(career_path),
        model_name=os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    )
    print("   ✅ Agent initialized successfully!")
except Exception as e:
    print(f"   ❌ Initialization failed: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

# Test 5: Simple query test
print("\n5. Testing a simple query...")
try:
    result = agent.query("What is Ram's current role and company?")
    print("   ✅ Query successful!")
    print(f"   📝 Response preview: {result['content'][:200]}...")
except Exception as e:
    print(f"   ❌ Query failed: {e}")
    import traceback
    traceback.print_exc()
    exit(1)

print("\n" + "=" * 60)
print("✅ All tests passed! Your Career Agent is ready to use!")
print("=" * 60)
print("\n📚 Next steps:")
print("   • Run: python3 example_usage.py")
print("   • Run: python3 interactive_cli.py (for interactive menu)")
print("   • Or import CareerAgent in your own scripts")

















