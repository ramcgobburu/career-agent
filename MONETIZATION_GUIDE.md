# Career Agent Monetization Guide

## Overview

Career Agent now supports a freemium monetization model with usage tracking and subscription management. Users get **2 free services** and can upgrade to **Premium** for unlimited access.

## Features Implemented

### 1. User Management
- ✅ User registration with email/name (optional)
- ✅ API key authentication
- ✅ Secure API key storage in database
- ✅ User profile management

### 2. Usage Tracking
- ✅ Request counting per user
- ✅ Free tier: 2 requests
- ✅ Premium tier: Unlimited requests
- ✅ Real-time usage display in UI
- ✅ Usage limits enforced on API endpoints

### 3. Subscription Management
- ✅ Free tier (default)
- ✅ Premium tier (unlimited)
- ✅ Subscription status tracking
- ✅ Upgrade/downgrade functionality
- ✅ Subscription expiration support

### 4. Web Client Features
- ✅ User registration/login UI
- ✅ API key management
- ✅ Usage statistics display
- ✅ Progress bar for usage
- ✅ Subscription upgrade UI
- ✅ Career context upload
- ✅ Account management modal

## API Endpoints

### User Management
- `POST /api/v1/users` - Create new user account
- `GET /api/v1/user-info` - Get user info and usage stats
- `POST /api/v1/upload-context` - Upload career context (required before generating)

### Subscription
- `POST /api/v1/subscribe` - Upgrade/downgrade subscription tier

### Career Generation (Requires Authentication)
- `POST /api/v1/cover-letter` - Generate cover letter (counts as 1 request)
- `POST /api/v1/blurb` - Generate blurb (counts as 1 request)
- `POST /api/v1/query` - Send query (counts as 1 request)

All generation endpoints:
- Require `X-API-Key` header
- Check usage limits before processing
- Return 403 if limit reached
- Include usage info in response

## Usage Limits

| Tier | Requests | Cost |
|------|----------|------|
| Free | 2 | Free |
| Premium | Unlimited | TBD (integrate payment provider) |

## Database Schema

### New Fields Added to `User` Table
- `subscription_tier` (String, default: "free")
- `requests_used` (Integer, default: 0)
- `subscription_expires_at` (DateTime, nullable)
- `subscription_status` (String, default: "active")

### New Table: `UsageRecord`
- Tracks individual API requests
- Links to user via `user_id`
- Stores endpoint name and timestamp

## User Flow

1. **Registration**: User creates account → Gets API key
2. **Upload Context**: User uploads career context document
3. **Generate Content**: User generates cover letters, blurbs, or queries
4. **Usage Tracking**: Each request counts against limit
5. **Upgrade**: When limit reached, user can upgrade to Premium

## Integration with Payment Providers

Currently, the subscription upgrade is a demo. To integrate real payments:

1. **Choose Payment Provider** (Stripe, PayPal, etc.)
2. **Add Payment Token Validation** in `/api/v1/subscribe` endpoint
3. **Set Subscription Expiration** based on plan (monthly/yearly)
4. **Add Webhook Handler** for payment events
5. **Update Subscription Status** on payment success/failure

### Example: Stripe Integration

```python
import stripe

@app.post("/api/v1/subscribe")
async def subscribe(
    request: SubscriptionRequest,
    payment_token: str = Field(..., description="Stripe payment token"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify payment with Stripe
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
    charge = stripe.Charge.create(
        amount=999,  # $9.99
        currency="usd",
        source=payment_token,
        description=f"Career Agent Premium - {user.email}"
    )
    
    if charge.status == "succeeded":
        expires_at = datetime.now() + timedelta(days=30)  # Monthly
        update_subscription(db, user.id, "premium", expires_at)
        return {"success": True, "message": "Subscription activated"}
    else:
        raise HTTPException(status_code=400, detail="Payment failed")
```

## Deployment Considerations

### Environment Variables
```bash
DATABASE_URL=sqlite:///./career_agent.db  # Use PostgreSQL in production
CORS_ORIGINS=*  # Set to your domain in production
OPENAI_API_KEY=your_key_here
OPENAI_MODEL=gpt-4o-mini
```

### Database Migration
If you have an existing database, you'll need to migrate:

```python
# Run this once to add new columns
from database import engine, Base, User, UsageRecord
Base.metadata.create_all(bind=engine)
```

### Production Recommendations

1. **Use PostgreSQL** instead of SQLite
2. **Set up Redis** for agent caching (if scaling)
3. **Add rate limiting** (e.g., slowapi)
4. **Implement monitoring** (e.g., Sentry)
5. **Add logging** for usage analytics
6. **Set up email notifications** for subscription events
7. **Implement payment webhooks** for subscription management

## Testing

### Test User Registration
```bash
curl -X POST http://localhost:8000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "name": "Test User"}'
```

### Test Usage Tracking
```bash
# Use the API key from registration
API_KEY="your_api_key_here"

# Upload context first
curl -X POST http://localhost:8000/api/v1/upload-context \
  -H "X-API-Key: $API_KEY" \
  -F "context_text=Your career context here..."

# Make requests (will count usage)
curl -X POST http://localhost:8000/api/v1/cover-letter \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"company_name": "Google", "role_title": "PM"}'
```

## Web Client Usage

1. Open `http://localhost:8000` in browser
2. Click "Login / Register"
3. Create account or enter API key
4. Upload career context
5. Generate content (first 2 are free)
6. Upgrade to Premium when limit reached

## Next Steps

1. **Add Payment Integration**: Integrate Stripe/PayPal
2. **Add Email Service**: Send welcome emails, subscription confirmations
3. **Add Analytics**: Track conversion rates, popular features
4. **Add Admin Dashboard**: Monitor users, subscriptions, usage
5. **Add Trial Period**: Maybe 7-day free trial for Premium
6. **Add Usage Reset**: Monthly reset for free tier (optional)

## Support

For issues or questions about monetization features, check:
- API documentation: `http://localhost:8000/docs`
- Database models: `database.py`
- API server: `api_server.py`

