import { NextRequest, NextResponse } from "next/server"
import { generateChatResponse } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    // Debug: Log environment variable status (only in development or if explicitly enabled)
    if (process.env.NODE_ENV === "development" || process.env.DEBUG_ENV === "true") {
      console.log("Environment check:", {
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
        geminiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
        nodeEnv: process.env.NODE_ENV,
      })
    }

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
      if (error instanceof Error) {
        if (error.message.includes("GEMINI_API_KEY") || error.message.includes("environment variable is not set")) {
          console.error("Missing GEMINI_API_KEY environment variable")
          return NextResponse.json(
            { 
              error: "AI service not configured. GEMINI_API_KEY environment variable is missing. Please configure it in your deployment settings.",
              details: process.env.NODE_ENV === "development" ? "Set GEMINI_API_KEY in your .env.local file" : "Set GEMINI_API_KEY in Netlify environment variables"
            },
            { status: 500 }
          )
        }
        
        // Check for timeout errors
        if (error.message.includes("timeout") || error.message.includes("TIMEOUT")) {
          console.error("AI service timeout")
          return NextResponse.json(
            { error: "AI service request timed out. The request took too long to process. Please try again." },
            { status: 504 }
          )
        }
        
        // Check for network errors
        if (error.message.includes("fetch") || error.message.includes("network") || error.message.includes("ECONNREFUSED")) {
          console.error("AI service network error")
          return NextResponse.json(
            { error: "Unable to connect to AI service. Please check your internet connection and try again." },
            { status: 503 }
          )
        }
      }
      
      // Generic error
      return NextResponse.json(
        { 
          error: "AI service temporarily unavailable. Please try again later.",
          details: process.env.NODE_ENV === "development" ? error instanceof Error ? error.message : "Unknown error" : undefined
        },
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
