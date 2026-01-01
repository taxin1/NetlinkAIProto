import { NextRequest, NextResponse } from "next/server"
import { extractBusinessCardInfo } from "@/lib/ai/business-card"
import { checkUsageLimit } from "@/lib/plan-features"

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, userId } = await request.json()

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Image data is required" },
        { status: 400 }
      )
    }

    // Check business card scan limit
    if (userId) {
      const scanLimitCheck = await checkUsageLimit(userId, 'businessCardScans')
      if (!scanLimitCheck.allowed) {
        return NextResponse.json(
          { 
            error: scanLimitCheck.message || "You've reached your monthly business card scan limit. Upgrade to Professional for unlimited scans.",
            limitReached: true,
            limit: scanLimitCheck.limit,
            remaining: scanLimitCheck.remaining
          },
          { status: 403 }
        )
      }
    }

    try {
      const info = await extractBusinessCardInfo(imageBase64)
      
      return NextResponse.json({
        success: true,
        data: info,
      })
    } catch (error) {
      console.error("Business card extraction error:", error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to extract business card information" },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Scan card API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
