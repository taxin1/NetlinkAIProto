import { throttle as geminiThrottle } from "@/lib/gemini"

export const GEMINI_MODEL = "gemini-2.5-flash"
export const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"

export const OPENROUTER_API_BASE = "https://openrouter.ai/api/v1"

const BUSINESS_CARD_OPENROUTER_MODELS = [
  "google/gemma-3-12b-it:free",
  "qwen/qwen-2.5-vl-7b-instruct:free",
  "microsoft/phi-4-multimodal-instruct"
]

const BYTEZ_API_BASE = "https://api.bytez.com/models/v2"

const BUSINESS_CARD_BYTEZ_MODELS = [
  "unography/blip-large-long-cap",
  "Salesforce/blip-image-captioning-base",
  "Salesforce/blip2-opt-2.7b"
]

const BUSINESS_CARD_EXTRACTION_PROMPT = `Extract contact information from this business card image. Return ONLY a JSON object with these fields (use null for missing fields):
{
  "name": "full name",
  "email": "email address",
  "phone": "phone number",
  "company": "company name",
  "position": "job title/position",
  "linkedin_url": "LinkedIn URL if present"
}

Be precise and only extract information that is clearly visible. Do not make up information.`

type BusinessCardInfo = {
  name?: string
  email?: string
  phone?: string
  company?: string
  position?: string
  linkedin_url?: string
}

function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set. Please add it to your .env.local file.")
  }
  return apiKey
}

function getOpenRouterVisionApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set. Please add it to your .env.local file.")
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

let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000

async function throttle(): Promise<void> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
  }
  lastRequestTime = Date.now()
}

export async function extractBusinessCardInfo(imageBase64: string): Promise<BusinessCardInfo> {
  if (!imageBase64 || imageBase64.length === 0) {
    throw new Error("No image data provided for business card scanning")
  }

  try {
    return await extractBusinessCardInfoWithGemini(imageBase64)
  } catch (error) {
    console.error("Gemini business card extraction failed, trying OpenRouter fallbacks", error)
  }

  const errors: string[] = []

  for (const model of BUSINESS_CARD_OPENROUTER_MODELS) {
    try {
      return await extractBusinessCardInfoWithOpenRouterModel(model, imageBase64)
    } catch (providerError) {
      console.error(`OpenRouter business card extraction failed for model ${model}`, providerError)
      if (providerError instanceof Error) {
        errors.push(`${model}: ${providerError.message}`)
      } else {
        errors.push(`${model}: ${String(providerError)}`)
      }
    }
  }

  for (const model of BUSINESS_CARD_BYTEZ_MODELS) {
    try {
      return await extractBusinessCardInfoWithBytezModel(model, imageBase64)
    } catch (providerError) {
      console.error(`Bytez business card extraction failed for model ${model}`, providerError)
      if (providerError instanceof Error) {
        errors.push(`bytez:${model}: ${providerError.message}`)
      } else {
        errors.push(`bytez:${model}: ${String(providerError)}`)
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`All AI providers failed for business card scanning. Details: ${errors.join(" | ")}`)
  }

  throw new Error("All AI providers failed for business card scanning")
}

async function extractBusinessCardInfoWithGemini(imageBase64: string): Promise<BusinessCardInfo> {
  await geminiThrottle()
  const apiKey = getGeminiApiKey()
  const prompt = BUSINESS_CARD_EXTRACTION_PROMPT

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
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
        },
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API request failed (${response.status}): ${errorText}`)
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(`Gemini API error: ${data.error.message || "Unknown error"}`)
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
}

async function extractBusinessCardInfoWithOpenRouterModel(
  model: string,
  imageBase64: string
): Promise<BusinessCardInfo> {
  await throttle()
  const apiKey = getOpenRouterVisionApiKey()
  const prompt = BUSINESS_CARD_EXTRACTION_PROMPT

  const messages = [
    {
      role: "user",
      content: [
        {
          type: "text",
          text: prompt
        },
        {
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`
          }
        }
      ]
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
        "X-Title": "Network Link AI"
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        max_tokens: 512
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter API error for ${model}: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices && data.choices[0]?.message?.content

  if (!content) {
    throw new Error(`No response content from OpenRouter model ${model}`)
  }

  const text = typeof content === "string"
    ? content
    : Array.isArray(content)
      ? content.map((part: any) => part.text || "").join("\n")
      : String(content)

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error("JSON parsing error for OpenRouter model", model, parseError)
      throw new Error(`Failed to parse business card information from OpenRouter model ${model}`)
    }
  }

  throw new Error(`No valid JSON found in OpenRouter response for model ${model}`)
}

async function extractBusinessCardInfoWithBytezModel(
  modelId: string,
  imageBase64: string
): Promise<BusinessCardInfo> {
  await throttle()
  const apiKey = getBytezApiKey()
  const prompt = BUSINESS_CARD_EXTRACTION_PROMPT

  const response = await fetch(
    `${BYTEZ_API_BASE}/${encodeURIComponent(modelId)}`,
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
                text: prompt
              },
              {
                type: "image",
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            ]
          }
        ],
        stream: false,
        params: {
          max_length: 512,
          temperature: 0.1
        }
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Bytez API error for ${modelId}: ${response.status} - ${errorText}`)
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(`Bytez API error for ${modelId}: ${typeof data.error === "string" ? data.error : JSON.stringify(data.error)}`)
  }

  const output = data.output

  if (!output) {
    throw new Error(`No output field in Bytez response for model ${modelId}`)
  }

  const content = typeof output.content === "string" ? output.content : output.content?.toString?.() ?? JSON.stringify(output)

  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0])
    } catch (parseError) {
      console.error("JSON parsing error for Bytez model", modelId, parseError)
      throw new Error(`Failed to parse business card information from Bytez model ${modelId}`)
    }
  }

  throw new Error(`No valid JSON found in Bytez response for model ${modelId}`)
}
