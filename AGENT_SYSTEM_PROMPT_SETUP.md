# Netlink Voice Networking Agent - System Prompt Setup

This document explains how the detailed system prompt is integrated into the voice networking agent system.

## Overview

The Netlink Voice Networking Agent uses a comprehensive system prompt that defines:
- How the agent speaks (voice-first, natural, human-like)
- Call structure and flow
- Safety and honesty rules
- Context handling
- Output formatting

## Implementation

### 1. System Prompt Location

The full system prompt is defined in:
- `lib/voice-agent/system-prompt.ts` - Contains `NETLINK_VOICE_AGENT_SYSTEM_PROMPT` and `generateContextualSystemPrompt()`

### 2. How It's Used

#### For ElevenLabs Telephony (Phone Calls)

When making actual phone calls via ElevenLabs Telephony API:

```typescript
// In app/api/elevenlabs-telephony/route.ts
const { generateContextualSystemPrompt } = await import('@/lib/voice-agent/system-prompt')
const systemPrompt = generateContextualSystemPrompt(context)

// This is passed to ElevenLabs API as system_prompt
callData.system_prompt = systemPrompt
```

**Important**: The system prompt is sent with each call. However, for best results, you should also configure it in your ElevenLabs agent dashboard:

1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/conversational-ai)
2. Select your agent
3. Go to Agent Settings → System Prompt
4. Paste the base system prompt from `NETLINK_VOICE_AGENT_SYSTEM_PROMPT`
5. Save the agent

The context-specific parts will be added dynamically when making calls.

#### For Real-time Conversations

During active calls, when processing contact responses:

```typescript
// In app/api/voice-call/route.ts (conversation action)
const systemInstruction = generateContextualSystemPrompt(callContext)
// Used as system instruction for OpenRouter API
```

### 3. Configuration in ElevenLabs Dashboard

**Recommended Setup**:

1. **Base System Prompt**: Copy the content from `NETLINK_VOICE_AGENT_SYSTEM_PROMPT` and paste it in your agent's system prompt field in the ElevenLabs dashboard.

2. **Dynamic Context**: The `generateContextualSystemPrompt()` function automatically adds call-specific context (user profile, contact info, call goals) when making calls.

3. **Agent Settings**:
   - Voice: Choose a professional, natural-sounding voice
   - Temperature: 0.7-0.8 (balanced creativity/naturalness)
   - Response Style: Conversational, Short responses

### 4. Testing the System Prompt

To verify the system prompt works correctly:

1. **Check Prompt Generation**:
   ```typescript
   import { generateContextualSystemPrompt } from '@/lib/voice-agent/system-prompt'
   
   const prompt = generateContextualSystemPrompt({
     user_profile: { name: "John Doe", role: "CEO", organization: "Acme Inc" },
     contact: { name: "Jane Smith", company: "Tech Corp" },
     call_goal: { type: "networking", desired_outcome: "Schedule follow-up meeting" }
   })
   
   console.log(prompt) // Should include full prompt + context
   ```

2. **Make a Test Call**:
   - Use the voice networking call component
   - Generate a call prompt
   - Initiate a call
   - The system prompt will be included in the API request

### 5. Key Features of the System Prompt

✅ **Voice-First Behavior**: Short sentences, natural pacing, verbal signposts
✅ **Safety Rules**: Never invent facts, never claim capabilities you don't have
✅ **Call Structure**: Default flow (Opener → Rapport → Purpose → Qualify → Next Step → Close)
✅ **Context Awareness**: Uses provided user profile, contact info, and call goals
✅ **Human-Like**: Avoids AI-sounding phrases, mirrors contact's energy
✅ **Topic Mode**: Adapts to specific topics (fundraising, partnership, etc.)
✅ **Output Format**: Provides both SPEAK (what to say) and ACTIONS (CRM notes)

### 6. Customization

If you need to modify the system prompt:

1. **Edit Base Prompt**: Update `NETLINK_VOICE_AGENT_SYSTEM_PROMPT` in `lib/voice-agent/system-prompt.ts`
2. **Modify Context Generation**: Update `generateContextualSystemPrompt()` to add/remove context sections
3. **Test Changes**: Make a test call to verify the agent behaves as expected

### 7. Troubleshooting

**Issue**: Agent doesn't follow the system prompt
- **Solution**: Ensure the prompt is configured in the ElevenLabs dashboard AND passed in the API call

**Issue**: Agent sounds too robotic
- **Solution**: Check that voice-first behavior rules are in the prompt, and adjust temperature settings

**Issue**: Agent doesn't use context properly
- **Solution**: Verify that `generateContextualSystemPrompt()` is being called with complete context

**Issue**: Calls don't follow the conversation structure
- **Solution**: Review that the "Conversation structure (default)" section is in the system prompt

## Next Steps

1. ✅ System prompt is implemented in code
2. ⚠️ **Required**: Configure the base prompt in your ElevenLabs agent dashboard
3. ✅ Context is automatically injected when making calls
4. ✅ System prompt is used for real-time conversation processing

The system is ready to use once you configure the agent in the ElevenLabs dashboard!

