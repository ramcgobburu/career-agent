# Fixing 500 Internal Server Error on Production

## Quick Fix Applied ✅

I've added error handling to `getServerSideProps` functions to prevent crashes. However, the root cause is likely missing environment variables.

## Most Common Cause: Missing Environment Variables

### Check These in Vercel/Render:

**Required Environment Variables for Frontend (Vercel):**

```bash
NEXT_PUBLIC_SUPABASE_URL=https://qiigwshlzdlvddcaknyp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
NEXT_PUBLIC_API_BASE_URL=https://api.careerpilotconsulting.com
NEXT_PUBLIC_STRIPE_WEEKLY_PRICE_ID=price_1SZeGKLnMLXIe10aVo6f938A
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_1SZeDILnMLXIe10adeEmQKJa
```

### How to Check/Fix:

1. **Go to Vercel Dashboard**
   - Select your project
   - Go to **Settings** → **Environment Variables**
   - Verify all `NEXT_PUBLIC_*` variables are set
   - Make sure they're set for **Production** environment

2. **Redeploy After Adding Variables**
   - After adding/updating variables, trigger a new deployment
   - Or wait for automatic redeploy

## Other Possible Causes:

### 1. Supabase Connection Issues
- Check if Supabase project is active
- Verify the URL and keys are correct
- Check Supabase dashboard for any service issues

### 2. Build Errors
- Check Vercel deployment logs
- Look for build-time errors
- Verify all dependencies are installed

### 3. Server-Side Rendering Errors
- The error handling I added should catch these now
- Check browser console for client-side errors
- Check server logs in Vercel

## Immediate Actions:

1. ✅ **Error handling added** - Pages won't crash if Supabase fails
2. ⏳ **Check environment variables** in Vercel
3. ⏳ **Redeploy** after fixing env vars
4. ⏳ **Check Vercel logs** for specific error messages

## How to Check Vercel Logs:

1. Go to Vercel Dashboard
2. Select your project
3. Go to **Deployments** tab
4. Click on the latest deployment
5. Check **Build Logs** and **Function Logs**
6. Look for error messages

## Quick Test:

After redeploying, the site should:
- ✅ Load without 500 errors
- ✅ Show the landing page even if Supabase has issues
- ✅ Handle authentication gracefully

The error handling I added ensures the site won't crash even if Supabase environment variables are missing or incorrect.

