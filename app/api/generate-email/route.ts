import { NextRequest, NextResponse } from "next/server"
import { generateEmailWithGemini } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const { contactName, contactCompany, purpose } = await request.json()

    if (!contactName || !purpose) {
      return NextResponse.json(
        { error: "Contact name and purpose are required" },
        { status: 400 }
      )
    }

    try {
      const emailBody = await generateEmailWithGemini(
        contactName,
        contactCompany || "",
        purpose
      )
      
      return NextResponse.json({
        success: true,
        emailBody,
      })
    } catch (error) {
      console.error("Email generation error:", error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to generate email" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Generate email API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

