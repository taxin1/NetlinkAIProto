# Next Steps After Adding Twilio to ElevenLabs ✅

You've connected Twilio! Here's what to do next:

## Step 1: Verify Environment Variables

Make sure you have these in your `.env.local` file:

\`\`\`bash
ELEVENLABS_API_KEY=your_api_key_here
ELEVENLABS_AGENT_ID=your_agent_id_here
\`\`\`

### How to Get These:

**API Key:**
1. Go to https://elevenlabs.io/app/settings/api-keys
2. Copy your API key
3. Add to `.env.local` as `ELEVENLABS_API_KEY`

**Agent ID:**
1. Go to https://elevenlabs.io/app/conversational-ai
2. Click on your agent
3. Copy the Agent ID from the URL or settings
4. Add to `.env.local` as `ELEVENLABS_AGENT_ID`

## Step 2: Verify Twilio is Active in ElevenLabs

1. Go to https://elevenlabs.io/app/conversational-ai
2. Click on your agent
3. Go to **Settings** → **Telephony**
4. Check that **Twilio** shows as:
   - ✅ **Connected** or **Active**
   - ✅ Your Twilio phone number is listed
   - ✅ Status is "Ready" or "Active"

If it's not active:
- Click on Twilio integration
- Verify your Twilio credentials are correct
- Wait a few minutes for activation
- Refresh the page

## Step 3: Enable Telephony for Your Agent

1. In your agent settings
2. Go to **Telephony** tab
3. Make sure **"Enable Telephony"** is turned ON
4. Select **Twilio** as the provider
5. Save changes

## Step 4: Test the Connection

### Option A: Use the Test Endpoint

Visit: `http://localhost:3000/api/test-telephony-connection`

This will show you:
- ✅ API key status
- ✅ Agent ID status
- ✅ Agent accessibility
- ✅ Telephony endpoint status

### Option B: Use the Test Call Button

1. Go to your app's voice networking call page
2. Click **"Test Call: 08072497474"** button
3. Check the response

### Expected Success Response:
\`\`\`json
{
  "success": true,
  "callId": "call_123...",
  "status": "initiated",
  "phoneNumber": "+448072497474"
}
\`\`\`

## Step 5: Make Your First Call

1. Fill in the call preparation form:
   - Select a contact or enter phone number
   - Enter your name and role
   - Set call goal and desired outcome
2. Click **"Generate Call Plan"**
3. Review the generated plan
4. Click **"Call [Phone Number]"**
5. The call should initiate!

## Troubleshooting

### If you get "Not Found" error:

1. **Check Twilio Status:**
   - Go to ElevenLabs dashboard
   - Verify Twilio is connected and active
   - Check if your Twilio account has credits

2. **Verify Agent ID:**
   - Make sure `ELEVENLABS_AGENT_ID` in `.env.local` matches your agent
   - The agent must have telephony enabled

3. **Check API Key:**
   - Verify `ELEVENLABS_API_KEY` is correct
   - Make sure it has telephony permissions

4. **Wait for Activation:**
   - After connecting Twilio, wait 2-5 minutes
   - Refresh the ElevenLabs dashboard
   - Try again

### If you get "Agent not found":

- Double-check your `ELEVENLABS_AGENT_ID`
- Make sure the agent exists in your ElevenLabs account
- Verify the agent has telephony enabled

### If calls don't connect:

- Check your Twilio account has sufficient credits
- Verify the phone number format (should be E.164: +[country][number])
- Check Twilio logs for errors
- Verify your Twilio phone number is verified/active

## Quick Verification Checklist

- [ ] `ELEVENLABS_API_KEY` is in `.env.local`
- [ ] `ELEVENLABS_AGENT_ID` is in `.env.local`
- [ ] Twilio shows as "Connected" in ElevenLabs dashboard
- [ ] Agent has telephony enabled
- [ ] Twilio phone number is configured
- [ ] Test endpoint shows success
- [ ] Test call button works

## Need Help?

1. **Check ElevenLabs Status:** https://status.elevenlabs.io
2. **ElevenLabs Docs:** https://elevenlabs.io/docs/conversational-ai/telephony
3. **Test Connection:** Visit `/api/test-telephony-connection` in your app

Once all these are set, your telephony should work! 🎉
