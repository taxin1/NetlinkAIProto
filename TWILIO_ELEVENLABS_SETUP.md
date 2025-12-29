# Twilio + ElevenLabs Setup Guide

Now that you have Twilio, here's how to connect it with ElevenLabs for phone calls.

## Step 1: Get Your Twilio Credentials

From your Twilio account dashboard:

1. **Account SID**: Found on the main dashboard (starts with `AC...`)
2. **Auth Token**: Click "View" next to Auth Token (starts with your auth token)
3. **Phone Number**: Purchase/configure a phone number (Format: +1234567890)

## Step 2: Configure ElevenLabs Dashboard

1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/conversational-ai)
2. Navigate to **Telephony** → **Integrations**
3. Select **"Twilio"**
4. Enter your Twilio credentials:
   - **Account SID**: Your Twilio Account SID
   - **Auth Token**: Your Twilio Auth Token
   - **Phone Number**: Your Twilio phone number
5. Click **"Connect"** or **"Save"**

## Step 3: Verify Your Agent

1. In ElevenLabs Dashboard, go to **Conversational AI** → **Agents**
2. Select your agent (or create one)
3. Make sure the agent is:
   - ✅ Created and saved
   - ✅ Has a voice selected
   - ✅ Agent ID copied (you'll need this)

## Step 4: Update Environment Variables

Add to your `.env.local`:

\`\`\`env
# ElevenLabs
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_AGENT_ID=your_agent_id_here

# Twilio (optional - if you need direct Twilio access)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890
\`\`\`

**Note**: The Twilio credentials in `.env.local` are optional since ElevenLabs handles the connection. But you can add them if you need direct Twilio access.

## Step 5: Test the Connection

### Option A: Use the Test Button

1. Go to `/dashboard/voice-call`
2. In the contact selection area, find the "Test Call" button
3. Click "Test Call: 08072497474"
4. The call should initiate successfully!

### Option B: Make a Real Call

1. Select a contact with a phone number
2. Fill in call details (name, role, call goal, etc.)
3. Click "Generate Call Plan"
4. Click "Call {phone number}"
5. The agent should call using your system prompt!

## Step 6: Verify System Prompt is Working

During a call, the agent should:
- ✅ Speak naturally (short sentences)
- ✅ Follow call structure (opener → rapport → purpose → next step)
- ✅ Use the contact's name appropriately
- ✅ Reference context (events, shared connections)
- ✅ Not sound robotic

## Troubleshooting

### Error: "Failed to initiate call"

**Check:**
1. ✅ Twilio credentials are correct in ElevenLabs dashboard
2. ✅ Phone number is in E.164 format (+1234567890)
3. ✅ Agent ID is set in environment variables
4. ✅ ElevenLabs API key is correct

### Error: "Not Found" or 404

**Possible causes:**
- Twilio integration not fully connected in ElevenLabs
- Agent ID not found
- API endpoint issue

**Solution:**
- Re-check Twilio connection in ElevenLabs dashboard
- Verify agent exists and ID is correct
- Check ElevenLabs API status

### Call initiates but agent doesn't respond correctly

**Check:**
- System prompt is being passed (check Network tab → API request payload)
- Agent voice is configured
- Agent is active in ElevenLabs dashboard

## Success Checklist

- [ ] Twilio account created
- [ ] Twilio credentials added to ElevenLabs dashboard
- [ ] Phone number configured in Twilio
- [ ] Agent created in ElevenLabs
- [ ] Agent ID added to `.env.local`
- [ ] Test call works
- [ ] System prompt is being used (check API request)

## Next Steps

1. ✅ **Make your first call!** Use the voice networking call component
2. ✅ **Monitor call quality** - Does agent follow system prompt rules?
3. ✅ **Adjust if needed** - Edit system prompt in `lib/voice-agent/system-prompt.ts`
4. ✅ **Review call outcomes** - Check summaries and follow-up drafts

## Your System Prompt is Already Configured!

Remember: Your system prompt is passed automatically via API on every call - no dashboard configuration needed for the prompt itself. Just make sure:
- ✅ Agent ID is set
- ✅ Twilio is connected
- ✅ Phone numbers are formatted correctly

**You're ready to make calls! 🎉**
