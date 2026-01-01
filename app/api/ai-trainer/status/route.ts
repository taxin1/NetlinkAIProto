import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: status, error } = await supabase
      .from("ai_trainer_status")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found" which is okay for new users
      throw error
    }

    return NextResponse.json({
      status: status || {
        user_id: user.id,
        is_training: false,
        last_trained_at: null,
        training_progress: 0,
        total_memories: 0,
        model_version: null,
      },
    })
  } catch (error) {
    console.error("Error fetching trainer status:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch status" },
      { status: 500 }
    )
  }
}
