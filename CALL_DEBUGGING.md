# Debugging: Calls Not Coming Through

If everything is configured but calls aren't working, follow these steps:

## Step 1: Check Server Console Logs

When you click "Test Call", check your **server console** (where you run `npm run dev`). You should see logs like:

\`\`\`
[Telephony] Endpoint: https://api.elevenlabs.io/v1/convai/conversation/outbound_call
[Telephony] Status: 200
[Telephony] Response: {...}
\`\`\`

Or if there's an error:
\`\`\`
[Telephony] Endpoint failed: { status: 400, error: {...} }
\`\`\`

**Look for:**
- What status code is returned (200 = success, 400/401/403/404 = error)
- What error message is in the response
- Which endpoint was tried

## Step 2: Check Browser Console

Open browser DevTools (F12) → Console tab, then click "Test Call". Look for:
- Network requests to `/api/elevenlabs-telephony/test`
- Response data
- Any JavaScript errors

## Step 3: Test the Diagnostic Endpoint

Visit: `http://localhost:3000/api/test-telephony-connection`

This will show:
- ✅ Environment variables status
- ✅ API key validity
- ✅ Agent accessibility
- ✅ Telephony endpoint status

## Step 4: Common Issues & Fixes

### Issue: "Not Found" (404)
**Cause:** Endpoint doesn't exist or telephony not enabled
**Fix:**
1. Verify Twilio is connected in ElevenLabs dashboard
2. Wait 2-5 minutes after connecting (activation time)
3. Check your ElevenLabs plan includes telephony
4. Verify agent has telephony enabled

### Issue: "Bad Request" (400)
**Cause:** Invalid parameters
**Fix:**
1. Check phone number format (must be E.164: +[country][number])
2. Verify agent_id is correct
3. Check if phone number is valid and callable

### Issue: "Unauthorized" (401) or "Forbidden" (403)
**Cause:** API key or permissions issue
**Fix:**
1. Verify API key is correct
2. Check API key has telephony permissions
3. Regenerate API key if needed
4. Verify account has telephony access

### Issue: Call ID returned but no call
**Cause:** Twilio configuration issue
**Fix:**
1. Check Twilio account has credits
2. Verify Twilio phone number is active
3. Check Twilio logs for errors
4. Verify phone number is verified in Twilio

## Step 5: Check Twilio Dashboard

1. Go to https://console.twilio.com
2. Check **Monitor** → **Logs** → **Calls**
3. Look for:
   - Outbound call attempts
   - Error messages
   - Call status

## Step 6: Verify ElevenLabs Configuration

1. Go to https://elevenlabs.io/app/conversational-ai
2. Click your agent
3. Go to **Settings** → **Telephony**
4. Verify:
   - ✅ Twilio shows "Connected" or "Active"
   - ✅ Your Twilio phone number is listed
   - ✅ Telephony is enabled for the agent
   - ✅ Status is "Ready"

## Step 7: Test with Different Phone Numbers

Try calling:
- Your own phone number (to test)
- A verified number in Twilio
- Different country codes

## Step 8: Check API Response Details

When you click "Test Call", the alert will show detailed error information. Look for:
- `error`: Main error message
- `details`: Full error response
- `statusCode`: HTTP status code
- `requestData`: What was sent to the API

## Quick Diagnostic Commands

### Check Environment Variables
\`\`\`bash
# In your terminal
echo $ELEVENLABS_API_KEY
echo $ELEVENLABS_AGENT_ID
\`\`\`

### Test API Key Directly
\`\`\`bash
curl -X GET "https://api.elevenlabs.io/v1/convai/agents" \
  -H "xi-api-key: YOUR_API_KEY"
\`\`\`

### Test Agent Access
\`\`\`bash
curl -X GET "https://api.elevenlabs.io/v1/convai/agents/YOUR_AGENT_ID" \
  -H "xi-api-key: YOUR_API_KEY"
\`\`\`

## Still Not Working?

1. **Check server logs** - Look for `[Telephony]` prefixed messages
2. **Check browser console** - Look for network errors
3. **Check Twilio logs** - See if calls are being attempted
4. **Contact ElevenLabs Support** - support@elevenlabs.io
5. **Check ElevenLabs Status** - https://status.elevenlabs.io

## What Success Looks Like

When a call is successfully initiated, you should see:
- ✅ Status code: 200
- ✅ Response with `call_id` or `conversation_id`
- ✅ Status: "initiated" or "ringing"
- ✅ Call appears in Twilio logs
- ✅ Phone rings

If you get a call ID but the phone doesn't ring, the issue is likely in Twilio configuration, not the API call.
