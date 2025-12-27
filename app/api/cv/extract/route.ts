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

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Please upload PDF, DOCX, or TXT file" },
        { status: 400 }
      )
    }

    // Convert file to base64 or text
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString("base64")
    const mimeType = file.type

    await throttle()
    const apiKey = getApiKey()

    // Use Gemini to extract CV/resume information
    let prompt = ""
    
    if (mimeType === "application/pdf" || mimeType.startsWith("image/")) {
      // Use vision API for PDF/image files
      prompt = `Extract all information from this CV/Resume document. Analyze the content and return ONLY valid JSON (no markdown, no asterisks):

{
  "name": "Full name",
  "email": "Email address",
  "phone": "Phone number",
  "title": "Current job title/position",
  "location": "Location/city",
  "summary": "Professional summary/about section (3-5 sentences)",
  "experience": "Detailed work experience with companies, roles, dates, and achievements (use bullet points with dashes)",
  "education": "Education background with degrees, institutions, and dates (use bullet points)",
  "skills": "Skills organized by category (Technical, Soft Skills, etc.) with bullet points",
  "certifications": "Certifications and licenses (use bullet points)",
  "projects": "Key projects or achievements (use bullet points)",
  "languages": "Languages spoken (if mentioned)"
}

IMPORTANT:
- Extract ALL real information from the CV/Resume
- Use bullet points (dashes) for lists, not asterisks
- Be thorough and include all relevant details
- Keep experience, education, skills in structured format
- Return ONLY the JSON object, no other text`
      
      // For PDF, we'll use Gemini's vision capabilities if available
      // For now, we'll try to extract text first
      const response = await fetch(
        `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64
                  }
                }
              ]
            }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 4096,
            },
          }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to extract CV data")
      }

      const data = await response.json()
      const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!extractedText) {
        throw new Error("No data extracted from CV")
      }

      const jsonMatch = extractedText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("Failed to parse extracted data")
      }

      const cvData = JSON.parse(jsonMatch[0])
      return NextResponse.json({ success: true, cvData })
    } else {
      // For text/DOCX files, read as text first
      const text = buffer.toString("utf-8")
      
      prompt = `Extract all information from this CV/Resume text. Return ONLY valid JSON (no markdown, no asterisks):

{
  "name": "Full name",
  "email": "Email address",
  "phone": "Phone number",
  "title": "Current job title/position",
  "location": "Location/city",
  "summary": "Professional summary/about section (3-5 sentences)",
  "experience": "Detailed work experience with companies, roles, dates, and achievements (use bullet points with dashes)",
  "education": "Education background with degrees, institutions, and dates (use bullet points)",
  "skills": "Skills organized by category (Technical, Soft Skills, etc.) with bullet points",
  "certifications": "Certifications and licenses (use bullet points)",
  "projects": "Key projects or achievements (use bullet points)",
  "languages": "Languages spoken (if mentioned)"
}

CV/RESUME CONTENT:
${text.substring(0, 50000)} ${text.length > 50000 ? "...(truncated)" : ""}

IMPORTANT:
- Extract ALL real information from the CV/Resume
- Use bullet points (dashes) for lists, not asterisks
- Be thorough and include all relevant details
- Return ONLY the JSON object, no other text`

      const response = await fetch(
        `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 4096,
            },
          }),
        }
      )

      if (!response.ok) {
        throw new Error("Failed to extract CV data")
      }

      const data = await response.json()
      const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (!extractedText) {
        throw new Error("No data extracted from CV")
      }

      const jsonMatch = extractedText.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("Failed to parse extracted data")
      }

      const cvData = JSON.parse(jsonMatch[0])
      return NextResponse.json({ success: true, cvData })
    }
  } catch (error) {
    console.error("CV extraction error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to extract CV information" },
      { status: 500 }
    )
  }
}

