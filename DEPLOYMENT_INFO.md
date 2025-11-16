# Deployment Information

## Production URL
**Render API**: https://career-agent-tf85.onrender.com/

## OpenAPI Schema URL
https://career-agent-tf85.onrender.com/openapi.json

## API Documentation
https://career-agent-tf85.onrender.com/docs

## Health Check
https://career-agent-tf85.onrender.com/health

## Quick Test Commands

### Test Health
```bash
curl https://career-agent-tf85.onrender.com/health
```

### Create User
```bash
curl -X POST https://career-agent-tf85.onrender.com/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

### Upload Context (replace API_KEY)
```bash
curl -X POST https://career-agent-tf85.onrender.com/api/v1/upload-context \
  -H "X-API-Key: YOUR_API_KEY" \
  -F "context_text=# Your career context here..."
```

### Generate Cover Letter (replace API_KEY)
```bash
curl -X POST https://career-agent-tf85.onrender.com/api/v1/cover-letter \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"company_name":"Google","role_title":"Product Manager"}'
```













