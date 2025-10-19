import { NextRequest, NextResponse } from "next/server"
import { generateChatResponse } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    try {
      const response = await generateChatResponse(message)
      
      return NextResponse.json({
        response: response,
      })
    } catch (error) {
      console.error("AI service error:", error)
      
      // Check if it's an API key issue
      if (error instanceof Error && error.message.includes("GEMINI_API_KEY")) {
        return NextResponse.json(
          { error: "AI service not configured. Please contact support." },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { error: "AI service temporarily unavailable. Please try again later." },
        { status: 503 }
      )
    }
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
