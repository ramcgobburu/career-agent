# Migration Guide: Single-Tenant to Multi-Tenant

This guide explains the changes from the original single-tenant Career Agent to the new multi-tenant version.

## Key Changes

### 1. New Files

- **`database.py`**: Database models and user management
- **`api_server_multi_tenant.py`**: New multi-tenant API server
- **`MARKETPLACE_GUIDE.md`**: Marketplace deployment guide
- **`OPENAI_ACTIONS_SETUP.md`**: OpenAI Actions configuration guide
- **`test_multi_tenant.py`**: Test script for multi-tenant API

### 2. Updated Files

- **`career_agent.py`**: 
  - Now supports `career_context_text` parameter (not just file paths)
  - Supports `user_id` for isolated vector stores
  - Generic prompts (not hardcoded to specific user)
  
- **`requirements.txt`**: Added SQLAlchemy and python-multipart

### 3. Architecture Changes

**Before (Single-Tenant)**:
```
Server → Single CareerAgent → Single Vector Store → Single User Context
```

**After (Multi-Tenant)**:
```
Server → Database (Users + Contexts) → Per-User CareerAgent → Per-User Vector Store
```

## Migration Steps

### Option 1: Fresh Start (Recommended)

Use the new multi-tenant server:

```bash
python3 api_server_multi_tenant.py
```

### Option 2: Keep Old Server

The original `api_server.py` still works for single-user scenarios. Keep both servers running if needed.

## API Differences

### Original API (`api_server.py`)
- No authentication
- Single hardcoded context file
- Server startup initializes agent

### Multi-Tenant API (`api_server_multi_tenant.py`)
- API key authentication required
- Users upload their own contexts
- Agents created on-demand per user

## Code Changes for Existing Integrations

If you have existing code using the old API:

### Before:
```python
response = requests.post(
    "http://localhost:8000/api/v1/cover-letter",
    json={"company_name": "Google", "role_title": "PM"}
)
```

### After:
```python
# First: Create user and get API key (one-time)
user_response = requests.post(
    "http://localhost:8000/api/v1/users",
    json={"email": "user@example.com"}
)
api_key = user_response.json()["api_key"]

# Upload context (one-time)
with open("career_context.md") as f:
    requests.post(
        "http://localhost:8000/api/v1/upload-context",
        headers={"X-API-Key": api_key},
        data={"context_text": f.read()}
    )

# Then: Make requests with API key
response = requests.post(
    "http://localhost:8000/api/v1/cover-letter",
    headers={"X-API-Key": api_key},
    json={"company_name": "Google", "role_title": "PM"}
)
```

## Database

The multi-tenant version uses SQLite by default:
- Database file: `career_agent.db`
- Tables: `users`, `user_contexts`
- Automatic initialization on first run

For production, switch to PostgreSQL:
```python
DATABASE_URL=postgresql://user:password@localhost/career_agent
```

## Vector Stores

**Before**: Single vector store at `./chroma_db/`

**After**: Per-user vector stores at `./chroma_db/{user_id}/`

Each user's data is completely isolated.

## Backward Compatibility

The original `api_server.py` and `career_agent.py` still support the old file-based approach:

```python
agent = CareerAgent(
    career_context_path="~/path/to/context.md",
    persist_directory="./chroma_db"
)
```

This allows you to:
1. Keep existing scripts working
2. Gradually migrate to multi-tenant
3. Support both use cases

## Testing

Test the multi-tenant API:
```bash
python3 test_multi_tenant.py
```

This will:
1. Create a user
2. Upload context
3. Generate cover letter
4. Generate blurb
5. Test query endpoint

## Deployment

For OpenAI Marketplace, use `api_server_multi_tenant.py` as it supports:
- User provisioning
- Context uploads
- Per-user isolation
- API key authentication

See `MARKETPLACE_GUIDE.md` for deployment instructions.

## Questions?

- Check `MARKETPLACE_GUIDE.md` for setup
- Check `OPENAI_ACTIONS_SETUP.md` for OpenAI integration
- Review API docs at `http://localhost:8000/docs` when server is running


