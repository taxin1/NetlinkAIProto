# Quick Start - Twilio Setup ✅

You've added Twilio! Here's the quick setup:

## 🚀 3 Steps to Start Making Calls

### Step 1: Connect Twilio to ElevenLabs

1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/conversational-ai)
2. **Telephony** → **Integrations** → **Twilio**
3. Enter:
   - Twilio Account SID
   - Twilio Auth Token  
   - Your Twilio Phone Number
4. Click **Connect**

### Step 2: Verify Environment Variables

Make sure `.env.local` has:

\`\`\`env
ELEVENLABS_API_KEY=your_key
ELEVENLABS_AGENT_ID=your_agent_id
\`\`\`

### Step 3: Test It!

1. Go to `/dashboard/voice-call`
2. Click "Test Call: 08072497474" button
3. Or make a real call to a contact

## ✅ That's It!

Your system prompt is already configured - it's passed automatically on every call!

## 🐛 Issues?

- **"Not Found" error?** → Re-check Twilio connection in ElevenLabs dashboard
- **Call doesn't start?** → Verify phone number format (+1234567890)
- **Agent doesn't respond?** → Check agent ID is correct

**Ready to test! 🎉**
