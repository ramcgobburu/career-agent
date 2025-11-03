# OpenAI Actions Setup for Career Agent

This guide explains how to configure Career Agent as an OpenAI Action (Custom GPT with API integration).

## Prerequisites

1. Deployed Career Agent API (e.g., on Vercel, Render, etc.)
2. OpenAI GPT Builder access
3. Public API endpoint with HTTPS

## Step-by-Step Setup

### 1. Deploy Your API

Deploy `api_server_multi_tenant.py` to a public endpoint. For example:
- Production URL: `https://career-agent-api.vercel.app`

### 2. Get Your OpenAPI Schema

Your FastAPI automatically generates OpenAPI schema:
- Visit: `https://your-api-url.com/openapi.json`
- Copy the JSON schema

### 3. Create/Edit GPT in OpenAI

1. Go to https://chat.openai.com
2. Click "Explore GPTs"
3. Click "Create" or edit existing GPT
4. In "Actions" section, click "Create new action"

### 4. Configure Authentication

In the Action configuration:

**Authentication Type**: API Key
**Auth Header**: `X-API-Key`
**API Key Type**: Custom

**Note**: Users will need to:
1. Create an account via `/api/v1/users`
2. Upload their context via `/api/v1/upload-context`
3. Use their API key in the GPT Action settings

### 5. Import OpenAPI Schema

1. Paste your OpenAPI schema URL or JSON
2. Or manually configure endpoints

### 6. GPT Instructions

Add these instructions to your GPT:

```
You are a Career Agent assistant that helps users create personalized career materials.

Before generating content, ensure the user has:
1. Created an account (they can do this via the /api/v1/users endpoint)
2. Uploaded their career context (via /api/v1/upload-context)

Use the user's API key for all requests. Guide new users through the setup process.

Available capabilities:
- Generate personalized cover letters
- Create LinkedIn/email blurbs
- Generate role-specific summaries
- Create STAR stories
- Answer interview questions
- Answer career-related queries

Always personalize content based on the user's uploaded career context.
```

## Alternative: Simplified User Flow

If you want a simpler user experience, you can:

1. **Pre-create users** during GPT setup
2. **Store contexts in GPT memory** (for simple use cases)
3. **Use a single shared API key** (less secure, simpler)

## Recommended Endpoints for OpenAI Actions

For OpenAI Actions, focus on these endpoints:

1. `/api/v1/cover-letter` - Main use case
2. `/api/v1/blurb` - Quick content generation
3. `/api/v1/query` - General career questions

You can hide user management endpoints from Actions if preferred.

## Testing Your Action

1. Save your GPT
2. In the preview, test with sample requests:
   - "Generate a cover letter for Google PM role"
   - "Create a LinkedIn introduction blurb"
   - "What are my key achievements?"

## Troubleshooting

**Issue**: Action not working
- Check API is deployed and accessible
- Verify OpenAPI schema is valid
- Check authentication configuration

**Issue**: User gets "No context" error
- User needs to upload context first
- Guide user to `/api/v1/upload-context` endpoint

**Issue**: Authentication fails
- Verify API key format
- Check X-API-Key header is configured correctly

## Production Considerations

1. **Rate Limiting**: Add rate limits to prevent abuse
2. **Error Handling**: Provide clear error messages
3. **Context Size Limits**: Limit context upload size
4. **Usage Tracking**: Monitor API usage per user
5. **Cost Management**: Track OpenAI API costs per user

## Security Best Practices

1. **HTTPS Only**: Always use HTTPS in production
2. **API Key Rotation**: Allow users to regenerate keys
3. **Input Validation**: Validate all user inputs
4. **SQL Injection**: SQLAlchemy prevents most issues, but validate inputs
5. **File Upload Limits**: Limit file size and validate content

## Example Action Configuration JSON

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "Career Agent API",
    "version": "2.0.0"
  },
  "servers": [
    {
      "url": "https://your-api-url.com"
    }
  ],
  "paths": {
    "/api/v1/cover-letter": {
      "post": {
        "summary": "Generate personalized cover letter",
        "operationId": "generateCoverLetter",
        "parameters": [
          {
            "name": "X-API-Key",
            "in": "header",
            "required": true,
            "schema": {"type": "string"}
          }
        ],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "type": "object",
                "properties": {
                  "company_name": {"type": "string"},
                  "role_title": {"type": "string"},
                  "job_description": {"type": "string"},
                  "tone": {"type": "string", "default": "professional"},
                  "length": {"type": "string", "default": "medium"}
                },
                "required": ["company_name", "role_title"]
              }
            }
          }
        },
        "responses": {
          "200": {
            "description": "Generated cover letter",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "success": {"type": "boolean"},
                    "content": {"type": "string"}
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

Note: FastAPI automatically generates a complete OpenAPI schema at `/openapi.json` - use that directly!


