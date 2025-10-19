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

