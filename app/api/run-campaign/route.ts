import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedUser(request)

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const { campaignId } = body

    if (!campaignId) {
      return NextResponse.json(
        { error: "Campaign ID is required" },
        { status: 400 }
      )
    }

    // Verify authenticated user owns the campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("email_campaigns")
      .select("id, status")
      .eq("id", campaignId)
      .eq("user_id", user.id)
      .single()

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: "Campaign not found or unauthorized" },
        { status: 404 }
      )
    }

    // Update campaign status to running strictly for caller's campaign
    const { error: updateError } = await supabase
      .from("email_campaigns")
      .update({ status: "running" })
      .eq("id", campaignId)
      .eq("user_id", user.id)

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
