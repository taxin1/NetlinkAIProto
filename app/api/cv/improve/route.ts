import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  throttle,
  GEMINI_MODEL,
  GEMINI_API_BASE,
  getApiKey,
  retryWithBackoff,
  OPENROUTER_API_BASE,
  OPENROUTER_TEXT_MODEL,
  CHAT_BYTEZ_MODELS,
} from "@/lib/gemini"

// Fallback model lists (matching lib/gemini.ts)
const CHAT_OPENROUTER_MODELS = ["google/gemma-3-12b-it:free", "openai/gpt-oss-120b:free", "google/gemma-3n-e4b-it:free"]

const CORE_OPENROUTER_MODELS = [OPENROUTER_TEXT_MODEL, ...CHAT_OPENROUTER_MODELS]

const CORE_BYTEZ_API_BASE = "https://api.bytez.com/models/v2"
const CORE_BYTEZ_MODELS = CHAT_BYTEZ_MODELS

function getOpenRouterApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not configured")
  }
  return apiKey
}

function getBytezApiKey(): string {
  const apiKey = process.env.BYTEZ_API_KEY
  if (!apiKey) {
    throw new Error("BYTEZ_API_KEY not configured")
  }
  return apiKey
}

async function callOpenRouterChatModel(
  model: string,
  message: string,
  systemPrompt: string,
  skipThrottle = false,
): Promise<string> {
  if (!skipThrottle) {
    await throttle()
  }
  const apiKey = getOpenRouterApiKey()

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: message },
  ]

  const response = await fetch(`${OPENROUTER_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Netlink",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.5,
      max_tokens: 1536, // Reduced for faster response
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter API error for ${model}: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error(`No response content from OpenRouter model ${model}`)
  }

  return typeof content === "string" ? content : String(content)
}

async function callBytezChatModel(
  modelId: string,
  message: string,
  systemPrompt: string,
  skipThrottle = false,
): Promise<string> {
  if (!skipThrottle) {
    await throttle()
  }
  const apiKey = getBytezApiKey()

  const response = await fetch(`${CORE_BYTEZ_API_BASE}/${encodeURIComponent(modelId)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `${systemPrompt}\n\nUser: ${message}`,
            },
          ],
        },
      ],
      stream: false,
      params: {
        max_length: 1536, // Reduced for faster response
        temperature: 0.5,
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Bytez API error for ${modelId}: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const output = data.output
  const content =
    typeof output?.content === "string" ? output.content : (output?.content?.toString?.() ?? JSON.stringify(output))

  if (!content) {
    throw new Error(`No content in Bytez output for model ${modelId}`)
  }

  return content
}

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

async function improveCVWithModel(prompt: string, cvData: any): Promise<any> {
  // Track last request time for throttling
  let lastRequestTime = Date.now() - 1000 // Initialize to allow first request immediately

  // Build the system prompt (optimized for speed - shorter)
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

  // Try Gemini first (reduced retries and faster fail)
  try {
    return await retryWithBackoff(
      async () => {
        // Only throttle if last request was very recent (optimized for speed)
        const now = Date.now()
        const timeSinceLastRequest = now - lastRequestTime
        if (timeSinceLastRequest < 300) {
          await new Promise((resolve) => setTimeout(resolve, 300 - timeSinceLastRequest))
        }
        lastRequestTime = Date.now()
        const apiKey = getApiKey()

        // Add timeout to prevent hanging (15 seconds max)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000)

        try {
          const response = await fetch(`${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }],
              generationConfig: {
                temperature: 0.5,
                maxOutputTokens: 2048, // Reduced from 4096 for faster response
              },
            }),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            throw new Error(`Gemini API returned status ${response.status}`)
          }

          const data = await response.json()

          if (data.error) {
            throw new Error(`Gemini API error: ${data.error.message || JSON.stringify(data.error)}`)
          }

          const extractedText = data.candidates?.[0]?.content?.parts?.[0]?.text

          if (!extractedText) {
            const safetyRating = data.candidates?.[0]?.safetyRatings
            if (safetyRating && safetyRating.some((r: any) => r.blocked)) {
              throw new Error("Content was blocked by safety filters")
            }
            throw new Error("No response text from Gemini")
          }

          return parseJsonFromText(extractedText)
        } finally {
          clearTimeout(timeoutId)
        }
      },
      2,
      500,
    ) // Reduced retries from 3 to 2, reduced base delay from 1000ms to 500ms
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.error("Gemini CV improvement timed out, trying fallback")
    } else {
      console.error("Gemini CV improvement failed, trying OpenRouter fallback:", error)
    }
  }

  // Try OpenRouter primary model (only if API key is configured, no retries for speed)
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const text = await callOpenRouterChatModel(
        OPENROUTER_TEXT_MODEL,
        prompt,
        systemPrompt,
        true, // Skip throttle on first attempt
      )
      return parseJsonFromText(text)
    } catch (error) {
      console.error("OpenRouter primary CV improvement failed:", error)
    }

    // Try first OpenRouter fallback only (limit to 1 for speed)
    if (CHAT_OPENROUTER_MODELS.length > 0) {
      try {
        const text = await callOpenRouterChatModel(CHAT_OPENROUTER_MODELS[0], prompt, systemPrompt, true)
        return parseJsonFromText(text)
      } catch (error) {
        console.error(`OpenRouter fallback model failed:`, error)
      }
    }
  }

  // Try first Bytez model only (limit to 1 for speed, no retries)
  if (process.env.BYTEZ_API_KEY && CORE_BYTEZ_MODELS.length > 0) {
    try {
      const text = await callBytezChatModel(
        CORE_BYTEZ_MODELS[0],
        prompt,
        systemPrompt,
        true, // Skip throttle on first attempt
      )
      return parseJsonFromText(text)
    } catch (error) {
      console.error(`Bytez model failed:`, error)
    }
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

    // Try to improve CV using fallback models (Gemini -> OpenRouter -> Bytez)
    let improvedCvData
    try {
      improvedCvData = await improveCVWithModel(prompt, cvData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to improve CV data"

      // Provide user-friendly messages
      if (errorMessage.includes("API key") || errorMessage.includes("GEMINI_API_KEY")) {
        throw new Error(
          "AI service not configured. Please set at least one API key (GEMINI_API_KEY, OPENROUTER_API_KEY, or BYTEZ_API_KEY) in environment variables.",
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
