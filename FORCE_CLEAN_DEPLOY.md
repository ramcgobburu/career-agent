# Force Clean Deployment on Render

## Problem
The subscription routes (`/api/v1/create-checkout-session` and `/api/v1/subscription-status`) are returning 404, even though the code is committed and pushed. Debug prints aren't showing in logs, suggesting Render is using a cached build.

## Solution: Force a Clean Deployment

### Step 1: Clear Build Cache
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Navigate to your service: `career-agent-api`
3. Click **Settings** tab
4. Scroll down to **"Build & Deploy"** section
5. Click **"Clear build cache"** button
6. Confirm the action

### Step 2: Manual Deploy
1. Still in the **Settings** tab
2. Scroll to **"Manual Deploy"** section
3. Click **"Deploy latest commit"**
4. Select branch: `career-agent-ui`
5. Click **"Deploy"**

### Step 3: Watch the Logs
1. Go to **"Logs"** tab
2. Watch for these debug messages:
   - `🚀 MODULE LOADING: api_server_multi_tenant.py`
   - `🚀 Creating FastAPI app...`
   - `🔍 DEBUG: About to define subscription routes...`
   - `🔍 DEBUG: About to define subscription-status route...`
   - `✅ Registered X routes`
   - `✅ Subscription routes: ...`

### Step 4: Verify Routes
After deployment completes, check:
- Visit: `https://api.careerpilotconsulting.com/api/v1/subscription-status`
- Should get: `{"detail":"API key required"}` or `{"detail":"Invalid API key"}` (NOT 404)

## Alternative: Trigger via Git
If manual deploy doesn't work, trigger a new deployment by:
1. Making a small change (like adding a comment)
2. Committing and pushing:
   ```bash
   git commit --allow-empty -m "Trigger clean deployment"
   git push origin career-agent-ui
   ```

## Expected Log Output
After a clean deployment, you should see:
```
🚀 MODULE LOADING: api_server_multi_tenant.py
🚀 Creating FastAPI app...
🔍 DEBUG: About to define subscription routes...
🔍 DEBUG: About to define subscription-status route...
✅ Database initialized successfully!
✅ Registered 18 routes
✅ Subscription routes: POST /api/v1/create-checkout-session, GET /api/v1/subscription-status
📋 All /api/v1 routes (14):
   ...
```

If you DON'T see these messages, Render is still using cached code.

