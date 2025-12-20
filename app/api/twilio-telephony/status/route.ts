import { NextRequest, NextResponse } from "next/server"

/**
 * Twilio Status Callback Handler
 * 
 * Receives call status updates from Twilio (initiated, ringing, answered, completed)
 */

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const callSid = formData.get("CallSid") as string
    const callStatus = formData.get("CallStatus") as string
    const from = formData.get("From") as string
    const to = formData.get("To") as string
    const duration = formData.get("CallDuration") as string

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || ""

    console.log(`[Twilio Status] Call ${callSid}: ${callStatus}`, {
      from,
      to,
      duration,
      userId
    })

    // In production, you'd store this in a database
    // For now, just log it
    
    return NextResponse.json({ 
      success: true,
      callSid,
      status: callStatus 
    })
  } catch (error) {
    console.error("Twilio status callback error:", error)
    return NextResponse.json(
      { error: "Failed to process status callback" },
      { status: 500 }
    )
  }
}

