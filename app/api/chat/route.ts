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
      
      if (error instanceof Error) {
        if (error.message.includes("GEMINI_API_KEY") || error.message.includes("environment variable is not set")) {
          return NextResponse.json(
            { 
              error: "AI service not configured. GEMINI_API_KEY environment variable is missing.",
              details: process.env.NODE_ENV === "development" ? "Set GEMINI_API_KEY in your .env.local file" : "Set GEMINI_API_KEY in Vercel environment variables"
            },
            { status: 500 }
          )
        }
        
        if (error.message.includes("503") || error.message.includes("overloaded")) {
          return NextResponse.json(
            { error: "The AI service is temporarily overloaded. Please try again.", retryable: true },
            { status: 503 }
          )
        }
        
        if (error.message.includes("429")) {
          return NextResponse.json(
            { error: "Too many requests. Please wait a moment.", retryable: true },
            { status: 429 }
          )
        }
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
