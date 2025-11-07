# How to Start and Use the Career Agent API

## 🚀 Quick Start

### Step 1: Start the API Server

```bash
cd /Users/ramgobburu/Documents/career-agent
python3 api_server.py
```

The server will start on `http://localhost:8000`

You should see:
```
🚀 Initializing Career Agent...
Loading career context from...
Split document into 21 chunks
✅ Career Agent initialized successfully!
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Step 2: Access the API

**Option A: Web Interface (Easiest)**
1. Keep the server running
2. Open `web_client.html` in your browser (double-click the file)
3. Use the interface to generate content

**Option B: API Documentation**
- Visit: http://localhost:8000/docs
- Interactive Swagger UI to test all endpoints

**Option C: Python Client**
```python
python3 simple_client.py
```

**Option D: cURL/Command Line**
```bash
curl -X POST "http://localhost:8000/api/v1/cover-letter" \
  -H "Content-Type: application/json" \
  -d '{"company_name": "Google", "role_title": "Senior PM"}'
```

## 📋 Available Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | API information |
| `GET /health` | Health check |
| `POST /api/v1/cover-letter` | Generate cover letter |
| `POST /api/v1/blurb` | Generate LinkedIn/email blurb |
| `POST /api/v1/role-summary` | Generate role-specific summary |
| `POST /api/v1/star-story` | Generate STAR story |
| `POST /api/v1/interview-answer` | Answer interview question |
| `POST /api/v1/query` | Generic query |

## 💡 Example Usage

### Generate Cover Letter

**Web Interface:**
1. Open `web_client.html`
2. Fill in company name, role, job description
3. Click "Generate Cover Letter"

**Python:**
```python
import requests

response = requests.post(
    "http://localhost:8000/api/v1/cover-letter",
    json={
        "company_name": "ServiceNow",
        "role_title": "Product Manager",
        "job_description": "Looking for PM with ServiceNow experience...",
        "tone": "professional",
        "length": "medium"
    }
)

print(response.json()["content"])
```

**cURL:**
```bash
curl -X POST "http://localhost:8000/api/v1/cover-letter" \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Google",
    "role_title": "Senior Product Manager",
    "tone": "professional"
  }'
```

## 📊 Architecture Overview

```
Client (Browser/App/CLI)
    ↓ HTTP/JSON
FastAPI Server (api_server.py)
    ↓
CareerAgent (career_agent.py)
    ↓
RAG Pipeline (LangChain)
    ├─→ Document Loader
    ├─→ Text Splitter
    ├─→ Embeddings (OpenAI)
    └─→ Vector Store (ChromaDB)
    ↓
Retrieval Chain
    ├─→ Semantic Search
    ├─→ Document Combination
    └─→ LLM Generation (GPT-4o-mini)
    ↓
Response (JSON)
```

See `ARCHITECTURE.md` for detailed diagrams.

## 🔧 Troubleshooting

**Server won't start:**
- Check if port 8000 is already in use
- Ensure `.env` file has `OPENAI_API_KEY`
- Verify career context file path

**API returns errors:**
- Check server logs
- Verify request format (see `/docs`)
- Ensure agent initialized (check `/health`)

**Web client can't connect:**
- Make sure API server is running
- Check browser console for errors
- Verify `API_BASE_URL` in `web_client.html`

## 📚 More Information

- **API Guide**: See `API_GUIDE.md`
- **Architecture**: See `ARCHITECTURE.md`
- **Interactive Docs**: http://localhost:8000/docs







