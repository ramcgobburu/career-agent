# Quick Steps: Switch Stripe Account

## 🚀 Quick Checklist

### 1. Get New Stripe Keys (5 min)
- [ ] Log into new Stripe account
- [ ] Go to Developers → API keys
- [ ] Copy Secret Key (`sk_test_...` or `sk_live_...`)
- [ ] Copy Publishable Key (`pk_test_...` or `pk_live_...`)

### 2. Create Products (10 min)
- [ ] Create "Weekly Premium" product → $9.99/week → Copy Price ID
- [ ] Create "Monthly Premium" product → $27.99/month → Copy Price ID

### 3. Set Up Webhook (5 min)
- [ ] Go to Developers → Webhooks → Add endpoint
- [ ] URL: `https://api.careerpilotconsulting.com/api/v1/webhooks/stripe`
- [ ] Select events: `checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`
- [ ] Copy Webhook Secret (`whsec_...`)

### 4. Update Backend Env Vars (5 min)
**On Render/Your Backend Host:**
- [ ] `STRIPE_SECRET_KEY` = Your new secret key
- [ ] `STRIPE_WEBHOOK_SECRET` = Your new webhook secret
- [ ] Redeploy backend

### 5. Update Frontend Env Vars (5 min)
**On Vercel/Your Frontend Host:**
- [ ] `NEXT_PUBLIC_STRIPE_WEEKLY_PRICE_ID` = Weekly price ID
- [ ] `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID` = Monthly price ID
- [ ] Redeploy frontend

### 6. Test (10 min)
- [ ] Use test mode in Stripe
- [ ] Go to `/subscription` page
- [ ] Click "Upgrade now"
- [ ] Use test card: `4242 4242 4242 4242`
- [ ] Verify subscription created in Stripe Dashboard

---

## 📝 Environment Variables Summary

### Backend:
```bash
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
FRONTEND_URL=https://careerpilotconsulting.com
```

### Frontend:
```bash
NEXT_PUBLIC_STRIPE_WEEKLY_PRICE_ID=price_xxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID=price_xxxxxxxxxxxxx
```

---

## 🔍 Where to Find Things

- **Stripe Dashboard**: https://dashboard.stripe.com
- **API Keys**: Developers → API keys
- **Products**: Products → Add product
- **Webhooks**: Developers → Webhooks
- **Test Cards**: https://stripe.com/docs/testing

---

## ⚠️ Important Notes

1. **Test Mode First**: Always test in test mode before going live
2. **Test Card**: Use `4242 4242 4242 4242` for testing
3. **Redeploy**: After updating env vars, redeploy both backend and frontend
4. **Webhook URL**: Must match your actual API URL
5. **Price IDs**: Must be from the same Stripe account as your keys

---

For detailed instructions, see `STRIPE_ACCOUNT_SWITCH_GUIDE.md`

