# Direct Twilio Setup Guide (No ElevenLabs Required)

This guide explains how to use the direct Twilio integration for voice calls without needing ElevenLabs.

## Overview

The system now supports making phone calls directly through Twilio, using:
- **Twilio Voice API** for making phone calls
- **Web Speech API** for browser-based voice synthesis and recognition (no API keys needed)
- **AI (OpenRouter/Gemini)** for generating conversational responses

## Setup Steps

### 1. Get Twilio Credentials

1. Sign up for a Twilio account at https://www.twilio.com
2. Get your credentials from the Twilio Console:
   - **Account SID**: Found in your Twilio dashboard
   - **Auth Token**: Found in your Twilio dashboard
   - **Phone Number**: Purchase a Twilio phone number

### 2. Configure Environment Variables

Add these to your `.env.local` file:

```env
# Twilio Configuration (Required)
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# App URL (Required for webhooks)
NEXT_PUBLIC_APP_URL=https://your-domain.com
# For local development:
# NEXT_PUBLIC_APP_URL=http://localhost:3000

# AI Configuration (Required for AI responses)
OPENROUTER_API_KEY=your_openrouter_api_key
```

### 3. Configure Twilio Webhooks

Twilio needs to be able to reach your webhook endpoints. For local development:

1. Use **ngrok** or similar tunneling service:
   ```bash
   ngrok http 3000
   ```

2. Update `NEXT_PUBLIC_APP_URL` to your ngrok URL:
   ```env
   NEXT_PUBLIC_APP_URL=https://your-ngrok-url.ngrok.io
   ```

3. For production, ensure your domain is accessible and `NEXT_PUBLIC_APP_URL` points to your production URL.

### 4. Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to the Voice Call page in your dashboard
3. Enter a phone number and click "Call Now"
4. The call will be made directly through Twilio

## How It Works

### Call Flow

1. **Initiate Call**: User clicks "Call Now" → API calls Twilio to make the call
2. **Twilio Calls Recipient**: Twilio dials the phone number
3. **Webhook Handles Conversation**: When answered, Twilio calls your webhook endpoint
4. **AI Generates Response**: Your webhook uses AI to generate responses
5. **Twilio Speaks Response**: Twilio's TTS speaks the AI response
6. **Collects Speech Input**: Twilio's speech recognition collects the recipient's response
7. **Loop Continues**: Process repeats until call ends

### Voice Features

- **Browser Voice (Web Speech API)**: Used for local voice interactions in the browser
  - No API keys required
  - Works entirely in the browser
  - Supports TTS and STT

- **Twilio Voice**: Used for actual phone calls
  - Twilio's built-in TTS (text-to-speech)
  - Twilio's speech recognition
  - Handles the actual phone call

## API Endpoints

### POST `/api/twilio-telephony`
Initiates a phone call via Twilio.

**Request:**
```json
{
  "phoneNumber": "+1234567890",
  "userId": "user-id",
  "context": { /* call context */ },
  "customPrompt": "optional custom prompt"
}
```

**Response:**
```json
{
  "success": true,
  "callId": "CAxxxxx",
  "status": "initiated",
  "phoneNumber": "+1234567890",
  "twilioCallSid": "CAxxxxx"
}
```

### GET `/api/twilio-telephony?callId=CAxxxxx`
Gets the status of a call.

### POST `/api/twilio-telephony/webhook`
Webhook endpoint that Twilio calls during the call. Handles the conversation flow.

### POST `/api/twilio-telephony/status`
Status callback endpoint for call status updates.

## Browser Support

### Web Speech API Support

The Web Speech API is supported in:
- ✅ Chrome/Edge (Chromium)
- ✅ Safari (with `webkit` prefix)
- ❌ Firefox (limited support)

For browsers without Web Speech API support, the system will show an error message.

## Troubleshooting

### Call Not Initiating

1. **Check Twilio Credentials**: Verify `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` are set correctly
2. **Check Twilio Account**: Ensure your Twilio account has credits
3. **Check Phone Number Format**: Phone numbers must be in E.164 format (`+[country][number]`)
4. **Check Webhook URL**: Ensure `NEXT_PUBLIC_APP_URL` is set and accessible

### Webhook Not Receiving Calls

1. **Check ngrok/URL**: For local development, ensure ngrok is running and URL is correct
2. **Check Firewall**: Ensure your server can receive POST requests from Twilio
3. **Check Logs**: Check server logs for webhook errors

### Speech Recognition Not Working

1. **Check Browser Support**: Ensure you're using a supported browser (Chrome, Safari, Edge)
2. **Check Permissions**: Ensure microphone permissions are granted
3. **Check HTTPS**: Web Speech API requires HTTPS (or localhost)

## Cost Considerations

- **Twilio**: Pay per minute for calls (varies by country)
- **Web Speech API**: Free (browser-based)
- **AI (OpenRouter)**: Pay per API call (varies by model)

## Migration from ElevenLabs

If you were previously using ElevenLabs:

1. ✅ **No changes needed** - The system automatically uses Twilio when ElevenLabs is not configured
2. The voice call component will use Web Speech API for browser voice
3. Phone calls will use Twilio directly

## Next Steps

1. Set up your Twilio account and get credentials
2. Add environment variables
3. Test with a call
4. Configure webhooks for production

For more information, see:
- [Twilio Voice API Documentation](https://www.twilio.com/docs/voice)
- [Web Speech API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

