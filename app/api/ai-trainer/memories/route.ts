import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: memories, error } = await supabase
      .from("ai_trainer_memories")
      .select("*")
      .eq("user_id", user.id)
      .order("importance_score", { ascending: false })
      .order("usage_count", { ascending: false })

    if (error) throw error

    return NextResponse.json({ memories: memories || [] })
  } catch (error) {
    console.error("Error fetching memories:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch memories" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { memory_type, memory_key, memory_value, importance_score = 5, metadata } = await request.json()
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!memory_type || !memory_key || !memory_value) {
      return NextResponse.json(
        { error: "memory_type, memory_key, and memory_value are required" },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from("ai_trainer_memories")
      .upsert({
        user_id: user.id,
        memory_type,
        memory_key,
        memory_value,
        importance_score,
        metadata: metadata || {},
        usage_count: 0,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, memory: data })
  } catch (error) {
    console.error("Error saving memory:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save memory" },
      { status: 500 }
    )
  }
}
