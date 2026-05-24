import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendSystemEmail } from "@/lib/email/smtp"
import { buildQuotationRequestEmail } from "@/lib/email/template"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { projectName, clientNeeds, projectBudget, rawTranscript } = body

    if (!projectName || !clientNeeds) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const adminEmail =
      process.env.ADMIN_EMAIL ||
      process.env.SMTP_USER ||
      process.env.GMAIL_USER ||
      "cognisor.ai@gmail.com"

    const { html, text } = buildQuotationRequestEmail({
      clientEmail: user.email ?? "unknown",
      projectName,
      projectBudget,
      clientNeeds,
      rawTranscript,
    })

    const result = await sendSystemEmail({
      to: adminEmail,
      subject: `New Quotation Request: ${projectName}`,
      replyTo: user.email,
      html,
      text,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to send quotation. Check SMTP settings." },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: "Quotation sent successfully" })
  } catch (error) {
    console.error("Error sending quotation email:", error)
    return NextResponse.json(
      { error: "Failed to send quotation. Please check your email settings." },
      { status: 500 }
    )
  }
}
