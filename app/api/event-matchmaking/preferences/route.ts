import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("event_matchmaking_preferences")
    .select("goals, interests, is_discoverable")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    goals: data?.goals ?? "",
    interests: data?.interests ?? [],
    isDiscoverable: data?.is_discoverable ?? false,
  })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const goals = typeof body.goals === "string" ? body.goals.trim() : ""
  const interests = Array.isArray(body.interests)
    ? body.interests.map(String).filter(Boolean).slice(0, 12)
    : []
  const isDiscoverable = Boolean(body.isDiscoverable)

  const { error } = await supabase.from("event_matchmaking_preferences").upsert(
    {
      user_id: user.id,
      goals,
      interests,
      is_discoverable: isDiscoverable,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  )

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
