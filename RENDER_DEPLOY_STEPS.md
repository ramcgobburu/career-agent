# 🚀 Render Deployment - Step by Step Guide

## ✅ Step 1: Code is Ready!
Your code has been committed to git and is ready to push.

## 📤 Step 2: Create GitHub Repository

1. **Go to GitHub**: https://github.com/new
2. **Repository name**: `career-agent` (or any name you prefer)
3. **Visibility**: Choose Public or Private
4. **DO NOT** initialize with README, .gitignore, or license (we already have these)
5. **Click "Create repository"**

## 📥 Step 3: Push to GitHub

After creating the repository, GitHub will show you commands. Use these (replace YOUR_USERNAME):

```bash
cd /Users/ramgobburu/Documents/career-agent

# Add your GitHub repository as remote
git remote add origin https://github.com/ramcgobburu/career-agent.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**Or if you prefer SSH:**
```bash
git remote add origin git@github.com:ramcgobburu/career-agent.git
git branch -M main
git push -u origin main
```

## 🎯 Step 4: Deploy on Render

### 4a. Go to Render Dashboard
1. Visit: https://dashboard.render.com
2. Sign up or log in (you can use GitHub to sign in)

### 4b. Create New Web Service
1. Click the **"New +"** button (top right)
2. Select **"Web Service"**

### 4c. Connect Repository
1. Choose **"Build and deploy from a Git repository"**
2. Click **"Connect account"** if not already connected
3. Authorize Render to access your GitHub
4. Select your repository: `career-agent`

### 4d. Configure Service
Render will auto-detect the `render.yaml` file, but verify these settings:

- **Name**: `career-agent-api` (or your preferred name)
- **Region**: Choose closest to you (Oregon, Frankfurt, etc.)
- **Branch**: `main`
- **Root Directory**: (leave empty)
- **Runtime**: `Python 3`
- **Build Command**: `pip install -r requirements.txt` (auto-filled)
- **Start Command**: `uvicorn api_server_multi_tenant:app --host 0.0.0.0 --port $PORT` (auto-filled)

### 4e. Set Environment Variables
Click on **"Environment"** tab or scroll down:

Click **"Add Environment Variable"** and add:

1. **OPENAI_API_KEY**
   - Key: `OPENAI_API_KEY`
   - Value: (paste your OpenAI API key)
   - ✅ Mark as **"Secret"**

2. **OPENAI_MODEL** (optional)
   - Key: `OPENAI_MODEL`
   - Value: `gpt-4o-mini`

3. **ENVIRONMENT** (optional, for production)
   - Key: `ENVIRONMENT`
   - Value: `production`

### 4f. Create Web Service
1. Scroll down and click **"Create Web Service"**
2. Render will start building and deploying (takes 3-5 minutes)

### 4g. Wait for Deployment
- Watch the build logs
- First deployment takes longer (installing dependencies)
- You'll see a URL like: `https://career-agent-api.onrender.com`

## ✅ Step 5: Verify Deployment

Once deployment is complete:

1. **Check Health**:
```bash
curl https://your-service-name.onrender.com/health
```

Should return:
```json
{"status":"healthy","database":"connected","agent_cache_size":0}
```

2. **Check API Docs**:
Open in browser: `https://your-service-name.onrender.com/docs`

3. **Test User Creation**:
```bash
curl -X POST https://your-service-name.onrender.com/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

## 🎉 Success!

Your API is now live! Copy your URL - you'll need it for OpenAI Actions setup.

---

## 🆘 Troubleshooting

**Build fails?**
- Check build logs in Render dashboard
- Verify `requirements.txt` is correct
- Ensure all dependencies are listed

**Service won't start?**
- Check start command is correct
- Verify environment variables are set
- Check logs for errors

**Database errors?**
- SQLite works for testing
- For production, create a PostgreSQL database in Render
- Update `DATABASE_URL` environment variable

## 📝 Next Steps

After successful deployment:
1. ✅ Save your Render URL
2. ✅ Test all endpoints
3. ✅ Set up OpenAI Actions (see `OPENAI_ACTIONS_SETUP.md`)
4. ✅ Share with users!















