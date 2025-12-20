import { NextRequest, NextResponse } from "next/server"

/**
 * ElevenLabs Telephony API Routes (Using Twilio)
 * 
 * This handles making phone calls using ElevenLabs Conversational AI telephony with Twilio.
 * 
 * HOW IT WORKS:
 * - ElevenLabs agent uses Twilio for making outbound phone calls
 * - Twilio must be connected in ElevenLabs dashboard (Telephony → Integrations → Twilio)
 * - This API route calls ElevenLabs telephony endpoints which route through Twilio
 * - The agent ID must have telephony enabled and Twilio connected
 * 
 * SETUP REQUIRED:
 * 1. Connect Twilio in ElevenLabs dashboard (Account SID, Auth Token, Phone Number)
 * 2. Ensure your ElevenLabs plan includes telephony
 * 3. Set ELEVENLABS_API_KEY and ELEVENLABS_AGENT_ID in environment variables
 * 4. Wait 5-10 minutes after connecting Twilio for activation
 * 
 * The system automatically uses Twilio through ElevenLabs - no direct Twilio API calls needed.
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
    // Twilio requires E.164 format: +[country code][number]
    const formattedPhone = formatPhoneNumber(phoneNumber)

    // ElevenLabs telephony uses Twilio for outbound calls
    // Twilio must be connected in ElevenLabs dashboard (Telephony → Integrations → Twilio)
    // The call will be routed through Twilio automatically

    // Get agent ID
    const finalAgentId = agentId || process.env.ELEVENLABS_AGENT_ID
    if (!finalAgentId) {
      return NextResponse.json(
        { error: "Agent ID is required. Please provide agentId or set ELEVENLABS_AGENT_ID in environment variables." },
        { status: 400 }
      )
    }

    // Create outbound call via ElevenLabs Telephony API (uses Twilio)
    // The call will be routed through Twilio automatically if connected in ElevenLabs dashboard
    console.log(`[Telephony] Initiating call via ElevenLabs (Twilio) to ${formattedPhone} using agent ${finalAgentId}`)
    
    const callData: any = {
      phone_number: formattedPhone,
      agent_id: finalAgentId,
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
    // Note: The correct endpoint may vary based on ElevenLabs API version and telephony setup
    const endpoints = [
      "https://api.elevenlabs.io/v1/convai/conversation/outbound_call",
      "https://api.elevenlabs.io/v1/convai/outbound_call", 
      "https://api.elevenlabs.io/v1/convai/call",
      "https://api.elevenlabs.io/v1/convai/conversations/outbound_call",
      "https://api.elevenlabs.io/v1/convai/telephony/outbound_call",
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

        // Log the response for debugging
        console.log(`[Telephony] Endpoint: ${endpoint}`)
        console.log(`[Telephony] Status: ${apiResponse.status}`)
        console.log(`[Telephony] Response: ${responseText.substring(0, 500)}`)

        if (apiResponse.ok) {
          let result
          try {
            result = JSON.parse(responseText)
          } catch (e) {
            result = { raw: responseText }
          }
          
          console.log(`[Telephony] Call initiated successfully:`, result)
          
          return NextResponse.json({
            success: true,
            callId: result.call_id || result.id || result.conversation_id || result.conversationId,
            status: result.status || "initiated",
            phoneNumber: formattedPhone,
            endpoint: endpoint,
            fullResponse: result
          })
        } else {
          let errorDetails
          try {
            errorDetails = JSON.parse(responseText)
          } catch {
            errorDetails = { message: responseText }
          }
          
          lastError = {
            status: apiResponse.status,
            statusText: apiResponse.statusText,
            body: responseText,
            parsed: errorDetails
          }
          
          console.error(`[Telephony] Endpoint ${endpoint} failed:`, lastError)
          
          // If it's a 404, try next endpoint
          if (apiResponse.status === 404) {
            continue
          }
          
          // For 400/401/403, these might be parameter/auth issues - try next endpoint but log it
          if ([400, 401, 403].includes(apiResponse.status)) {
            console.warn(`[Telephony] Endpoint exists but returned ${apiResponse.status}, trying alternatives...`)
            // Still try other endpoints in case this one has wrong parameters
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
    console.error("[Telephony] All endpoints failed. Last error:", lastError)
    console.error("[Telephony] Request data sent:", {
      phone_number: formattedPhone,
      agent_id: finalAgentId,
      hasPrompt: !!finalPrompt
    })
    
    // Parse error details for better user feedback
    let errorMessage = "Failed to initiate call"
    let errorDetails = lastResponseText || (lastError instanceof Error ? lastError.message : JSON.stringify(lastError))
    let suggestions: string[] = []
    
    try {
      const parsedError = JSON.parse(errorDetails)
      if (parsedError.detail) {
        errorMessage = parsedError.detail
      } else if (parsedError.message) {
        errorMessage = parsedError.message
      }
      
      // Provide specific suggestions based on error
      if (errorMessage.includes("not found") || lastStatusCode === 404) {
        suggestions = [
          "⚠️ CRITICAL: The telephony endpoint is not available",
          "This usually means:",
          "1. Telephony is NOT enabled for your ElevenLabs account/plan",
          "2. Twilio integration is NOT fully activated (wait 5-10 minutes after connecting)",
          "3. Your ElevenLabs plan doesn't include telephony features",
          "",
          "SOLUTIONS:",
          "• Go to ElevenLabs dashboard → Check if your plan includes telephony",
          "• Verify Twilio shows 'Active' (not just 'Connected') in dashboard",
          "• Wait 5-10 minutes after connecting Twilio, then refresh",
          "• Contact ElevenLabs support to enable telephony for your account",
          "• Consider using the browser-based ConvAI widget instead"
        ]
      } else if (errorMessage.includes("agent") || errorMessage.includes("Agent")) {
        suggestions = [
          "Verify your Agent ID is correct",
          "Check that the agent has telephony enabled in ElevenLabs dashboard",
          "Ensure the agent exists and is accessible"
        ]
      } else if (errorMessage.includes("phone") || errorMessage.includes("number")) {
        suggestions = [
          "Verify the phone number format (should be E.164: +[country][number])",
          "Check if the number is valid and callable",
          "Ensure your Twilio account has credits and the number is verified"
        ]
      } else if (lastStatusCode === 401 || lastStatusCode === 403) {
        suggestions = [
          "Verify your API key is correct and has telephony permissions",
          "Check that your ElevenLabs account has telephony access",
          "Ensure Twilio integration is properly connected"
        ]
      }
    } catch {
      // Error details not JSON, use as-is
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        statusCode: lastStatusCode,
        requestData: {
          phoneNumber: formattedPhone,
          agentId: finalAgentId,
          endpoint: "Multiple endpoints tried"
        },
        suggestion: suggestions.length > 0 ? suggestions.join(". ") : "ElevenLabs telephony requires Twilio integration or SIP trunking setup in the ElevenLabs dashboard.",
        instructions: [
          "Troubleshooting steps:",
          "1. Verify Twilio is connected and active in ElevenLabs dashboard",
          "2. Check that telephony is enabled for your agent",
          "3. Verify your API key has telephony permissions",
          "4. Check Twilio account has credits",
          "5. Wait 2-5 minutes after connecting Twilio for activation",
          "6. Check server console logs for detailed error messages"
        ],
        alternative: "Consider using the browser-based ConvAI widget for voice calls as an alternative"
      },
      { status: lastStatusCode || 500 }
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

