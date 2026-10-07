# Email Sending Feature - Complete Guide

## ✅ What's Been Added

### 1. **Send Email API** (`/app/api/send-email/route.ts`)
- Uses Gmail SMTP configuration from `.env.local`
- Supports custom email settings per user from database
- Updates email status to "sent" after successful delivery
- Includes proper error handling

### 2. **Enhanced Compose Dialog** (`components/compose-email-dialog.tsx`)
Now includes **TWO** buttons:
- **"Save Draft"** - Saves email without sending
- **"Send Email"** - Sends email immediately via SMTP

### 3. **Email List with Send Button** (`components/emails-list.tsx`)
- Draft emails now show a **"Send Now"** button
- Can send saved drafts directly from the email list
- Shows loading state while sending

### 4. **Database Migration** (`scripts/007_add_sent_at_to_emails.sql`)
- Adds `sent_at` timestamp column to track when emails are sent

## 🚀 How to Use

### For Users:

#### **Composing and Sending:**
1. Go to **Dashboard → Contacts**
2. Click on a contact
3. Click **"Compose Email"**
4. Fill in subject and body (or use AI to generate)
5. Choose:
   - **"Save Draft"** - Save for later
   - **"Send Email"** - Send immediately ✉️

#### **Sending Saved Drafts:**
1. Go to **Dashboard → Emails**
2. Find any email with status "draft"
3. Click **"Send Now"** button at the bottom
4. Email will be sent immediately

### For Setup:

#### **Email Configuration (Already Done):**
Your `.env.local` has:
\`\`\`
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-app-password
\`\`\`

This uses Gmail's SMTP server to send emails.

#### **Run Database Migration:**
You need to add the `sent_at` column to your database:

1. Go to Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run the script from `scripts/007_add_sent_at_to_emails.sql`

Or copy-paste this:
\`\`\`sql
ALTER TABLE public.emails 
ADD COLUMN IF NOT EXISTS sent_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS emails_sent_at_idx ON public.emails(sent_at);
\`\`\`

## 📧 Email Statuses

- **draft** - Email saved but not sent (shows "Send Now" button)
- **sending** - Email is being sent (temporary status)
- **sent** - Email successfully delivered (shows green badge)

## 🔧 Technical Details

### SMTP Configuration:
\`\`\`
Host: smtp.gmail.com
Port: 587
Security: TLS
From: your-email@gmail.com
\`\`\`

### API Endpoint:
\`\`\`
POST /api/send-email
Body: {
  emailId: string,
  contactEmail: string,
  subject: string,
  body: string
}
\`\`\`

### Response:
\`\`\`json
{
  "success": true,
  "message": "Email sent successfully"
}
\`\`\`

## ⚠️ Important Notes

1. **Gmail App Password**: The password in `.env.local` is a Gmail App Password (not your regular password)

2. **Daily Limits**: Gmail has sending limits:
   - Free Gmail: ~500 emails/day
   - Google Workspace: ~2,000 emails/day

3. **Error Messages**: If sending fails, check:
   - Email configuration in `.env.local`
   - Contact has a valid email address
   - Gmail App Password is correct
   - Internet connection

4. **Custom Email Settings**: Users can configure their own SMTP settings in:
   - Dashboard → Settings → Email Configuration

## 🎯 Features

✅ **Compose and Send** - Write and send emails directly
✅ **AI Generation** - Generate personalized emails with AI
✅ **Save Drafts** - Save emails for later
✅ **Send Drafts** - Send saved drafts anytime
✅ **Email Tracking** - See status of all emails
✅ **Event Logging** - Track all email activities
✅ **Error Handling** - Clear error messages
✅ **Loading States** - Visual feedback during sending

## 🔐 Security

- ✅ User authentication required
- ✅ Users can only send from their configured email
- ✅ Email credentials stored securely
- ✅ API routes protected

## 📊 Next Steps

Want to enhance the email feature? Consider adding:
- Email templates
- Scheduled sending
- Email open tracking
- Reply detection
- Attachment support
- HTML email editor

---

**Status**: ✅ Email sending fully functional
**Dependencies**: nodemailer installed
**Configuration**: Gmail SMTP configured
