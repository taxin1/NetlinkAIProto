import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    const supabase = createClient()

    // Get user context (recent contacts, emails, etc.)
    const [contactsResult, emailsResult, eventsResult] = await Promise.all([
      supabase
        .from("contacts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("emails")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", userId)
        .order("event_date", { ascending: true })
        .limit(5),
    ])

    const contacts = contactsResult.data || []
    const emails = emailsResult.data || []
    const events = eventsResult.data || []

    // Use Gemini to parse the command and extract intent
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set")
    }

    const prompt = `You are a voice command parser for a networking and email management application.
Parse the following voice command and determine the user's intent.

Available actions:
- send_email: Send an email to a contact
- create_contact: Add a new contact
- view_contacts: Show contacts list
- create_event: Create a new event
- view_events: Show upcoming events
- search_contact: Search for a specific contact
- get_stats: Show dashboard statistics
- general_query: Answer general questions

Voice command: "${command}"

User's recent contacts: ${contacts.map(c => `${c.name} (${c.email})`).join(", ")}
Recent events: ${events.map(e => e.title).join(", ")}

Respond with a JSON object containing:
{
  "action": "action_name",
  "parameters": {
    // extracted parameters like recipient, subject, message, name, email, etc.
  },
  "needsConfirmation": true/false,
  "response": "A natural language response to say back to the user"
}

For send_email action, try to match contact names from the user's contacts list.
For create_contact action, extract name, email, company, and other details.
For create_event action, extract title, date, location, and description.

If the command is unclear or missing information, set needsConfirmation to true and ask for clarification in the response.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
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
    
    // Extract JSON from the response
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

    // Execute action if no confirmation needed
    if (!intent.needsConfirmation) {
      switch (intent.action) {
        case "send_email":
          // Return the intent so the frontend can handle it with confirmation
          intent.needsConfirmation = true
          intent.response = `I'll help you send an email. ${intent.response}`
          break

        case "create_contact":
          // Validate required fields
          if (intent.parameters.name && intent.parameters.email) {
            try {
              const { error } = await supabase.from("contacts").insert({
                user_id: userId,
                name: intent.parameters.name,
                email: intent.parameters.email,
                company: intent.parameters.company || null,
                phone: intent.parameters.phone || null,
                notes: intent.parameters.notes || null,
              })

              if (error) throw error

              intent.response = `Great! I've added ${intent.parameters.name} to your contacts.`
            } catch (error) {
              console.error("Error creating contact:", error)
              intent.response = "I encountered an error while adding the contact. Please try again."
            }
          } else {
            intent.needsConfirmation = true
            intent.response = "To add a contact, I need at least a name and email address. Could you provide those?"
          }
          break

        case "view_contacts":
          intent.response = `You have ${contacts.length} recent contacts: ${contacts.slice(0, 5).map(c => c.name).join(", ")}. Would you like me to show you more details?`
          break

        case "view_events":
          if (events.length > 0) {
            intent.response = `You have ${events.length} upcoming events: ${events.slice(0, 3).map(e => e.title).join(", ")}. Your next event is "${events[0].title}".`
          } else {
            intent.response = "You don't have any upcoming events scheduled."
          }
          break

        case "get_stats":
          intent.response = `You have ${contacts.length} contacts, ${emails.length} recent emails, and ${events.length} upcoming events.`
          break

        default:
          // General query - already has response from AI
          break
      }
    }

    return NextResponse.json(intent)
  } catch (error) {
    console.error("Voice command error:", error)
    return NextResponse.json(
      { 
        error: "Failed to process voice command",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

