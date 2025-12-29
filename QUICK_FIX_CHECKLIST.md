# Quick Fix Checklist - "Not Found" Error

## ✅ Do This First (Most Common Issue)

1. **Go to ElevenLabs Dashboard**
   - https://elevenlabs.io/app/conversational-ai
   - Login

2. **Check Twilio Connection**
   - Click: **Telephony** → **Integrations**
   - Find **Twilio**
   - Does it say "Connected" or "Active"?
   - ❌ If NO → Connect it with your Twilio credentials
   - ✅ If YES → Go to next step

3. **Wait 2-3 Minutes**
   - After connecting Twilio, wait for it to activate
   - Refresh the page
   - Check if status changed to "Active"

4. **Restart Your Dev Server**
   \`\`\`bash
   # Stop the server (Ctrl+C)
   # Then restart:
   npm run dev
   \`\`\`

5. **Try Test Call Again**
   - Go to `/dashboard/voice-call`
   - Click "Test Call: 08072497474"

## 🔍 If Still Not Working

Check your **server console** (terminal where `npm run dev` is running):

Look for a line like:
\`\`\`
ElevenLabs telephony error: {"detail":"Not Found"}
\`\`\`

**What does it say exactly?** The error message will tell us what's wrong.

## 🎯 Most Likely Issues

1. **Twilio not connected** → Connect it in ElevenLabs dashboard
2. **Agent ID wrong** → Check `.env.local` has correct `ELEVENLABS_AGENT_ID`
3. **API key wrong** → Check `.env.local` has correct `ELEVENLABS_API_KEY`
4. **Telephony not enabled** → Check your ElevenLabs plan includes telephony

## 💡 Quick Test

Run this in your browser console (F12 → Console):

\`\`\`javascript
fetch('/api/elevenlabs-telephony/test', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phoneNumber: '08072497474' })
})
.then(r => r.json())
.then(console.log)
\`\`\`

This will show you the exact error message!

**Share the error message and I'll help you fix it!** 🚀
