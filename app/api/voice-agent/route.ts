import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GEMINI_API_BASE } from "@/lib/gemini"

// Use flash model for fastest responses
const FAST_MODEL = "gemini-2.0-flash"

// Retry utility for handling transient errors
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      const isRetryable = 
        error instanceof Error && 
        (error.message.includes("503") || 
         error.message.includes("429") || 
         error.message.includes("overloaded") ||
         error.message.includes("UNAVAILABLE"))
      
      if (!isRetryable || attempt === maxRetries - 1) {
        throw lastError
      }
      
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      console.log(`Voice agent API retry (attempt ${attempt + 1}/${maxRetries}), waiting ${Math.round(delay)}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError || new Error("Failed after retries")
}

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

    const [contactsResult, eventsResult] = await Promise.all([
      supabase.from("contacts").select("name,email,company").eq("user_id", userId).limit(10),
      supabase.from("calendar_events").select("title,event_date").eq("user_id", userId).limit(5),
    ])

    const contacts = contactsResult.data || []
    const events = eventsResult.data || []

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not configured")
    }

    // Minimal context for faster responses
    const contactNames = contacts.slice(0, 10).map(c => c.name).join(", ")
    const eventTitles = events.slice(0, 5).map(e => e.title).join(", ")

    const prompt = `You are ARIA, a fast voice assistant. Be concise and conversational.

Stats: ${contacts.length} contacts, ${events.length} events
Recent contacts: ${contactNames || "None"}
Upcoming: ${eventTitles || "None"}

User: "${command}"
${context ? `Context: ${context}` : ""}

Reply JSON only:
{"action":"action_name","parameters":{},"needsConfirmation":false,"response":"Short natural reply","data":null}

Actions: send_email, create_event, add_contact, search_contacts, view_contacts, view_events, get_stats, general_query
Set needsConfirmation:true only for send_email, create_event, add_contact.
Keep response under 30 words, friendly and direct.`

    const data = await retryWithBackoff(async () => {
      const response = await fetch(
        `${GEMINI_API_BASE}/models/${FAST_MODEL}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.5, maxOutputTokens: 256 },
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`)
      }

      return await response.json()
    }, 3, 1000)
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
          intent.data = events.slice(0, 5).map(e => ({ title: e.title, date: e.event_date }))
          intent.response = events.length > 0 ? `You have ${events.length} upcoming events. Your next event is ${events[0]?.title}.` : "You don't have any upcoming events scheduled."
          break
        case "get_stats":
          intent.data = { totalContacts: contacts.length, upcomingEvents: events.length }
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
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { action: "error", parameters: {}, needsConfirmation: false, response: `Error: ${errorMessage}`, data: null },
      { status: 500 }
    )
  }
}
