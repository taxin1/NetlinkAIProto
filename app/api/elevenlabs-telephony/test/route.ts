import { NextRequest, NextResponse } from "next/server"

/**
 * Test endpoint for making a call to 08072497474
 * This endpoint tries multiple ElevenLabs API approaches
 */
export async function POST(request: NextRequest) {
  try {
    const { phoneNumber } = await request.json()
    const testNumber = phoneNumber || "08072497474"

    const apiKey = process.env.ELEVENLABS_API_KEY
    const agentId = process.env.ELEVENLABS_AGENT_ID

    if (!apiKey) {
      return NextResponse.json(
        { 
          error: "ElevenLabs API key not configured",
          instructions: [
            "1. Add ELEVENLABS_API_KEY to your .env.local file",
            "2. Get your API key from https://elevenlabs.io/app/settings/api-keys"
          ]
        },
        { status: 500 }
      )
    }

    if (!agentId) {
      return NextResponse.json(
        { 
          error: "ElevenLabs Agent ID not configured",
          instructions: [
            "1. Create a Conversational AI agent in ElevenLabs dashboard",
            "2. Add ELEVENLABS_AGENT_ID to your .env.local file",
            "3. Get your agent ID from the agent settings"
          ]
        },
        { status: 500 }
      )
    }

    // Format phone number to E.164 format
    let formattedPhone = testNumber.replace(/\D/g, "")
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "44" + formattedPhone.substring(1) // UK country code
    }
    formattedPhone = "+" + formattedPhone

    // Try multiple possible API endpoints
    const endpoints = [
      "https://api.elevenlabs.io/v1/convai/conversation/outbound_call",
      "https://api.elevenlabs.io/v1/convai/outbound_call",
      "https://api.elevenlabs.io/v1/convai/call",
    ]

    let lastError: any = null
    let lastResponseText = ""

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": apiKey,
          },
          body: JSON.stringify({
            phone_number: formattedPhone,
            agent_id: agentId,
          }),
        })

        const responseText = await response.text()
        lastResponseText = responseText

        if (response.ok) {
          let result
          try {
            result = JSON.parse(responseText)
          } catch {
            result = { response: responseText }
          }

          return NextResponse.json({
            success: true,
            callId: result.call_id || result.id || result.conversation_id,
            status: result.status || "initiated",
            phoneNumber: formattedPhone,
            message: "Call initiated successfully",
            endpoint: endpoint
          })
        } else {
          let errorDetails
          try {
            errorDetails = JSON.parse(responseText)
          } catch {
            errorDetails = { message: responseText }
          }
          
          lastError = {
            status: response.status,
            statusText: response.statusText,
            body: responseText,
            parsed: errorDetails
          }
          
          console.log(`[Test Call] Endpoint ${endpoint} failed:`, {
            status: response.status,
            error: errorDetails
          })
          
          // If it's a 404, try next endpoint
          if (response.status === 404) {
            continue
          }
          
          // For 400/401/403, log but try other endpoints
          if ([400, 401, 403].includes(response.status)) {
            console.warn(`[Test Call] Endpoint exists but returned ${response.status}, trying alternatives...`)
            continue
          }
          
          // For other errors, break and show the error
          break
        }
      } catch (fetchError) {
        lastError = fetchError
        continue
      }
    }

    // If all endpoints failed, provide helpful instructions
    console.error("All ElevenLabs telephony endpoints failed:", lastError)
    
    return NextResponse.json({
      error: "Telephony API endpoint not found",
      details: lastResponseText || (lastError instanceof Error ? lastError.message : JSON.stringify(lastError)),
      formattedPhone,
      instructions: [
        "ElevenLabs telephony requires additional setup:",
        "",
        "OPTION 1: Use ElevenLabs Widget (Recommended for testing)",
        "- The widget handles telephony automatically",
        "- No additional API setup needed",
        "- Use the ElevenLabs ConvAI widget component",
        "",
        "OPTION 2: Set up Twilio Integration",
        "1. Go to ElevenLabs dashboard → Telephony settings",
        "2. Connect your Twilio account",
        "3. Configure Twilio credentials",
        "4. Enable telephony for your agent",
        "",
        "OPTION 3: Use SIP Trunking",
        "1. Set up SIP trunk in ElevenLabs dashboard",
        "2. Configure your SIP provider",
        "",
        `Phone number formatted: ${formattedPhone}`,
        `Agent ID: ${agentId ? 'Configured' : 'Missing'}`,
        "",
        "Note: The outbound call API endpoint may vary. Check ElevenLabs documentation for the latest endpoint."
      ],
      alternative: "Consider using the ElevenLabs ConvAI widget for browser-based voice calls instead"
    }, { status: 200 }) // Return 200 to show helpful instructions
  } catch (error) {
    console.error("Test call error:", error)
    return NextResponse.json({
      error: "Failed to initiate test call",
      details: error instanceof Error ? error.message : "Unknown error",
      suggestion: "Check your ElevenLabs API key, Agent ID, and telephony setup"
    }, { status: 500 })
  }
}

