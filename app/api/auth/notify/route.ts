import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { AuthNotificationType } from "@/lib/email/auth-templates"
import { sendAuthNotificationEmail } from "@/lib/email/auth-notify"

const SESSION_REQUIRED: AuthNotificationType[] = [
  "login",
  "oauth_login",
  "password_reset_success",
]

const PUBLIC_TYPES: AuthNotificationType[] = [
  "signup",
  "password_reset_requested",
]

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const type = body.type as AuthNotificationType
    const provider = body.provider as string | undefined

    if (!type) {
      return NextResponse.json({ error: "Missing notification type" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let email: string | undefined

    if (SESSION_REQUIRED.includes(type)) {
      if (!user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      email = user.email
    } else if (PUBLIC_TYPES.includes(type)) {
      email = (body.email as string) || user?.email
      if (!email) {
        return NextResponse.json({ error: "Email required" }, { status: 400 })
      }
    } else {
      return NextResponse.json({ error: "Invalid notification type" }, { status: 400 })
    }

    await sendAuthNotificationEmail(type, email, { provider })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[Auth notify API]", error)
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    )
  }
}
