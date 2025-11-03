# Career Agent - OpenAI Marketplace Setup Guide

This guide will help you deploy Career Agent to the OpenAI Marketplace (GPT Store).

## 🏗️ Architecture Overview

The multi-tenant Career Agent supports:
- **User Provisioning**: Create users and generate API keys
- **Context Upload**: Users upload their career context documents
- **Isolated Processing**: Each user has their own vector store and agent instance
- **REST API**: Full REST API compatible with OpenAI Actions

## 🚀 Quick Start

### 1. Start the Multi-Tenant Server

```bash
python3 api_server_multi_tenant.py
```

The server will start on `http://localhost:8000`

### 2. Create a User

```bash
curl -X POST "http://localhost:8000/api/v1/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe"
  }'
```

Response:
```json
{
  "user_id": "user_abc123...",
  "api_key": "ca_xyz789...",
  "message": "User created successfully. Save your API key - it won't be shown again!"
}
```

### 3. Upload Career Context

**Option A: File Upload**
```bash
curl -X POST "http://localhost:8000/api/v1/upload-context" \
  -H "X-API-Key: YOUR_API_KEY" \
  -F "file=@career_context.md"
```

**Option B: Text Upload**
```bash
curl -X POST "http://localhost:8000/api/v1/upload-context" \
  -H "X-API-Key: YOUR_API_KEY" \
  -F "context_text=$(cat career_context.md)"
```

### 4. Generate Career Materials

```bash
curl -X POST "http://localhost:8000/api/v1/cover-letter" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Google",
    "role_title": "Senior Product Manager",
    "tone": "professional",
    "length": "medium"
  }'
```

## 📋 API Endpoints

### Authentication

All endpoints (except user creation) require authentication via:
- **Header**: `X-API-Key: YOUR_API_KEY`
- **Bearer Token**: `Authorization: Bearer YOUR_API_KEY`

### User Management

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/users` | POST | No | Create new user, get API key |
| `/api/v1/upload-context` | POST | Yes | Upload career context |

### Career Generation

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/v1/cover-letter` | POST | Yes | Generate cover letter |
| `/api/v1/blurb` | POST | Yes | Generate LinkedIn/email blurb |
| `/api/v1/role-summary` | POST | Yes | Generate role-specific summary |
| `/api/v1/star-story` | POST | Yes | Generate STAR story |
| `/api/v1/interview-answer` | POST | Yes | Answer interview question |
| `/api/v1/query` | POST | Yes | Generic career query |

## 🔐 Security & Production Setup

### 1. Environment Variables

Create a `.env` file:
```bash
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
DATABASE_URL=sqlite:///./career_agent.db  # Or PostgreSQL for production
```

### 2. Database Setup

**Development (SQLite)**:
- Default: SQLite database at `./career_agent.db`
- No additional setup needed

**Production (PostgreSQL)**:
```bash
DATABASE_URL=postgresql://user:password@localhost/career_agent
```

Update `database.py`:
```python
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./career_agent.db")
```

### 3. API Key Security

- API keys are generated securely using `secrets.token_urlsafe()`
- Keys are one-way (not retrievable after creation)
- Users should save their API key immediately
- Consider implementing key rotation

### 4. Rate Limiting

Add rate limiting for production:
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

### 5. CORS Configuration

Update CORS for production:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://chat.openai.com", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🤖 OpenAI Marketplace Integration

### Option 1: OpenAI Actions (Recommended)

1. **Deploy your API** (Vercel, Render, AWS, etc.)
2. **Create OpenAPI Schema**: The API automatically generates OpenAPI schema at `/openapi.json`
3. **Configure GPT**:
   - Go to GPT configuration
   - Add Action
   - Import OpenAPI schema from your deployed URL
   - Configure authentication (API key)

### Option 2: Custom GPT

1. Deploy API to public endpoint
2. Create GPT with custom instructions
3. Users provide their API key in the GPT interface
4. GPT calls your API endpoints

### OpenAPI Schema Example

Your API automatically exposes OpenAPI schema. Access it at:
- Swagger UI: `http://localhost:8000/docs`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

### Authentication Flow

1. User creates account → Gets API key
2. User uploads context → Context stored per user
3. User makes requests → API validates key → Returns personalized results

## 📦 Deployment Options

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Create `vercel.json`:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api_server_multi_tenant.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api_server_multi_tenant.py"
    }
  ]
}
```
3. Deploy: `vercel`

### Render

1. Create `render.yaml`:
```yaml
services:
  - type: web
    name: career-agent-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn api_server_multi_tenant:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: OPENAI_API_KEY
        sync: false
```
2. Deploy via Render dashboard

### Docker

Create `Dockerfile`:
```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "api_server_multi_tenant:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build and run:
```bash
docker build -t career-agent .
docker run -p 8000:8000 -e OPENAI_API_KEY=your_key career-agent
```

## 🔄 Multi-Tenant Architecture

### Data Isolation

- **User Contexts**: Stored in database per user
- **Vector Stores**: Isolated per user in `./chroma_db/{user_id}/`
- **Agent Instances**: Cached per user (one per user)

### Agent Lifecycle

1. User uploads context → Context saved to DB
2. User makes request → Agent created/retrieved from cache
3. Agent loads user's context → Creates vector store
4. Request processed → Returns personalized result

### Cache Management

Agents are cached in memory. To refresh:
- Re-upload context (automatically clears cache)
- Restart server

## 📊 Monitoring & Logging

Add logging:
```python
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
```

Monitor:
- API key usage
- Context uploads
- Generation requests
- Error rates

## 🧪 Testing

Test the API:
```bash
# Create user
USER_RESPONSE=$(curl -X POST "http://localhost:8000/api/v1/users" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}')

API_KEY=$(echo $USER_RESPONSE | jq -r '.api_key')

# Upload context
curl -X POST "http://localhost:8000/api/v1/upload-context" \
  -H "X-API-Key: $API_KEY" \
  -F "context_text=# My Career Context\n\n## Experience\n..."

# Generate cover letter
curl -X POST "http://localhost:8000/api/v1/cover-letter" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"company_name": "Test Co", "role_title": "PM"}'
```

## 🎯 Next Steps

1. **Deploy to production**
2. **Submit to OpenAI Marketplace**
3. **Add analytics** (usage tracking, etc.)
4. **Implement rate limiting**
5. **Add user management UI** (optional)
6. **Scale database** (PostgreSQL for production)

## 📚 Additional Resources

- API Documentation: `http://localhost:8000/docs`
- OpenAI Actions Guide: https://platform.openai.com/docs/actions
- FastAPI Documentation: https://fastapi.tiangolo.com/


