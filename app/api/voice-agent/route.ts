import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GEMINI_MODEL, GEMINI_API_BASE } from "@/lib/gemini"

interface AgentAction {
  action: string
  parameters: Record<string, any>
  needsConfirmation: boolean
  response: string
  data?: any
}

export async function POST(request: NextRequest) {
  try {
    const { command, userId, context } = await request.json()

    if (!command || !userId) {
      return NextResponse.json({ error: "Command and userId are required" }, { status: 400 })
    }

    const supabase = await createClient()

    const [contactsResult, emailsResult, eventsResult, profileResult] = await Promise.all([
      supabase.from("contacts").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50),
      supabase.from("emails").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
      supabase.from("calendar_events").select("*").eq("user_id", userId).order("event_date", { ascending: true }).limit(20),
      supabase.auth.getUser(),
    ])

    const contacts = contactsResult.data || []
    const emails = emailsResult.data || []
    const events = eventsResult.data || []
    const userProfile = profileResult.data?.user

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured")
    }

    const contactsList = contacts.map(c => ({ name: c.name, email: c.email, company: c.company, role: c.role, interests: c.notes, tags: c.tags }))
    const eventsList = events.map(e => ({ title: e.title, date: e.event_date, location: e.location, description: e.description }))

    const prompt = `You are ARIA, an AI Voice Agent for Netlink Cogni - a professional networking platform.

USER CONTEXT:
- User Email: ${userProfile?.email || "Unknown"}
- Total Contacts: ${contacts.length}
- Upcoming Events: ${events.length}

CONTACTS: ${JSON.stringify(contactsList.slice(0, 20), null, 2)}
EVENTS: ${JSON.stringify(eventsList.slice(0, 10), null, 2)}

AVAILABLE ACTIONS:
send_email, create_event, add_contact, search_contacts, find_similar_interests, view_contacts, view_events, get_stats, analyze_network, general_query

USER COMMAND: "${command}"
${context ? `CONTEXT: ${context}` : ""}

Respond with ONLY a JSON object:
{
  "action": "action_name",
  "parameters": {},
  "needsConfirmation": true/false,
  "response": "Natural spoken response (no asterisks)",
  "data": null
}

For data-modifying actions (send_email, create_event, add_contact), set needsConfirmation to true.`

    const response = await fetch(
      `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!responseText) {
      throw new Error("No response from AI")
    }

    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({
        action: "general_query",
        parameters: {},
        needsConfirmation: false,
        response: "I'm not sure I understood that. Could you please rephrase?",
        data: null,
      })
    }

    const intent: AgentAction = JSON.parse(jsonMatch[0])

    if (!intent.needsConfirmation) {
      switch (intent.action) {
        case "view_contacts":
          intent.data = contacts.slice(0, 10).map(c => ({ name: c.name, email: c.email, company: c.company }))
          intent.response = `You have ${contacts.length} contacts. Here are the most recent ones.`
          break
        case "view_events":
          intent.data = events.slice(0, 5).map(e => ({ title: e.title, date: e.event_date, location: e.location }))
          intent.response = events.length > 0 ? `You have ${events.length} upcoming events. Your next event is ${events[0]?.title}.` : "You don't have any upcoming events scheduled."
          break
        case "get_stats":
          intent.data = { totalContacts: contacts.length, totalEmails: emails.length, upcomingEvents: events.length }
          break
        case "analyze_network":
          const companies = new Set(contacts.map(c => c.company).filter(Boolean))
          intent.data = { totalContacts: contacts.length, uniqueCompanies: companies.size, topCompanies: Array.from(companies).slice(0, 5) }
          break
      }
    }

    return NextResponse.json(intent)
  } catch (error) {
    console.error("Voice agent error:", error)
    return NextResponse.json(
      { action: "error", parameters: {}, needsConfirmation: false, response: "I encountered an error. Please try again.", data: null },
      { status: 500 }
    )
  }
}
