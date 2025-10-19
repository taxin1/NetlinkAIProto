# 🎤 Voice Assistant Guide

## Overview

The Voice Assistant feature adds powerful voice control capabilities to your Netlink-Cogni application. Users can now:
- **Talk to the AI** using voice commands
- **Hear responses** with text-to-speech
- **Send emails** by voice
- **Manage contacts** hands-free
- **Control the app** with natural language

## Features

### 🎙️ Speech Recognition
- Real-time voice transcription
- Natural language understanding
- Multi-intent command parsing
- Context-aware responses

### 🔊 Text-to-Speech
- AI responses spoken aloud
- Adjustable voice settings
- Mute/unmute control
- Natural sounding voice

### ⚡ Actions
The voice assistant can execute the following actions:

1. **Send Email** 
   - "Send an email to John"
   - "Email Sarah about the meeting"
   
2. **Create Contact**
   - "Add a new contact named John Smith with email john@example.com"
   - "Create contact for Jane at jane@company.com"

3. **View Contacts**
   - "Show my contacts"
   - "List my recent contacts"

4. **View Events**
   - "What are my upcoming events?"
   - "Show my calendar"

5. **Get Statistics**
   - "Show my stats"
   - "How many contacts do I have?"

6. **General Queries**
   - Ask questions about networking
   - Get tips and advice
   - Natural conversation

## How to Use

### Starting Voice Input
1. Click the **microphone icon** 🎤 in the chat interface
2. Wait for the "Listening..." badge to appear
3. Speak your command clearly
4. The assistant will process and respond

### Voice Controls

| Button | Function |
|--------|----------|
| 🎤 Mic | Start/Stop voice recognition |
| 🔊 Volume | Enable/Disable voice responses |
| ✉️ Send | Send typed message |

### Visual Feedback

- **Blue pulsing badge**: Currently listening to your voice
- **Volume icon**: AI is speaking
- **Live transcript**: Shows what you're saying in real-time
- **Confirmation dialog**: Appears for important actions like sending emails

## Voice Command Examples

### Email Commands
```
"Send email to john@example.com"
"Email Sarah about the project update"
"Compose an email to my colleague Mike"
```

### Contact Commands
```
"Add contact John Smith, email john@example.com, company ABC Corp"
"Create a new contact for Jane Doe at jane@example.com"
"Add Sarah to my contacts"
```

### Information Commands
```
"Show my contacts"
"What are my upcoming events?"
"How many emails have I sent?"
"Show my dashboard statistics"
```

### General Commands
```
"Help me write a professional email"
"Give me networking tips"
"How do I follow up with a contact?"
```

## Action Confirmation

For sensitive actions like **sending emails**, the assistant will:
1. ✅ Show a confirmation dialog
2. 📝 Display the action details
3. ⏳ Wait for your approval
4. ✉️ Execute only after you click "Confirm & Send"

This prevents accidental actions from voice misrecognition.

## Browser Compatibility

The voice assistant uses the **Web Speech API** and is supported in:

✅ **Chrome/Edge** (Recommended)
✅ **Safari** (macOS/iOS)
✅ **Opera**

❌ **Firefox** (Limited support)

If your browser doesn't support voice features, the microphone buttons won't appear, but text chat will still work normally.

## Tips for Best Results

1. **Speak Clearly**: Use natural language but speak clearly
2. **Quiet Environment**: Reduce background noise
3. **Allow Microphone**: Grant microphone permissions when prompted
4. **Be Specific**: Include details like names, emails, subjects
5. **Wait for Response**: Let the AI finish speaking before next command

## Privacy & Security

- 🔒 Voice data is processed securely
- 🎤 Microphone is only active when you click the button
- 🚫 No audio is stored or recorded
- ✅ All processing follows your privacy settings

## Troubleshooting

### Microphone Not Working?
1. Check browser permissions for microphone access
2. Ensure no other app is using the microphone
3. Try refreshing the page
4. Check your system's microphone settings

### Voice Not Recognized?
1. Speak more slowly and clearly
2. Reduce background noise
3. Check your microphone volume
4. Try rephrasing your command

### No Sound from Assistant?
1. Check if voice responses are enabled (🔊 button)
2. Verify your system volume is up
3. Check browser sound permissions
4. Try unmuting and remuting

## Technical Details

### Architecture
```
User Voice Input
    ↓
Web Speech API (Browser)
    ↓
Voice Assistant Hook
    ↓
Command Processing API
    ↓
Gemini AI (Intent Parsing)
    ↓
Action Execution
    ↓
Text-to-Speech Response
```

### API Endpoint
- **POST** `/api/voice-command`
- Processes voice commands
- Returns structured intents
- Handles context and user data

### Components
- `useVoiceAssistant` - React hook for voice features
- `Chatbot` - Main chat interface with voice
- `/api/voice-command` - Command processing endpoint

## Future Enhancements

Coming soon:
- 🌍 Multi-language support
- 🎯 Custom wake words
- 📊 Voice analytics
- 🔄 Continuous conversation mode
- 🎨 Voice command shortcuts
- 📱 Mobile optimization

## Support

If you encounter issues or have suggestions:
1. Check browser compatibility
2. Review the troubleshooting section
3. Ensure microphone permissions are granted
4. Try the text interface as a fallback

---

Enjoy hands-free networking with the Voice Assistant! 🎤✨

