import { throttle, retryWithBackoff } from "@/lib/ai/utils"

export type AiProvider = "openai" | "gemini" | "openrouter" | "bytez"

export const GEMINI_MODEL = "gemini-2.5-flash"
export const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"
export const OPENROUTER_API_BASE = "https://openrouter.ai/api/v1"
export const OPENROUTER_TEXT_MODEL = "qwen/qwen3-14b:free"

export const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini"
export const OPENAI_VISION_MODEL = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini"
export const OPENAI_API_BASE = "https://api.openai.com/v1"

const CHAT_OPENROUTER_MODELS = [
  "google/gemma-3-12b-it:free",
  "openai/gpt-oss-120b:free",
  "google/gemma-3n-e4b-it:free",
]

export const CHAT_BYTEZ_MODELS = [
  "ek-ai/DeepSeek-R1-Distill-Qwen-1.5B",
  "Qwen/Qwen3-0.6B",
  "microsoft/Phi-3-mini-4k-instruct",
]

const CORE_OPENROUTER_MODELS = [OPENROUTER_TEXT_MODEL, ...CHAT_OPENROUTER_MODELS]
const BYTEZ_API_BASE = "https://api.bytez.com/models/v2"

const providerUsage: Record<AiProvider, number> = {
  openai: 0,
  gemini: 0,
  openrouter: 0,
  bytez: 0,
}

const providerCooldownUntil: Partial<Record<AiProvider, number>> = {}

export function isProviderConfigured(provider: AiProvider): boolean {
  switch (provider) {
    case "openai":
      return !!process.env.OPENAI_API_KEY
    case "gemini":
      return !!process.env.GEMINI_API_KEY
    case "openrouter":
      return !!process.env.OPENROUTER_API_KEY
    case "bytez":
      return !!process.env.BYTEZ_API_KEY
  }
}

function trackProviderUsage(provider: AiProvider): void {
  providerUsage[provider]++
}

function markProviderRateLimited(provider: AiProvider): void {
  providerCooldownUntil[provider] = Date.now() + 5 * 60 * 1000
}

function isProviderInCooldown(provider: AiProvider): boolean {
  return (providerCooldownUntil[provider] ?? 0) > Date.now()
}

function isRateLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()
  return message.includes("429") || message.includes("rate limit") || message.includes("quota")
}

/** Fallback providers sorted by lowest usage for token balancing. */
export function getBalancedFallbackProviders(): AiProvider[] {
  const fallbacks: AiProvider[] = ["gemini", "openrouter", "bytez"].filter(
    (p) => isProviderConfigured(p as AiProvider) && !isProviderInCooldown(p as AiProvider)
  ) as AiProvider[]

  return fallbacks.sort((a, b) => providerUsage[a] - providerUsage[b])
}

/** OpenAI first, then fallbacks ordered by lowest usage. Skips providers in cooldown. */
export function getProviderOrder(): AiProvider[] {
  const fallbacks = getBalancedFallbackProviders()
  const order: AiProvider[] = []

  if (isProviderConfigured("openai") && !isProviderInCooldown("openai")) {
    order.push("openai")
  }

  return [...order, ...fallbacks.filter((p) => !order.includes(p))]
}

function getOpenAIApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set. Please add it to your .env.local file.")
  }
  return apiKey
}

function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set. Please add it to your .env.local file.")
  }
  return apiKey
}

function getOpenRouterApiKey(): string {
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

export interface AiCallOptions {
  message: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
}

export interface AiVisionCallOptions {
  prompt: string
  imageBase64: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
}

export async function callOpenAI(options: AiCallOptions): Promise<string> {
  const apiKey = getOpenAIApiKey()
  await throttle()

  const messages: Array<{ role: string; content: string }> = []
  if (options.systemPrompt) {
    messages.push({ role: "system", content: options.systemPrompt })
  }
  messages.push({ role: "user", content: options.message })

  const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2048,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API request failed (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error("No response content from OpenAI")
  }

  return typeof content === "string" ? content : String(content)
}

export async function callOpenAIVision(options: AiVisionCallOptions): Promise<string> {
  const apiKey = getOpenAIApiKey()
  await throttle()

  const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_VISION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: options.systemPrompt ? `${options.systemPrompt}\n\n${options.prompt}` : options.prompt,
            },
            {
              type: "image_url",
              image_url: { url: `data:image/jpeg;base64,${options.imageBase64}` },
            },
          ],
        },
      ],
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 1024,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI vision API request failed (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error("No response content from OpenAI vision")
  }

  return typeof content === "string" ? content : String(content)
}

export async function callGemini(prompt: string, systemInstruction?: string): Promise<string> {
  await throttle()
  const apiKey = getGeminiApiKey()

  const noAsterisksRule =
    "CRITICAL: Never use asterisks (*) in your responses. Use plain dashes (-) for bullet points. No markdown formatting."
  const systemContent = systemInstruction ? `${systemInstruction}\n\n${noAsterisksRule}` : noAsterisksRule

  const response = await fetch(
    `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: `${systemContent}\n\n${prompt}` }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API request failed (${response.status}): ${errorText}`)
  }

  const data = await response.json()

  if (data.error) {
    throw new Error(`Gemini API error: ${data.error.message || JSON.stringify(data.error)}`)
  }

  if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text
  }

  throw new Error("Failed to generate response: No valid response from Gemini")
}

async function callOpenRouterChatModel(
  model: string,
  message: string,
  systemPrompt: string,
  maxTokens = 2048,
  temperature = 0.7
): Promise<string> {
  await throttle()
  const apiKey = getOpenRouterApiKey()

  const response = await fetch(`${OPENROUTER_API_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "Netlink AI",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter chat API error for ${model}: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    throw new Error(`No response content from OpenRouter chat model ${model}`)
  }

  return typeof content === "string"
    ? content
    : Array.isArray(content)
      ? content.map((part: { text?: string }) => part.text || "").join("\n")
      : String(content)
}

async function callBytezChatModel(
  modelId: string,
  message: string,
  systemPrompt: string,
  maxTokens = 2048,
  temperature = 0.7
): Promise<string> {
  await throttle()
  const apiKey = getBytezApiKey()

  const response = await fetch(`${BYTEZ_API_BASE}/${encodeURIComponent(modelId)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: [{ type: "text", text: `${systemPrompt}\n\nUser: ${message}` }],
        },
      ],
      stream: false,
      params: { max_length: maxTokens, temperature },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Bytez chat API error for ${modelId}: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const output = data.output

  if (!output) {
    throw new Error(`No output field in Bytez response for model ${modelId}`)
  }

  const content =
    typeof output.content === "string"
      ? output.content
      : output.content?.toString?.() ?? JSON.stringify(output)

  if (!content) {
    throw new Error(`No content in Bytez output for model ${modelId}`)
  }

  return content
}

async function callProviderWithModelFallbacks(
  provider: AiProvider,
  options: AiCallOptions,
  systemPrompt: string
): Promise<string> {
  const maxTokens = options.maxTokens ?? 2048
  const temperature = options.temperature ?? 0.7

  switch (provider) {
    case "openai":
      return callOpenAI({ ...options, systemPrompt, maxTokens, temperature })
    case "gemini":
      return callGemini(options.message, systemPrompt)
    case "openrouter": {
      let lastError: Error | null = null
      for (const model of CORE_OPENROUTER_MODELS) {
        try {
          return await callOpenRouterChatModel(model, options.message, systemPrompt, maxTokens, temperature)
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error))
        }
      }
      throw lastError ?? new Error("All OpenRouter models failed")
    }
    case "bytez": {
      let lastError: Error | null = null
      for (const modelId of CHAT_BYTEZ_MODELS) {
        try {
          return await callBytezChatModel(modelId, options.message, systemPrompt, maxTokens, temperature)
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error))
        }
      }
      throw lastError ?? new Error("All Bytez models failed")
    }
  }
}

/**
 * Try OpenAI first, then fall back to other configured providers.
 * Fallback order rotates by lowest usage to balance token consumption.
 */
export async function callAIWithFallbacks(
  options: AiCallOptions
): Promise<{ text: string; provider: AiProvider }> {
  const systemPrompt = options.systemPrompt ?? "You are a helpful AI assistant."
  const providerOrder = getProviderOrder()

  if (providerOrder.length === 0) {
    throw new Error(
      "No AI providers configured. Set at least one of OPENAI_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY, or BYTEZ_API_KEY."
    )
  }

  const errors: string[] = []

  for (const provider of providerOrder) {
    try {
      const text = await retryWithBackoff(
        () => callProviderWithModelFallbacks(provider, options, systemPrompt),
        provider === "openai" ? 3 : 2,
        1000
      )
      trackProviderUsage(provider)
      return { text, provider }
    } catch (error) {
      if (isRateLimitError(error)) {
        markProviderRateLimited(provider)
      }
      const msg = error instanceof Error ? error.message : String(error)
      console.error(`${provider} failed, trying next provider:`, msg)
      errors.push(`${provider}: ${msg}`)
    }
  }

  throw new Error(`All AI providers failed. Details: ${errors.join(" | ")}`)
}

/** Convenience wrapper returning only the text response. */
export async function generateAIContent(options: AiCallOptions): Promise<string> {
  const { text } = await callAIWithFallbacks(options)
  return text
}
