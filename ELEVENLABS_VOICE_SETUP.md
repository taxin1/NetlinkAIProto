# ElevenLabs Voice Integration - Complete Setup

All voice agents in the application now use **ElevenLabs** for voice synthesis and recognition.

## Overview

The system uses:
- **ElevenLabs TTS (Text-to-Speech)** for all voice output
- **ElevenLabs STT (Speech-to-Text)** for all voice input
- **Direct Twilio** for making phone calls (no ElevenLabs telephony needed)
- **ElevenLabs audio** streamed to Twilio for phone call voice

## Components Using ElevenLabs Voice

### 1. Voice Networking Call Component
- **File**: `components/voice-networking-call.tsx`
- **Hook**: `useElevenLabsVoice`
- **Features**: 
  - Browser-based voice interactions
  - Phone call preparation and management
  - Real-time conversation handling

### 2. Chatbot Component
- **File**: `components/chatbot.tsx`
- **Hook**: `useVoiceAssistant` (wraps `useElevenLabsVoice`)
- **Features**:
  - Voice commands
  - Text-to-speech responses
  - Speech-to-text input

### 3. Phone Calls (Twilio)
- **Files**: 
  - `app/api/twilio-telephony/webhook/route.ts`
  - `app/api/elevenlabs-tts-audio/route.ts`
- **Features**:
  - ElevenLabs TTS audio generated for phone calls
  - Audio streamed to Twilio via `<Play>` verb
  - Fallback to Twilio TTS if ElevenLabs unavailable

## Required Environment Variables

\`\`\`env
# ElevenLabs Configuration (Required for voice)
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Twilio Configuration (Required for phone calls)
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890

# App URL (Required for webhooks)
NEXT_PUBLIC_APP_URL=https://your-domain.com
\`\`\`

## How It Works

### Browser Voice Interactions

1. **User speaks** → Browser captures audio
2. **Audio sent to** → `/api/elevenlabs-stt` (ElevenLabs Speech-to-Text)
3. **Transcription returned** → Processed by AI
4. **AI response generated** → Sent to `/api/elevenlabs-tts` (ElevenLabs Text-to-Speech)
5. **Audio played** → User hears ElevenLabs voice

### Phone Calls

1. **Call initiated** → `/api/twilio-telephony` makes call via Twilio
2. **Call answered** → Twilio webhook called
3. **AI response generated** → Based on conversation context
4. **ElevenLabs audio generated** → `/api/elevenlabs-tts-audio?text=...`
5. **Audio streamed to Twilio** → Via `<Play>` verb in TwiML
6. **User hears** → ElevenLabs voice on phone call

## API Endpoints

### `/api/elevenlabs-tts`
Generates audio from text using ElevenLabs TTS.

**Request:**
\`\`\`json
{
  "text": "Hello, how are you?",
  "voiceId": "21m00Tcm4TlvDq8ikWAM" // Optional
}
\`\`\`

**Response:** Audio file (audio/mpeg)

### `/api/elevenlabs-stt`
Transcribes audio to text using ElevenLabs STT.

**Request:** FormData with audio file

**Response:**
\`\`\`json
{
  "text": "transcribed text",
  "language": "en"
}
\`\`\`

### `/api/elevenlabs-tts-audio`
Generates audio for phone calls (used by Twilio).

**Request:** GET `/api/elevenlabs-tts-audio?text=Hello`

**Response:** Audio file (audio/mpeg)

## Voice Hooks

### `useElevenLabsVoice`
Main hook for ElevenLabs voice interactions.

**Usage:**
\`\`\`typescript
const {
  speak,
  stop,
  isSpeaking,
  isListening,
  toggleListening,
  transcript,
  isLoading
} = useElevenLabsVoice({
  onSpeechStart: () => {},
  onSpeechEnd: () => {},
  onTranscript: (text) => {},
  onError: (error) => {}
})
\`\`\`

### `useVoiceAssistant`
Wrapper hook for chatbot and general voice interactions.

**Usage:**
\`\`\`typescript
const {
  isListening,
  isSpeaking,
  transcript,
  speak,
  toggle
} = useVoiceAssistant({
  onResult: (text) => {},
  onError: (error) => {},
  autoSpeak: true
})
\`\`\`

## Testing

### Test Browser Voice
1. Navigate to `/dashboard/ai-assistant`
2. Click the microphone button
3. Speak a command
4. Verify ElevenLabs voice responds

### Test Phone Calls
1. Navigate to `/dashboard/voice-call`
2. Enter a phone number
3. Click "Call Now"
4. Answer the call
5. Verify ElevenLabs voice speaks

## Troubleshooting

### Voice Not Working

1. **Check API Key**: Verify `ELEVENLABS_API_KEY` is set correctly
2. **Check Browser Console**: Look for errors in browser console
3. **Check Server Logs**: Look for API errors in server logs
4. **Check Network Tab**: Verify API calls are being made

### Phone Calls Not Using ElevenLabs Voice

1. **Check API Key**: Verify `ELEVENLABS_API_KEY` is set
2. **Check Audio Endpoint**: Verify `/api/elevenlabs-tts-audio` is accessible
3. **Check Twilio Logs**: Look for errors in Twilio call logs
4. **Check Webhook**: Verify webhook URL is correct and accessible

### Fallback Behavior

- If ElevenLabs API key is not configured, the system will:
  - Browser: Use Web Speech API (if available)
  - Phone calls: Use Twilio's built-in TTS

## Voice Settings

Default voice: **Rachel** (`21m00Tcm4TlvDq8ikWAM`)

To change the voice, update the `voiceId` in:
- `lib/hooks/use-elevenlabs-voice.ts`
- `app/api/elevenlabs-tts/route.ts`
- `app/api/elevenlabs-tts-audio/route.ts`

Available voices can be found in `lib/hooks/use-elevenlabs-voice.ts`:
\`\`\`typescript
export const ELEVENLABS_VOICES = {
  rachel: "21m00Tcm4TlvDq8ikWAM",
  adam: "pNInz6obpgDQGcFmaJgB",
  antoni: "ErXwobaYiN019PkySvjV",
  bella: "EXAVITQu4vr4xnSDxMaL",
  elli: "MF3mGyEYCl7XYWbV9V6O",
  josh: "TxGEqnHWrfWFTfGW9XjX",
  sam: "yoZ06aMxZJJ28mfd3POQ",
}
\`\`\`

## Summary

✅ All voice agents use ElevenLabs for TTS and STT
✅ Phone calls use ElevenLabs audio streamed to Twilio
✅ Browser voice interactions use ElevenLabs
✅ Fallback mechanisms in place for reliability

The system is now fully integrated with ElevenLabs for all voice functionality!
