import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/supabase/server"

/**
 * Server route to generate signed conversation URL / token for ElevenLabs Conversational AI.
 * Keeps ELEVENLABS_API_KEY strictly on the server and protects private agent credentials.
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const agentId =
      body.agentId ||
      request.nextUrl.searchParams.get("agentId") ||
      process.env.ELEVENLABS_AGENT_ID ||
      process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID

    if (!agentId) {
      return NextResponse.json(
        { error: "Agent ID is required. Configure ELEVENLABS_AGENT_ID on the server." },
        { status: 400 }
      )
    }

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "ELEVENLABS_API_KEY is not configured on the server." },
        { status: 503 }
      )
    }

    // Call ElevenLabs Conversational AI to get a temporary signed URL
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${encodeURIComponent(agentId)}`,
      {
        method: "GET",
        headers: {
          "xi-api-key": apiKey,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("ElevenLabs signed URL error:", response.status, errorText)
      return NextResponse.json(
        {
          error: "Failed to generate conversation session from ElevenLabs API.",
          status: response.status,
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({
      success: true,
      signedUrl: data.signed_url,
      agentId,
    })
  } catch (error) {
    console.error("Error in elevenlabs conversation token route:", error)
    return NextResponse.json(
      { error: "Internal server error generating conversation session." },
      { status: 500 }
    )
  }
}

