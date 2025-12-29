# ElevenLabs Telephony Setup Guide

This guide explains how to set up ElevenLabs telephony for making actual phone calls.

## Overview

ElevenLabs telephony integration allows you to make real phone calls using their Conversational AI platform. The system has been integrated into the Voice Networking Calls feature.

## Setup Steps

### 1. Configure ElevenLabs API Key

Add your ElevenLabs API key to your environment variables:

\`\`\`env
ELEVENLABS_API_KEY=your_api_key_here
\`\`\`

You can get your API key from: https://elevenlabs.io/app/settings/api-keys

### 2. Set Up Telephony Integration

ElevenLabs telephony works through one of these methods:

#### Option A: Twilio Integration (Recommended)

1. Sign up for a Twilio account at https://www.twilio.com
2. Get your Twilio Account SID and Auth Token
3. Purchase a Twilio phone number
4. In your ElevenLabs dashboard, navigate to Telephony > Integrations
5. Select "Twilio" and enter your credentials
6. Configure your AI agent to handle calls

#### Option B: SIP Trunking

1. If you have an existing SIP-enabled telephony system
2. Configure SIP trunking in ElevenLabs dashboard
3. Map your phone numbers to AI agents

### 3. Create an AI Agent (Optional)

If you want to use a specific agent for calls:

1. Go to ElevenLabs dashboard > Conversational AI > Agents
2. Create a new agent or use an existing one
3. Configure the agent's voice, personality, and capabilities
4. Copy the Agent ID
5. Add to environment variables:

\`\`\`env
ELEVENLABS_AGENT_ID=your_agent_id_here
\`\`\`

### 4. Test the Integration

The application includes a test button to call **08072497474**. 

**To test:**
1. Go to Voice Calls page
2. Click the "Test Call: 08072497474" button in the contact selection area
3. The system will attempt to initiate a call and show the result

**Note:** The phone number format is automatically converted:
- UK numbers starting with `0` are converted to `+44` format
- Example: `08072497474` → `+448072497474`

## API Endpoints

### Initiate Call
\`\`\`
POST /api/elevenlabs-telephony
Body: {
  phoneNumber: string,
  userId: string,
  agentId?: string,
  context?: object
}
\`\`\`

### Test Call
\`\`\`
POST /api/elevenlabs-telephony/test
Body: {
  phoneNumber?: string (defaults to 08072497474)
}
\`\`\`

### Get Call Status
\`\`\`
GET /api/elevenlabs-telephony?callId={callId}
\`\`\`

## Troubleshooting

### Error: "Failed to initiate call"

**Possible causes:**
1. ElevenLabs API key not configured
2. Telephony integration not set up in ElevenLabs dashboard
3. No phone number configured in ElevenLabs
4. Twilio credentials not configured (if using Twilio integration)

**Solutions:**
1. Verify `ELEVENLABS_API_KEY` is set in environment variables
2. Check ElevenLabs dashboard for telephony setup
3. Ensure you have configured Twilio or SIP trunking
4. Verify phone number format (should be E.164: +[country][number])

### Error: "Agent ID not found"

- Make sure you've created an agent in ElevenLabs dashboard
- Set `ELEVENLABS_AGENT_ID` environment variable
- Or pass `agentId` in the API request

## Phone Number Format

The system automatically formats phone numbers to E.164 format:
- Removes all non-digit characters
- Converts UK numbers (starting with 0) to +44 format
- Adds + prefix if missing

Examples:
- `08072497474` → `+448072497474`
- `+1 555 123 4567` → `+15551234567`
- `44 20 1234 5678` → `+442012345678`

## Next Steps

Once telephony is configured:
1. Select a contact with a phone number
2. Generate a call plan
3. Click "Call [phone number]" to initiate
4. Monitor call status in real-time
5. Review call summary and outcomes after the call

## Additional Resources

- [ElevenLabs Telephony Documentation](https://elevenlabs.io/docs/conversational-ai/telephony)
- [Twilio Integration Guide](https://elevenlabs.io/agents/integrations/twilio)
- [SIP Trunking Guide](https://elevenlabs.io/conversational-ai/integrations/sip-trunking)
