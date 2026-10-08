import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/supabase/server"
import { generateChatResponse } from "@/lib/ai/assistant"
import { loadUserAIContext } from "@/lib/ai/contact-context"

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(request)
    const body = await request.json().catch(() => ({}))
    const {
      message,
      language = "en",
      conversationHistory = [],
    } = body

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    let userContext
    // Only load database user context for verified authenticated users
    if (user) {
      try {
        userContext = await loadUserAIContext(user.id)
      } catch (err) {
        console.warn("Could not load user AI context:", err)
      }
    }

    try {
      console.log(`Chat API: Calling generateChatResponse (lang: ${language}) with message:`, message.substring(0, 50))
      const response = await generateChatResponse(message, {
        language,
        userContext,
        conversationHistory,
      })
      console.log("Chat API: Got response successfully")

      return NextResponse.json({
        response: response,
      })
    } catch (error) {
      console.error("AI service error:", error)
      console.error("Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)))

      if (error instanceof Error) {
        // Check for missing API key (Gemini)
        if (error.message.includes("GEMINI_API_KEY") || error.message.includes("environment variable is not set")) {
          return NextResponse.json(
            {
              error: "AI service not configured. GEMINI_API_KEY environment variable is missing.",
              details: process.env.NODE_ENV === "development"
                ? "Set GEMINI_API_KEY in your .env.local file. Get your key from https://aistudio.google.com/app/apikey"
                : "Set GEMINI_API_KEY in your deployment environment variables. Get your key from https://aistudio.google.com/app/apikey"
            },
            { status: 500 }
          )
        }

        // Check for Gemini API errors
        if (error.message.includes("Gemini API")) {
          const errorMsg = error.message.toLowerCase()

          if (errorMsg.includes("503") || errorMsg.includes("overloaded") || errorMsg.includes("unavailable")) {
            return NextResponse.json(
              { error: "The AI service (Gemini) is temporarily overloaded. Please try again in a moment.", retryable: true },
              { status: 503 }
            )
          }

          if (errorMsg.includes("429") || errorMsg.includes("rate limit")) {
            return NextResponse.json(
              { error: "Too many requests to the AI service. Please wait a moment before trying again.", retryable: true },
              { status: 429 }
            )
          }

          if (errorMsg.includes("401") || errorMsg.includes("unauthorized")) {
            return NextResponse.json(
              { error: "AI service authentication failed. Please check your GEMINI_API_KEY.", retryable: false },
              { status: 401 }
            )
          }

          // Return the specific Gemini error
          return NextResponse.json(
            { error: `AI service error: ${error.message}`, retryable: false },
            { status: 500 }
          )
        }

        // Network or connection errors
        if (error.message.includes("network") || error.message.includes("fetch") || error.message.includes("ECONNREFUSED")) {
          return NextResponse.json(
            { error: "Unable to connect to AI service. Please check your internet connection and try again.", retryable: true },
            { status: 503 }
          )
        }
      }

      // Generic fallback error
      return NextResponse.json(
        {
          error: "AI service temporarily unavailable. Please try again later.",
          details: error instanceof Error ? error.message : "Unknown error occurred"
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
