import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendEmailWithSettings } from "@/lib/email/smtp"
import { buildTestEmail } from "@/lib/email/template"

export async function GET(request: NextRequest) {
  return await sendTestEmail()
}

export async function POST(request: NextRequest) {
  return await sendTestEmail()
}

async function sendTestEmail() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userSettings, error: settingsError } = await supabase
      .from("user_email_settings")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    const senderEmail =
      userSettings?.email_address ||
      process.env.SMTP_USER ||
      process.env.GMAIL_USER

    if (!senderEmail && settingsError) {
      return NextResponse.json(
        {
          error: "Email not configured",
          message: "Configure SMTP in .env or Settings → Email Configuration",
        },
        { status: 400 }
      )
    }

    const { html, text, subject } = buildTestEmail()

    const result = await sendEmailWithSettings(
      userSettings && !settingsError ? userSettings : null,
      {
        to: senderEmail!,
        subject,
        text,
        html,
        fallbackFromName: user.email ?? undefined,
      }
    )

    if (!result.success) {
      let troubleshooting = {}
      if (result.error.includes("Invalid login")) {
        troubleshooting = {
          issue: "Invalid email credentials",
          solution: "Check SMTP_USER and SMTP_PASS (use a Gmail App Password for Gmail)",
        }
      }
      return NextResponse.json(
        { error: result.error, troubleshooting },
        { status: result.needsConfiguration ? 400 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully!",
      details: {
        messageId: result.messageId,
        from: senderEmail,
        to: senderEmail,
        timestamp: new Date().toISOString(),
        usedUserSettings: !!userSettings,
      },
      nextSteps: "Check your inbox (and spam folder) for the test email!",
    })
  } catch (error) {
    console.error("Test email error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to send test email",
      },
      { status: 500 }
    )
  }
}
