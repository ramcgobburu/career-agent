#!/usr/bin/env python3
"""
Helper script to URL-encode database passwords for connection strings.
This is especially important for Supabase PostgreSQL connections where
passwords may contain special characters that need encoding.
"""

import urllib.parse
import sys

def encode_password(password: str) -> str:
    """URL-encode a password for use in database connection strings."""
    return urllib.parse.quote_plus(password)

def build_connection_string(
    username: str,
    password: str,
    host: str,
    port: int = 5432,
    database: str = "postgres",
    pooler: bool = True
) -> str:
    """
    Build a properly formatted PostgreSQL connection string.
    
    Args:
        username: Database username (e.g., postgres.qiigwshlzdlvddcaknyp)
        password: Database password (will be URL-encoded)
        host: Database host (e.g., aws-1-us-east-2.pooler.supabase.com)
        port: Database port (5432 for transaction mode, 6543 for session mode)
        database: Database name (usually "postgres")
        pooler: Whether using Supabase pooler (adds sslmode=require)
    
    Returns:
        Properly formatted connection string
    """
    encoded_password = encode_password(password)
    
    connection_string = f"postgresql://{username}:{encoded_password}@{host}:{port}/{database}"
    
    if pooler:
        connection_string += "?sslmode=require"
    
    return connection_string

def main():
    """Interactive script to encode database password."""
    print("=" * 60)
    print("Database Password URL Encoder")
    print("=" * 60)
    print()
    
    if len(sys.argv) > 1:
        # Non-interactive mode: just encode the password
        password = sys.argv[1]
        encoded = encode_password(password)
        print(f"Original password: {password}")
        print(f"URL-encoded:       {encoded}")
        print()
        print("Use this in your DATABASE_URL connection string.")
        return
    
    # Interactive mode
    print("Enter your database connection details:")
    print()
    
    username = input("Username (e.g., postgres.qiigwshlzdlvddcaknyp): ").strip()
    password = input("Password: ").strip()
    host = input("Host (e.g., aws-1-us-east-2.pooler.supabase.com): ").strip()
    
    port_input = input("Port (5432 for transaction, 6543 for session pooler) [5432]: ").strip()
    port = int(port_input) if port_input else 5432
    
    database = input("Database name [postgres]: ").strip() or "postgres"
    
    use_pooler = input("Using Supabase pooler? (y/n) [y]: ").strip().lower() != "n"
    
    print()
    print("=" * 60)
    print("Generated Connection String:")
    print("=" * 60)
    print()
    
    connection_string = build_connection_string(
        username=username,
        password=password,
        host=host,
        port=port,
        database=database,
        pooler=use_pooler
    )
    
    print(connection_string)
    print()
    print("=" * 60)
    print("Copy this to your Render environment variable:")
    print("=" * 60)
    print()
    print(f"DATABASE_URL={connection_string}")
    print()
    print("⚠️  Important:")
    print("   - Never commit this to git!")
    print("   - Set this in Render Dashboard > Environment > DATABASE_URL")
    print("   - The password is automatically URL-encoded")

if __name__ == "__main__":
    main()

