// Gemini API Configuration - Using latest Gemini 2.5 Flash model
export const GEMINI_MODEL = "gemini-2.5-flash"
export const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

export async function generateEmailWithGemini(
  contactName: string,
  contactCompany: string,
  purpose: string,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY!

  const prompt = `Write a professional cold email to ${contactName}${contactCompany ? ` at ${contactCompany}` : ""} for the following purpose: ${purpose}. 

Keep it concise, friendly, and professional. Include a clear call to action. Do not include subject line, just the email body. 

FORMATTING RULES:
- Use plain dash (-) for bullet points
- Keep responses concise and professional`

  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
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
      },
    )

    const data = await response.json()

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text
    }

    throw new Error("Failed to generate email")
  } catch (error) {
    console.error("Gemini API error:", error)
    throw error
  }
}

export async function extractBusinessCardInfo(imageBase64: string): Promise<{
  name?: string
  email?: string
  phone?: string
  company?: string
  position?: string
  linkedin_url?: string
}> {
  const geminiApiKey = process.env.GEMINI_API_KEY

  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set. Please add it to your .env.local file.")
  }

  return await extractWithGemini(imageBase64, geminiApiKey)
}

async function extractWithGemini(imageBase64: string, apiKey: string): Promise<{
  name?: string
  email?: string
  phone?: string
  company?: string
  position?: string
  linkedin_url?: string
}> {

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
      `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
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
                {
                  inline_data: {
                    mime_type: "image/jpeg",
                    data: imageBase64,
                  },
                },
              ],
            },
          ],
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemini API request failed (${response.status}): ${errorText}`)
    }

    const data = await response.json()

    // Check for API errors
    if (data.error) {
      throw new Error(`Gemini API error: ${data.error.message || 'Unknown error'}`)
    }

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const text = data.candidates[0].content.parts[0].text
      console.log("Gemini response text:", text)
      
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
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
    
    // Re-throw with more context if it's our custom error
    if (error instanceof Error) {
      throw error
    }
    
    // Handle unexpected errors
    throw new Error(`Failed to extract business card information: ${error}`)
  }
}


export async function generateText(prompt: string): Promise<string> {
  const geminiApiKey = process.env.GEMINI_API_KEY

  if (!geminiApiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set")
  }

  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${geminiApiKey}`,
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
                  text: prompt + "\n\nFORMATTING RULES:\n1. Use plain dash (-) for bullet points\n2. Keep responses concise and professional\n3. Do not use any asterisks in formatting\n\nExample:\nTitle:\n- Point one\n- Point two",
                },
              ],
            },
          ],
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Gemini API request failed (${response.status}): ${errorText}`)
    }

    const data = await response.json()

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text
    }

    throw new Error("No valid response from Gemini API")
  } catch (error) {
    console.error("Gemini API error:", error)
    throw error
  }
}

export async function generateChatResponse(message: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set")
  }

  const systemPrompt = `You are a helpful AI assistant for Netlink Cogni, a comprehensive AI-powered business networking platform. You help users with business networking, contact management, and professional communication.

ABOUT NETLINK COGNI PLATFORM:
Netlink Cogni is an AI-powered business networking and contact management platform that helps professionals build, manage, and grow their professional networks. The platform includes:

CORE FEATURES:
- Business Card Scanner: AI-powered OCR using Google Gemini to extract contact information from business card photos
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
- Uses Google Gemini 2.5 Flash model for AI processing
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

FORMATTING RULES:
1. For bullet points: Use plain dash (-) NOT asterisks
2. Do not use asterisks in any formatting
3. Keep responses concise, professional, and to the point
4. Use clear, readable formatting without special markdown characters

Example of correct formatting:
Key Features:
- Business Networking
- Contact Management
- Professional Communication

Be friendly, professional, and knowledgeable about the platform's capabilities. When users ask about features, explain how they work within Netlink Cogni.`
  
  const fullPrompt = `${systemPrompt}\n\nUser: ${message}`

  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
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
                  text: fullPrompt,
                },
              ],
            },
          ],
        }),
      },
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Gemini API error:", errorText)
      throw new Error(`Gemini API request failed (${response.status}): ${errorText}`)
    }

    const data = await response.json()

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      return data.candidates[0].content.parts[0].text
    }

    throw new Error("No valid response from Gemini API")
  } catch (error) {
    console.error("Gemini chat API error:", error)
    throw error
  }
}

export async function fetchUrlPreview(url: string): Promise<{
  title?: string
  description?: string
  image?: string
}> {
  const apiKey = process.env.GEMINI_API_KEY!

  const prompt = `Given this URL: ${url}

Generate a preview with:
- A descriptive title (what the page/event is about)
- A brief description (1-2 sentences)
- Suggest what type of image would represent this (we'll use a placeholder)

Return ONLY a JSON object:
{
  "title": "event or page title",
  "description": "brief description",
  "imageType": "description for placeholder image"
}

Keep descriptions concise and to the point.`

  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
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
      },
    )

    const data = await response.json()

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const text = data.candidates[0].content.parts[0].text
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
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
  const apiKey = process.env.GEMINI_API_KEY!

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

Return ONLY a JSON object:
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
    const response = await fetch(
      `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
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
      },
    )

    const data = await response.json()

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const text = data.candidates[0].content.parts[0].text
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    }

    throw new Error("Failed to extract event data")
  } catch (error) {
    console.error("Gemini API error:", error)
    throw error
  }
}
