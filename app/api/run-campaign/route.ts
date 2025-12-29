import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { campaignId, userId } = await request.json()

    if (!campaignId || !userId) {
      return NextResponse.json(
        { error: "Campaign ID and user ID are required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verify user owns the campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("email_campaigns")
      .select("*")
      .eq("id", campaignId)
      .eq("user_id", userId)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      )
    }

    // Update campaign status to running
    // The actual sending will be handled by the frontend component
    const { error: updateError } = await supabase
      .from("email_campaigns")
      .update({ status: "running" })
      .eq("id", campaignId)

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to start campaign" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Campaign started successfully",
      campaignId: campaignId,
    })
  } catch (error) {
    console.error("Run campaign error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
