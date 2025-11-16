# Testing Subscription Flow

## Prerequisites

1. **Stripe Test Mode**: Make sure you're using Stripe test mode (keys start with `sk_test_` and `pk_test_`)
2. **Environment Variables Set in Render**:
   - `STRIPE_SECRET_KEY` - Your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET` - Webhook signing secret (see step 4)
   - `FRONTEND_URL` - Your frontend URL (e.g., `https://www.careerpilotconsulting.com`)
   - `SUPABASE_URL` - Your Supabase project URL (if using Supabase auth)
   - `SUPABASE_ANON_KEY` - Your Supabase anon key (if using Supabase auth)

## Step 1: Test Checkout Session Creation

### Via Frontend (Easiest)
1. Go to your subscription page: `https://www.careerpilotconsulting.com/subscription`
2. Make sure you're logged in
3. Click "Upgrade now" on either Weekly or Monthly plan
4. **Expected Result**: You should be redirected to Stripe Checkout page

### Via API (Manual Testing)
```bash
# Replace YOUR_SUPABASE_TOKEN with your actual auth token
curl -X POST https://api.careerpilotconsulting.com/api/v1/create-checkout-session \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -d '{
    "price_id": "price_1SU9guD3YrV0maBoMLJYRZmm",
    "success_url": "https://www.careerpilotconsulting.com/subscription?success=true",
    "cancel_url": "https://www.careerpilotconsulting.com/subscription?canceled=true"
  }'
```

**Expected Response**:
```json
{
  "session_id": "cs_test_...",
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

## Step 2: Test Payment Flow

1. **On Stripe Checkout Page**:
   - Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/25`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
   - Email: Your test email

2. **Click "Subscribe"**

3. **Expected Result**: 
   - Payment processes successfully
   - You're redirected to: `https://www.careerpilotconsulting.com/subscription?success=true`
   - Subscription status should show as "premium"

## Step 3: Test Subscription Status Endpoint

### Via Frontend
- After successful payment, the subscription page should automatically refresh and show your premium status

### Via API
```bash
curl -X GET https://api.careerpilotconsulting.com/api/v1/subscription-status \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN"
```

**Expected Response**:
```json
{
  "subscription_tier": "premium",
  "subscription_status": "active",
  "subscription_expires_at": "2024-12-16T...",
  "requests_used": 0,
  "requests_limit": 999999,
  "stripe_customer_id": "cus_...",
  "stripe_subscription_id": "sub_..."
}
```

## Step 4: Test Webhooks (Important!)

### Setup Webhook Endpoint in Stripe

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. **Endpoint URL**: `https://api.careerpilotconsulting.com/api/v1/webhooks/stripe`
4. **Events to listen to**:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

5. Click "Add endpoint"
6. **Copy the "Signing secret"** (starts with `whsec_`)
7. **Add to Render**: Set `STRIPE_WEBHOOK_SECRET` environment variable

### Test Webhook Locally (Optional)

Use Stripe CLI to forward webhooks to your local server:
```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to http://localhost:8000/api/v1/webhooks/stripe
```

### Verify Webhook Received

1. Check Render logs after a successful payment
2. Look for: `Received Stripe webhook: checkout.session.completed`
3. Check database to verify user subscription was updated

## Step 5: Test Different Scenarios

### Test 1: Cancel Payment
1. Click "Upgrade now"
2. On Stripe Checkout, click "Cancel" or close the page
3. **Expected**: Redirected to `?canceled=true` with error message

### Test 2: Payment Failure
1. Use test card: `4000 0000 0000 0002` (declined card)
2. Try to subscribe
3. **Expected**: Stripe shows error, payment fails

### Test 3: Already Subscribed
1. After successful subscription, try to subscribe again
2. **Expected**: Button shows "Current plan" and is disabled

### Test 4: Subscription Status After Payment
1. Complete a test payment
2. Wait 2-3 seconds
3. Refresh subscription page
4. **Expected**: Shows "You're currently on the premium plan"

## Step 6: Verify Database Updates

Check that the subscription was saved to the database:

```sql
-- Connect to your Supabase database or PostgreSQL
SELECT 
  id, 
  email, 
  subscription_tier, 
  subscription_status,
  stripe_customer_id,
  stripe_subscription_id
FROM users 
WHERE email = 'your-test-email@example.com';
```

**Expected**: 
- `subscription_tier` = `'premium'`
- `subscription_status` = `'active'`
- `stripe_customer_id` = `'cus_...'`
- `stripe_subscription_id` = `'sub_...'`

## Step 7: Test Usage Limits

After subscription, verify usage limits are updated:

```bash
curl -X GET https://api.careerpilotconsulting.com/api/v1/subscription-status \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN"
```

Check that `requests_limit` is high (999999 for premium) instead of 3 (free tier).

## Troubleshooting

### Issue: "Payment processing not configured correctly"
- **Fix**: Check `STRIPE_SECRET_KEY` in Render environment variables
- Verify the key starts with `sk_test_` and is complete

### Issue: "API key required" or 401 errors
- **Fix**: Make sure you're sending the Authorization header with your Supabase token
- Check that Supabase environment variables are set in Render

### Issue: Webhook not received
- **Fix**: 
  1. Verify webhook endpoint URL in Stripe Dashboard
  2. Check `STRIPE_WEBHOOK_SECRET` is set in Render
  3. Check Render logs for webhook errors
  4. Verify webhook events are enabled in Stripe Dashboard

### Issue: Subscription status not updating
- **Fix**: 
  1. Check webhook logs in Render
  2. Verify webhook secret matches
  3. Check database to see if user record was updated

## Test Cards (Stripe Test Mode)

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`
- **Insufficient Funds**: `4000 0000 0000 9995`

## Success Criteria

✅ Checkout session creates successfully  
✅ Redirects to Stripe Checkout  
✅ Test payment processes  
✅ Redirects back to success URL  
✅ Webhook received and processed  
✅ Subscription status shows "premium"  
✅ Database updated with subscription info  
✅ Usage limits increased  

## Next Steps After Testing

1. **Switch to Live Mode** (when ready):
   - Get live keys from Stripe Dashboard
   - Update `STRIPE_SECRET_KEY` in Render
   - Update webhook endpoint to use live mode
   - Update frontend to use live publishable key

2. **Monitor**:
   - Check Stripe Dashboard for payments
   - Monitor Render logs for errors
   - Set up alerts for failed payments

