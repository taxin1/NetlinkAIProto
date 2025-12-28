# Test Telephony Connection

Run this diagnostic test to verify your setup:

## Quick Test

1. **Start your dev server** (if not already running):
   \`\`\`bash
   npm run dev
   \`\`\`

2. **Open browser and go to**:
   \`\`\`
   http://localhost:3000/api/test-telephony-connection
   \`\`\`

3. **Check the JSON response** - it will show:
   - ✅ Environment variables (API key, Agent ID)
   - ✅ API key validity
   - ✅ Agent accessibility
   - ✅ Telephony endpoint status
   - ❌ Any errors found

## What to Look For

### ✅ Good Signs:
- `"apiKeyValid": true` - Your API key works
- `"agentAccessible": true` - Your agent ID is correct
- `"telephonyEndpointExists": true` - The endpoint exists
- `"success": true` - Everything is configured correctly

### ❌ Problem Signs:
- `"apiKeyValid": false` - Check your API key
- `"agentAccessible": false` - Check your Agent ID
- `"telephonyEndpointExists": false` - Telephony might not be enabled
- `"errors": [...]` - Check the error messages

## Interpreting Results

### If telephonyEndpointExists is false:
- The endpoint `/v1/convai/conversation/outbound_call` might not exist
- Your account might not have telephony access
- You may need to check ElevenLabs documentation for the correct endpoint

### If you see "403 Forbidden" or "401 Unauthorized":
- This is actually GOOD! It means the endpoint exists
- The issue is authentication/permissions
- Check your API key permissions

### If you see "400 Bad Request":
- This is GOOD! The endpoint exists
- The issue is with request parameters
- We need to check the correct parameter format

## Share Results

Copy the JSON response and share it, and I'll help you fix any issues!
