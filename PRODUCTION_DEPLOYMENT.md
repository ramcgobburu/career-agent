# Production Deployment Guide

## 🚨 Critical: NOT Ready for Production Payments

The current `api_server.py` is **NOT safe for payment processing**. Use `api_server_production.py` for production.

## Quick Production Checklist

### ✅ Required Before Launch

1. **Payment Security**
   - [ ] Implement Stripe webhook signature verification
   - [ ] Never accept subscriptions without payment verification
   - [ ] Test payment flow in Stripe test mode
   - [ ] Set up webhook endpoint URL in Stripe dashboard

2. **Database**
   - [ ] Switch from SQLite to PostgreSQL
   - [ ] Set up database backups
   - [ ] Configure connection pooling

3. **Security**
   - [ ] Set `CORS_ORIGINS` to your domain only
   - [ ] Add rate limiting (slowapi)
   - [ ] Enable HTTPS (SSL/TLS)
   - [ ] Set `ALLOWED_HOSTS` environment variable
   - [ ] Remove `/docs` endpoint in production

4. **Environment Variables**
```bash
ENVIRONMENT=production
DATABASE_URL=postgresql://user:pass@host:5432/dbname
CORS_ORIGINS=https://careerpilotconsulting.com,https://www.careerpilotconsulting.com
ALLOWED_HOSTS=careerpilotconsulting.com,*.careerpilotconsulting.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
OPENAI_API_KEY=sk-...
SENTRY_DSN=https://... (optional but recommended)
```

5. **Monitoring**
   - [ ] Set up error tracking (Sentry)
   - [ ] Configure logging
   - [ ] Set up health check monitoring
   - [ ] Add uptime monitoring

## 🔐 Secure Payment Webhook Setup

### 1. Stripe Account Setup

1. Create Stripe account: https://stripe.com
2. Get API keys from Dashboard → Developers → API keys
3. Set up webhook endpoint in Dashboard → Developers → Webhooks
4. Add endpoint: `https://careerpilotconsulting.com/api/v1/webhooks/stripe`
5. Subscribe to events:
   - `checkout.session.completed`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
6. Copy webhook signing secret (starts with `whsec_`)

### 2. Environment Variables

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx  # Live key for production
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx  # From webhook settings
```

### 3. Webhook Security

The webhook endpoint **MUST**:
- Verify Stripe signature (prevents fake webhooks)
- Handle idempotency (duplicate webhooks)
- Return 200 status quickly (Stripe timeout is 20 seconds)
- Log all webhook events

### 4. Testing

```bash
# Test webhook locally with Stripe CLI
stripe listen --forward-to localhost:8000/api/v1/webhooks/stripe

# Trigger test event
stripe trigger checkout.session.completed
```

## 🛡️ Security Best Practices

### 1. API Key Security

```python
# ✅ GOOD: Use environment variables
api_key = os.getenv("OPENAI_API_KEY")

# ❌ BAD: Never hardcode
api_key = "sk-..."
```

### 2. Database Security

```python
# ✅ GOOD: Use connection string with SSL
DATABASE_URL = "postgresql://user:pass@host/db?sslmode=require"

# ❌ BAD: SQLite in production
DATABASE_URL = "sqlite:///./db.db"
```

### 3. CORS Configuration

```python
# ✅ GOOD: Specific domains
CORS_ORIGINS = ["https://careerpilotconsulting.com"]

# ❌ BAD: Allow all origins
CORS_ORIGINS = ["*"]
```

### 4. Input Validation

```python
# ✅ GOOD: Validate and sanitize
@validator('company_name')
def validate_company_name(cls, v):
    if len(v) > 200:
        raise ValueError('Too long')
    return html.escape(v)

# ❌ BAD: No validation
company_name: str
```

## 📊 Production Server Setup

### Using Production Server File

```bash
# Rename or use production server
cp api_server_production.py api_server.py

# Or run directly
python api_server_production.py
```

### With Gunicorn (Recommended)

```bash
pip install gunicorn

gunicorn api_server_production:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --timeout 120
```

### Environment Variables

Create `.env.production`:
```bash
ENVIRONMENT=production
DATABASE_URL=postgresql://...
CORS_ORIGINS=https://careerpilotconsulting.com
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
OPENAI_API_KEY=sk-...
```

Use the provided `env.production.example` file as a starting point and replace the placeholder values with your real secrets.

## 🧪 Testing Payment Flow

### 1. Test Mode

```bash
# Use Stripe test keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

### 2. Test Card Numbers

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0027 6000 3184`

### 3. Webhook Testing

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:8000/api/v1/webhooks/stripe

# In another terminal
stripe trigger checkout.session.completed
```

## 📝 Legal Requirements

Before accepting payments:

1. **Terms of Service** - Must be published
2. **Privacy Policy** - Required for GDPR/CCPA
3. **Refund Policy** - Clear refund terms
4. **PCI Compliance** - Use Stripe (they handle PCI)
5. **GDPR Compliance** - If serving EU users
   - Data export functionality
   - Right to deletion
   - Cookie consent

## 🚀 Deployment Platforms

### Render.com

```yaml
# render.yaml
services:
  - type: web
    name: career-agent
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: gunicorn api_server_production:app --workers 4 --worker-class uvicorn.workers.UvicornWorker
    envVars:
      - key: ENVIRONMENT
        value: production
      - key: DATABASE_URL
        sync: false
      - key: STRIPE_SECRET_KEY
        sync: false
      - key: STRIPE_WEBHOOK_SECRET
        sync: false
```

### Railway

1. Connect GitHub repo
2. Set environment variables
3. Add PostgreSQL database
4. Deploy

### Fly.io

```bash
fly launch
fly secrets set ENVIRONMENT=production
fly secrets set STRIPE_SECRET_KEY=sk_live_...
fly secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

## ⚠️ Important Notes

1. **Never commit** `.env` files or secrets to Git
2. **Always verify** webhook signatures before processing
3. **Use HTTPS** only in production
4. **Monitor** error logs daily
5. **Backup** database regularly
6. **Test** payment flow thoroughly before launch
7. **Start** with Stripe test mode, then switch to live

## 🆘 Support

For issues:
- Check logs: `tail -f logs/app.log`
- Monitor Stripe dashboard for failed payments
- Check Sentry for errors
- Review database for inconsistencies

