import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/supabase/server"
import { generateEmailWithGemini } from "@/lib/gemini"
import { checkUsageLimit } from "@/lib/plan-features"

export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getAuthenticatedUser(request)

    const body = await request.json().catch(() => ({}))
    const { contactName, contactCompany, purpose, contactId } = body

    if (!contactName || !purpose) {
      return NextResponse.json(
        { error: "Contact name and purpose are required" },
        { status: 400 }
      )
    }

    // Determine guest mode
    const guestCookie = request.cookies.get("netlink_guest_id")?.value
    const isGuestRequest = !user && (guestCookie || (typeof body.userId === "string" && body.userId.startsWith("guest")))

    if (!user && !isGuestRequest) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check AI email generation limit for authenticated users
    if (user) {
      const emailLimitCheck = await checkUsageLimit(user.id, "aiEmailGeneration")
      if (!emailLimitCheck.allowed) {
        return NextResponse.json(
          {
            error: emailLimitCheck.message || "You've reached your monthly AI email generation limit. Upgrade to Professional for unlimited AI emails.",
            limitReached: true,
            limit: emailLimitCheck.limit,
            remaining: emailLimitCheck.remaining,
          },
          { status: 403 }
        )
      }
    }

    let userProfile: any = {}
    let contactDetails: any = {}
    let previousEmails: any[] = []
    let aiMemories: any[] = []

    if (user) {
      userProfile = {
        name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        email: user.email || "",
        displayName: user.user_metadata?.full_name || user.email?.split("@")[0] || "",
      }

      // Fetch detailed contact information only for contacts owned by the authenticated user
      if (contactId) {
        const { data: contact } = await supabase
          .from("contacts")
          .select("*")
          .eq("id", contactId)
          .eq("user_id", user.id)
          .single()

        if (contact) {
          contactDetails = {
            name: contact.name,
            email: contact.email,
            company: contact.company,
            position: contact.position,
            notes: contact.notes,
            where_met: contact.where_met,
            met_at: contact.met_at,
            linkedin_url: contact.linkedin_url,
            tags: contact.tags || [],
          }

          // Fetch previous emails strictly for caller and contact
          const { data: emails } = await supabase
            .from("emails")
            .select("subject, body, created_at, status")
            .eq("contact_id", contactId)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(3)

          previousEmails = emails || []

          // Fetch recent events/interactions strictly for caller and contact
          const { data: events } = await supabase
            .from("events")
            .select("event_type, description, created_at")
            .eq("contact_id", contactId)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(3)

          if (events && events.length > 0) {
            contactDetails.recentInteractions = events
          }
        }
      }

      // Fetch caller's AI memories
      const { data: memories } = await supabase
        .from("ai_trainer_memories")
        .select("*")
        .eq("user_id", user.id)
        .order("importance_score", { ascending: false })
        .limit(20)

      aiMemories = memories || []

      if (aiMemories.length > 0) {
        for (const memory of aiMemories) {
          await supabase
            .from("ai_trainer_memories")
            .update({
              usage_count: (memory.usage_count || 0) + 1,
              last_used_at: new Date().toISOString(),
            })
            .eq("id", memory.id)
            .eq("user_id", user.id)
        }
      }
    }

    const emailBody = await generateEmailWithGemini({
      contactName: contactDetails.name || contactName,
      contactCompany: contactDetails.company || contactCompany || "",
      contactPosition: contactDetails.position || "",
      contactNotes: contactDetails.notes || "",
      contactWhereMet: contactDetails.where_met || "",
      contactMetAt: contactDetails.met_at || "",
      contactLinkedIn: contactDetails.linkedin_url || "",
      contactTags: contactDetails.tags || [],
      userProfile: Object.keys(userProfile).length > 0 ? userProfile : undefined,
      purpose,
      previousEmails: previousEmails.length > 0 ? previousEmails : undefined,
      recentInteractions: contactDetails.recentInteractions && contactDetails.recentInteractions.length > 0
        ? contactDetails.recentInteractions
        : undefined,
      userId: user?.id,
      aiMemories: aiMemories.length > 0 ? aiMemories : undefined,
    })

    if (!emailBody || typeof emailBody !== "string") {
      return NextResponse.json(
        { error: "Failed to generate email: Invalid response from AI" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      emailBody,
    })
  } catch (error) {
    console.error("Generate email API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    )
  }
}
