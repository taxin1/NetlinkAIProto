export async function generateEmailWithGemini(
  contactName: string,
  contactCompany: string,
  purpose: string,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY!

  const prompt = `Write a professional cold email to ${contactName}${contactCompany ? ` at ${contactCompany}` : ""} for the following purpose: ${purpose}. 

Keep it concise, friendly, and professional. Include a clear call to action. Do not include subject line, just the email body. 

FORMATTING RULES:
- Use **bold** for important titles and key points (double asterisks)
- Use plain dash (-) for bullet points, NOT asterisks (*)
- NEVER use single asterisk (*) for any purpose`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
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
                  text: prompt + "\n\nFORMATTING RULES:\n1. Use **bold** for titles (double asterisks)\n2. Use plain dash (-) for bullet points, NOT asterisks (*)\n3. NEVER use single asterisk (*)\n4. Keep responses concise\n\nExample:\n**Title:**\n- Point one\n- Point two",
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

  const systemPrompt = `You are a helpful AI assistant for a business networking platform called Netlink Cogni. You help users with business networking, contact management, and professional communication.

FORMATTING RULES (CRITICAL):
1. For titles and headings: Use **Title** (double asterisks on both sides)
2. For bullet points: Use plain dash (-) NOT asterisks (*)
3. NEVER use single asterisk (*) for any purpose
4. NEVER use asterisk (*) for bullet points or lists
5. Keep responses concise, professional, and to the point

Example of correct formatting:
**Key Features:**
- Business Networking
- Contact Management
- Professional Communication

Be friendly, professional, and avoid unnecessary details.`
  
  const fullPrompt = `${systemPrompt}\n\nUser: ${message}`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
