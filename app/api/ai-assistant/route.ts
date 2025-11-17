import { NextRequest, NextResponse } from "next/server"
import { generateAIResponse } from "@/lib/ai/assistant"

export async function POST(request: NextRequest) {
  try {
    const { message, userId, contacts, recentEmails, conversationHistory } = await request.json()

    if (!message || !userId) {
      return NextResponse.json(
        { error: "Message and userId are required" },
        { status: 400 }
      )
    }

    try {
      const response = await generateAIResponse({
        message,
        userId,
        contacts: contacts || [],
        recentEmails: recentEmails || [],
        conversationHistory: conversationHistory || [],
      })
      
      return NextResponse.json({
        success: true,
        response,
      })
    } catch (error) {
      console.error("AI assistant error:", error)
      
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
      }
      
      return NextResponse.json(
        { 
          error: error instanceof Error ? error.message : "Failed to generate AI response",
          details: process.env.NODE_ENV === "development" && error instanceof Error ? error.message : undefined
        },
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

