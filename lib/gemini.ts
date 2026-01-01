export const GEMINI_MODEL = "gemini-2.5-flash"
export const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"

export const OPENROUTER_API_BASE = "https://openrouter.ai/api/v1"

const DEFAULT_OPENROUTER_MODEL = "qwen/qwen3-14b:free"

export const OPENROUTER_MODEL = DEFAULT_OPENROUTER_MODEL
export const OPENROUTER_TEXT_MODEL = DEFAULT_OPENROUTER_MODEL

const CHAT_OPENROUTER_MODELS = [
  "google/gemma-3-12b-it:free",
  "openai/gpt-oss-120b:free",
  "google/gemma-3n-e4b-it:free"
]

const CORE_BYTEZ_API_BASE = "https://api.bytez.com/models/v2"

export const CHAT_BYTEZ_MODELS = [
  "ek-ai/DeepSeek-R1-Distill-Qwen-1.5B",
  "Qwen/Qwen3-0.6B",
  "microsoft/Phi-3-mini-4k-instruct"
]

const CORE_OPENROUTER_MODELS = [
  OPENROUTER_TEXT_MODEL,
  ...CHAT_OPENROUTER_MODELS,
]

const CORE_BYTEZ_MODELS = CHAT_BYTEZ_MODELS

let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000

export async function throttle(): Promise<void> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
  }
  lastRequestTime = Date.now()
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      const isRetryable = 
        (error instanceof Error && 
         (error.message.includes("503") || 
          error.message.includes("429") || 
          error.message.includes("overloaded") ||
          error.message.includes("UNAVAILABLE") ||
          error.message.includes("network") ||
          error.message.includes("ECONNRESET"))) ||
        (error?.response?.status === 503 || error?.response?.status === 429)
      
      if (!isRetryable || attempt === maxRetries - 1) {
        throw lastError
      }
      
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      console.log(`API call failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${Math.round(delay)}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError || new Error("Failed after retries")
}

export function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set. Please add it to your .env.local file.")
  }
  return apiKey
}

function getBytezApiKey(): string {
  const apiKey = process.env.BYTEZ_API_KEY
  if (!apiKey) {
    throw new Error("BYTEZ_API_KEY environment variable is not set. Please add it to your .env.local file.")
  }
  return apiKey
}

export async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
  await throttle()
  const apiKey = getApiKey()
  
  const noAsterisksRule = "CRITICAL: Never use asterisks (*) in your responses. Use plain dashes (-) for bullet points. No markdown formatting."
  
  const systemContent = systemInstruction 
    ? `${systemInstruction}\n\n${noAsterisksRule}`
    : noAsterisksRule

  const contents: any[] = [
    {
      role: "user",
      parts: [{ text: `${systemContent}\n\n${prompt}` }]
    }
  ]

  const response = await fetch(
    `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Gemini API error response:", {
      status: response.status,
      statusText: response.statusText,
      body: errorText
    })
    const error: any = new Error(`Gemini API request failed (${response.status}): ${errorText}`)
    error.status = response.status
    error.response = { status: response.status }
    throw error
  }

  const data = await response.json()

  if (data.error) {
    console.error("Gemini API error:", data.error)
    throw new Error(`Gemini API error: ${data.error.message || JSON.stringify(data.error)}`)
  }

  if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text
  }

  console.error("No valid response from Gemini API:", data)
  throw new Error("Failed to generate response: No valid response from AI")
}

interface EmailGenerationContext {
  contactName: string
  contactCompany: string
  contactPosition?: string
  contactNotes?: string
  contactLinkedIn?: string
  contactTags?: string[]
  userProfile?: {
    name?: string
    email?: string
    displayName?: string
  }
  purpose: string
  previousEmails?: Array<{
    subject?: string
    body?: string
    created_at?: string
    status?: string
  }>
  recentInteractions?: Array<{
    event_type?: string
    description?: string
    created_at?: string
  }>
  userId?: string
  aiMemories?: Array<{
    memory_type: string
    memory_key: string
    memory_value: string
    importance_score: number
  }>
}

export async function generateEmailWithGemini(
  context: EmailGenerationContext
): Promise<string> {
  const {
    contactName,
    contactCompany,
    contactPosition,
    contactNotes,
    contactLinkedIn,
    contactTags,
    userProfile,
    purpose,
    previousEmails,
    recentInteractions,
    aiMemories
  } = context

  const senderName = userProfile?.name || userProfile?.displayName || "I"
  const senderEmail = userProfile?.email || ""
  
  let previousEmailContext = ""
  if (previousEmails && previousEmails.length > 0) {
    previousEmailContext = `\n\nPREVIOUS EMAILS SENT TO THIS CONTACT:\n${previousEmails.map((email, idx) => 
      `${idx + 1}. ${email.subject || 'No subject'} (${email.created_at ? new Date(email.created_at).toLocaleDateString() : 'Unknown date'})\n   ${email.body ? email.body.substring(0, 150) + '...' : ''}`
    ).join('\n\n')}`
  }

  let interactionContext = ""
  if (recentInteractions && recentInteractions.length > 0) {
    interactionContext = `\n\nRECENT INTERACTIONS WITH THIS CONTACT:\n${recentInteractions.map((event, idx) => 
      `${idx + 1}. ${event.event_type || 'Interaction'} - ${event.description || 'No description'} (${event.created_at ? new Date(event.created_at).toLocaleDateString() : 'Unknown date'})`
    ).join('\n')}`
  }

  // Build AI memory context from trained memories
  let aiMemoryContext = ""
  if (aiMemories && aiMemories.length > 0) {
    const styleMemories = aiMemories.filter(m => m.memory_type === "email_style")
    const networkingMemories = aiMemories.filter(m => m.memory_type === "networking_preference")
    const patternMemories = aiMemories.filter(m => m.memory_type === "communication_pattern")

    if (styleMemories.length > 0) {
      const styleInfo = styleMemories.map(m => {
        try {
          if (m.memory_key === "common_phrases") {
            const phrases = JSON.parse(m.memory_value)
            return `Common phrases: ${Array.isArray(phrases) ? phrases.join(", ") : m.memory_value}`
          }
          return `${m.memory_key}: ${m.memory_value}`
        } catch {
          return `${m.memory_key}: ${m.memory_value}`
        }
      }).join("\n")
      aiMemoryContext += `\n\nUSER'S EMAIL WRITING STYLE (learned from past emails):\n${styleInfo}`
    }

    if (networkingMemories.length > 0) {
      const networkingInfo = networkingMemories.map(m => {
        try {
          if (m.memory_key === "target_industries") {
            const industries = JSON.parse(m.memory_value)
            return `Target industries: ${Array.isArray(industries) ? industries.join(", ") : m.memory_value}`
          }
          return `${m.memory_key}: ${m.memory_value}`
        } catch {
          return `${m.memory_key}: ${m.memory_value}`
        }
      }).join("\n")
      aiMemoryContext += `\n\nUSER'S NETWORKING PREFERENCES:\n${networkingInfo}`
    }

    if (patternMemories.length > 0) {
      const patternInfo = patternMemories.map(m => {
        try {
          if (m.memory_key === "preferred_interaction_types") {
            const types = JSON.parse(m.memory_value)
            return `Preferred interaction types: ${Object.entries(types).map(([k, v]) => `${k} (${v} times)`).join(", ")}`
          }
          return `${m.memory_key}: ${m.memory_value}`
        } catch {
          return `${m.memory_key}: ${m.memory_value}`
        }
      }).join("\n")
      aiMemoryContext += `\n\nUSER'S COMMUNICATION PATTERNS:\n${patternInfo}`
    }

    if (aiMemoryContext) {
      aiMemoryContext += "\n\nIMPORTANT: Use the user's learned writing style, tone, and preferences when writing this email. Match their natural communication patterns."
    }
  }

  const prompt = `You are an expert email writer helping ${senderName} write a highly personalized, authentic email. This is NOT a template - write a genuine, specific email that sounds like it came directly from ${senderName}.

YOUR ROLE:
Write a professional email that is:
- Highly personalized and specific to the recipient and situation
- Genuine and authentic, not generic or template-like
- Uses specific details from the context provided
- Shows you've done research or know the recipient
- Professional but warm and human

RECIPIENT INFORMATION:
- Name: ${contactName}
- Company: ${contactCompany || 'Not specified'}
- Position: ${contactPosition || 'Not specified'}
- Notes about contact: ${contactNotes || 'None'}
- LinkedIn: ${contactLinkedIn || 'Not provided'}
- Tags/Categories: ${contactTags?.join(', ') || 'None'}${previousEmailContext}${interactionContext}${aiMemoryContext}

SENDER INFORMATION:
- Sender Name: ${senderName}
- Sender Email: ${senderEmail}

EMAIL PURPOSE:
${purpose}

CRITICAL INSTRUCTIONS - READ CAREFULLY:
1. PERSONALIZATION IS KEY: Use specific details from the recipient information, previous emails, and interactions to make this email highly personalized. Reference their company, position, or past interactions when relevant.

2. NO GENERIC TEMPLATES: Do NOT use phrases like:
   - "I hope this email finds you well" (too generic)
   - "I'm reaching out because..." (too template-like)
   - "I wanted to touch base" (overused)
   - Instead, start with something specific to them or the situation

3. BE SPECIFIC AND AUTHENTIC: 
   - Reference their company, position, or industry if relevant
   - Mention previous emails or interactions if appropriate
   - Include details from notes if they provide context
   - Show you've put thought into why you're reaching out

4. WRITE AS THE SENDER: Write in first person as ${senderName}, not as a third party or assistant. Sound like a real person wrote this, not an AI.

5. STRUCTURE:
   - Opening: Specific, personalized greeting that shows you know who they are
   - Body: Clear explanation of purpose with specific context
   - Call to action: Clear next steps
   - Closing: Professional sign-off

6. TONE: Professional but warm, authentic, and specific. Match the purpose and relationship level.

7. LENGTH: Concise but complete - typically 3-5 paragraphs. Don't ramble, but include enough detail to be meaningful.

8. CALL TO ACTION: Include a specific, clear call to action relevant to the purpose.

FORMATTING RULES:
- NEVER use asterisks (*) or double asterisks (**) anywhere
- Use plain text formatting only - no markdown
- Use plain dash (-) for bullet points if needed
- Keep paragraphs natural and readable

EXAMPLES OF GOOD OPENINGS (NOT templates, but personalized):
- If they're at a known company: "I noticed you're [position] at [company] - I've been following your work on [specific thing]..."
- If previous email: "Following up on our previous conversation about [topic]..."
- If mutual connection: "I was speaking with [mutual contact] who mentioned you work on [specific area]..."
- Purpose-specific: "I saw your post about [specific thing] and thought it connected to [your purpose]..."

Write the email body now. Make it specific, authentic, and personalized - NOT a template.`

  try {
    return await retryWithBackoff(async () => {
      return await callGemini(prompt)
    }, 3, 1000)
  } catch (error) {
    console.error("Gemini email generation failed, trying OpenRouter fallback", error)
  }

  try {
    return await retryWithBackoff(async () => {
      return await callOpenRouterChat(
        prompt,
        "You are an expert email writer. Follow all instructions in the user message exactly."
      )
    }, 3, 1000)
  } catch (error) {
    console.error("OpenRouter primary email model failed", error)
  }

  for (const model of CORE_OPENROUTER_MODELS) {
    try {
      return await retryWithBackoff(async () => {
        return await callOpenRouterChatModel(
          model,
          prompt,
          "You are an expert email writer. Follow all instructions in the user message exactly."
        )
      }, 2, 1000)
    } catch (modelError) {
      console.error("OpenRouter email fallback model failed", model, modelError)
    }
  }

  for (const modelId of CORE_BYTEZ_MODELS) {
    try {
      return await retryWithBackoff(async () => {
        return await callBytezChatModel(
          modelId,
          prompt,
          "You are an expert email writer. Follow all instructions in the user message exactly."
        )
      }, 2, 1000)
    } catch (modelError) {
      console.error("Bytez email fallback model failed", modelId, modelError)
    }
  }

  throw new Error("All AI providers failed for email generation")
}

function getOpenRouterApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set. Please add it to your .env.local file.")
  }
  return apiKey
}

export async function callOpenRouterChat(
  message: string,
  systemPrompt: string
): Promise<string> {
  return callOpenRouterChatModel(OPENROUTER_TEXT_MODEL, message, systemPrompt)
}

async function callOpenRouterChatModel(
  model: string,
  message: string,
  systemPrompt: string
): Promise<string> {
  await throttle()
  const apiKey = getOpenRouterApiKey()

  const messages = [
    {
      role: "system",
      content: systemPrompt
    },
    {
      role: "user",
      content: message
    }
  ]

  const response = await fetch(
    `${OPENROUTER_API_BASE}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Netlink"
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2048
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter chat API error for ${model}: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices && data.choices[0]?.message?.content

  if (!content) {
    throw new Error(`No response content from OpenRouter chat model ${model}`)
  }

  return typeof content === "string"
    ? content
    : Array.isArray(content)
      ? content.map((part: any) => part.text || "").join("\n")
      : String(content)
}

async function callBytezChatModel(
  modelId: string,
  message: string,
  systemPrompt: string
): Promise<string> {
  await throttle()
  const apiKey = getBytezApiKey()

  const response = await fetch(
    `${CORE_BYTEZ_API_BASE}/${encodeURIComponent(modelId)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": apiKey
      },
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `${systemPrompt}\n\nUser: ${message}`
              }
            ]
          }
        ],
        stream: false,
        params: {
          max_length: 2048,
          temperature: 0.7
        }
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Bytez chat API error for ${modelId}: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const output = data.output

  if (!output) {
    throw new Error(`No output field in Bytez response for model ${modelId}`)
  }

  const content = typeof output.content === "string" ? output.content : output.content?.toString?.() ?? JSON.stringify(output)

  if (!content) {
    throw new Error(`No content in Bytez output for model ${modelId}`)
  }

  return content
}

export async function generateText(prompt: string): Promise<string> {
  const formattingRules = `

CRITICAL FORMATTING RULES - MUST FOLLOW:
1. NEVER use asterisks (*) or double asterisks (**) in your response
2. NEVER use asterisks for bold text, emphasis, bullet points, or any other purpose
3. Use plain dash (-) for bullet points only
4. Keep responses concise and professional
5. Use plain text formatting only - no markdown, no asterisks, no special formatting characters

CORRECT Example:
Title:
- Point one
- Point two

WRONG Example (DO NOT DO THIS):
**Title**
* Point one
* Point two`

  const fullPrompt = prompt + formattingRules

  try {
    return await retryWithBackoff(async () => {
      return await callGemini(fullPrompt)
    }, 3, 1000)
  } catch (error) {
    console.error("Gemini text generation failed, trying OpenRouter fallback", error)
  }

  try {
    return await retryWithBackoff(async () => {
      return await callOpenRouterChat(
        fullPrompt,
        "You are a helpful text generator. Follow all formatting rules in the user message."
      )
    }, 3, 1000)
  } catch (error) {
    console.error("OpenRouter primary text model failed", error)
  }

  for (const model of CORE_OPENROUTER_MODELS) {
    try {
      return await retryWithBackoff(async () => {
        return await callOpenRouterChatModel(
          model,
          fullPrompt,
          "You are a helpful text generator. Follow all formatting rules in the user message."
        )
      }, 2, 1000)
    } catch (modelError) {
      console.error("OpenRouter text fallback model failed", model, modelError)
    }
  }

  for (const modelId of CORE_BYTEZ_MODELS) {
    try {
      return await retryWithBackoff(async () => {
        return await callBytezChatModel(
          modelId,
          fullPrompt,
          "You are a helpful text generator. Follow all formatting rules in the user message."
        )
      }, 2, 1000)
    } catch (modelError) {
      console.error("Bytez text fallback model failed", modelId, modelError)
    }
  }

  throw new Error("All AI providers failed for text generation")
}

export async function fetchUrlPreview(url: string): Promise<{
  title?: string
  description?: string
  image?: string
}> {
  const prompt = `Given this URL: ${url}

Generate a preview with:
- A descriptive title (what the page/event is about)
- A brief description (1-2 sentences)
- Suggest what type of image would represent this (we'll use a placeholder)

CRITICAL FORMATTING RULES:
- NEVER use asterisks (*) or double asterisks (**) anywhere in your response
- NEVER use asterisks for any purpose whatsoever
- Return ONLY a JSON object (no markdown, no asterisks, no extra text):
{
  "title": "event or page title",
  "description": "brief description",
  "imageType": "description for placeholder image"
}

Keep descriptions concise and to the point.`

  try {
    const text = await callGemini(prompt)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return { title: url, description: "Event link" }
  } catch (error) {
    console.error("Gemini URL preview error, trying OpenRouter fallback:", error)
  }

  try {
    const text = await callOpenRouterChat(
      prompt,
      "You generate URL previews and must respond with JSON only."
    )
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    return { title: url, description: "Event link" }
  } catch (error) {
    console.error("OpenRouter primary URL preview model error:", error)
  }

  for (const model of CORE_OPENROUTER_MODELS) {
    try {
      const text = await callOpenRouterChatModel(
        model,
        prompt,
        "You generate URL previews and must respond with JSON only."
      )
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (modelError) {
      console.error("OpenRouter URL preview fallback model error:", model, modelError)
    }
  }

  for (const modelId of CORE_BYTEZ_MODELS) {
    try {
      const text = await callBytezChatModel(
        modelId,
        prompt,
        "You generate URL previews and must respond with JSON only."
      )
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (modelError) {
      console.error("Bytez URL preview fallback model error:", modelId, modelError)
    }
  }

  return { title: url, description: "Event link" }
}

export async function extractEventDataFromUrl(url: string): Promise<{
  title?: string
  description?: string
  startTime?: string
  endTime?: string
  location?: string
  imageUrl?: string
}> {
  const prompt = `Analyze this URL and extract event information if present: ${url}

IMPORTANT RULES:
1. Only extract information that is ACTUALLY present in the URL
2. For meeting platforms (Zoom, Google Meet, Teams), use generic titles based on the platform
3. Do NOT make up names, companies, or specific details not in the URL
4. If there's a meeting ID, include it in the title
5. Be factual and generic, not creative

URL Analysis:
- If Zoom link: Title should be "Zoom Meeting" + meeting ID if present
- If Google Meet: Title should be "Google Meet" + meeting code if present  
- If Microsoft Teams: Title should be "Teams Meeting"
- If calendar link with parameters: Extract actual event name from query params
- If event platform (Eventbrite, Meetup, etc.): Use generic "Event" unless name is in URL path

For dates/times:
- If no date in URL: Leave startTime and endTime as null (user will fill in)
- If date is in URL path/params: Extract it
- Format dates as: YYYY-MM-DDTHH:MM (24-hour format)

For location:
- Zoom links → "Zoom (Online)"
- Google Meet → "Google Meet (Online)"
- Teams → "Microsoft Teams (Online)"
- Physical address in URL → Extract it
- Otherwise → "Online Meeting"

CRITICAL FORMATTING RULES:
- NEVER use asterisks (*) or double asterisks (**) anywhere in your response
- NEVER use asterisks for any purpose whatsoever
- Return ONLY a JSON object (no markdown, no asterisks, no extra text):
{
  "title": "Generic platform-based title or extracted name",
  "description": "Brief description based on platform type",
  "startTime": null or "YYYY-MM-DDTHH:MM",
  "endTime": null or "YYYY-MM-DDTHH:MM",
  "location": "Platform name (Online) or extracted location"
}

Example outputs:
- "https://zoom.us/j/123456789" → {"title": "Zoom Meeting #123456789", "description": "Online video conference", "startTime": null, "endTime": null, "location": "Zoom (Online)"}
- "https://meet.google.com/abc-defg-hij" → {"title": "Google Meet - abc-defg-hij", "description": "Online video conference", "startTime": null, "endTime": null, "location": "Google Meet (Online)"}
- "https://eventbrite.com/e/product-launch-123" → {"title": "Product Launch", "description": "Event", "startTime": null, "endTime": null, "location": "TBD"}`

  try {
    const text = await callGemini(prompt)
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    throw new Error("Failed to extract event data from Gemini response")
  } catch (error) {
    console.error("Gemini API error for event data, trying OpenRouter fallback:", error)
  }

  try {
    const text = await callOpenRouterChat(
      prompt,
      "You extract structured event data from URLs and must respond with JSON only."
    )
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
  } catch (error) {
    console.error("OpenRouter primary event data model error:", error)
  }

  for (const model of CORE_OPENROUTER_MODELS) {
    try {
      const text = await callOpenRouterChatModel(
        model,
        prompt,
        "You extract structured event data from URLs and must respond with JSON only."
      )
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (modelError) {
      console.error("OpenRouter event data fallback model error:", model, modelError)
    }
  }

  for (const modelId of CORE_BYTEZ_MODELS) {
    try {
      const text = await callBytezChatModel(
        modelId,
        prompt,
        "You extract structured event data from URLs and must respond with JSON only."
      )
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (modelError) {
      console.error("Bytez event data fallback model error:", modelId, modelError)
    }
  }

  throw new Error("All AI providers failed to extract event data from URL")
}
