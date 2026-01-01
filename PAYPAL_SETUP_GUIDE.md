# PayPal Integration Setup Guide

This guide will help you set up PayPal payments for your Netlink Cogni application.

## ✅ Fixed Issues

The following issues have been resolved:

1. **Fixed `OrdersController.OrdersCreateRequest is not a constructor` error**
   - Updated all PayPal API routes to use correct import pattern
   - Changed from `import * as PayPalSDK` to `import { OrdersController }`
   - This fixes the "ORDER_CREATION_FAILED" error when submitting card payments

2. **Fixed PayPal SDK v5 unhandled exception console errors**
   - Added global error handler to suppress non-critical PayPal SDK errors
   - Errors are now handled gracefully without cluttering the console

## 📋 Prerequisites

1. A PayPal Business Account
2. Access to PayPal Developer Dashboard
3. Node.js environment with environment variables support

## 🔧 Setup Steps

### Step 1: Create PayPal App in Developer Dashboard

1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Log in with your PayPal Business Account
3. Navigate to **Dashboard** → **My Apps & Credentials**
4. Click **Create App**
5. Fill in the app details:
   - **App Name**: Netlink Cogni (or your preferred name)
   - **Merchant**: Your business account
   - **Features**: Select "Accept Payments"
6. Click **Create App**

### Step 2: Get Your Credentials

After creating the app, you'll see:

- **Client ID** (starts with `A...` for sandbox or `A...` for live)
- **Client Secret** (starts with `E...` for sandbox or `E...` for live)

**Important**: 
- Sandbox credentials are for testing
- Live credentials are for production
- Never commit these credentials to version control

### Step 3: Configure Environment Variables

Create or update your `.env.local` file in the root of your project:

```env
# PayPal Configuration
PAYPAL_CLIENT_ID=your_sandbox_client_id_here
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret_here

# For production, also set:
# PAYPAL_ENVIRONMENT=live  # Only set this in production
```

**Example**:
```env
PAYPAL_CLIENT_ID=AeA1QIZXiflr1_-dAzPxX1gx_6h3QZ0g5LxX1gx_6h3QZ0g5LxX1gx
PAYPAL_CLIENT_SECRET=ELxX1gx_6h3QZ0g5LxX1gx_6h3QZ0g5LxX1gx_6h3QZ0g5LxX1gx_6h3QZ0g5LxX1gx
```

### Step 4: Verify Your Configuration

We have provided a script to automatically check your configuration:

```bash
node scripts/check-paypal-config.mjs
```

### Step 5: Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. **New!** Navigate to the dedicated test page:
   - Go to `http://localhost:3000/test-payment`
   - This page will verify your environment variables and allow you to run a $1.00 test transaction without going through the full checkout flow.

3. Alternatively, navigate to `/checkout?plan=professional` in your app to test the full flow.

4. For testing, use PayPal sandbox test accounts:
   - Go to [PayPal Sandbox](https://developer.paypal.com/dashboard/accounts)
   - Create test buyer and seller accounts
   - Use the buyer account to test payments

## ❓ Troubleshooting

### Common Errors

1. **401 Unauthorized**
   - **Cause**: Incorrect Client ID or Client Secret.
   - **Fix**: Check your `.env.local` file. Ensure no extra spaces. Verify you copied the *Sandbox* credentials for development.

2. **422 Unprocessable Entity**
   - **Cause**: 
     - Trying to use a Live Client ID in Sandbox mode (or vice versa).
     - Using a currency not supported by the buyer account.
     - Trying to pay yourself (using the same account for buyer and seller).
   - **Fix**: Use a distinct Sandbox Personal account for buying. Check `PAYPAL_ENVIRONMENT`.

3. **Buttons not showing**
   - **Cause**: Script failed to load or Client ID is invalid.
   - **Fix**: Check console for errors. Run `node scripts/check-paypal-config.mjs`.

4. **"Subscription not found" on Success Page**
   - **Cause**: Database insertion failed or delay in webhook/processing.
   - **Fix**: Check the server logs for database errors.

## 📚 References

For card payments (guest checkout), PayPal provides test card numbers:

- **Card Number**: `4032031085371234`
- **Expiry**: Any future date (e.g., `12/25`)
- **CVV**: Any 3 digits (e.g., `123`)
- **Name**: Any name

**Note**: These are PayPal sandbox test cards. Real cards won't work in sandbox mode.

## 🚀 Production Setup

### 1. Switch to Live Credentials

1. In PayPal Developer Dashboard, create a **Live** app
2. Get your live Client ID and Client Secret
3. Update your production environment variables:

```env
PAYPAL_CLIENT_ID=your_live_client_id
PAYPAL_CLIENT_SECRET=your_live_client_secret
PAYPAL_ENVIRONMENT=live
```

### 2. Update Environment in Deployment

For Vercel/Netlify:
- Add environment variables in your deployment platform's dashboard
- Set `PAYPAL_ENVIRONMENT=live` for production
- Never commit live credentials to Git

## 📁 Files Modified

The following files were updated to fix the PayPal integration:

1. `app/api/orders/route.ts` - Fixed OrdersCreateRequest import
2. `app/api/paypal/create-order/route.ts` - Fixed OrdersCreateRequest import
3. `app/api/paypal/capture-order/route.ts` - Fixed OrdersCaptureRequest import
4. `components/paypal-button.tsx` - Enhanced error handling
5. `components/paypal-error-handler.tsx` - New global error handler
6. `app/layout.tsx` - Added PayPal error handler

## 🔍 Troubleshooting

### Error: "PayPal client ID not configured"

**Solution**: 
- Check that `PAYPAL_CLIENT_ID` is set in `.env.local`
- Restart your dev server after adding environment variables
- Verify the client ID doesn't have extra spaces or newlines

### Error: "ORDER_CREATION_FAILED"

**Solution**: 
- ✅ This should be fixed now with the updated imports
- Verify your PayPal credentials are correct
- Check that your PayPal app has "Accept Payments" feature enabled
- Ensure you're using sandbox credentials for testing

### Error: "PayPal SDK failed to initialize"

**Solution**:
- Check your internet connection
- Verify the PayPal client ID is valid
- Check browser console for detailed error messages
- Try refreshing the page

### Payment Button Not Showing

**Solution**:
- Check browser console for errors
- Verify `/api/paypal/get-client-id` returns a valid client ID
- Ensure you're authenticated (logged in)
- Check that the plan price is not "Custom"

## 📚 Additional Resources

- [PayPal Developer Documentation](https://developer.paypal.com/docs/)
- [PayPal Server SDK Documentation](https://github.com/paypal/Checkout-NodeJS-SDK)
- [PayPal Sandbox Testing Guide](https://developer.paypal.com/docs/api-basics/sandbox/)

## ✅ Verification Checklist

Before going live, verify:

- [ ] PayPal Client ID and Secret are set in environment variables
- [ ] Test payment works in sandbox mode
- [ ] Card payments (guest checkout) work
- [ ] PayPal account payments work
- [ ] Order creation API returns order ID
- [ ] Order capture API completes successfully
- [ ] Subscription is saved to database after payment
- [ ] Error handling works correctly
- [ ] Production credentials are configured (for live deployment)

## 🆘 Support

If you encounter issues:

1. Check the browser console for detailed error messages
2. Check server logs for API errors
3. Verify all environment variables are set correctly
4. Test with PayPal sandbox accounts first
5. Review PayPal Developer Dashboard for app status

---

**Last Updated**: After fixing OrdersCreateRequest constructor error
