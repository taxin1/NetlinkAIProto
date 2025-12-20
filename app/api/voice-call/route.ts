import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { OPENROUTER_API_BASE, OPENROUTER_TEXT_MODEL } from "@/lib/gemini"
import { generateTemplateCallPrompt } from "@/lib/voice-agent/template-prompt-generator"
import type { 
  CallContext, 
  GeneratedCallPrompt, 
  CallOutcome,
  CallActions 
} from "@/types/call"

// Rate limiting - track last request time
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000

async function throttle(): Promise<void> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
  }
  lastRequestTime = Date.now()
}

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
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError || new Error("Failed after retries")
}

function getApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured")
  }
  return apiKey
}

async function callOpenRouter(prompt: string, systemInstruction?: string): Promise<string> {
  await throttle()
  const apiKey = getApiKey()
  
  const messages: any[] = []
  
  const systemContent = systemInstruction 
    ? systemInstruction
    : "You are a helpful AI assistant."
  
  messages.push({
    role: "system",
    content: systemContent
  })
  
  messages.push({
    role: "user",
    content: prompt
  })

  const response = await fetch(
    `${OPENROUTER_API_BASE}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Netlink Cogni"
      },
      body: JSON.stringify({
        model: OPENROUTER_TEXT_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  if (data.choices && data.choices[0]?.message?.content) {
    return data.choices[0].message.content
  }

  throw new Error("No response from AI")
}

// Generate call prompt on-the-spot
export async function POST(request: NextRequest) {
  try {
    const { action, context, conversationHistory, userInput, userId } = await request.json()

    if (!action || !context) {
      return NextResponse.json({ error: "Action and context are required" }, { status: 400 })
    }

    const supabase = await createClient()
    
    // Get actual user ID from auth if not provided
    let actualUserId = userId
    if (!actualUserId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }
      actualUserId = user.id
    }
    
    const apiKey = getApiKey()

    if (action === "generate_call_prompt") {
      // Generate a call-ready prompt
      const callContext: CallContext = context
      
      // Check if we should use AI or template-based generation
      // Use template-based by default (more reliable), but allow AI if explicitly requested
      const useAI = process.env.USE_AI_FOR_CALL_PROMPTS === "true"
      
      let generatedPrompt: GeneratedCallPrompt
      
      if (useAI) {
        // Try AI generation first, fallback to template if it fails
        try {
          const prompt = `You are generating a call prompt for a professional networking call.

USER PROFILE:
- Name: ${callContext.user_profile.name}
- Role: ${callContext.user_profile.role}
- Organization: ${callContext.user_profile.organization}
- Background: ${callContext.user_profile.short_background || "Not provided"}
- Goals: ${callContext.user_profile.goals?.join(", ") || "Not provided"}

CONTACT:
- Name: ${callContext.contact.name}
- Company: ${callContext.contact.company || "Unknown"}
- Title: ${callContext.contact.title || "Unknown"}
- Notes from card scan: ${callContext.contact.notes_from_card_scan || "None"}

RELATIONSHIP:
${callContext.relationship ? `
- Where met: ${callContext.relationship.where_met || "Not specified"}
- Event: ${callContext.relationship.event_name || "Not specified"}
- Date met: ${callContext.relationship.date_met || "Not specified"}
- Last interaction: ${callContext.relationship.last_interaction || "None"}
- Tags: ${callContext.relationship.tags?.join(", ") || "None"}
` : "No relationship history"}

CALL GOAL:
- Type: ${callContext.call_goal.type}
- Desired outcome: ${callContext.call_goal.desired_outcome}
- Priority questions: ${callContext.call_goal.priority_questions?.join(", ") || "None"}
- Constraints: ${callContext.call_goal.constraints || "None"}

TOPIC MODE:
${callContext.topic_mode ? `
- Topic: ${callContext.topic_mode.topic}
- Tone: ${callContext.topic_mode.tone}
- Must mention: ${callContext.topic_mode.must_mention?.join(", ") || "None"}
- Must avoid: ${callContext.topic_mode.must_avoid?.join(", ") || "None"}
` : "No specific topic mode"}

Generate a 5-10 minute call plan. Return ONLY valid JSON (no markdown, no code blocks):

{
  "opening_line": "1-2 sentence natural opener",
  "key_talking_points": ["point 1", "point 2", "point 3"],
  "smart_questions": ["question 1", "question 2", "question 3", "question 4", "question 5"],
  "objection_handling": [
    {"objection": "I'm too busy", "reply": "short natural reply"},
    {"objection": "Not interested", "reply": "short natural reply"},
    {"objection": "Send me info via email", "reply": "short natural reply"}
  ],
  "closing_line": "1-2 sentence closing with next-step ask"
}

Keep everything natural, conversational, and specific to this contact and goal.`

          const responseText = await retryWithBackoff(async () => {
            return await callOpenRouter(prompt)
          }, 3, 1000)

          const jsonMatch = responseText.match(/\{[\s\S]*\}/)
          if (!jsonMatch) {
            throw new Error("Failed to parse call prompt")
          }

          generatedPrompt = JSON.parse(jsonMatch[0])
        } catch (aiError) {
          console.warn("AI call prompt generation failed, using template fallback:", aiError)
          // Fallback to template-based generation
          generatedPrompt = generateTemplateCallPrompt(callContext)
        }
      } else {
        // Use template-based generation (no AI required)
        generatedPrompt = generateTemplateCallPrompt(callContext)
      }
      
      return NextResponse.json({
        success: true,
        prompt: generatedPrompt
      })

    } else if (action === "conversation") {
      // Handle real-time conversation during call
      const callContext: CallContext = context
      
      // Use the full system prompt with context
      const { generateContextualSystemPrompt } = await import('@/lib/voice-agent/system-prompt')
      const systemInstruction = generateContextualSystemPrompt(callContext)

      const conversationPrompt = `The contact just said: "${userInput}"

Previous conversation:
${conversationHistory.map((msg: any) => `${msg.role === "user" ? "You (agent)" : "Contact"}: ${msg.content}`).join("\n")}

Respond naturally as if you're on a phone call. Keep it 1-3 sentences, conversational, and human-like.`

      const responseText = await retryWithBackoff(async () => {
        return await callOpenRouter(conversationPrompt, systemInstruction)
      }, 3, 1000)

      // Also generate what to track in CRM
      const trackingPrompt = `Based on this conversation moment:
Contact said: "${userInput}"
Your response: "${responseText}"

Provide a brief update for CRM tracking. Return ONLY JSON:
{
  "lead_quality": "low" | "medium" | "high",
  "key_insight": "one sentence summary of this exchange",
  "sentiment": "positive" | "neutral" | "negative" | "interested" | "not_interested"
}

Be objective.`

      let trackingData = {
        lead_quality: "medium" as const,
        key_insight: "Conversation in progress",
        sentiment: "neutral" as const
      }

      try {
        const trackingText = await callOpenRouter(trackingPrompt)
        const trackingMatch = trackingText.match(/\{[\s\S]*\}/)
        if (trackingMatch) {
          trackingData = JSON.parse(trackingMatch[0])
        }
      } catch (e) {
        console.error("Failed to generate tracking data:", e)
      }

      return NextResponse.json({
        success: true,
        speak: responseText.trim(),
        tracking: trackingData
      })

    } else if (action === "end_call") {
      // Generate call outcome summary
      const callContext: CallContext = context
      const fullConversation = conversationHistory || []

      const summaryPrompt = `Generate a comprehensive call outcome summary. This was a networking call.

CALL DETAILS:
User: ${callContext.user_profile.name} (${callContext.user_profile.role})
Contact: ${callContext.contact.name} (${callContext.contact.title || ""} at ${callContext.contact.company || ""})
Call Goal: ${callContext.call_goal.desired_outcome}

FULL CONVERSATION:
${fullConversation.map((msg: any) => `${msg.role === "agent" ? "Agent" : "Contact"}: ${msg.content}`).join("\n\n")}

Generate a call outcome. Return ONLY valid JSON (no markdown):
{
  "call_summary": "2-3 sentence summary of the call",
  "lead_quality": "low" | "medium" | "high",
  "next_step": "specific next action agreed upon",
  "objections": ["objection 1", "objection 2"] or [],
  "personal_notes": "any personal details mentioned or rapport built",
  "follow_up_message_draft": "draft email follow-up (optional)",
  "next_step_date": "YYYY-MM-DD or null",
  "tags": ["tag1", "tag2"] or []
}

Be specific and actionable.`

      const responseText = await retryWithBackoff(async () => {
        return await callOpenRouter(summaryPrompt)
      }, 3, 1000)

      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("Failed to parse call outcome")
      }

      const outcome: CallOutcome = JSON.parse(jsonMatch[0])

      // Save to database
      const { error: eventError } = await supabase.from("events").insert({
        user_id: actualUserId,
        contact_id: callContext.contact.id,
        event_type: "call",
        description: outcome.call_summary,
        created_at: new Date().toISOString()
      })

      if (eventError) {
        console.error("Failed to save call event:", eventError)
      }

      // Update contact notes if needed
      if (outcome.personal_notes || outcome.call_summary) {
        const { data: existingContact } = await supabase
          .from("contacts")
          .select("notes")
          .eq("id", callContext.contact.id)
          .single()

        const updatedNotes = existingContact?.notes 
          ? `${existingContact.notes}\n\n[Call ${new Date().toLocaleDateString()}]: ${outcome.call_summary}`
          : `[Call ${new Date().toLocaleDateString()}]: ${outcome.call_summary}`

        await supabase
          .from("contacts")
          .update({ notes: updatedNotes, updated_at: new Date().toISOString() })
          .eq("id", callContext.contact.id)
      }

      return NextResponse.json({
        success: true,
        outcome
      })
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 })
  } catch (error) {
    console.error("Voice call API error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

