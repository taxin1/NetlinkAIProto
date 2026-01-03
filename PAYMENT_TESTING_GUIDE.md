# Payment System Testing Guide

This guide will help you test both PayPal payments and coupon-based free subscriptions.

## Prerequisites

### 1. Environment Variables Setup

Make sure your `.env.local` file has:

\`\`\`env
# PayPal Configuration (Sandbox for testing)
PAYPAL_CLIENT_ID=your_sandbox_client_id
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret
PAYPAL_ENVIRONMENT=sandbox
# Note: NEXT_PUBLIC_PAYPAL_CLIENT_ID is NOT needed - client ID is fetched from server for security

# Site URL (for PayPal redirects)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
\`\`\`

### 2. Database Setup

Run these SQL scripts in your Supabase SQL Editor (in order):

1. ✅ `scripts/006_add_subscriptions.sql` - Creates subscriptions table
2. ✅ `scripts/007_add_coupons.sql` - Creates coupons table and seeds NETLINKFREE coupon

### 3. PayPal Sandbox Account Setup

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Log in with your PayPal account
3. Navigate to **Dashboard** → **Sandbox** → **Accounts**
4. Create test accounts:
   - **Business Account** (Seller) - Already exists (your app credentials)
   - **Personal Account** (Buyer) - Click "Create Account" to create test buyer

## Testing Scenarios

## Test 1: PayPal Payment Flow (Regular Checkout)

### Step 1: Start Your Development Server

\`\`\`bash
pnpm dev
\`\`\`

### Step 2: Create Test User Account

1. Go to `http://localhost:3000/auth/signup`
2. Create a new user account
3. Log in with that account

### Step 3: Navigate to Checkout

1. Go to `http://localhost:3000/pricing`
2. Click **"Subscribe with PayPal"** on the Professional plan
3. You'll be redirected to `/checkout?plan=professional`

### Step 4: Complete PayPal Payment

1. Click **"Pay with PayPal"** button
2. You'll be redirected to PayPal Sandbox
3. Use PayPal Sandbox test credentials:
   - **Login with Personal Account** (buyer account you created)
   - Or use **Guest Checkout** with test card:
     - Card: `4032034816845847`
     - Expiry: Any future date (e.g., `12/25`)
     - CVV: `123`
     - Name: Any name
4. Complete the payment on PayPal
5. You'll be redirected back to `/checkout/success`

### Expected Results:

✅ Subscription created in database  
✅ Status: `active`  
✅ `paypal_order_id` populated  
✅ Amount: `15.00`  
✅ `expires_at` set to 1 month from now

### Verify in Database:

\`\`\`sql
-- Check subscription was created
SELECT * FROM subscriptions 
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 1;
\`\`\`

---

## Test 2: Coupon-Based Free Subscription (NETLINKFREE)

### Step 1: Navigate to Checkout

1. Go to `http://localhost:3000/checkout?plan=professional`
2. Make sure you're logged in

### Step 2: Apply Coupon

1. In the "Have a coupon code?" section
2. Enter: `NETLINKFREE`
3. Click **"Apply"** button

### Expected Behavior:

✅ Coupon validates successfully  
✅ Shows: "1 month free" in green  
✅ Total changes to: `$0` (with line-through on $15)  
✅ Button changes to: **"Activate Free 1 Month"** (green button)  
✅ No PayPal redirect needed

### Step 3: Activate Free Subscription

1. Click **"Activate Free 1 Month"** button
2. You'll be redirected to `/checkout/success?orderId=free&coupon=NETLINKFREE`

### Expected Results:

✅ Subscription created in database  
✅ Status: `active`  
✅ Amount: `0.00`  
✅ `coupon_id` populated  
✅ `expires_at` set to **2 months** from now (1 regular + 1 free)  
✅ Coupon use recorded in `coupon_uses` table

### Verify in Database:

\`\`\`sql
-- Check subscription
SELECT s.*, c.code as coupon_code 
FROM subscriptions s
LEFT JOIN coupons c ON s.coupon_id = c.id
WHERE s.user_id = 'your-user-id'
ORDER BY s.created_at DESC
LIMIT 1;

-- Check coupon usage
SELECT * FROM coupon_uses 
WHERE user_id = 'your-user-id';

-- Check coupon usage count
SELECT code, current_uses, max_uses 
FROM coupons 
WHERE code = 'NETLINKFREE';
\`\`\`

---

## Test 3: Coupon Validation Edge Cases

### Test 3.1: Invalid Coupon Code

1. Enter: `INVALIDCODE`
2. Click "Apply"
3. **Expected**: Error message: "Invalid or expired coupon code"

### Test 3.2: Already Used Coupon

1. Use `NETLINKFREE` coupon (from Test 2)
2. Try to use it again with the same user
3. **Expected**: Error message: "You have already used this coupon"

### Test 3.3: Case Insensitive Coupon

1. Enter: `netlinkfree` (lowercase)
2. Click "Apply"
3. **Expected**: Should work (code is converted to uppercase)

### Test 3.4: Remove Coupon

1. Apply a coupon
2. Click "Remove" button
3. **Expected**: Coupon removed, price back to $15, PayPal button returns

---

## Test 4: Payment Failure Scenarios

### Test 4.1: Cancel PayPal Payment

1. Go to checkout
2. Click "Pay with PayPal"
3. On PayPal page, click "Cancel" or close the window
4. **Expected**: Redirected back to checkout with error or back to checkout page

### Test 4.2: Network Error During Payment

1. Disconnect internet after clicking "Pay with PayPal"
2. **Expected**: Error handling (will vary based on PayPal response)

---

## Debugging & Troubleshooting

### Issue: PayPal redirect not working

**Check:**
- `NEXT_PUBLIC_SITE_URL` is set correctly in `.env.local`
- PayPal credentials are correct (sandbox credentials)
- Browser console for errors

**Solution:**
\`\`\`bash
# Restart dev server after changing env variables
pnpm dev
\`\`\`

### Issue: "PayPal credentials not configured" error

**Check:**
- `.env.local` file exists
- `PAYPAL_CLIENT_ID` and `PAYPAL_CLIENT_SECRET` are set
- No typos in variable names

**Solution:**
\`\`\`env
PAYPAL_CLIENT_ID=your_actual_client_id
PAYPAL_CLIENT_SECRET=your_actual_secret
PAYPAL_ENVIRONMENT=sandbox
\`\`\`

### Issue: Subscription not created

**Check:**
- Database migrations ran successfully
- `subscriptions` table exists
- User is authenticated (check browser console)
- Check server logs for errors

**Debug Query:**
\`\`\`sql
-- Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'subscriptions';

-- Check RLS policies
SELECT * FROM pg_policies 
WHERE tablename = 'subscriptions';
\`\`\`

### Issue: Coupon validation fails

**Check:**
- `coupons` table exists
- `NETLINKFREE` coupon is seeded
- Check browser network tab for API response
- Check server logs

**Debug Query:**
\`\`\`sql
-- Check coupon exists
SELECT * FROM coupons WHERE code = 'NETLINKFREE';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'coupons';
\`\`\`

### Issue: Free subscription not activating

**Check:**
- User is authenticated
- Coupon is valid and applied
- Check browser console for errors
- Check network tab for API response
- Verify `/api/subscriptions/create-free` endpoint

---

## Testing Checklist

### PayPal Payment Flow
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] User can navigate to checkout
- [ ] PayPal button appears
- [ ] Redirects to PayPal sandbox
- [ ] Can complete payment (with PayPal account or guest)
- [ ] Redirects back to success page
- [ ] Subscription created in database
- [ ] Subscription details show correctly

### Coupon Flow
- [ ] Coupon input field appears
- [ ] Can enter coupon code
- [ ] Valid coupon applies successfully
- [ ] Invalid coupon shows error
- [ ] Applied coupon shows discount
- [ ] Free checkout button appears for free coupons
- [ ] Free subscription activates without PayPal
- [ ] Success page shows coupon information
- [ ] Coupon usage tracked in database
- [ ] Cannot reuse same coupon

### Edge Cases
- [ ] Case insensitive coupon codes
- [ ] Already used coupon rejection
- [ ] Remove coupon functionality
- [ ] PayPal payment cancellation
- [ ] Network errors handled gracefully

---

## Quick Test Commands

### Check Environment Variables

\`\`\`bash
# Windows PowerShell
$env:PAYPAL_CLIENT_ID
$env:PAYPAL_CLIENT_SECRET

# Linux/Mac
echo $PAYPAL_CLIENT_ID
echo $PAYPAL_CLIENT_SECRET
\`\`\`

### Check Database Tables

\`\`\`sql
-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check subscriptions
SELECT COUNT(*) FROM subscriptions;

-- Check coupons
SELECT code, active, current_uses, max_uses FROM coupons;
\`\`\`

---

## Production Testing

When ready for production:

1. **Change Environment Variables:**
   \`\`\`env
   PAYPAL_ENVIRONMENT=live
   PAYPAL_CLIENT_ID=your_live_client_id
   PAYPAL_CLIENT_SECRET=your_live_client_secret
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   \`\`\`

2. **Test with Real PayPal Account:**
   - Use a small test amount first
   - Verify webhook handling (if implemented)
   - Monitor PayPal dashboard for transactions

3. **Test Coupon System:**
   - Create production coupon codes
   - Test with real users
   - Monitor coupon usage

---

## Support Resources

- **PayPal Developer Docs:** https://developer.paypal.com/docs/
- **PayPal Sandbox:** https://developer.paypal.com/dashboard/
- **Supabase Docs:** https://supabase.com/docs
