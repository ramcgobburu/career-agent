# Stripe Subscription Setup Guide

This guide will help you set up Stripe subscriptions for your Career Agent application.

## Step 1: Get Your Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Make sure you're in **Test mode** for development
3. Go to **Developers** > **API keys**
4. Copy your:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

## Step 2: Create Products and Prices in Stripe

1. Go to **Products** in Stripe Dashboard
2. Click **Add product**
3. Create two products:

### Weekly Plan
- **Name**: Weekly Premium
- **Description**: Weekly subscription for unlimited generations
- **Pricing**: 
  - **Recurring**: Yes
  - **Price**: $9.99
  - **Billing period**: Weekly
- **Save** and copy the **Price ID** (starts with `price_`)

### Monthly Plan
- **Name**: Monthly Premium
- **Description**: Monthly subscription for unlimited generations
- **Pricing**:
  - **Recurring**: Yes
  - **Price**: $27.99
  - **Billing period**: Monthly
- **Save** and copy the **Price ID** (starts with `price_`)

## Step 3: Set Up Webhook Endpoint

1. Go to **Developers** > **Webhooks** in Stripe Dashboard
2. Click **Add endpoint**
3. Set **Endpoint URL**: `https://api.careerpilotconsulting.com/api/v1/webhooks/stripe`
   - Replace with your actual API URL
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

## Step 4: Configure Environment Variables

### Backend (Render/Production)

Add these to your Render environment variables:

```bash
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx  # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx  # Your webhook signing secret
FRONTEND_URL=https://careerpilotconsulting.com  # Your frontend URL
```

### Frontend (Next.js)

Add these to your `.env.local` or Render environment:

```bash
NEXT_PUBLIC_STRIPE_WEEKLY_PRICE_ID=price_xxxxxxxxxxxxx  # Weekly plan price ID
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx  # Monthly plan price ID
```

## Step 5: Test the Integration

### Test Mode

1. Use Stripe test cards:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - Use any future expiry date and any CVC

2. Test the flow:
   - Go to `/subscription` page
   - Click "Upgrade now" on a plan
   - Complete checkout with test card
   - Verify subscription status updates

### Webhook Testing

1. Use Stripe CLI for local testing:
   ```bash
   stripe listen --forward-to localhost:8000/api/v1/webhooks/stripe
   ```

2. Trigger test events:
   ```bash
   stripe trigger checkout.session.completed
   ```

## Step 6: Go Live

1. Switch Stripe Dashboard to **Live mode**
2. Get live API keys
3. Create live products and prices
4. Update environment variables with live keys
5. Update webhook endpoint URL to production
6. Test with real payment method

## Troubleshooting

### "Payment processing not configured"
- Check that `STRIPE_SECRET_KEY` is set in backend environment
- Verify Stripe package is installed: `pip install stripe`

### "Webhook secret not configured"
- Check that `STRIPE_WEBHOOK_SECRET` is set
- Verify webhook endpoint is configured in Stripe Dashboard

### Subscription not updating after payment
- Check webhook logs in Stripe Dashboard
- Verify webhook endpoint URL is correct
- Check backend logs for webhook processing errors
- Ensure user email matches Stripe customer email

### "Invalid price ID"
- Verify Price IDs are correct in frontend environment variables
- Check that prices are in the same Stripe mode (test/live) as your keys

## Security Notes

- **Never commit** API keys to git
- Use environment variables for all secrets
- Use test mode for development
- Verify webhook signatures (already implemented)
- Use HTTPS in production

## Next Steps

- Set up subscription cancellation flow
- Add customer portal for subscription management
- Implement usage-based billing if needed
- Add analytics for subscription metrics

