import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { callGemini } from "@/lib/gemini"

interface EmailLike {
  subject?: string | null
  body?: string | null
  created_at?: string | null
  from?: string | null
  to?: string | null
}

function buildPrompt(emails: EmailLike[], events: any[]): string {
  const formattedEmails =
    emails
      .map((e, idx) => {
        const created = e.created_at ? new Date(e.created_at).toLocaleString() : "Unknown time"
        return `${idx + 1}. ${e.from ? `From: ${e.from} | ` : ""}Subject: ${e.subject || "No subject"} (${created})\nBody: ${e.body?.slice(0, 600) || "No body"}`
      })
      .join("\n\n") || "No emails found."

  const formattedEvents =
    events
      .map((ev, idx) => {
        const created = ev.created_at || ev.start_time ? new Date(ev.start_time || ev.created_at).toLocaleString() : "Unknown time"
        return `${idx + 1}. ${ev.title || ev.summary || "Calendar item"} (${created}) - ${ev.description || ""}`
      })
      .join("\n") || "No calendar items found."

  return `You are an assistant that creates concise highlights across emails and calendar activity.

INPUT EMAILS (latest first):
${formattedEmails}

INPUT CALENDAR (latest first):
${formattedEvents}

Return 3 sections only. No markdown formatting and do not use asterisks:
- Key updates: concise bullets of what matters
- Action items: who needs to do what, deadlines if present
- Dates: upcoming meetings or important dates detected

Respond as plain text with section headers and dash bullets. Keep it brief.`
}

function parseSections(raw: string) {
  const sections = []
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)

  let current: { title: string; items: string[] } | null = null
  for (const line of lines) {
    const lower = line.toLowerCase()
    const isHeader =
      lower.startsWith("key updates") ||
      lower.startsWith("updates") ||
      lower.startsWith("action items") ||
      lower.startsWith("actions") ||
      lower.startsWith("dates") ||
      lower.startsWith("calendar")

    if (isHeader) {
      if (current) sections.push(current)
      current = { title: line.replace(/:$/, ""), items: [] }
      continue
    }

    if (line.startsWith("-")) {
      if (!current) current = { title: "Highlights", items: [] }
      current.items.push(line.replace(/^-+\s*/, ""))
    }
  }

  if (current) sections.push(current)
  return sections
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    
    let user = null
    const authHeader = req.headers.get("authorization")
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.substring(7) : null
    if (bearerToken) {
      const { data, error } = await supabase.auth.getUser(bearerToken)
      if (!error && data?.user) {
        user = data.user
      }
    }

    if (!user) {
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser()
      if (!authError && cookieUser) {
        user = cookieUser
      }
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Latest 10 emails
    const { data: emails } = await supabase
      .from("emails")
      .select("subject, body, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    // Latest 10 email replies
    const { data: replies } = await supabase
      .from("email_replies")
      .select("subject, snippet, body, from_email, received_at")
      .eq("user_id", user.id)
      .order("received_at", { ascending: false })
      .limit(10)

    // Combine sent emails and replies into email list
    const combinedEmails: EmailLike[] = [
      ...(replies || []).map((r: any) => ({
        subject: r.subject,
        body: r.snippet || r.body,
        created_at: r.received_at,
        from: r.from_email,
      })),
      ...(emails || []).map((e: any) => ({
        subject: e.subject,
        body: e.body,
        created_at: e.created_at,
      })),
    ]

    // Calendar events
    const { data: calEvents } = await supabase
      .from("calendar_events")
      .select("title, description, start_time")
      .eq("user_id", user.id)
      .order("start_time", { ascending: true })
      .limit(5)

    // Latest 5 interaction events
    const { data: events } = await supabase
      .from("events")
      .select("event_type, description, created_at")
      .eq("user_id", user.id)
      .in("event_type", ["meeting", "calendar"])
      .order("created_at", { ascending: false })
      .limit(5)

    const combinedEvents = [...(calEvents || []), ...(events || [])]

    if (combinedEmails.length === 0 && combinedEvents.length === 0) {
      return NextResponse.json({ sections: [] })
    }

    const prompt = buildPrompt(combinedEmails, combinedEvents)
    const raw = await callGemini(prompt)
    const sections = parseSections(raw)

    return NextResponse.json({ sections })
  } catch (error: any) {
    console.error("Highlights API error:", error)
    return NextResponse.json({ error: error?.message || "Failed to generate highlights" }, { status: 500 })
  }
}
