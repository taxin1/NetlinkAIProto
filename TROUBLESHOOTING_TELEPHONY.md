# Troubleshooting "Not Found" Error

The "Not Found" error means the ElevenLabs API endpoint isn't responding. Here's how to fix it:

## 🔍 Step-by-Step Troubleshooting

### Step 1: Verify Twilio is Connected in ElevenLabs Dashboard

**This is the most common issue!**

1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/conversational-ai)
2. Navigate to **Telephony** → **Integrations**
3. Check if **Twilio** shows as "Connected" or "Active"
4. If not connected:
   - Click on Twilio
   - Enter your credentials:
     - Account SID
     - Auth Token
     - Phone Number
   - Click **Connect** or **Save**
   - Wait a few minutes for it to activate

### Step 2: Check Your Agent ID

1. Go to **Conversational AI** → **Agents**
2. Select your agent
3. Copy the **Agent ID** (should be a long string)
4. Verify it's in your `.env.local`:
   \`\`\`env
   ELEVENLABS_AGENT_ID=your_actual_agent_id_here
   \`\`\`

### Step 3: Verify API Key

1. Check your `.env.local` has:
   \`\`\`env
   ELEVENLABS_API_KEY=your_api_key_here
   \`\`\`
2. Make sure there are no extra spaces or quotes
3. Restart your dev server after changing `.env.local`

### Step 4: Check Telephony Feature Access

Some ElevenLabs plans might not include telephony. Check:

1. Go to ElevenLabs Dashboard → Settings/Billing
2. Check if telephony is included in your plan
3. If not, you may need to upgrade or contact ElevenLabs support

### Step 5: Verify API Endpoint

The endpoint might have changed. Let's check what the API is actually returning:

**Check your server console** when you click "Test Call". Look for:
- The exact error message
- The API response status code
- Any additional error details

### Step 6: Test with Browser Console

Open browser DevTools → Console tab, then check Network tab:
1. Click "Test Call"
2. Look for the API request to `/api/elevenlabs-telephony/test`
3. Click on it → Response tab
4. See the exact error message

## 🔧 Quick Fixes to Try

### Fix 1: Re-connect Twilio

Sometimes the connection needs to be refreshed:

1. In ElevenLabs Dashboard → Telephony → Integrations
2. Disconnect Twilio (if connected)
3. Wait 30 seconds
4. Reconnect with your credentials
5. Wait 2-3 minutes for activation
6. Try test call again

### Fix 2: Verify Phone Number Format

The phone number must be in E.164 format:
- ✅ Correct: `+447911123456`
- ❌ Wrong: `07911123456`
- ❌ Wrong: `447911123456` (missing +)

### Fix 3: Check Agent Status

Make sure your agent:
- ✅ Is saved/created
- ✅ Has a voice selected
- ✅ Is active (not archived)
- ✅ Agent ID is correct

### Fix 4: Check Server Logs

Look at your terminal/console where `npm run dev` is running. You should see:
\`\`\`
ElevenLabs telephony error: [actual error message]
\`\`\`

This will tell you the exact issue.

## 🚨 Common Issues & Solutions

### Issue: "Not Found" (404)

**Possible causes:**
- Twilio not connected in ElevenLabs dashboard
- Telephony feature not enabled on account
- Wrong API endpoint (unlikely, but possible)

**Solution:**
1. Verify Twilio connection in dashboard (Step 1)
2. Check if telephony is included in your plan
3. Contact ElevenLabs support if needed

### Issue: "Unauthorized" (401)

**Cause:** Invalid API key

**Solution:**
- Check API key in `.env.local`
- Regenerate API key in ElevenLabs dashboard
- Restart dev server

### Issue: "Forbidden" (403)

**Cause:** API key doesn't have telephony permissions

**Solution:**
- Check API key permissions in ElevenLabs dashboard
- Generate new API key with full permissions
- Ensure your account has telephony access

### Issue: "Bad Request" (400)

**Cause:** Invalid request format

**Solution:**
- Check phone number format (must be E.164)
- Verify agent_id is correct
- Check request payload structure

## 📞 Alternative: Use Browser-Based Calls

If telephony setup is taking too long, you can test with **browser-based voice calls** immediately:

See: `BROWSER_VOICE_CALLS_ALTERNATIVE.md`

This uses the `useConversation` hook and works without any telephony setup!

## 🔍 Still Not Working?

1. **Check ElevenLabs Status**: https://status.elevenlabs.io
2. **Contact ElevenLabs Support**: support@elevenlabs.io
3. **Check API Documentation**: https://elevenlabs.io/docs/conversational-ai/telephony

## ✅ Success Checklist

Before testing, make sure:
- [ ] Twilio is connected in ElevenLabs dashboard
- [ ] Agent ID is correct and in `.env.local`
- [ ] API key is correct and in `.env.local`
- [ ] Dev server restarted after env changes
- [ ] Phone number is in E.164 format (+1234567890)
- [ ] Your ElevenLabs account has telephony access

Try these steps and let me know what error you see in the server console!
