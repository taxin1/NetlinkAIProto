import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GEMINI_MODEL, GEMINI_API_BASE } from "@/lib/gemini"

interface CommandIntent {
  action: string
  parameters: Record<string, any>
  needsConfirmation: boolean
  response: string
}

export async function POST(request: NextRequest) {
  try {
    const { command, userId } = await request.json()

    if (!command || !userId) {
      return NextResponse.json(
        { error: "Command and userId are required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const [contactsResult, emailsResult, eventsResult] = await Promise.all([
      supabase.from("contacts").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
      supabase.from("emails").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
      supabase.from("calendar_events").select("*").eq("user_id", userId).order("event_date", { ascending: true }).limit(5),
    ])

    const contacts = contactsResult.data || []
    const emails = emailsResult.data || []
    const events = eventsResult.data || []

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set")
    }

    const prompt = `You are a voice command parser for Netlink Cogni, an AI-powered business networking platform.

AVAILABLE VOICE ACTIONS:
- send_email: Send an email to a contact (requires confirmation)
- create_contact: Add a new contact with name, email, company, phone, LinkedIn, notes
- view_contacts: Show the user's contacts list
- create_event: Create a new calendar event
- view_events: Show upcoming events
- search_contact: Search for a specific contact
- get_stats: Show dashboard statistics
- general_query: Answer general questions

Voice command: "${command}"

User's recent contacts: ${contacts.map(c => `${c.name} (${c.email})`).join(", ")}
Recent events: ${events.map(e => e.title).join(", ")}

Respond with ONLY a JSON object:
{
  "action": "action_name",
  "parameters": {},
  "needsConfirmation": true/false,
  "response": "Natural language response (no asterisks, plain text)"
}`

    const response = await fetch(
      `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemini API request failed (${response.status}): ${errorText}`)
    }

    const data = await response.json()

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error("No valid response from Gemini API")
    }

    const responseText = data.candidates[0].content.parts[0].text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      return NextResponse.json({
        action: "general_query",
        parameters: {},
        needsConfirmation: false,
        response: "I'm not sure what you'd like me to do. Could you please rephrase that?",
      })
    }

    const intent: CommandIntent = JSON.parse(jsonMatch[0])

    if (!intent.needsConfirmation) {
      switch (intent.action) {
        case "send_email":
          intent.needsConfirmation = true
          intent.response = `I'll help you send an email. ${intent.response}`
          break
        case "create_contact":
          if (intent.parameters.name && intent.parameters.email) {
            const { error } = await supabase.from("contacts").insert({
              user_id: userId,
              name: intent.parameters.name,
              email: intent.parameters.email,
              company: intent.parameters.company || null,
              phone: intent.parameters.phone || null,
              notes: intent.parameters.notes || null,
            })
            intent.response = error ? "I encountered an error while adding the contact." : `Great! I've added ${intent.parameters.name} to your contacts.`
          } else {
            intent.needsConfirmation = true
            intent.response = "To add a contact, I need at least a name and email address."
          }
          break
        case "view_contacts":
          intent.response = `You have ${contacts.length} recent contacts: ${contacts.slice(0, 5).map(c => c.name).join(", ")}.`
          break
        case "view_events":
          intent.response = events.length > 0 
            ? `You have ${events.length} upcoming events. Your next event is "${events[0].title}".`
            : "You don't have any upcoming events scheduled."
          break
        case "get_stats":
          intent.response = `You have ${contacts.length} contacts, ${emails.length} recent emails, and ${events.length} upcoming events.`
          break
      }
    }

    return NextResponse.json(intent)
  } catch (error) {
    console.error("Voice command error:", error)
    return NextResponse.json(
      { error: "Failed to process voice command", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
