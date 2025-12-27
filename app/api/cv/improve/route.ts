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

    const { cvData } = await request.json()

    if (!cvData) {
      return NextResponse.json(
        { error: "CV data is required" },
        { status: 400 }
      )
    }

    await throttle()
    const apiKey = getApiKey()

    // Build prompt to improve CV data
    const prompt = `You are an expert career advisor and resume writer. Review and improve the following CV/Resume data to make it more professional, impactful, and compelling while maintaining accuracy and authenticity.

CURRENT CV/RESUME DATA:
Name: ${cvData.name || ''}
Email: ${cvData.email || ''}
Phone: ${cvData.phone || ''}
Title: ${cvData.title || ''}
Location: ${cvData.location || ''}
${cvData.summary ? `\nProfessional Summary:\n${cvData.summary}` : ''}
${cvData.experience ? `\nWork Experience:\n${cvData.experience}` : ''}
${cvData.education ? `\nEducation:\n${cvData.education}` : ''}
${cvData.skills ? `\nSkills:\n${cvData.skills}` : ''}
${cvData.certifications ? `\nCertifications:\n${cvData.certifications}` : ''}
${cvData.projects ? `\nProjects:\n${cvData.projects}` : ''}
${cvData.languages ? `\nLanguages:\n${cvData.languages}` : ''}

IMPROVEMENT GUIDELINES:
1. Enhance the professional summary to be more compelling and achievement-focused
2. Strengthen work experience descriptions with quantifiable achievements and impact
3. Refine skills section to be more organized and industry-relevant
4. Improve project descriptions to highlight technical depth and business impact
5. Ensure all content is professional, clear, and concise
6. Maintain all factual information - only enhance wording and structure
7. Use action verbs and achievement-oriented language
8. Keep bullet points using dashes (-), not asterisks

CRITICAL FORMATTING RULES:
- NEVER use asterisks (*) anywhere in the response
- Use ONLY dashes (-) for bullet points
- Return ONLY valid JSON (no markdown, no asterisks, no extra text)
- Keep all original information, just improve the presentation

Return ONLY valid JSON in this exact format:
{
  "name": "Full name (unchanged)",
  "email": "Email address (unchanged)",
  "phone": "Phone number (unchanged)",
  "title": "Current job title/position (may be enhanced)",
  "location": "Location/city (unchanged)",
  "summary": "Enhanced professional summary (3-5 sentences, more compelling and achievement-focused)",
  "experience": "Enhanced work experience with stronger action verbs, quantifiable achievements, and impact (use dashes for bullets)",
  "education": "Enhanced education section (use dashes for bullets)",
  "skills": "Enhanced skills organized by category with better structure (use dashes for bullets)",
  "certifications": "Enhanced certifications section (use dashes for bullets)",
  "projects": "Enhanced project descriptions highlighting technical depth and business impact (use dashes for bullets)",
  "languages": "Languages spoken (if mentioned, unchanged or enhanced)"
}`

    const response = await fetch(
      `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 4096,
          },
        }),
      }
    )

    if (!response.ok) {
      throw new Error("Failed to improve CV data")
    }

    const data = await response.json()
    const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!extractedText) {
      throw new Error("No improved data generated")
    }

    const jsonMatch = extractedText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Failed to parse improved data")
    }

    const improvedCvData = JSON.parse(jsonMatch[0])
    
    // Merge with original data to ensure we don't lose any fields
    const finalCvData = {
      ...cvData,
      ...improvedCvData,
      // Preserve original contact info if improved version is missing
      name: improvedCvData.name || cvData.name,
      email: improvedCvData.email || cvData.email,
      phone: improvedCvData.phone || cvData.phone,
    }

    return NextResponse.json({ success: true, cvData: finalCvData })
  } catch (error) {
    console.error("CV improvement error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to improve CV information" },
      { status: 500 }
    )
  }
}

