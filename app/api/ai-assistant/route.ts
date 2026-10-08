import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/supabase/server"
import { generateAIResponse } from "@/lib/ai/assistant"
import { loadUserAIContext } from "@/lib/ai/contact-context"
import { checkUsageLimit } from "@/lib/plan-features"

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(request)

    const body = await request.json().catch(() => ({}))
    const { message, contacts, recentEmails, conversationHistory } = body

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    const guestCookie = request.cookies.get("netlink_guest_id")?.value
    const isGuestRequest = !user && (guestCookie || (typeof body.userId === "string" && body.userId.startsWith("guest")))

    if (!user && !isGuestRequest) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedUserId = user ? user.id : (guestCookie || body.userId || "guest")

    // Check AI assistant message limit for authenticated users
    if (user) {
      const messageLimitCheck = await checkUsageLimit(user.id, "aiAssistantMessages")
      if (!messageLimitCheck.allowed) {
        return NextResponse.json(
          {
            error: messageLimitCheck.message || "You've reached your daily AI assistant message limit. Upgrade to Professional for unlimited messages.",
            limitReached: true,
            limit: messageLimitCheck.limit,
            remaining: messageLimitCheck.remaining,
          },
          { status: 403 }
        )
      }
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
      const response = await generateAIResponse({
        message,
        userId: resolvedUserId,
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
              details: process.env.NODE_ENV === "development"
                ? "Set GEMINI_API_KEY in your .env.local file"
                : "Set GEMINI_API_KEY in server environment variables",
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
