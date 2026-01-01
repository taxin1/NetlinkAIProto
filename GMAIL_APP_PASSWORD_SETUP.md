# Gmail App Password Setup Guide

## ❌ Current Error
\`\`\`
Invalid login: 535-5.7.8 Username and Password not accepted
\`\`\`

**Reason**: The Gmail App Password in `.env.local` is either:
- Invalid or expired
- Incorrectly formatted
- From a different Google account
- 2FA is not enabled on the Gmail account

## ✅ How to Fix

### Step 1: Enable 2-Factor Authentication (Required)

Gmail App Passwords **only work** if 2FA is enabled.

1. Go to https://myaccount.google.com/security
2. Sign in with: **cognisorai@gmail.com**
3. Find **"2-Step Verification"**
4. Click **"Get Started"**
5. Follow the steps to enable 2FA
6. ✅ **Confirm 2FA is enabled** (you'll see a checkmark)

### Step 2: Generate Gmail App Password

1. Go to https://myaccount.google.com/apppasswords
   - Or: Google Account → Security → 2-Step Verification → App passwords

2. You might need to sign in again

3. **Select app**: Choose "Mail" or "Other (Custom name)"
   - If "Other", type: "Netlink" or "SMTP App"

4. **Select device**: Choose "Other (Custom name)"
   - Type: "Netlink Server" or "Node.js App"

5. Click **"Generate"**

6. Google will show you a **16-character password** like:
   \`\`\`
   abcd efgh ijkl mnop
   \`\`\`

7. ✅ **Copy this password immediately** (you won't see it again!)

### Step 3: Update Your .env.local File

**Current (in your .env.local):**
\`\`\`
GMAIL_USER=cognisorai@gmail.com
GMAIL_APP_PASSWORD=qffz djsz byrw dkdo
\`\`\`

**Update the App Password with the new one:**

1. Open `.env.local`
2. Replace the `GMAIL_APP_PASSWORD` value with your new password
3. **Remove spaces** from the password (use it as one string):
   \`\`\`
   # If Google gives you: abcd efgh ijkl mnop
   # Use it as: abcdefghijklmnop
   
   GMAIL_APP_PASSWORD=abcdefghijklmnop
   \`\`\`

**Example:**
\`\`\`env
GMAIL_USER=cognisorai@gmail.com
GMAIL_APP_PASSWORD=yourNewAppPasswordHere
\`\`\`

### Step 4: Restart Your Development Server

\`\`\`powershell
# Stop the current server (Ctrl+C)
# Then restart:
pnpm dev
\`\`\`

### Step 5: Test Email Sending

1. Go to your app at http://localhost:3000
2. Navigate to Contacts
3. Try sending a test email
4. Should work now! ✅

## 🔍 Troubleshooting

### Error: "2-Step Verification not enabled"
- You MUST enable 2FA first
- App Passwords don't work without 2FA

### Error: "App Passwords option not showing"
Two possibilities:
1. **2FA not enabled** - Enable it first
2. **Google Workspace account** - Your admin needs to enable it

### Error: "Invalid credentials" still appearing
- Make sure there are NO spaces in the password
- Make sure you copied the entire password
- Try generating a new App Password

### Need to use a different Gmail account?
Update both values in `.env.local`:
\`\`\`env
GMAIL_USER=your-other-email@gmail.com
GMAIL_APP_PASSWORD=new-app-password-here
\`\`\`

## 📋 Quick Checklist

Before testing:
- [ ] 2FA is enabled on Gmail account
- [ ] App Password generated successfully
- [ ] Password copied correctly (no spaces)
- [ ] `.env.local` updated with new password
- [ ] Development server restarted
- [ ] Browser cache cleared (optional)

## 🎯 Alternative: Using a Different Email Provider

If Gmail is not working, you can use other providers:

### **Option 1: Outlook/Hotmail**
\`\`\`env
GMAIL_USER=your-email@outlook.com
GMAIL_APP_PASSWORD=your-outlook-app-password
\`\`\`
Update `route.ts`:
\`\`\`typescript
const smtpHost = 'smtp-mail.outlook.com'
const smtpPort = 587
\`\`\`

### **Option 2: Yahoo Mail**
\`\`\`env
GMAIL_USER=your-email@yahoo.com
GMAIL_APP_PASSWORD=your-yahoo-app-password
\`\`\`
Update `route.ts`:
\`\`\`typescript
const smtpHost = 'smtp.mail.yahoo.com'
const smtpPort = 587
\`\`\`

### **Option 3: Custom SMTP**
Use your own SMTP server - update both `.env.local` and the database `user_email_settings` table.

## 🔐 Security Notes

1. **Never commit `.env.local`** to Git (it's in .gitignore)
2. **App Password = Full Account Access** - Keep it secret
3. **Revoke old passwords** - Remove unused App Passwords from Google
4. **One password per app** - Generate separate passwords for different apps

## 📧 Gmail Sending Limits

- **Free Gmail**: 500 emails/day
- **Google Workspace**: 2,000 emails/day
- **Recommended**: Don't exceed 100-200 emails/hour

## 🆘 Still Having Issues?

If you continue to have problems:

1. **Check Gmail Activity**: https://myaccount.google.com/notifications
   - See if Google blocked the login attempt
   - You may need to "Allow" the app

2. **Check Gmail Filters**: 
   - Make sure email isn't being blocked
   - Check spam folder

3. **Try a different email**:
   - Create a new Gmail account specifically for sending
   - Generate App Password for that account

4. **Use Netlink's email settings**:
   - Go to Dashboard → Settings → Email Configuration
   - Configure SMTP settings there

---

**Current Status**: 
- Email: cognisorai@gmail.com
- Password: Need to generate new App Password
- Action Required: Follow Steps 1-4 above
