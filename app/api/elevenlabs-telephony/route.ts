import { NextRequest, NextResponse } from "next/server"

/**
 * ElevenLabs Telephony API Routes
 * 
 * This handles making phone calls using ElevenLabs Conversational AI telephony.
 * Note: ElevenLabs telephony works through:
 * 1. Twilio integration (recommended for outbound calls)
 * 2. SIP Trunking
 * 3. Direct telephony API (if available)
 * 
 * For now, we'll use their Conversational AI API to create a call.
 */

interface InitiateCallRequest {
  phoneNumber: string
  agentId?: string // ElevenLabs agent ID
  userId: string
  context?: any // Call context for the agent
  customPrompt?: string // Custom system prompt for the agent
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, agentId, userId, context, customPrompt }: InitiateCallRequest = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured. Please add ELEVENLABS_API_KEY to your environment variables." },
        { status: 500 }
      )
    }

    // Format phone number (ensure it's in E.164 format)
    const formattedPhone = formatPhoneNumber(phoneNumber)

    // For ElevenLabs telephony, we typically need to:
    // 1. Have a phone number configured in their dashboard
    // 2. Use their Conversational AI API to create an outbound call
    // 3. Or use Twilio integration

    // Try to create an outbound call via ElevenLabs Conversational AI
    // Note: This endpoint may vary - check ElevenLabs documentation for the exact endpoint
    const callData: any = {
      phone_number: formattedPhone,
      agent_id: agentId || process.env.ELEVENLABS_AGENT_ID,
    }

    // Generate full system prompt with context if not provided
    let finalPrompt = customPrompt
    if (!finalPrompt && context) {
      const { generateContextualSystemPrompt } = await import('@/lib/voice-agent/system-prompt')
      finalPrompt = generateContextualSystemPrompt(context)
    }

    // Add custom prompt if provided
    if (finalPrompt) {
      // ElevenLabs Conversational AI accepts system_prompt or prompt parameter
      callData.system_prompt = finalPrompt
      // Also try prompt as fallback (different API versions may use different fields)
      callData.prompt = finalPrompt
    }

    // Add any additional context or parameters needed
    if (context) {
      callData.context = context
    }

    // Try multiple possible API endpoints
    const endpoints = [
      "https://api.elevenlabs.io/v1/convai/conversation/outbound_call",
      "https://api.elevenlabs.io/v1/convai/outbound_call",
      "https://api.elevenlabs.io/v1/convai/call",
    ]

    let lastError: any = null
    let lastResponseText = ""
    let lastStatusCode = 404

    for (const endpoint of endpoints) {
      try {
        const apiResponse = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": apiKey,
          },
          body: JSON.stringify(callData),
        })

        const responseText = await apiResponse.text()
        lastResponseText = responseText
        lastStatusCode = apiResponse.status

        if (apiResponse.ok) {
          const result = JSON.parse(responseText)
          
          return NextResponse.json({
            success: true,
            callId: result.call_id || result.id || result.conversation_id,
            status: result.status || "initiated",
            phoneNumber: formattedPhone,
            endpoint: endpoint
          })
        } else {
          lastError = {
            status: apiResponse.status,
            statusText: apiResponse.statusText,
            body: responseText
          }
          // If it's a 404, try next endpoint
          if (apiResponse.status === 404) {
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

    // If all endpoints failed
    console.error("All ElevenLabs telephony endpoints failed:", lastError)
    
    return NextResponse.json(
      { 
        error: "Failed to initiate call. Telephony API endpoint not found.",
        details: lastResponseText || (lastError instanceof Error ? lastError.message : JSON.stringify(lastError)),
        suggestion: "ElevenLabs telephony requires Twilio integration or SIP trunking setup in the ElevenLabs dashboard. Alternatively, use the browser-based ConvAI widget for voice calls.",
        instructions: [
          "To enable telephony:",
          "1. Go to ElevenLabs dashboard → Telephony settings",
          "2. Connect your Twilio account OR set up SIP trunking",
          "3. Enable telephony for your agent",
          "4. Check ElevenLabs documentation for the correct API endpoint"
        ]
      },
      { status: lastStatusCode }
    )
  } catch (error) {
    console.error("Telephony error:", error)
    return NextResponse.json(
      { 
        error: "Failed to initiate phone call",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

/**
 * Format phone number to E.164 format
 * E.164 format: +[country code][number] (e.g., +447911123456)
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "")
  
  // If it starts with 0 (like UK numbers), replace with country code
  if (cleaned.startsWith("0")) {
    cleaned = "44" + cleaned.substring(1) // UK country code
  }
  
  // Add + prefix if not present
  if (!cleaned.startsWith("+")) {
    cleaned = "+" + cleaned
  }
  
  return cleaned
}

/**
 * GET endpoint to check call status
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const callId = searchParams.get("callId")

    if (!callId) {
      return NextResponse.json({ error: "Call ID is required" }, { status: 400 })
    }

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 500 }
      )
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/${callId}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": apiKey,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        { error: "Failed to get call status", details: errorText },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error("Get call status error:", error)
    return NextResponse.json(
      { error: "Failed to get call status" },
      { status: 500 }
    )
  }
}

