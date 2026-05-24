import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkUsageLimit } from "@/lib/plan-features"
import {
  generateEventMatches,
  type MatchCandidate,
  type EventMatchResult,
} from "@/lib/ai/event-matchmaking"

export async function POST(request: Request) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const usageCheck = await checkUsageLimit(user.id, "eventMatchmaking")
    if (!usageCheck.allowed) {
      return NextResponse.json(
        {
          error: usageCheck.message || "Event matchmaking limit reached",
          requiresPro: true,
        },
        { status: 403 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const eventId = typeof body.eventId === "string" ? body.eventId : null
    const goalsOverride = typeof body.goals === "string" ? body.goals.trim() : ""
    const interestsOverride = Array.isArray(body.interests)
      ? body.interests.map(String).filter(Boolean)
      : []

    const [profileResult, prefsResult, contactsResult, networkersResult, portfoliosResult] =
      await Promise.all([
        supabase
          .from("network_profiles")
          .select("name, title, company, email")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("event_matchmaking_preferences")
          .select("goals, interests")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("contacts")
          .select("id, name, company, position, email, linkedin_url, notes, tags, where_met")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(30),
        supabase
          .from("network_profiles")
          .select("user_id, name, title, company, email, linkedin, is_public_profile")
          .eq("is_public_profile", true)
          .neq("user_id", user.id)
          .limit(40),
        supabase
          .from("portfolios")
          .select("user_id, slug, bio, is_public")
          .eq("is_public", true),
      ])

    let event: {
      title: string
      description?: string | null
      location?: string | null
      startTime?: string | null
    } | null = null

    if (eventId) {
      const { data: calendarEvent } = await supabase
        .from("calendar_events")
        .select("title, description, location, start_time")
        .eq("id", eventId)
        .eq("user_id", user.id)
        .single()

      if (calendarEvent) {
        event = {
          title: calendarEvent.title,
          description: calendarEvent.description,
          location: calendarEvent.location,
          startTime: calendarEvent.start_time,
        }
      }
    }

    const portfoliosByUser = new Map<string, { slug: string; bio: string | null }>()
    for (const p of portfoliosResult.data ?? []) {
      if (!portfoliosByUser.has(p.user_id)) {
        portfoliosByUser.set(p.user_id, { slug: p.slug, bio: p.bio })
      }
    }

    const candidates: MatchCandidate[] = []

    for (const contact of contactsResult.data ?? []) {
      candidates.push({
        id: contact.id,
        type: "contact",
        name: contact.name,
        title: contact.position,
        company: contact.company,
        email: contact.email,
        linkedin: contact.linkedin_url,
        bio: contact.notes,
        interests: Array.isArray(contact.tags) ? contact.tags : [],
      })
    }

    for (const networker of networkersResult.data ?? []) {
      const portfolio = portfoliosByUser.get(networker.user_id)
      candidates.push({
        id: networker.user_id,
        type: "networker",
        name: networker.name || "Networker",
        title: networker.title,
        company: networker.company,
        email: networker.email,
        linkedin: networker.linkedin,
        bio: portfolio?.bio ?? null,
        portfolioSlug: portfolio?.slug ?? null,
      })
    }

    const userGoals = goalsOverride || prefsResult.data?.goals || ""
    const userInterests =
      interestsOverride.length > 0
        ? interestsOverride
        : prefsResult.data?.interests ?? []

    const matches: EventMatchResult[] = await generateEventMatches({
      userProfile: {
        name: profileResult.data?.name,
        title: profileResult.data?.title,
        company: profileResult.data?.company,
        goals: userGoals,
        interests: userInterests,
      },
      event,
      candidates,
    })

    const enrichedMatches = matches.map((match) => {
      const candidate = candidates.find((c) => c.id === match.id && c.type === match.type)
      return {
        ...match,
        name: candidate?.name ?? "Unknown",
        title: candidate?.title,
        company: candidate?.company,
        email: candidate?.email,
        linkedin: candidate?.linkedin,
        portfolioSlug: candidate?.portfolioSlug,
      }
    })

    const { data: existingUsage } = await supabase
      .from("event_matchmaking_usage")
      .select("usage_count")
      .eq("user_id", user.id)
      .maybeSingle()

    const newCount = (existingUsage?.usage_count ?? 0) + 1
    await supabase.from("event_matchmaking_usage").upsert(
      {
        user_id: user.id,
        usage_count: newCount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )

    return NextResponse.json({
      matches: enrichedMatches,
      event,
      candidateCount: candidates.length,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate matches"
    console.error("Event matchmaking suggest error:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
