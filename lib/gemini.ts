export async function generateEmailWithGemini(
  contactName: string,
  contactCompany: string,
  purpose: string,
): Promise<string> {
  const apiKey = "AIzaSyCHK3xUtoqF79_kIsOCxgeCDMY0HcyB-fs"

  const prompt = `Write a professional cold email to ${contactName}${contactCompany ? ` at ${contactCompany}` : ""} for the following purpose: ${purpose}. 

Keep it concise, friendly, and professional. Include a clear call to action. Do not include subject line, just the email body.`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
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
  const apiKey = "AIzaSyCHK3xUtoqF79_kIsOCxgeCDMY0HcyB-fs"

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

    const data = await response.json()

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const text = data.candidates[0].content.parts[0].text
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    }

    throw new Error("Failed to extract business card information")
  } catch (error) {
    console.error("Gemini API error:", error)
    throw error
  }
}

export async function fetchUrlPreview(url: string): Promise<{
  title?: string
  description?: string
  image?: string
}> {
  const apiKey = "AIzaSyCHK3xUtoqF79_kIsOCxgeCDMY0HcyB-fs"

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
}`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
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
