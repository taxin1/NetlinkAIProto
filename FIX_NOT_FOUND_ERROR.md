# Fix: "Not Found" Error - Telephony Endpoint

## The Problem

You're getting `{"detail":"Not Found"}` which means the ElevenLabs telephony API endpoint doesn't exist or isn't available for your account.

## Why This Happens

The "Not Found" (404) error means one of these:

1. **Telephony not enabled** - Your ElevenLabs plan doesn't include telephony
2. **Twilio not activated** - Twilio is connected but not fully activated yet
3. **Wrong endpoint** - The API endpoint path has changed
4. **Account limitation** - Your account type doesn't have telephony access

## Solutions (Try in Order)

### Solution 1: Verify Telephony is Enabled in Your Plan

1. Go to https://elevenlabs.io/app/settings/billing
2. Check your current plan
3. Look for "Telephony" or "Phone Calls" in features
4. If not included, you may need to:
   - Upgrade your plan
   - Contact ElevenLabs support
   - Use browser-based widget instead

### Solution 2: Check Twilio Activation Status

1. Go to https://elevenlabs.io/app/conversational-ai
2. Click your agent
3. Go to **Settings** → **Telephony**
4. Check Twilio status:
   - ✅ **"Active"** = Ready to use
   - ⚠️ **"Connected"** = Still activating (wait 5-10 minutes)
   - ❌ **"Disconnected"** = Not connected

**If it says "Connected" but not "Active":**
- Wait 5-10 minutes
- Refresh the page
- Check again
- If still not active, disconnect and reconnect Twilio

### Solution 3: Verify Agent Has Telephony Enabled

1. In your agent settings
2. Go to **Telephony** tab
3. Make sure **"Enable Telephony"** toggle is ON
4. Select **Twilio** as provider
5. Save changes

### Solution 4: Check Your ElevenLabs Account Type

Some account types (free/trial) may not have telephony access:

1. Go to https://elevenlabs.io/app/settings
2. Check your account type
3. If it's a free/trial account:
   - You may need to upgrade
   - Or use the browser widget instead

### Solution 5: Re-connect Twilio

1. In ElevenLabs dashboard → Telephony → Integrations
2. Disconnect Twilio
3. Wait 30 seconds
4. Reconnect with your Twilio credentials:
   - Account SID
   - Auth Token
   - Phone Number
5. Wait 5-10 minutes for activation
6. Verify status shows "Active"

### Solution 6: Contact ElevenLabs Support

If none of the above work:

1. Email: support@elevenlabs.io
2. Subject: "Telephony API endpoint returning 404"
3. Include:
   - Your account email
   - Agent ID
   - Screenshot of Twilio integration status
   - Error message: `{"detail":"Not Found"}`

### Solution 7: Use Browser Widget Instead

If telephony isn't available, you can use the browser-based voice widget:

1. The widget works without telephony setup
2. It makes calls through the browser
3. No Twilio configuration needed
4. Works immediately

## Quick Diagnostic

Run this to check your setup:

```bash
# Test if your agent exists
curl "https://api.elevenlabs.io/v1/convai/agents/YOUR_AGENT_ID" \
  -H "xi-api-key: YOUR_API_KEY"

# If this works, your agent exists
# If telephony endpoint returns 404, telephony isn't enabled
```

## What Success Looks Like

When telephony is properly set up:
- Twilio shows "Active" (not just "Connected")
- Agent has telephony enabled
- API endpoint returns 200 (not 404)
- Calls can be initiated

## Alternative: Browser-Based Calls

If telephony API isn't available, use the ConvAI widget:
- No API calls needed
- Works in browser
- No Twilio setup required
- Immediate use

The widget is already in your codebase at `components/elevenlabs-convai-widget.tsx`

## Most Common Fix

**90% of the time**, the issue is:
1. Twilio is "Connected" but not "Active" → Wait 5-10 minutes
2. Telephony not enabled in plan → Upgrade or contact support
3. Agent doesn't have telephony enabled → Enable it in agent settings

Try these first!

