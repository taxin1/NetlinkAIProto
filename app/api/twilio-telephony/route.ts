import { NextRequest, NextResponse } from "next/server"

/**
 * Direct Twilio Telephony API Route
 * 
 * This handles making phone calls directly using Twilio, without ElevenLabs.
 * Uses Twilio Voice API with AI-generated responses converted to speech.
 * 
 * SETUP REQUIRED:
 * 1. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in environment variables
 * 2. Set NEXT_PUBLIC_APP_URL (for webhook callbacks)
 * 3. Ensure your Twilio account has credits
 */

interface InitiateCallRequest {
  phoneNumber: string
  userId: string
  context?: any // Call context for the agent
  customPrompt?: string // Custom system prompt for the agent
}

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, userId, context, customPrompt }: InitiateCallRequest = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    // Support both Account SID + Auth Token and API Key + Secret
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const apiKeySid = process.env.TWILIO_API_KEY_SID
    const apiKeySecret = process.env.TWILIO_API_KEY_SECRET
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

    // Account SID is always required (even with API Key) for the API endpoint URL
    if (!accountSid) {
      return NextResponse.json(
        { 
          error: "Twilio Account SID required",
          details: "TWILIO_ACCOUNT_SID is required (starts with AC). Get it from https://console.twilio.com. Even when using API Key authentication, you need the Account SID."
        },
        { status: 500 }
      )
    }

    // Determine which authentication method to use
    let finalAuthToken = authToken
    
    if (apiKeySid && apiKeySecret) {
      // Use API Key authentication (API Key SID + Secret)
      finalAuthToken = apiKeySecret
      // Note: We use accountSid for the URL, but API Key SID + Secret for auth
    } else if (!authToken) {
      return NextResponse.json(
        { 
          error: "Twilio authentication not configured",
          details: "Please set either TWILIO_AUTH_TOKEN or (TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET) in your environment variables"
        },
        { status: 500 }
      )
    }

    if (!twilioPhoneNumber) {
      return NextResponse.json(
        { 
          error: "Twilio phone number not configured",
          details: "Please set TWILIO_PHONE_NUMBER in your environment variables"
        },
        { status: 500 }
      )
    }

    // Format phone number (ensure it's in E.164 format)
    const formattedPhone = formatPhoneNumber(phoneNumber)

    // Generate system prompt with context if provided
    let systemPrompt = customPrompt
    if (!systemPrompt && context) {
      const { generateContextualSystemPrompt } = await import('@/lib/voice-agent/system-prompt')
      systemPrompt = generateContextualSystemPrompt(context)
    }

    // Store call context for webhook handler
    // In production, you'd use a database or cache (Redis) for this
    // For now, we'll pass it via the webhook URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const webhookUrl = `${appUrl}/api/twilio-telephony/webhook?userId=${userId}&context=${encodeURIComponent(JSON.stringify(context || {}))}`

    // Make the call using Twilio REST API
    // Account SID is used in the URL, authentication uses either Auth Token or API Key
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`
    
    // For authentication: use API Key SID + Secret if provided, otherwise Account SID + Auth Token
    const authUsername = apiKeySid || accountSid
    const authPassword = finalAuthToken
    
    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${Buffer.from(`${authUsername}:${authPassword}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        From: twilioPhoneNumber,
        To: formattedPhone,
        Url: webhookUrl,
        Method: "POST",
        StatusCallback: `${appUrl}/api/twilio-telephony/status?userId=${userId}`,
        StatusCallbackEvent: "initiated,ringing,answered,completed",
        StatusCallbackMethod: "POST",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("[Twilio] Call initiation failed:", errorText)
      
      let errorMessage = "Failed to initiate call"
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.message || errorText
      } catch {
        errorMessage = errorText
      }

      return NextResponse.json(
        { 
          error: errorMessage,
          details: errorText
        },
        { status: response.status }
      )
    }

    const result = await response.json()
    
    console.log("[Twilio] Call initiated successfully:", result.sid)

    return NextResponse.json({
      success: true,
      callId: result.sid,
      status: result.status || "initiated",
      phoneNumber: formattedPhone,
      twilioCallSid: result.sid
    })
  } catch (error) {
    console.error("Twilio telephony error:", error)
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

    // Support both Account SID + Auth Token and API Key + Secret
    const accountSid = process.env.TWILIO_ACCOUNT_SID
    const authToken = process.env.TWILIO_AUTH_TOKEN
    const apiKeySid = process.env.TWILIO_API_KEY_SID
    const apiKeySecret = process.env.TWILIO_API_KEY_SECRET

    if (!accountSid) {
      return NextResponse.json(
        { error: "Twilio Account SID not configured" },
        { status: 500 }
      )
    }

    // Determine authentication method
    let finalAuthToken = authToken
    let authUsername = accountSid

    if (apiKeySid && apiKeySecret) {
      // Use API Key authentication
      authUsername = apiKeySid
      finalAuthToken = apiKeySecret
    } else if (!authToken) {
      return NextResponse.json(
        { error: "Twilio authentication not configured" },
        { status: 500 }
      )
    }

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls/${callId}.json`,
      {
        method: "GET",
        headers: {
          "Authorization": `Basic ${Buffer.from(`${authUsername}:${finalAuthToken}`).toString("base64")}`,
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
    return NextResponse.json({
      status: result.status,
      duration: result.duration,
      direction: result.direction,
      from: result.from,
      to: result.to,
      startTime: result.startTime,
      endTime: result.endTime
    })
  } catch (error) {
    console.error("Get call status error:", error)
    return NextResponse.json(
      { error: "Failed to get call status" },
      { status: 500 }
    )
  }
}

