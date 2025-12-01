# Your Stripe Account Setup - In Progress

## ✅ Step 1: Keys Obtained

You have your Stripe test keys:

**Publishable Key:**
```
pk_test_51SZe9gLnMLXIe10a... (your full key)
```

**Secret Key:**
```
sk_test_51SZe9gLnMLXIe10a... (your full key)
```

> ⚠️ **Security Note**: Your actual keys are stored locally. Never commit them to git!

> **Note:** The publishable key is not currently needed since we use Stripe Checkout (redirect-based). Only the secret key is used in the backend.

---

## 🔧 Step 2: Update Backend Environment Variables

### On Render (Your API Backend):

1. Go to your Render dashboard
2. Select your API service
3. Go to **Environment** tab
4. Add or update:
   ```
   STRIPE_SECRET_KEY=sk_test_51SZe9gLnMLXIe10a... (your full secret key)
   ```
5. Click **Save Changes**
6. **Redeploy** your service

### For Local Testing (Optional):

If you have a `.env` file in your project root:
```bash
STRIPE_SECRET_KEY=sk_test_51SZe9gLnMLXIe10a... (your full secret key)
```

---

## 📦 Step 3: Create Products in Stripe Dashboard

You need to create two subscription products and get their Price IDs.

### Create Weekly Plan:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/products)
2. Click **Add product**
3. Fill in:
   - **Name**: `Weekly Premium`
   - **Description**: `Weekly subscription for unlimited generations`
   - **Pricing**:
     - Select **Recurring**
     - **Price**: `9.99`
     - **Currency**: `USD`
     - **Billing period**: `Weekly`
   - Click **Save product**
4. **Copy the Price ID** (starts with `price_`)
   - It will look like: `price_1ABC123xyz...`
   - ⚠️ **Save this - you'll need it for the frontend!**

### Create Monthly Plan:

1. Click **Add product** again
2. Fill in:
   - **Name**: `Monthly Premium`
   - **Description**: `Monthly subscription for unlimited generations`
   - **Pricing**:
     - Select **Recurring**
     - **Price**: `27.99`
     - **Currency**: `USD`
     - **Billing period**: `Monthly`
   - Click **Save product**
3. **Copy the Price ID** (starts with `price_`)
   - ⚠️ **Save this - you'll need it for the frontend!**

---

## 🔗 Step 4: Set Up Webhook Endpoint

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **Add endpoint**
3. **Endpoint URL**: 
   ```
   https://api.careerpilotconsulting.com/api/v1/webhooks/stripe
   ```
   (Replace with your actual API URL if different)
4. **Description**: `CareerPilot Subscription Webhooks`
5. **Events to send**: Select these events:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_failed`
6. Click **Add endpoint**
7. **Copy the Signing secret** (starts with `whsec_`)
   - It will look like: `whsec_1234567890abcdef...`
   - ⚠️ **Save this - you'll need it for the backend!**

### Update Backend with Webhook Secret:

On Render, add this environment variable:
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```
(Replace with your actual webhook secret)

---

## 🎨 Step 5: Update Frontend Environment Variables

### On Vercel (Your Frontend):

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add or update:
   ```
   NEXT_PUBLIC_STRIPE_WEEKLY_PRICE_ID=price_xxxxxxxxxxxxx
   NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
   ```
   (Replace with your actual Price IDs from Step 3)
5. Click **Save**
6. **Redeploy** your application

---

## ✅ Step 6: Test the Integration

### Test Flow:

1. **Make sure you're in Test Mode** in Stripe Dashboard (toggle in top right)
2. Go to your app: `https://careerpilotconsulting.com/subscription`
3. Click **"Upgrade now"** on Weekly or Monthly plan
4. You should be redirected to Stripe Checkout
5. Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)
6. Complete the payment
7. You should be redirected back with `?success=true`
8. Check Stripe Dashboard → **Customers** to see the customer was created
9. Check Stripe Dashboard → **Subscriptions** to see the subscription

### Verify Webhooks:

1. Go to Stripe Dashboard → **Webhooks** → Click on your endpoint
2. Go to **Events** tab
3. You should see events like `checkout.session.completed` after a successful payment

---

## 📋 Checklist Summary

- [x] ✅ Got Stripe test keys
- [ ] ⏳ Update backend `STRIPE_SECRET_KEY` on Render
- [ ] ⏳ Create Weekly product → Get Price ID
- [ ] ⏳ Create Monthly product → Get Price ID
- [ ] ⏳ Set up webhook → Get Webhook Secret
- [ ] ⏳ Update backend `STRIPE_WEBHOOK_SECRET` on Render
- [ ] ⏳ Update frontend `NEXT_PUBLIC_STRIPE_WEEKLY_PRICE_ID` on Vercel
- [ ] ⏳ Update frontend `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID` on Vercel
- [ ] ⏳ Test subscription flow end-to-end
- [ ] ⏳ Verify webhook events are received

---

## 🔍 Where to Find Things

- **Stripe Dashboard**: https://dashboard.stripe.com/test
- **Products**: https://dashboard.stripe.com/test/products
- **Webhooks**: https://dashboard.stripe.com/test/webhooks
- **API Keys**: https://dashboard.stripe.com/test/apikeys
- **Test Cards**: https://stripe.com/docs/testing

---

## 🚨 Important Notes

1. **Test Mode**: You're currently in test mode (keys start with `sk_test_`). This is perfect for testing!
2. **Price IDs**: Must be from the same Stripe account as your keys
3. **Webhook URL**: Must match your actual API URL
4. **Redeploy**: After updating env vars, redeploy both backend and frontend
5. **Going Live**: When ready for production, switch to live mode and get live keys

---

## 🆘 Troubleshooting

### "Payment processing not configured"
- ✅ Check `STRIPE_SECRET_KEY` is set correctly in Render
- ✅ Verify backend was redeployed after updating env vars

### "Invalid price ID"
- ✅ Verify Price IDs are correct in Vercel environment variables
- ✅ Check that prices exist in your Stripe Dashboard

### Webhook not working
- ✅ Verify webhook endpoint URL matches your API URL
- ✅ Check `STRIPE_WEBHOOK_SECRET` is set in Render
- ✅ Check webhook events are enabled in Stripe Dashboard

---

## 📞 Next Steps After Setup

Once everything is working in test mode:

1. ✅ Test thoroughly with test cards
2. ✅ Switch to **Live mode** in Stripe Dashboard when ready
3. ✅ Get live keys and update environment variables
4. ✅ Create live products and prices
5. ✅ Update webhook endpoint for production
6. ✅ Test with a real payment method (you can refund immediately)

---

**Need help?** Check the detailed guide: `STRIPE_ACCOUNT_SWITCH_GUIDE.md`

