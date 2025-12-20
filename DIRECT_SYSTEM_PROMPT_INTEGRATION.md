# Direct System Prompt Integration - No Dashboard Needed!

## ✅ You DON'T Need to Configure in Dashboard!

The system prompt is passed **directly via API** when making calls. No dashboard configuration required!

## How It Works

### 1. System Prompt is Generated in Code

When you make a call, the system automatically:
1. Loads the system prompt from `lib/voice-agent/system-prompt.ts`
2. Injects call-specific context (user profile, contact info, call goals)
3. Passes it directly to ElevenLabs API via `system_prompt` parameter

### 2. Code Location

**File**: `app/api/elevenlabs-telephony/route.ts`

```typescript
// This happens automatically when you make a call
const { generateContextualSystemPrompt } = await import('@/lib/voice-agent/system-prompt')
const finalPrompt = generateContextualSystemPrompt(context)

// Pass directly to ElevenLabs API
callData.system_prompt = finalPrompt
```

### 3. What You DO Need from Dashboard

**Only one thing**: An **Agent ID**

1. Go to ElevenLabs Dashboard → Create an agent (or use existing)
2. Copy the Agent ID
3. Add to `.env.local`:
   ```env
   ELEVENLABS_AGENT_ID=your-agent-id-here
   ```

That's it! The system prompt is handled entirely in your code.

## Benefits of Direct Integration

✅ **Full Control**: Change the prompt in code, no dashboard needed  
✅ **Dynamic Context**: Each call gets personalized context automatically  
✅ **Version Control**: Prompt changes are tracked in git  
✅ **No Manual Steps**: No need to copy/paste prompts to dashboard  
✅ **Multi-Environment**: Different prompts for dev/staging/prod if needed

## How It Works Technically

1. **Your Code** → Generates system prompt with context
2. **API Call** → Sends `system_prompt` parameter to ElevenLabs
3. **ElevenLabs** → Uses your prompt (overrides dashboard settings)
4. **Agent Responds** → Following your exact instructions

## Example Flow

```typescript
// When you call /api/elevenlabs-telephony
POST {
  phoneNumber: "+1234567890",
  context: {
    user_profile: { name: "John", role: "CEO", ... },
    contact: { name: "Jane", company: "Tech Corp", ... },
    call_goal: { type: "networking", desired_outcome: "..." }
  }
}

// Backend automatically:
// 1. Loads NETLINK_VOICE_AGENT_SYSTEM_PROMPT
// 2. Adds context-specific information
// 3. Sends to ElevenLabs as system_prompt

// ElevenLabs uses YOUR prompt directly - no dashboard needed!
```

## Testing

To verify it's working:

1. Make a test call via your app
2. Check the API request in browser DevTools Network tab
3. Look for the `system_prompt` field in the request payload
4. Verify it contains your full system prompt with context

## Updating the Prompt

Just edit `lib/voice-agent/system-prompt.ts`:

```typescript
export const NETLINK_VOICE_AGENT_SYSTEM_PROMPT = `
  Your updated prompt here...
  No dashboard changes needed!
`
```

Save, deploy, and the new prompt is active immediately!

## Summary

- ✅ System prompt is in your code (`lib/voice-agent/system-prompt.ts`)
- ✅ Passed directly via API on every call
- ✅ No dashboard configuration needed for prompt
- ⚠️ Only need Agent ID from dashboard (one-time setup)

You're fully in control! 🎉

