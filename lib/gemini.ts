// Gemini API Configuration (Free tier)
export const GEMINI_MODEL = "gemini-2.5-flash"
export const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"

// Rate limiting - track last request time
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 4000 // 4 seconds between requests (15 RPM = 1 per 4s)

async function throttle(): Promise<void> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
  }
  lastRequestTime = Date.now()
}

// Retry utility for handling transient errors (503, 429, etc.)
async function retryWithBackoff<T>(
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
      
      // Check if error is retryable (503, 429, or network errors)
      const isRetryable = 
        (error instanceof Error && 
         (error.message.includes("503") || 
          error.message.includes("429") || 
          error.message.includes("overloaded") ||
          error.message.includes("UNAVAILABLE") ||
          error.message.includes("network") ||
          error.message.includes("ECONNRESET"))) ||
        (error?.response?.status === 503 || error?.response?.status === 429)
      
      // Don't retry if it's not a retryable error or if we've exhausted retries
      if (!isRetryable || attempt === maxRetries - 1) {
        throw lastError
      }
      
      // Calculate exponential backoff delay (with jitter)
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      console.log(`API call failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${Math.round(delay)}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError || new Error("Failed after retries")
}

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set. Please add it to your .env.local file.")
  }
  return apiKey
}

async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
  await throttle() // Rate limit requests
  const apiKey = getApiKey()
  
  const contents = [
    {
      role: "user",
      parts: [{ text: prompt }]
    }
  ]

  const body: any = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    }
  }

  // Always add no-asterisks rule to system instruction
  const noAsterisksRule = "CRITICAL: Never use asterisks (*) in your responses. Use plain dashes (-) for bullet points. No markdown formatting."
  
  if (systemInstruction) {
    body.systemInstruction = {
      parts: [{ text: `${systemInstruction}\n\n${noAsterisksRule}` }]
    }
  } else {
    body.systemInstruction = {
      parts: [{ text: noAsterisksRule }]
    }
  }

  const response = await fetch(
    `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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
    recentInteractions
  } = context

  const senderName = userProfile?.name || userProfile?.displayName || "I"
  const senderEmail = userProfile?.email || ""

  // Build context about previous interactions
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
- Tags/Categories: ${contactTags?.join(', ') || 'None'}${previousEmailContext}${interactionContext}

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

  return retryWithBackoff(async () => {
    return await callGemini(prompt)
  }, 3, 1000)
}

export async function extractBusinessCardInfo(imageBase64: string): Promise<{
  name?: string
  email?: string
  phone?: string
  company?: string
  position?: string
  linkedin_url?: string
}> {
  const apiKey = getApiKey()

  // Validate image data
  if (!imageBase64 || imageBase64.length === 0) {
    throw new Error("No image data provided for business card scanning")
  }

  const prompt = `Extract contact information from this business card image. Return ONLY a JSON object with these fields (use null for missing fields):
{
  "name": "full name",
  "email": "email address",
  "phone": "phone number",
  "company": "company name",
  "position": "job title/position",
  "linkedin_url": "LinkedIn URL if present"
}

Be precise and only extract information that is clearly visible. Do not make up information.`

  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                { 
                  inlineData: { 
                    mimeType: "image/jpeg", 
                    data: imageBase64 
                  } 
                }
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

    if (data.error) {
      throw new Error(`Gemini API error: ${data.error.message || 'Unknown error'}`)
    }

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const text = data.candidates[0].content.parts[0].text
      console.log("Gemini response text:", text)
      
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0])
        } catch (parseError) {
          console.error("JSON parsing error:", parseError)
          throw new Error("Failed to parse business card information from AI response")
        }
      } else {
        throw new Error("No valid JSON found in AI response")
      }
    }

    throw new Error("No valid response from Gemini API")
  } catch (error) {
    console.error("Gemini API error:", error)
    
    if (error instanceof Error) {
      throw error
    }
    
    throw new Error(`Failed to extract business card information: ${error}`)
  }
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

  try {
    return await callGemini(prompt + formattingRules)
  } catch (error) {
    console.error("Gemini API error:", error)
    throw error
  }
}

export async function generateChatResponse(message: string): Promise<string> {
  const systemPrompt = `You are a helpful AI assistant for Netlink Cogni, a comprehensive AI-powered business networking platform. You help users with business networking, contact management, and professional communication.

ABOUT NETLINK COGNI PLATFORM:
Netlink Cogni is an AI-powered business networking and contact management platform that helps professionals build, manage, and grow their professional networks. The platform includes:

CORE FEATURES:
- Business Card Scanner: AI-powered OCR to extract contact information from business card photos
- Contact Management: Comprehensive contact database with company, position, phone, email, LinkedIn, and notes
- Email Generation: AI-powered email composition for cold emails, introductions, follow-ups, and thank you messages
- Email Campaigns: Bulk email sending with personalized AI-generated content for each recipient
- Event Management: Create, manage, and track calendar events and networking opportunities
- Event URL Scraping: Automatic extraction of event details from URLs (Zoom, Google Meet, Teams, Eventbrite, etc.)
- Voice Commands: Hands-free voice assistant for sending emails, adding contacts, viewing events, and getting statistics
- AI Assistant: Conversational AI that provides networking advice, email writing help, and contact analysis
- Analytics Dashboard: Track networking activity, email performance, and relationship insights
- Real-time Notifications: Get notified about new contacts, events, and email activity

TECHNICAL CAPABILITIES:
- Uses Google Gemini AI for intelligent processing
- Supabase backend for data storage and authentication
- Real-time database updates using Supabase subscriptions
- SMTP email sending (Gmail and custom servers)
- Responsive web interface with modern UI/UX

USER WORKFLOWS:
1. Upload business card photo → AI extracts info → Contact saved automatically
2. Select contact → Generate AI email → Review/edit → Send individually or in campaign
3. Paste event URL → AI scrapes details → Event created with auto-filled information
4. Voice command → AI parses intent → Action executed (with confirmation for sensitive operations)
5. Chat with AI Assistant → Get networking advice, email help, contact analysis

CRITICAL FORMATTING RULES - MUST FOLLOW STRICTLY:
1. NEVER use asterisks (*) or double asterisks (**) in your response under any circumstances
2. NEVER use asterisks for bold text, emphasis, bullet points, headings, or any other purpose
3. For bullet points: ALWAYS use plain dash (-) only, NEVER asterisks
4. Do not use asterisks in any formatting, anywhere, for any reason
5. Keep responses concise, professional, and to the point
6. Use clear, readable formatting with plain text only - no markdown, no asterisks, no special formatting characters

CORRECT Example of formatting:
Key Features:
- Business Networking
- Contact Management
- Professional Communication

WRONG Examples (NEVER DO THIS):
**Key Features:**
* Business Networking
* Contact Management

Be friendly, professional, and knowledgeable about the platform's capabilities. When users ask about features, explain how they work within Netlink Cogni.`

  return retryWithBackoff(async () => {
    return await callGemini(message, systemPrompt)
  }, 3, 1000)
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
    console.error("Gemini API error:", error)
    return { title: url, description: "Event link" }
  }
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
    throw new Error("Failed to extract event data")
  } catch (error) {
    console.error("Gemini API error:", error)
    throw error
  }
}
