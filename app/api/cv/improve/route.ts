import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateAIContent } from "@/lib/gemini"

function parseJsonFromText(text: string): any {
  // Try to find JSON in the text
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error("No JSON object found in response")
  }

  let jsonText = jsonMatch[0]

  // Try to clean up common issues
  // Remove trailing commas
  jsonText = jsonText.replace(/,(\s*[}\]])/g, "$1")

  try {
    return JSON.parse(jsonText)
  } catch (parseError) {
    // Try to fix common JSON issues
    try {
      // Try removing markdown code blocks if present
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "")
      return JSON.parse(jsonText)
    } catch {
      // Try fixing escaped quotes
      try {
        jsonText = jsonText.replace(/\\"/g, '"')
        return JSON.parse(jsonText)
      } catch {
        throw new Error(
          `Failed to parse JSON: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
        )
      }
    }
  }
}

async function improveCVWithModel(prompt: string, _cvData: any): Promise<any> {
  const systemPrompt = `You are an expert career advisor. Improve CV data to be more professional and impactful while maintaining accuracy.

Guidelines: Enhance summary, strengthen experience with achievements, organize skills, improve projects. Use action verbs. Keep dashes (-) for bullets, NO asterisks (*).

CRITICAL: Return ONLY valid JSON (no markdown, no asterisks). Keep all original info, just improve presentation.

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

  // Try OpenAI first (via unified provider chain), then Gemini/OpenRouter/Bytez fallbacks
  try {
    const text = await generateAIContent({
      message: `${systemPrompt}\n\n${prompt}`,
      systemPrompt: "You improve CV/resume data. Return only valid JSON.",
      maxTokens: 2048,
      temperature: 0.5,
    })
    return parseJsonFromText(text)
  } catch (error) {
    console.error("Unified AI CV improvement failed:", error)
  }

  throw new Error("All AI providers failed to improve CV data")
}

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
      return NextResponse.json({ error: "CV data is required" }, { status: 400 })
    }

    // Build prompt to improve CV data
    const prompt = `CURRENT CV/RESUME DATA:
Name: ${cvData.name || ""}
Email: ${cvData.email || ""}
Phone: ${cvData.phone || ""}
Title: ${cvData.title || ""}
Location: ${cvData.location || ""}
${cvData.summary ? `\nProfessional Summary:\n${cvData.summary}` : ""}
${cvData.experience ? `\nWork Experience:\n${cvData.experience}` : ""}
${cvData.education ? `\nEducation:\n${cvData.education}` : ""}
${cvData.skills ? `\nSkills:\n${cvData.skills}` : ""}
${cvData.certifications ? `\nCertifications:\n${cvData.certifications}` : ""}
${cvData.projects ? `\nProjects:\n${cvData.projects}` : ""}
${cvData.languages ? `\nLanguages:\n${cvData.languages}` : ""}`

    // Try to improve CV using AI (OpenAI first, then fallbacks)
    let improvedCvData
    try {
      improvedCvData = await improveCVWithModel(prompt, cvData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to improve CV data"

      // Provide user-friendly messages
      if (errorMessage.includes("API key") || errorMessage.includes("GEMINI_API_KEY")) {
        throw new Error(
          "AI service not configured. Please set at least one API key (OPENAI_API_KEY recommended, or GEMINI_API_KEY, OPENROUTER_API_KEY, BYTEZ_API_KEY) in environment variables.",
        )
      } else if (
        errorMessage.includes("quota") ||
        errorMessage.includes("rate limit") ||
        errorMessage.includes("429")
      ) {
        throw new Error("API rate limit exceeded. Please try again in a moment.")
      } else if (errorMessage.includes("safety filters")) {
        throw new Error("Content was blocked by safety filters. Please modify your CV content and try again.")
      } else if (errorMessage.includes("All AI providers failed")) {
        throw new Error("All AI providers failed. Please check your API keys or try again later.")
      }

      throw error
    }

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
      { status: 500 },
    )
  }
}
