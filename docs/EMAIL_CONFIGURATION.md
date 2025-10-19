# User Email Configuration Guide

This guide explains how to configure and use your own email account for sending emails through Netlink Cogni's AI Email Agent.

## Overview

Users can now configure their own email accounts to send emails instead of using the built-in system email. This allows for:

- **Personalized sender address**: Emails come from your own email address
- **Multiple email providers**: Support for Gmail, Outlook, and custom SMTP
- **Secure credential storage**: Your email credentials are stored securely in the database
- **Fallback support**: System falls back to built-in email if user hasn't configured their own

## Supported Email Providers

### 1. Gmail
- **Provider**: Gmail
- **Requirement**: Google Account with 2-Step Verification enabled
- **Authentication**: App Password (not your regular Gmail password)

### 2. Outlook
- **Provider**: Outlook/Hotmail
- **Requirement**: Microsoft Account
- **Authentication**: Regular account password

### 3. Custom SMTP
- **Provider**: Any custom SMTP server
- **Requirement**: SMTP server credentials
- **Configuration**: Host, port, secure flag

## How to Configure Your Email

### Step 1: Access Settings
1. Log in to your Netlink Cogni account
2. Navigate to **Dashboard** → **Settings** in the sidebar

### Step 2: Choose Email Provider

#### For Gmail:
1. Select "Gmail" as your email provider
2. **Important**: You need to create an App Password:
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Enable 2-Step Verification if not already enabled
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Generate an App Password for "Mail"
   - Copy the generated 16-character password

#### For Outlook:
1. Select "Outlook" as your email provider
2. Use your regular Outlook/Hotmail email and password

#### For Custom SMTP:
1. Select "Custom SMTP" as your email provider
2. Fill in the following details:
   - **SMTP Host**: Your mail server hostname (e.g., smtp.example.com)
   - **SMTP Port**: Usually 587 for TLS or 465 for SSL
   - **Use SSL/TLS**: Check if your server requires secure connection

### Step 3: Enter Your Details
1. **Email Address**: Your full email address
2. **Password/App Password**: Your email password or App Password
3. **From Name** (Optional): The display name for your emails
   - Example: "John Doe" or "Acme Corp Sales"

### Step 4: Save and Test
1. Click **Save Settings**
2. Click **Test Email** to verify your configuration
3. Check your inbox for the test email
4. If successful, you're ready to use the AI Email Agent!

## Using the AI Email Agent

Once configured, the AI Email Agent will automatically use your email account when:
- Sending individual emails through the Compose Email dialog
- Running email campaigns
- Using any email sending feature in the application

### Email Sending Flow:
1. User triggers email send
2. System checks for user's email configuration
3. If configured: Uses user's email settings
4. If not configured: Falls back to system email (if available)
5. Email is sent from the appropriate account

## Security Considerations

### Password Storage
- Email passwords are stored in the database
- **Production Recommendation**: Implement encryption for the `email_password` field
- Consider using environment-specific encryption keys

### Best Practices
1. **Use App Passwords**: For Gmail, always use App Passwords instead of your main password
2. **Limit Access**: Ensure your database has proper access controls
3. **Regular Updates**: Update your passwords regularly
4. **Monitor Usage**: Check your sent emails folder for any unauthorized activity

## Troubleshooting

### Issue: "Invalid login" error
**Solution**: 
- For Gmail: Ensure you're using an App Password, not your regular password
- For Outlook: Verify your email and password are correct
- Check that 2-Step Verification is enabled for Gmail

### Issue: "Email not configured" error
**Solution**: You need to configure your email settings in the Settings page first

### Issue: Test email not received
**Solution**:
- Check your spam/junk folder
- Verify the email address is correct
- Try sending the test email again
- Check the server logs for detailed error messages

### Issue: SMTP connection timeout
**Solution**:
- Verify SMTP host and port are correct
- Check if your firewall is blocking SMTP connections
- Try using a different port (587 vs 465)

## Database Schema

The user email settings are stored in the `user_email_settings` table:

```sql
CREATE TABLE user_email_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  email_provider VARCHAR(50),
  email_address VARCHAR(255),
  email_password TEXT,
  smtp_host VARCHAR(255),
  smtp_port INTEGER,
  smtp_secure BOOLEAN,
  from_name VARCHAR(255),
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## API Endpoints

### GET /api/email-settings
Retrieve the current user's email settings (password excluded)

### POST /api/email-settings
Save or update email settings for the current user

**Request Body**:
```json
{
  "email_provider": "gmail",
  "email_address": "user@example.com",
  "email_password": "app-password-here",
  "from_name": "John Doe",
  "smtp_host": "smtp.example.com",  // For custom SMTP only
  "smtp_port": 587,                 // For custom SMTP only
  "smtp_secure": false              // For custom SMTP only
}
```

### DELETE /api/email-settings
Delete the current user's email settings

### POST /api/send-email
Send an email using the user's configured email (with fallback to system email)

**Request Body**:
```json
{
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "body": "Email body content",
  "fromName": "Optional sender name"
}
```

### POST /api/test-email
Send a test email to verify the configuration

## Future Enhancements

Potential improvements for future versions:
1. **OAuth Integration**: Support for OAuth2 authentication (Gmail, Outlook)
2. **Email Templates**: Pre-built templates for common use cases
3. **Email Scheduling**: Schedule emails to be sent at specific times
4. **Email Tracking**: Track email opens and clicks
5. **Encryption**: Encrypt email passwords at rest
6. **Multiple Accounts**: Allow users to configure multiple email accounts
7. **Email Signatures**: Add customizable email signatures

## Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the server logs for detailed error messages
3. Contact support with your error details

