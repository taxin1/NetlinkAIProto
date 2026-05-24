import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkUsageLimit, getUserPlan } from "@/lib/plan-features"

export async function GET() {
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const plan = await getUserPlan(user.id)
    const usageCheck = await checkUsageLimit(user.id, "eventMatchmaking")

    return NextResponse.json({
      allowed: usageCheck.allowed,
      limit: usageCheck.limit,
      remaining: usageCheck.remaining,
      usage:
        usageCheck.limit !== null && usageCheck.remaining !== null
          ? usageCheck.limit - usageCheck.remaining
          : 0,
      plan,
      isPro: usageCheck.limit === null,
      requiresPro: plan === "free" && !usageCheck.allowed,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to check usage"
    console.error("Error checking event matchmaking usage:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
