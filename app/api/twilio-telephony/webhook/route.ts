import { NextRequest, NextResponse } from "next/server"

/**
 * Twilio Webhook Handler for Call Flow
 * 
 * This handles the TwiML responses for active calls.
 * Uses Twilio's <Gather> verb to collect speech input and respond with AI-generated speech.
 */

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const from = formData.get("From") as string
    const to = formData.get("To") as string
    const speechResult = formData.get("SpeechResult") as string | null
    const digits = formData.get("Digits") as string | null
    
    // Get context from query params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || ""
    const contextStr = searchParams.get("context") || "{}"
    
    let context: any = {}
    try {
      context = JSON.parse(decodeURIComponent(contextStr))
    } catch {
      console.warn("Failed to parse context, using empty object")
    }

    // If this is the first call (no speech result yet), greet the caller
    if (!speechResult && !digits) {
      // Generate greeting from context if available
      let greeting = "Hello, this is an AI networking call. How can I help you today?"
      
      if (context && context.call_goal && context.contact) {
        const contactName = context.contact.name || "there"
        const callGoal = context.call_goal.desired_outcome || "connect with you"
        greeting = `Hello ${contactName}, this is an AI networking call. I'd like to ${callGoal}. How are you today?`
      } else if (context && context.generatedPrompt && context.generatedPrompt.opening_line) {
        greeting = context.generatedPrompt.opening_line
      }
      
      // Use ElevenLabs TTS for greeting
      const elevenLabsKey = process.env.ELEVENLABS_API_KEY
      const audioUrl = elevenLabsKey 
        ? `${request.nextUrl.origin}/api/elevenlabs-tts-audio?text=${encodeURIComponent(greeting)}`
        : null

      // Generate TwiML with ElevenLabs audio if available, otherwise use Twilio TTS
      const twiml = audioUrl
        ? `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Gather 
    input="speech" 
    action="${request.nextUrl.origin}/api/twilio-telephony/webhook?userId=${userId}&context=${encodeURIComponent(contextStr)}&callSid=${callSid}"
    method="POST"
    speechTimeout="auto"
    language="en-US"
    hints="yes, no, hello, interested, not interested, maybe, later, schedule, meeting, call back"
    timeout="10">
    <Say voice="alice">Please speak your response.</Say>
  </Gather>
  <Say voice="alice">We didn't receive any input. Goodbye.</Say>
  <Hangup/>
</Response>`
        : `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${greeting}</Say>
  <Gather 
    input="speech" 
    action="${request.nextUrl.origin}/api/twilio-telephony/webhook?userId=${userId}&context=${encodeURIComponent(contextStr)}&callSid=${callSid}"
    method="POST"
    speechTimeout="auto"
    language="en-US"
    hints="yes, no, hello, interested, not interested, maybe, later, schedule, meeting, call back"
    timeout="10">
    <Say voice="alice">Please speak your response.</Say>
  </Gather>
  <Say voice="alice">We didn't receive any input. Goodbye.</Say>
  <Hangup/>
</Response>`

      return new NextResponse(twiml, {
        headers: {
          "Content-Type": "text/xml",
        },
      })
    }

    // We have speech input - process it with AI
    if (speechResult) {
      try {
        // Call the voice-call API to get AI response
        const response = await fetch(`${request.nextUrl.origin}/api/voice-call`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "conversation",
            context: context,
            conversationHistory: [], // Could store this in a cache/db
            userInput: speechResult,
            userId: userId
          })
        })

        const result = await response.json()
        
        if (result.success && result.speak) {
          const aiResponse = result.speak
          
          // Use ElevenLabs TTS for phone calls
          const elevenLabsKey = process.env.ELEVENLABS_API_KEY
          const audioUrl = elevenLabsKey 
            ? `${request.nextUrl.origin}/api/elevenlabs-tts-audio?text=${encodeURIComponent(aiResponse)}`
            : null

          // Generate TwiML with ElevenLabs audio if available, otherwise use Twilio TTS
          const twiml = audioUrl
            ? `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Gather 
    input="speech" 
    action="${request.nextUrl.origin}/api/twilio-telephony/webhook?userId=${userId}&context=${encodeURIComponent(contextStr)}&callSid=${callSid}"
    method="POST"
    speechTimeout="auto"
    language="en-US"
    hints="yes, no, interested, not interested, maybe, later, schedule, meeting, call back, goodbye"
    timeout="10">
    <Say voice="alice">Please continue the conversation.</Say>
  </Gather>
  <Say voice="alice">Thank you for the call. Goodbye.</Say>
  <Hangup/>
</Response>`
            : `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">${aiResponse}</Say>
  <Gather 
    input="speech" 
    action="${request.nextUrl.origin}/api/twilio-telephony/webhook?userId=${userId}&context=${encodeURIComponent(contextStr)}&callSid=${callSid}"
    method="POST"
    speechTimeout="auto"
    language="en-US"
    hints="yes, no, interested, not interested, maybe, later, schedule, meeting, call back, goodbye"
    timeout="10">
    <Say voice="alice">Please continue the conversation.</Say>
  </Gather>
  <Say voice="alice">Thank you for the call. Goodbye.</Say>
  <Hangup/>
</Response>`

          return new NextResponse(twiml, {
            headers: {
              "Content-Type": "text/xml",
            },
          })
        }
      } catch (error) {
        console.error("Error processing speech with AI:", error)
      }
    }

    // Fallback response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">I'm having trouble understanding. Could you please repeat that?</Say>
  <Gather 
    input="speech" 
    action="${request.nextUrl.origin}/api/twilio-telephony/webhook?userId=${userId}&context=${encodeURIComponent(contextStr)}&callSid=${callSid}"
    method="POST"
    speechTimeout="auto"
    language="en-US"
    timeout="10">
  </Gather>
  <Say voice="alice">Thank you for calling. Goodbye.</Say>
  <Hangup/>
</Response>`

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  } catch (error) {
    console.error("Twilio webhook error:", error)
    
    // Return error TwiML
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">I'm sorry, there was an error processing your call. Goodbye.</Say>
  <Hangup/>
</Response>`

    return new NextResponse(twiml, {
      headers: {
        "Content-Type": "text/xml",
      },
    })
  }
}

