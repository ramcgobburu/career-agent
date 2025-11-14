#!/usr/bin/env python3
"""
Quick test script to verify database connection is working.
Run this to check if your DATABASE_URL is configured correctly.
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_connection():
    """Test database connection."""
    from database import engine, init_db
    
    print("Testing database connection...")
    print(f"DATABASE_URL: {os.getenv('DATABASE_URL', 'NOT SET')[:50]}...")
    print()
    
    try:
        # Try to initialize database (creates tables if needed)
        init_db()
        print("✅ Database connection successful!")
        print("✅ Tables initialized/verified")
        
        # Test a simple query
        from database import SessionLocal, User
        db = SessionLocal()
        try:
            user_count = db.query(User).count()
            print(f"✅ Query test successful! Found {user_count} users in database.")
        except Exception as e:
            print(f"⚠️  Connection works but query failed: {e}")
        finally:
            db.close()
            
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print()
        print("Troubleshooting:")
        print("1. Check that DATABASE_URL is set correctly")
        print("2. Verify password is URL-encoded (use encode_db_password.py)")
        print("3. For Render, use port 6543 (session pooler) instead of 5432")
        print("4. Check that database is not paused (Supabase)")
        return False

if __name__ == "__main__":
    success = test_connection()
    exit(0 if success else 1)

