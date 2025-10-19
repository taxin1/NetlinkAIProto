# Quick Start: User Email Configuration

## 🚀 Getting Started in 3 Steps

### Step 1: Run Database Migration (Required)
You need to create the database table first. Choose one method:

**Option A: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the sidebar
3. Click "New Query"
4. Copy the entire contents of `scripts/006_add_user_email_settings.sql`
5. Paste and click "Run"

**Option B: Using Supabase CLI**
```bash
supabase db push
```

### Step 2: Configure Your Email
1. Start/restart your development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

2. Log in to your application
3. Click "Settings" in the sidebar (new!)
4. Fill in your email configuration:

   **For Gmail users:**
   - Go to https://myaccount.google.com/apppasswords
   - Create an App Password
   - Use that password (not your regular Gmail password)

   **For Outlook users:**
   - Use your regular email and password

5. Click "Save Settings"
6. Click "Test Email" to verify it works

### Step 3: Start Sending Emails!
That's it! Now when you:
- Use the AI Email Agent
- Send campaign emails
- Compose emails to contacts

...all emails will be sent from YOUR email address! 🎉

## 📋 Gmail App Password Setup (Most Common)

1. **Enable 2-Step Verification**
   - Go to: https://myaccount.google.com/security
   - Find "2-Step Verification" and turn it on
   - Follow the prompts

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" as the app
   - Select "Other" as the device and name it "Netlink Cogni"
   - Click "Generate"
   - Copy the 16-character password (remove spaces)

3. **Configure in Settings**
   - Email Provider: Gmail
   - Email Address: your.email@gmail.com
   - App Password: [paste the 16-character password]
   - From Name: Your Name (optional)
   - Click "Save Settings"

## ✅ Verification

To verify everything works:
1. ✅ Settings page loads without errors
2. ✅ You can save your email configuration
3. ✅ Test email arrives in your inbox
4. ✅ AI Email Agent campaigns send from your email

## 🔒 Security Notes

- Your password is stored in the database (consider encryption for production)
- Each user can only see/modify their own settings (RLS enabled)
- Use App Passwords for Gmail (more secure than regular password)
- Passwords are never returned in API responses

## 🎯 What's New?

✨ **New Features:**
- Settings page to configure your email
- Support for Gmail, Outlook, and custom SMTP
- Test email functionality
- Visual feedback for configuration status
- Secure per-user email settings

🔄 **How It Changes Things:**
- **Before**: All emails sent from system email
- **After**: Emails sent from YOUR email address
- **Fallback**: If not configured, uses system email (backward compatible)

## 📖 More Information

- Full documentation: `docs/EMAIL_CONFIGURATION.md`
- Implementation details: `IMPLEMENTATION_SUMMARY.md`
- Troubleshooting: See docs/EMAIL_CONFIGURATION.md

## 🆘 Quick Troubleshooting

**Problem**: Can't access Settings page
- **Fix**: Make sure you ran the database migration

**Problem**: "Invalid login" error
- **Fix**: For Gmail, use App Password (not regular password)
- **Fix**: Make sure 2-Step Verification is enabled

**Problem**: Test email not received
- **Fix**: Check spam folder
- **Fix**: Wait a few minutes (email can be delayed)
- **Fix**: Verify email address is correct

**Problem**: Changes not saving
- **Fix**: Check browser console for errors
- **Fix**: Verify you're logged in
- **Fix**: Check database connection

## 🎊 You're Done!

Your users can now send emails from their own email addresses. Each user can configure their own email independently, making your application truly multi-user friendly!

Enjoy your personalized email sending! 📧

