# Fix Database Connection Issues

## Problem
You're seeing errors like:
- `503 Service Unavailable` from API endpoints
- `password authentication failed for user "postgres"`
- `Failed to load resource: the server responded with a status of 503`

## Root Cause
The `DATABASE_URL` environment variable in Render has an incorrect or improperly encoded password.

## Solution

### Step 1: Get Your Supabase Password
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** > **Database**
4. Find your database password (or reset it if needed)
5. Copy the password

### Step 2: URL-Encode the Password
Passwords with special characters (`@`, `#`, `/`, `:`, etc.) must be URL-encoded.

**Option A: Use the helper script (Recommended)**
```bash
python encode_db_password.py
```

Follow the prompts to generate a properly formatted connection string.

**Option B: Manual encoding**
Common special characters:
- `@` → `%40`
- `#` → `%23`
- `/` → `%2F`
- `:` → `%3A`
- `%` → `%25`
- `&` → `%26`
- `=` → `%3D`
- `?` → `%3F`
- ` ` (space) → `%20` or `+`

Example:
- Password: `MyPass@123#`
- Encoded: `MyPass%40123%23`

### Step 3: Build the Connection String

**For Session Pooler (Recommended for Render - Port 6543):**
```
postgresql://postgres.qiigwshlzdlvddcaknyp:ENCODED_PASSWORD@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require
```

**For Transaction Mode (Port 5432):**
```
postgresql://postgres.qiigwshlzdlvddcaknyp:ENCODED_PASSWORD@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require
```

Replace:
- `postgres.qiigwshlzdlvddcaknyp` with your actual username (from Supabase)
- `ENCODED_PASSWORD` with your URL-encoded password
- `aws-1-us-east-2.pooler.supabase.com` with your actual host (from Supabase)

### Step 4: Update Render Environment Variable

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Select your service (`career-agent-api`)
3. Go to **Environment** tab
4. Find `DATABASE_URL` variable
5. Click **Edit** or **Add** if it doesn't exist
6. Paste your complete connection string
7. Click **Save Changes**
8. Render will automatically redeploy

### Step 5: Verify Connection

After redeployment, check:
1. Render logs for "✅ Database initialized successfully!"
2. Visit `/health` endpoint to verify database connection
3. Try making an API request

## Quick Test

Test your connection string locally:
```bash
# Set environment variable
export DATABASE_URL="postgresql://postgres.qiigwshlzdlvddcaknyp:YOUR_ENCODED_PASSWORD@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require"

# Test connection
python -c "from database import init_db; init_db()"
```

## Common Issues

### Issue: "password authentication failed"
**Solution:** Password is incorrect or not URL-encoded. Re-run `encode_db_password.py` with the correct password.

### Issue: "connection refused" or "could not connect"
**Solution:** 
- Check that the database is not paused (Supabase)
- Verify host and port are correct
- Try Session Pooler (port 6543) instead of Transaction mode (5432)

### Issue: "SSL connection required"
**Solution:** Make sure `?sslmode=require` is at the end of your connection string.

### Issue: Still getting 503 errors
**Solution:**
1. Check Render logs for specific error messages
2. Verify the service has finished redeploying
3. Wait a few minutes for the database connection pool to initialize
4. Check that all environment variables are set correctly

## Prevention

Always use the helper script when setting up database connections:
```bash
python encode_db_password.py
```

This ensures passwords are properly encoded and connection strings are formatted correctly.



