# Deployment Guide - Career Agent Multi-Tenant API

Step-by-step guide to deploy the Career Agent API to production.

## 📋 Prerequisites

1. **OpenAI API Key** - Get from https://platform.openai.com/api-keys
2. **Git Repository** - Your code in GitHub/GitLab/Bitbucket
3. **Deployment Platform Account** - Choose one:
   - Vercel (easiest for serverless)
   - Render (simple web service)
   - AWS/GCP/Azure (full control)
   - Docker (any platform)

## 🚀 Deployment Options

### Option 1: Vercel (Recommended for Quick Start)

**Pros**: Easy, free tier, automatic deployments, serverless
**Cons**: Function timeout limits (10s free tier, 60s pro)

#### Steps:

1. **Install Vercel CLI**:
```bash
npm install -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Set Environment Variables**:
```bash
vercel env add OPENAI_API_KEY
vercel env add OPENAI_MODEL
# Enter your values when prompted
```

4. **Deploy**:
```bash
cd /Users/ramgobburu/Documents/career-agent
vercel
```

5. **Set Production Environment**:
```bash
vercel --prod
```

**⚠️ Important Notes for Vercel**:
- SQLite database may not persist (use external DB for production)
- For persistent storage, use:
  - PostgreSQL (via Supabase, Neon, or Railway)
  - Or external file storage for SQLite backups
- ChromaDB vector stores may need external storage (S3, etc.)

### Option 2: Render (Best for Persistent Data)

**Pros**: Simple, persistent storage, PostgreSQL support, free tier
**Cons**: Free tier spins down after inactivity

#### Steps:

1. **Go to Render Dashboard**: https://dashboard.render.com

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your Git repository
   - Or deploy from existing code

3. **Configure Service**:
   - **Name**: `career-agent-api`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn api_server_multi_tenant:app --host 0.0.0.0 --port $PORT`
   - **Region**: Choose closest to you

4. **Set Environment Variables**:
   - Click "Environment" tab
   - Add:
     - `OPENAI_API_KEY` = your OpenAI key
     - `OPENAI_MODEL` = `gpt-4o-mini`
     - `DATABASE_URL` = (see PostgreSQL setup below, or use SQLite for testing)

5. **For PostgreSQL (Recommended for Production)**:
   - Create a PostgreSQL database in Render
   - Copy the internal connection string
   - Set `DATABASE_URL` = `postgresql://user:pass@hostname:5432/dbname`

6. **Deploy**:
   - Render auto-deploys on git push
   - Or click "Manual Deploy" → "Deploy latest commit"

### Option 3: Docker Deployment

**Pros**: Works anywhere, consistent environment
**Cons**: Need to manage Docker hosting

#### Steps:

1. **Build Docker Image**:
```bash
docker build -t career-agent .
```

2. **Run Locally** (test):
```bash
docker run -p 8000:8000 \
  -e OPENAI_API_KEY=your_key \
  -e OPENAI_MODEL=gpt-4o-mini \
  career-agent
```

3. **Deploy to Docker Hosting**:
   - **Railway**: Connect GitHub, add Dockerfile, set env vars
   - **Fly.io**: `fly launch`, set secrets
   - **AWS ECS**: Use AWS CLI or console
   - **Google Cloud Run**: `gcloud run deploy`

## 🔧 Environment Variables

Create these environment variables in your deployment platform:

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | - | Your OpenAI API key |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | Model to use |
| `DATABASE_URL` | No | `sqlite:///./career_agent.db` | Database connection string |
| `CORS_ORIGINS` | No | `*` | Comma-separated allowed origins |
| `HOST` | No | `0.0.0.0` | Server host |
| `PORT` | No | `8000` | Server port |
| `ENVIRONMENT` | No | `development` | Set to `production` for prod |

## 🗄️ Database Setup

### SQLite (Development/Testing)
- Default, works out of the box
- Good for testing, not recommended for production
- File: `career_agent.db` in app directory

### PostgreSQL (Production Recommended)

**Option A: Render PostgreSQL**
1. Create PostgreSQL database in Render
2. Copy connection string
3. Set `DATABASE_URL` environment variable

**Option B: Supabase (Free Tier)**
1. Create account at https://supabase.com
2. Create new project → Database
3. Copy connection string from Settings → Database
4. Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

**Option C: Neon (Serverless PostgreSQL)**
1. Create account at https://neon.tech
2. Create project
3. Copy connection string
4. Set as `DATABASE_URL`

**Update Database Model** (if needed):
The `database.py` file automatically uses `DATABASE_URL`. If you switch to PostgreSQL, just update the environment variable - no code changes needed!

## 📊 Production Checklist

Before going live:

- [ ] Set `ENVIRONMENT=production` 
- [ ] Configure `CORS_ORIGINS` (don't use `*` in production)
- [ ] Use PostgreSQL database (not SQLite)
- [ ] Set secure API keys in environment variables
- [ ] Enable HTTPS (most platforms do this automatically)
- [ ] Test health endpoint: `https://your-api.com/health`
- [ ] Test user creation: `POST /api/v1/users`
- [ ] Test context upload: `POST /api/v1/upload-context`
- [ ] Test generation endpoint: `POST /api/v1/cover-letter`

## 🔍 Verify Deployment

1. **Health Check**:
```bash
curl https://your-api-url.com/health
```

Expected:
```json
{"status":"healthy","database":"connected","agent_cache_size":0}
```

2. **API Documentation**:
Visit: `https://your-api-url.com/docs`

3. **Test User Creation**:
```bash
curl -X POST https://your-api-url.com/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## 🚨 Troubleshooting

### Issue: Database errors
**Solution**: 
- Check `DATABASE_URL` is correct
- For PostgreSQL, ensure database exists and connection string is valid
- For SQLite, ensure write permissions

### Issue: OpenAI API errors
**Solution**:
- Verify `OPENAI_API_KEY` is set correctly
- Check API key has credits/permissions
- Try in development first

### Issue: ChromaDB storage
**Solution**:
- ChromaDB stores in `./chroma_db/` directory
- For serverless (Vercel), consider external storage
- For Render/Docker, directory persists

### Issue: Timeout errors
**Solution**:
- First request may take 20-30s (initializes agent)
- Consider adding timeout configuration
- Use caching for faster responses

## 📝 Next Steps After Deployment

1. **Save your API URL**: You'll need this for OpenAI Actions
2. **Test the API**: Use the test script or manual curl commands
3. **Set up OpenAI Actions**: See `OPENAI_ACTIONS_SETUP.md`
4. **Monitor Usage**: Check logs and database usage
5. **Scale as needed**: Upgrade plan if you get traffic

## 🔗 Quick Links

- **Vercel**: https://vercel.com
- **Render**: https://render.com
- **Supabase**: https://supabase.com
- **Neon**: https://neon.tech
- **OpenAI Platform**: https://platform.openai.com

## 💡 Production Tips

1. **Rate Limiting**: Add rate limiting to prevent abuse
2. **Monitoring**: Set up logging (e.g., Sentry for errors)
3. **Backups**: Regularly backup database
4. **Scaling**: Monitor CPU/memory usage
5. **Costs**: Track OpenAI API usage and costs

---

**Ready to deploy?** Choose your platform above and follow the steps!

