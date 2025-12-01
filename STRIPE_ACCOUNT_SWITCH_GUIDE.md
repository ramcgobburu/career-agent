# Guide: Switching to a Different Stripe Account

This guide will walk you through changing your CareerPilot app to use a different Stripe account.

## Prerequisites

- Access to the new Stripe account dashboard
- Access to your deployment environment (Render/Vercel) to update environment variables
- Access to your codebase

---

## Step 1: Get New Stripe API Keys

1. **Log in to your NEW Stripe Dashboard**
   - Go to [https://dashboard.stripe.com](https://dashboard.stripe.com)
   - Make sure you're logged into the account you want to use

2. **Get API Keys**
   - Navigate to **Developers** → **API keys**
   - **For Testing**: Use Test mode (toggle in top right)
   - **For Production**: Switch to Live mode
   - Copy these keys:
     - **Publishable key** (starts with `pk_test_` or `pk_live_`)
     - **Secret key** (starts with `sk_test_` or `sk_live_`)
     - ⚠️ **Important**: Keep these keys secure and never commit them to git

---

## Step 2: Create Products and Prices in New Stripe Account

You need to create the subscription products in your new Stripe account.

### Create Weekly Plan

1. Go to **Products** in Stripe Dashboard
2. Click **Add product**
3. Fill in:
   - **Name**: `Weekly Premium`
   - **Description**: `Weekly subscription for unlimited generations`
   - **Pricing**:
     - Select **Recurring**
     - **Price**: `9.99`
     - **Currency**: `USD`
     - **Billing period**: `Weekly`
   - Click **Save**
4. **Copy the Price ID** (starts with `price_`) - you'll need this later
   - Example: `price_1ABC123xyz...`

### Create Monthly Plan

1. Click **Add product** again
2. Fill in:
   - **Name**: `Monthly Premium`
   - **Description**: `Monthly subscription for unlimited generations`
   - **Pricing**:
     - Select **Recurring**
     - **Price**: `27.99`
     - **Currency**: `USD`
     - **Billing period**: `Monthly`
   - Click **Save**
3. **Copy the Price ID** (starts with `price_`) - you'll need this later
   - Example: `price_1DEF456abc...`

---

## Step 3: Set Up Webhook Endpoint

Webhooks allow Stripe to notify your backend when subscription events occur.

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. **Endpoint URL**: 
   ```
   https://api.careerpilotconsulting.com/api/v1/webhooks/stripe
   ```
   - Replace with your actual API URL if different
4. **Description**: `CareerPilot Subscription Webhooks`
5. **Events to send**: Select these events:
   - `checkout.session.completed` - When payment succeeds
   - `customer.subscription.created` - When subscription is created
   - `customer.subscription.updated` - When subscription changes
   - `customer.subscription.deleted` - When subscription is canceled
   - `invoice.payment_failed` - When payment fails
6. Click **Add endpoint**
7. **Copy the Signing secret** (starts with `whsec_`)
   - This appears after creating the endpoint
   - Example: `whsec_1234567890abcdef...`

---

## Step 4: Update Backend Environment Variables

Update your backend environment variables (on Render, Heroku, or wherever your API is hosted).

### Required Variables:

```bash
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
FRONTEND_URL=https://careerpilotconsulting.com
```

### How to Update on Render:

1. Go to your Render dashboard
2. Select your API service
3. Go to **Environment** tab
4. Update or add:
   - `STRIPE_SECRET_KEY` → Your new secret key
   - `STRIPE_WEBHOOK_SECRET` → Your new webhook signing secret
   - `FRONTEND_URL` → Your frontend URL (if different)
5. Click **Save Changes**
6. **Redeploy** your service (Render usually does this automatically)

### How to Update Locally (for testing):

If you have a `.env` file locally:

```bash
# .env (backend)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx  # Use test key for local dev
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
FRONTEND_URL=http://localhost:3000
```

---

## Step 5: Update Frontend Environment Variables

Update your frontend environment variables (on Vercel, Netlify, or wherever your frontend is hosted).

### Required Variables:

```bash
NEXT_PUBLIC_STRIPE_WEEKLY_PRICE_ID=price_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
```

### How to Update on Vercel:

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Update or add:
   - `NEXT_PUBLIC_STRIPE_WEEKLY_PRICE_ID` → Your new weekly price ID
   - `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID` → Your new monthly price ID
5. Click **Save**
6. **Redeploy** your application

### How to Update Locally (for testing):

If you have a `.env.local` file in your `web/` directory:

```bash
# web/.env.local
NEXT_PUBLIC_STRIPE_WEEKLY_PRICE_ID=price_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
```

---

## Step 6: Update Code (Optional - Remove Hardcoded Price IDs)

The frontend code has fallback price IDs. You should update or remove them:

**File**: `web/pages/subscription.js`

```javascript
const STRIPE_PRICE_IDS = {
  weekly: process.env.NEXT_PUBLIC_STRIPE_WEEKLY_PRICE_ID || 'price_1SU9guD3YrV0maBoMLJYRZmm',  // Remove old fallback
  monthly: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID || 'price_1SU9hUD3YrV0maBoYT3fpGdQ',  // Remove old fallback
};
```

**Recommended**: Remove the fallback values so it only uses environment variables:

```javascript
const STRIPE_PRICE_IDS = {
  weekly: process.env.NEXT_PUBLIC_STRIPE_WEEKLY_PRICE_ID,
  monthly: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID,
};
```

---

## Step 7: Test the Integration

### Test Mode (Recommended First)

1. **Use Test Mode in Stripe Dashboard**
   - Toggle to "Test mode" in Stripe Dashboard
   - Use test API keys (start with `sk_test_` and `pk_test_`)

2. **Test Cards**:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - Use any future expiry date (e.g., `12/34`) and any CVC (e.g., `123`)

3. **Test Flow**:
   - Go to your app's `/subscription` page
   - Click "Upgrade now" on Weekly or Monthly plan
   - Complete checkout with test card `4242 4242 4242 4242`
   - Verify you're redirected back with `?success=true`
   - Check Stripe Dashboard → **Customers** to see the customer was created
   - Check Stripe Dashboard → **Subscriptions** to see the subscription

4. **Test Webhooks Locally** (Optional):
   ```bash
   # Install Stripe CLI: https://stripe.com/docs/stripe-cli
   stripe listen --forward-to http://localhost:8000/api/v1/webhooks/stripe
   ```
   - This forwards webhook events to your local server
   - Trigger test events: `stripe trigger checkout.session.completed`

### Production Mode

1. **Switch to Live Mode in Stripe Dashboard**
2. **Update environment variables** with live keys
3. **Test with a real payment method** (you can refund it immediately)
4. **Verify webhook events** in Stripe Dashboard → **Webhooks** → **Events**

---

## Step 8: Verify Everything Works

### Checklist:

- [ ] New Stripe account API keys are set in backend
- [ ] New webhook secret is set in backend
- [ ] New price IDs are set in frontend
- [ ] Webhook endpoint is configured in Stripe Dashboard
- [ ] Test subscription flow works end-to-end
- [ ] Webhook events are being received (check Stripe Dashboard → Webhooks → Events)
- [ ] Subscription status updates correctly after payment

---

## Troubleshooting

### "Payment processing not configured"
- ✅ Check `STRIPE_SECRET_KEY` is set in backend environment
- ✅ Verify the key starts with `sk_test_` or `sk_live_`
- ✅ Make sure backend service was redeployed after updating env vars

### "Invalid price ID" or "No such price"
- ✅ Verify price IDs are correct in frontend environment variables
- ✅ Check that prices are in the same Stripe mode (test/live) as your keys
- ✅ Ensure prices exist in your new Stripe account

### Webhook not receiving events
- ✅ Verify webhook endpoint URL is correct in Stripe Dashboard
- ✅ Check `STRIPE_WEBHOOK_SECRET` is set in backend
- ✅ Verify webhook events are enabled in Stripe Dashboard
- ✅ Check backend logs for webhook processing errors
- ✅ Ensure webhook endpoint is accessible (not behind firewall)

### Subscription not updating after payment
- ✅ Check webhook logs in Stripe Dashboard → Webhooks → Events
- ✅ Verify webhook endpoint URL matches your API URL
- ✅ Check backend logs for webhook processing errors
- ✅ Ensure user email matches Stripe customer email

### Old subscriptions still showing
- ✅ Old subscriptions are tied to the old Stripe account
- ✅ Users need to cancel old subscriptions in old Stripe account
- ✅ New subscriptions will be created in new Stripe account
- ✅ Consider migrating existing customers (see Migration section below)

---

## Migration from Old Stripe Account

If you have existing subscribers, you'll need to handle migration:

### Option 1: Let Subscriptions Expire Naturally
- Existing subscriptions continue in old account until they expire
- New subscriptions go to new account
- Users can resubscribe in new account after expiration

### Option 2: Manual Migration
1. Export customer list from old Stripe account
2. Create customers in new Stripe account
3. Manually create subscriptions for migrated customers
4. Update your database to link users to new Stripe customer IDs

### Option 3: Dual Account Period
- Keep both accounts active temporarily
- Handle webhooks from both accounts
- Gradually migrate customers

---

## Security Reminders

- ⚠️ **Never commit** API keys or secrets to git
- ✅ Use environment variables for all sensitive data
- ✅ Use test mode for development
- ✅ Verify webhook signatures (already implemented in code)
- ✅ Use HTTPS in production
- ✅ Regularly rotate API keys

---

## Quick Reference: Environment Variables Summary

### Backend (Render/API Server):
```bash
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
FRONTEND_URL=https://careerpilotconsulting.com
```

### Frontend (Vercel/Next.js):
```bash
NEXT_PUBLIC_STRIPE_WEEKLY_PRICE_ID=price_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
```

---

## Need Help?

- **Stripe Documentation**: [https://stripe.com/docs](https://stripe.com/docs)
- **Stripe Support**: [https://support.stripe.com](https://support.stripe.com)
- **Check your code**: See `STRIPE_SETUP.md` for original setup details

---

## Next Steps After Switching

1. ✅ Test thoroughly in test mode
2. ✅ Switch to live mode when ready
3. ✅ Monitor webhook events for first few days
4. ✅ Set up Stripe Dashboard alerts for failed payments
5. ✅ Consider setting up Stripe Customer Portal for self-service management

