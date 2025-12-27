import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { throttle, GEMINI_MODEL, GEMINI_API_BASE, getApiKey } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { linkedinUrl } = await request.json()

    if (!linkedinUrl || !linkedinUrl.includes("linkedin.com")) {
      return NextResponse.json(
        { error: "Valid LinkedIn URL is required" },
        { status: 400 }
      )
    }

    // Extract username from LinkedIn URL
    const linkedinMatch = linkedinUrl.match(/linkedin\.com\/in\/([^\/\?]+)/)
    const username = linkedinMatch ? linkedinMatch[1] : ""

    // Use AI to infer information from LinkedIn profile URL
    await throttle()
    const apiKey = getApiKey()

    const prompt = `Based on this LinkedIn profile URL: ${linkedinUrl}

Infer realistic professional information that would typically be found on a LinkedIn profile with this URL structure. Return ONLY valid JSON (no markdown, no asterisks):

{
  "name": "Realistic full name based on username ${username}",
  "title": "Common professional title for this profile type",
  "company": "Realistic company name",
  "summary": "Brief 2-3 sentence professional summary",
  "experience": "2-3 key experience points",
  "education": "Educational background",
  "skills": "Relevant skills (comma-separated)"
}

Rules: Make it realistic and professional. Use the username to infer name structure. Keep it concise. Return JSON only.`

    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.5,
              maxOutputTokens: 1024,
            },
          }),
        }
      )

      if (response.ok) {
        const data = await response.json()
        const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text
        
        if (extractedText) {
          const jsonMatch = extractedText.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const aiProfile = JSON.parse(jsonMatch[0])
            return NextResponse.json({ 
              success: true, 
              profile: {
                linkedinUrl: linkedinUrl,
                username: username,
                ...aiProfile
              } 
            })
          }
        }
      }
    } catch (aiError) {
      console.error("AI extraction error, using fallback:", aiError)
    }

    // Fallback: Return basic structure
    const profileData = {
      linkedinUrl: linkedinUrl,
      username: username,
      name: username.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "",
    }

    return NextResponse.json({ success: true, profile: profileData })
  } catch (error) {
    console.error("LinkedIn extraction error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to extract LinkedIn profile" },
      { status: 500 }
    )
  }
}

