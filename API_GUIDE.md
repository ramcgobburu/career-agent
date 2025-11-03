# Career Agent API Guide

## Quick Start

### 1. Start the API Server

```bash
python3 api_server.py
```

The server will start on `http://localhost:8000`

### 2. Access API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 3. Test the API

```bash
# Health check
curl http://localhost:8000/health

# Generate cover letter
curl -X POST "http://localhost:8000/api/v1/cover-letter" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Google",
    "role_title": "Senior Product Manager",
    "tone": "professional",
    "length": "medium"
  }'
```

## API Endpoints

### Base URL
```
http://localhost:8000
```

### Endpoints Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API information |
| `/health` | GET | Health check |
| `/api/v1/cover-letter` | POST | Generate cover letter |
| `/api/v1/blurb` | POST | Generate LinkedIn/email blurb |
| `/api/v1/role-summary` | POST | Generate role-specific summary |
| `/api/v1/star-story` | POST | Generate STAR story |
| `/api/v1/interview-answer` | POST | Answer interview question |
| `/api/v1/query` | POST | Generic query |

## Request/Response Examples

### 1. Generate Cover Letter

**Request:**
```json
POST /api/v1/cover-letter

{
  "company_name": "Google",
  "role_title": "Senior Product Manager",
  "job_description": "Looking for PM with AI/ML experience...",
  "tone": "professional",
  "length": "medium",
  "format": "text"
}
```

**Response:**
```json
{
  "success": true,
  "content": "Dear Hiring Team,\n\nI'm an Engineering Manager...",
  "sources": [...],
  "metadata": {
    "company": "Google",
    "role": "Senior Product Manager",
    "tone": "professional",
    "length": "medium"
  }
}
```

### 2. Generate Blurb

**Request:**
```json
POST /api/v1/blurb

{
  "purpose": "LinkedIn introduction",
  "target_role": "Engineering Manager",
  "max_words": 200,
  "style": "linkedin",
  "format": "text"
}
```

### 3. Custom Query

**Request:**
```json
POST /api/v1/query

{
  "question": "What are Ram's key achievements at ACE Hardware?",
  "format": "text"
}
```

## Using the Web Client

1. Start the API server:
   ```bash
   python3 api_server.py
   ```

2. Open `web_client.html` in your browser (double-click the file)

3. Use the interface to generate content

## Using Python Client

```python
import requests

# Generate cover letter
response = requests.post(
    "http://localhost:8000/api/v1/cover-letter",
    json={
        "company_name": "Google",
        "role_title": "Senior PM",
        "tone": "professional",
        "length": "medium"
    }
)

result = response.json()
print(result["content"])
```

See `simple_client.py` for more examples.

## Using cURL

```bash
# Cover Letter
curl -X POST "http://localhost:8000/api/v1/cover-letter" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "ServiceNow",
    "role_title": "Product Manager",
    "tone": "professional"
  }'

# Blurb
curl -X POST "http://localhost:8000/api/v1/blurb" \
  -H "Content-Type: application/json" \
  -d '{
    "purpose": "LinkedIn post",
    "max_words": 150
  }'
```

## Response Formats

Set `format` parameter to:
- `"text"` - Plain text (default)
- `"markdown"` - Markdown formatted with sources
- `"json"` - JSON formatted output

## Error Handling

All endpoints return standard error responses:

```json
{
  "detail": "Error message here"
}
```

Common status codes:
- `200` - Success
- `400` - Bad request (validation error)
- `500` - Server error
- `503` - Service unavailable (agent not initialized)

## CORS Configuration

The API allows CORS from all origins by default. For production, update `api_server.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://yourdomain.com"],  # Your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Production Deployment

1. **Use a production ASGI server:**
   ```bash
   uvicorn api_server:app --host 0.0.0.0 --port 8000 --workers 4
   ```

2. **Add environment variables:**
   ```bash
   export OPENAI_API_KEY=your_key
   export OPENAI_MODEL=gpt-4o-mini
   ```

3. **Use a reverse proxy (nginx):**
   ```nginx
   location / {
       proxy_pass http://localhost:8000;
   }
   ```

4. **Add rate limiting** (using slowapi or similar)

5. **Set up monitoring** (Prometheus, Grafana)

## Performance Tips

- The vector database is cached locally for fast queries
- First request may take 10-20 seconds (includes LLM call)
- Subsequent requests with similar queries are faster
- Consider caching common queries in production



