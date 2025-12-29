# SIP Trunking Setup (Alternative to Twilio)

If you want to make **actual phone calls** without Twilio, you can use **SIP Trunking** - direct integration with ElevenLabs.

## What is SIP Trunking?

SIP (Session Initiation Protocol) trunking allows you to connect your telephony infrastructure directly to ElevenLabs without using Twilio as a middleman.

## Setup Steps

### 1. Get SIP Credentials from ElevenLabs

1. Go to ElevenLabs Dashboard → Telephony → Integrations
2. Select "SIP Trunking"
3. Get your SIP credentials:
   - SIP Server TCP: `sip.rtc.elevenlabs.io:5060`
   - SIP Server TLS: `sip.rtc.elevenlabs.io:5061`
   - Username/Password (provided by ElevenLabs)

### 2. Configure in Your Code (If Needed)

If you need to configure SIP in code, you would need a SIP client library. However, **ElevenLabs handles the SIP connection** - you just use their API.

### 3. Make Calls via API

The good news: Your existing code should work! The API endpoint is the same:

\`\`\`typescript
// Your existing code already does this:
POST /api/elevenlabs-telephony
{
  phoneNumber: "+1234567890",
  agentId: "your-agent-id",
  context: { ... }
}
\`\`\`

## Important Notes

⚠️ **SIP Trunking Requirements:**
- You need SIP-compatible infrastructure (or use ElevenLabs' managed SIP)
- Some setup required in ElevenLabs dashboard
- May require additional configuration

⚠️ **Alternative: Use ElevenLabs' Managed SIP**
- ElevenLabs may provide phone numbers directly
- Check your ElevenLabs account/dashboard
- Look for "Phone Numbers" or "Telephony" section

## Check Your ElevenLabs Account

1. Log into ElevenLabs Dashboard
2. Go to **Telephony** section
3. Check if you have:
   - Phone numbers assigned
   - SIP configuration available
   - Outbound calling enabled

## Recommendation

For quick testing without Twilio:
1. **Try browser-based calls first** (see `BROWSER_VOICE_CALLS_ALTERNATIVE.md`)
2. **Or check if ElevenLabs provides phone numbers** in your account
3. **Or use SIP trunking** if you have SIP infrastructure

The browser-based option is the fastest way to test without any additional setup!
