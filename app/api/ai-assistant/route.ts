import { NextRequest, NextResponse } from "next/server"
import { generateAIResponse } from "@/lib/ai/assistant"
import { loadUserAIContext } from "@/lib/ai/contact-context"
import { checkUsageLimit } from "@/lib/plan-features"
import { isGuest } from "@/lib/guest-trial"

export async function POST(request: NextRequest) {
  try {
    const { message, userId, contacts, recentEmails, conversationHistory } = await request.json()

    if (!message || !userId) {
      return NextResponse.json(
        { error: "Message and userId are required" },
        { status: 400 }
      )
    }

    // Check AI assistant message limit
    const messageLimitCheck = await checkUsageLimit(userId, 'aiAssistantMessages')
    if (!messageLimitCheck.allowed) {
      return NextResponse.json(
        {
          error: messageLimitCheck.message || "You've reached your daily AI assistant message limit. Upgrade to Professional for unlimited messages.",
          limitReached: true,
          limit: messageLimitCheck.limit,
          remaining: messageLimitCheck.remaining
        },
        { status: 403 }
      )
    }

    let userContext
    if (!isGuest(userId)) {
      try {
        userContext = await loadUserAIContext(userId)
      } catch (err) {
        console.warn("Could not load user AI context:", err)
      }
    }

    try {
      const response = await generateAIResponse({
        message,
        userId,
        contacts: contacts || [],
        recentEmails: recentEmails || [],
        conversationHistory: conversationHistory || [],
        userContext,
      })

      return NextResponse.json({
        success: true,
        response,
      })
    } catch (error) {
      console.error("AI assistant error:", error)

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
      }

      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to generate AI response" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("AI assistant API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
