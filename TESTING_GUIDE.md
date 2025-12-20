# Testing Guide - Voice System

This guide explains how to test all voice functionality in the application.

## Quick Test

Run the automated test script:

```bash
node scripts/test-voice-system.mjs
```

This will test:
- ✅ ElevenLabs TTS endpoint
- ✅ ElevenLabs TTS Audio endpoint (for phone calls)
- ✅ ElevenLabs STT endpoint
- ✅ Twilio Telephony endpoint
- ✅ Voice Call API

## Manual Testing

### 1. Test Browser Voice (Chatbot)

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to:** `http://localhost:3000/dashboard/ai-assistant`

3. **Test Voice Input:**
   - Click the microphone button 🎤
   - Speak a command like: "Show my contacts" or "Send email to John"
   - Verify the command is transcribed correctly
   - Verify the AI responds with ElevenLabs voice

4. **Test Voice Output:**
   - Type a message and send it
   - Verify the AI response is spoken using ElevenLabs TTS
   - Check browser console for any errors

### 2. Test Voice Networking Call

1. **Navigate to:** `http://localhost:3000/dashboard/voice-call`

2. **Test Call Preparation:**
   - Select a contact or enter a phone number
   - Fill in call details (goal, desired outcome)
   - Click "Generate Plan"
   - Verify a call plan is generated

3. **Test Voice Interaction (Browser):**
   - After generating plan, the system should use ElevenLabs voice
   - Test speaking and listening functionality
   - Verify transcript appears correctly

4. **Test Phone Call (Optional - requires Twilio):**
   - Click "Call Now" or use test call button
   - Verify call is initiated
   - Answer the call on your phone
   - Verify ElevenLabs voice speaks on the call
   - Speak back and verify speech recognition works

### 3. Test API Endpoints Directly

#### Test ElevenLabs TTS

```bash
curl -X POST http://localhost:3000/api/elevenlabs-tts \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello, this is a test"}'
```

Expected: Audio file (audio/mpeg)

#### Test ElevenLabs TTS Audio (for phone calls)

```bash
curl "http://localhost:3000/api/elevenlabs-tts-audio?text=Hello%20test"
```

Expected: Audio file (audio/mpeg)

#### Test ElevenLabs STT

```bash
# Note: This requires an actual audio file
curl -X POST http://localhost:3000/api/elevenlabs-stt \
  -F "audio=@test-audio.webm"
```

Expected: JSON with transcribed text

#### Test Twilio Telephony (without making call)

```bash
curl -X POST http://localhost:3000/api/twilio-telephony \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+10000000000",
    "userId": "test-user-id"
  }'
```

Expected: Error about invalid phone number (but endpoint should work)

#### Test Voice Call API

```bash
curl -X POST http://localhost:3000/api/voice-call \
  -H "Content-Type: application/json" \
  -d '{
    "action": "generate_call_prompt",
    "context": {
      "user_profile": {
        "name": "Test User",
        "role": "Developer",
        "organization": "Test Org"
      },
      "contact": {
        "name": "Test Contact",
        "company": "Test Company",
        "phone": "+1234567890"
      },
      "call_goal": {
        "type": "networking",
        "desired_outcome": "Test call"
      }
    },
    "userId": "test-user-id"
  }'
```

Expected: JSON with call prompt

## Browser Console Testing

Open browser console (F12) and test:

### Test ElevenLabs Voice Hook

```javascript
// In browser console on any page with voice functionality
// The hook should be available in components using it
```

### Check for Errors

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for any errors related to:
   - ElevenLabs API calls
   - Audio playback
   - Speech recognition
   - Network requests

## Expected Behavior

### ✅ Working Correctly

- **Browser Voice:**
  - Microphone button activates speech recognition
  - Speech is transcribed correctly
  - AI responses are spoken with ElevenLabs voice
  - No errors in console

- **Phone Calls:**
  - Call is initiated successfully
  - ElevenLabs voice speaks on the call
  - Speech recognition works during call
  - Call status updates correctly

### ❌ Common Issues

1. **"ElevenLabs API key not configured"**
   - Solution: Add `ELEVENLABS_API_KEY` to `.env.local`

2. **"Twilio credentials not configured"**
   - Solution: Add Twilio credentials to `.env.local` (only needed for phone calls)

3. **"Speech recognition not supported"**
   - Solution: Use a supported browser (Chrome, Edge, Safari)

4. **"Failed to generate audio"**
   - Solution: Check ElevenLabs API key is valid and has credits

5. **"Call failed to initiate"**
   - Solution: Check Twilio credentials and account has credits

## Environment Variables Checklist

Before testing, ensure these are set in `.env.local`:

```env
# Required for voice
ELEVENLABS_API_KEY=your_key_here

# Required for phone calls
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_PHONE_NUMBER=+1234567890

# Required for webhooks
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Or for production:
# NEXT_PUBLIC_APP_URL=https://your-domain.com

# Required for AI
OPENROUTER_API_KEY=your_key_here
```

## Integration Tests

### Test Full Voice Flow

1. **Start server:** `npm run dev`
2. **Open:** `http://localhost:3000/dashboard/ai-assistant`
3. **Click microphone** and say: "Show my contacts"
4. **Verify:**
   - Speech is transcribed
   - AI processes the command
   - Response is spoken with ElevenLabs voice
   - Contacts are displayed (if any exist)

### Test Phone Call Flow

1. **Start server:** `npm run dev`
2. **Open:** `http://localhost:3000/dashboard/voice-call`
3. **Enter phone number** and call details
4. **Click "Call Now"**
5. **Answer the call** on your phone
6. **Verify:**
   - ElevenLabs voice greets you
   - You can speak and be understood
   - AI responds appropriately
   - Call status updates in browser

## Debugging Tips

1. **Check Server Logs:**
   - Look for API call logs
   - Check for error messages
   - Verify webhook calls are received

2. **Check Browser Network Tab:**
   - Verify API calls are being made
   - Check response status codes
   - Look for failed requests

3. **Check Twilio Console:**
   - View call logs
   - Check webhook delivery
   - Verify phone number is active

4. **Check ElevenLabs Dashboard:**
   - Verify API key is active
   - Check usage/credits
   - View API logs

## Next Steps

After testing:

1. ✅ All browser voice tests pass
2. ✅ All API endpoints respond correctly
3. ✅ Phone calls work (if Twilio configured)
4. ✅ No console errors
5. ✅ ElevenLabs voice is used everywhere

If all tests pass, the system is ready for use! 🎉

