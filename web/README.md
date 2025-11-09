# Career-Agent Web Frontend

This directory contains the Next.js marketing site and authenticated dashboard for Career-Agent.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment template:
   ```bash
   cp env.local.example .env.local
   ```
   Populate the values with your Supabase project URL and anon key.

3. Run the development server:
   ```bash
   npm run dev
   ```

The landing page is served at http://localhost:3000. Google sign-in will redirect authenticated users to `/dashboard`.

## Deployment

Deploy the `web/` app to Vercel or Render Static Sites. Set the following environment variables in the hosting platform:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Configure Supabase Authentication → Providers to enable Google sign-in. Add `https://your-deployment-url.com/dashboard` to the list of allowed redirect URLs in Supabase Auth settings.


