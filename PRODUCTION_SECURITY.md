# Production Security & Deployment Checklist

## ⚠️ Current Status: NOT Production Ready

The application needs several security and production enhancements before it's safe for payment processing.

## 🔴 Critical Security Issues

### 1. Payment Integration (NOT SAFE)
- ❌ **Current**: Subscription endpoint accepts tier without payment verification
- ❌ **Risk**: Users can upgrade to premium without paying
- ✅ **Required**: Stripe/PayPal webhook verification with signature validation

### 2. API Security
- ❌ **CORS**: Currently allows all origins (`*`)
- ❌ **Rate Limiting**: No protection against abuse
- ❌ **Input Validation**: Some fields lack sanitization
- ❌ **Request Size**: No limits on file uploads

### 3. Database
- ❌ **SQLite**: Not suitable for production (use PostgreSQL)
- ❌ **No Migrations**: Schema changes require manual updates
- ❌ **No Backups**: No automated backup strategy

### 4. Environment Security
- ❌ **Secrets**: No secret management service
- ❌ **Logging**: May expose sensitive data
- ❌ **Error Messages**: Could leak internal details

## ✅ Required Changes for Production

### 1. Secure Payment Webhooks

#### Stripe Integration Example:
```python
import stripe
import hmac
import hashlib

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

@app.post("/api/v1/webhooks/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(400, "Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(400, "Invalid signature")
    
    # Handle events
    if event["type"] == "checkout.session.completed":
        # Update user subscription
        session = event["data"]["object"]
        customer_id = session["customer"]
        # Update subscription in database
    elif event["type"] == "customer.subscription.deleted":
        # Cancel subscription
        pass
    
    return {"status": "success"}
```

### 2. Rate Limiting

Add to `requirements.txt`:
```
slowapi>=0.1.9
```

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/api/v1/cover-letter")
@limiter.limit("10/minute")  # 10 requests per minute per IP
async def generate_cover_letter(...):
    ...
```

### 3. Production CORS

```python
# In production, replace "*" with specific domains
allowed_origins = [
    "https://yourdomain.com",
    "https://www.yourdomain.com"
]
```

### 4. Database Migration

Switch to PostgreSQL:
```python
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost/dbname")
```

### 5. Input Validation & Sanitization

```python
from pydantic import validator

class CoverLetterRequest(BaseModel):
    company_name: str
    
    @validator('company_name')
    def validate_company_name(cls, v):
        if len(v) > 200:
            raise ValueError('Company name too long')
        # Sanitize HTML
        import html
        return html.escape(v)
```

### 6. File Upload Limits

```python
@app.post("/api/v1/upload-context")
async def upload_context(
    file: UploadFile = File(..., max_length=10485760)  # 10MB limit
):
    if file.size > 10485760:
        raise HTTPException(400, "File too large")
```

### 7. Environment-Based Config

```python
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

if ENVIRONMENT == "production":
    # Production settings
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "").split(",")
    LOG_LEVEL = "warning"
    DEBUG = False
else:
    # Development settings
    CORS_ORIGINS = ["*"]
    LOG_LEVEL = "info"
    DEBUG = True
```

### 8. Secure API Keys

```python
# Use environment variables, never hardcode
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY not set")
```

### 9. Error Handling

```python
import logging
from sentry_sdk import init as sentry_init

if ENVIRONMENT == "production":
    sentry_init(
        dsn=os.getenv("SENTRY_DSN"),
        traces_sample_rate=0.1
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    if ENVIRONMENT == "production":
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"}
        )
    else:
        return JSONResponse(
            status_code=500,
            content={"detail": str(exc)}
        )
```

### 10. HTTPS Enforcement

```python
from fastapi.middleware.trustedhost import TrustedHostMiddleware

if ENVIRONMENT == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["yourdomain.com", "*.yourdomain.com"]
    )
```

## 📋 Production Deployment Checklist

- [ ] Switch to PostgreSQL database
- [ ] Set up Stripe/PayPal account
- [ ] Implement secure webhook handler with signature verification
- [ ] Add rate limiting middleware
- [ ] Configure production CORS (specific domains only)
- [ ] Set up environment variables securely
- [ ] Add input validation and sanitization
- [ ] Implement file upload size limits
- [ ] Set up error tracking (Sentry)
- [ ] Configure logging (structured logs)
- [ ] Set up database backups
- [ ] Add monitoring (health checks, metrics)
- [ ] Enable HTTPS (SSL/TLS certificates)
- [ ] Set up CI/CD pipeline
- [ ] Add database migrations
- [ ] Security audit
- [ ] Load testing
- [ ] Backup and disaster recovery plan

## 🔐 Payment Webhook Security Best Practices

1. **Always verify webhook signatures** - Never trust webhooks without verification
2. **Use HTTPS only** - Webhooks must come over HTTPS
3. **Idempotency** - Handle duplicate webhooks gracefully
4. **Timeout handling** - Webhook handlers should respond quickly
5. **Logging** - Log all webhook events for audit trail
6. **Error handling** - Return appropriate HTTP status codes

## 🚀 Recommended Production Stack

- **Database**: PostgreSQL (via AWS RDS, Supabase, or Railway)
- **Payment**: Stripe (recommended) or PayPal
- **Monitoring**: Sentry for errors, DataDog/New Relic for metrics
- **Logging**: CloudWatch, Logtail, or similar
- **Hosting**: Render, Railway, Fly.io, or AWS
- **CDN**: Cloudflare for static assets
- **SSL**: Let's Encrypt (free) or provider SSL

## ⚠️ Before Going Live

1. **Test payment flow end-to-end** in Stripe test mode
2. **Security audit** by a third party
3. **Load testing** to ensure it handles traffic
4. **Backup strategy** in place
5. **Disaster recovery** plan documented
6. **Terms of Service** and **Privacy Policy** published
7. **GDPR compliance** if serving EU users
8. **PCI compliance** considerations for payment data

