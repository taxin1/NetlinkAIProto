import { callGemini, callOpenRouterChat, generateText, retryWithBackoff } from "@/lib/gemini"

export const CHAT_GEMINI_MODEL = "gemini-2.5-flash"
export const CHAT_GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta"

export const CHAT_OPENROUTER_API_BASE = "https://openrouter.ai/api/v1"

const CHAT_OPENROUTER_MODELS = [
  "nvidia/nemotron-nano-9b-v2:free",
  "openai/gpt-oss-120b:free",
  "google/gemma-3n-e4b-it:free"
]

export const CHAT_BYTEZ_API_BASE = "https://api.bytez.com/models/v2"

export const CHAT_BYTEZ_MODELS = [
  "ek-ai/DeepSeek-R1-Distill-Qwen-1.5B",
  "Qwen/Qwen3-0.6B",
  "microsoft/Phi-3-mini-4k-instruct"
]

let assistantLastRequestTime = 0
const ASSISTANT_MIN_REQUEST_INTERVAL = 1000

async function assistantThrottle(): Promise<void> {
  const now = Date.now()
  const timeSinceLastRequest = now - assistantLastRequestTime
  if (timeSinceLastRequest < ASSISTANT_MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, ASSISTANT_MIN_REQUEST_INTERVAL - timeSinceLastRequest))
  }
  assistantLastRequestTime = Date.now()
}

function getChatOpenRouterApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set. Please add it to your .env.local file.")
  }
  return apiKey
}

function getChatBytezApiKey(): string {
  const apiKey = process.env.BYTEZ_API_KEY
  if (!apiKey) {
    throw new Error("BYTEZ_API_KEY environment variable is not set. Please add it to your .env.local file.")
  }
  return apiKey
}

interface AIResponse {
  content: string
  suggestions?: string[]
}

interface AssistantContext {
  message: string
  userId: string
  contacts: any[]
  recentEmails: any[]
  conversationHistory: any[]
}

type ChatProvider = "gemini" | "openrouter" | "bytez"

type ChatErrorType =
  | "rate_limit"
  | "overloaded"
  | "network"
  | "auth"
  | "config"
  | "invalid_request"
  | "unknown"

type ChatProviderError = {
  provider: ChatProvider
  type: ChatErrorType
  retryable: boolean
  message: string
}

function classifyChatError(provider: ChatProvider, error: unknown): ChatProviderError {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : String(error)

  const lower = message.toLowerCase()

  if (lower.includes("429") || lower.includes("rate limit")) {
    return { provider, type: "rate_limit", retryable: true, message }
  }

  if (
    lower.includes("503") ||
    lower.includes("overloaded") ||
    lower.includes("unavailable")
  ) {
    return { provider, type: "overloaded", retryable: true, message }
  }

  if (
    lower.includes("network") ||
    lower.includes("econnreset") ||
    lower.includes("fetch") ||
    lower.includes("timeout")
  ) {
    return { provider, type: "network", retryable: true, message }
  }

  if (
    lower.includes("401") ||
    lower.includes("unauthorized") ||
    lower.includes("forbidden")
  ) {
    return { provider, type: "auth", retryable: false, message }
  }

  if (
    lower.includes("api key") ||
    lower.includes("environment variable is not set") ||
    lower.includes("not configured")
  ) {
    return { provider, type: "config", retryable: false, message }
  }

  if (lower.includes("400") || lower.includes("invalid")) {
    return { provider, type: "invalid_request", retryable: false, message }
  }

  return { provider, type: "unknown", retryable: false, message }
}

export async function generateAIResponse(context: AssistantContext): Promise<AIResponse> {
  const { message, contacts, recentEmails, conversationHistory } = context

  const systemPrompt = `You are an AI networking assistant for Netlink, a comprehensive AI-powered business networking and contact management platform.

ABOUT NETLINK COGNI:
Netlink helps professionals build, manage, and grow their professional networks through AI-powered features:

PLATFORM FEATURES:
- Business Card Scanner: Upload photos to automatically extract contact information using AI
- Contact Management: Store and organize contacts with company, position, phone, email, LinkedIn, notes
- AI Email Generation: Generate professional emails for cold outreach, introductions, follow-ups, thank you messages
- Email Campaigns: Send personalized bulk emails with AI-generated unique content per recipient
- Event Management: Create and manage calendar events with automatic URL scraping (Zoom, Meet, Teams, Eventbrite)
- Voice Commands: Hands-free control to send emails, add contacts, view events, check statistics
- AI Assistant: Get networking advice, email writing help, contact analysis, and relationship insights
- Analytics: Track networking activity, email performance, contact growth
- Real-time Updates: Live notifications for new contacts, events, email activity

AVAILABLE ACTIONS:
- Help users write professional emails using the AI email generator
- Provide networking strategies based on their contact base
- Suggest follow-up activities and relationship building tactics
- Analyze contact networks and identify opportunities
- Explain platform features and how to use them effectively
- Assist with contact organization and management

User's Context:
- Recent contacts: ${contacts.length} contacts (${contacts.slice(0, 3).map(c => c.name).join(', ')})
- Recent emails: ${recentEmails.length} emails sent
- Conversation history: ${conversationHistory.length} previous messages

Current user message: "${message}"

CRITICAL FORMATTING RULES - MUST FOLLOW STRICTLY:
1. NEVER use asterisks (*) or double asterisks (**) in your response under any circumstances
2. NEVER use asterisks for bold text, emphasis, bullet points, headings, or any other purpose
3. For bullet points: ALWAYS use plain dash (-) only, NEVER asterisks
4. Do not use asterisks in any formatting, anywhere, for any reason
5. Keep responses concise, professional, and actionable
6. Reference specific Netlink features when relevant
7. Use clear, readable formatting with plain text only - no markdown, no asterisks, no special formatting characters

CORRECT Example of formatting:
Key Features:
- Business Networking
- Contact Management

WRONG Examples (NEVER DO THIS):
**Key Features:**
* Business Networking
* Contact Management

Provide helpful, actionable advice. If the user asks about specific contacts or emails, reference the context. When explaining features, describe how they work within the Netlink platform.`

  const conversationContext = conversationHistory
    .slice(-6)
    .map(msg => `${msg.type}: ${msg.content}`)
    .join("\n")

  const fullPrompt = `${systemPrompt}\n\nConversation context:\n${conversationContext}\n\nUser: ${message}\n\nAssistant:`

  try {
    const response = await generateText(fullPrompt)
    const suggestions = generateSuggestions(message, contacts, recentEmails)
    
    return {
      content: response,
      suggestions
    }
  } catch (error) {
    console.error("AI Assistant error:", error)
    throw new Error("Failed to generate AI response")
  }
}

function generateSuggestions(message: string, contacts: any[], recentEmails: any[]): string[] {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes("email") || lowerMessage.includes("write") || lowerMessage.includes("send")) {
    return [
      "Help me write a follow-up email",
      "Generate an introduction email",
      "Create a thank you email",
      "Draft a meeting request email"
    ]
  }
  
  if (lowerMessage.includes("contact") || lowerMessage.includes("network") || lowerMessage.includes("connection")) {
    return [
      "Analyze my contact network",
      "Suggest new networking opportunities",
      "Help me organize my contacts",
      "Create a networking strategy"
    ]
  }
  
  if (lowerMessage.includes("follow") || lowerMessage.includes("next") || lowerMessage.includes("plan")) {
    return [
      "Create a follow-up timeline",
      "Suggest follow-up activities",
      "Plan networking events",
      "Set relationship goals"
    ]
  }
  
  return [
    "Help me write an email",
    "Give me networking tips",
    "Analyze my recent activity",
    "Suggest conversation starters"
  ]
}

export async function generateEmailContent(
  type: "introduction" | "follow-up" | "thank-you" | "meeting-request",
  contactName: string,
  context?: string
): Promise<string> {
  const prompts = {
    introduction: `Write a professional introduction email to ${contactName}. ${context ? `Context: ${context}` : ""}`,
    "follow-up": `Write a follow-up email to ${contactName}. ${context ? `Context: ${context}` : ""}`,
    "thank-you": `Write a thank you email to ${contactName}. ${context ? `Context: ${context}` : ""}`,
    "meeting-request": `Write a meeting request email to ${contactName}. ${context ? `Context: ${context}` : ""}`
  }

  return await generateText(prompts[type])
}

export async function generateNetworkingAdvice(contacts: any[], recentActivity: any[]): Promise<string> {
  const prompt = `Based on these contacts and recent activity, provide networking advice:

Contacts: ${contacts.slice(0, 5).map(c => `${c.name} (${c.company || "No company"})`).join(", ")}
Recent Activity: ${recentActivity.slice(0, 3).map(a => a.description || a.event_type).join(", ")}

Provide specific, actionable networking advice.`

  return await generateText(prompt)
}

export async function analyzeContactNetwork(contacts: any[]): Promise<string> {
  if (contacts.length === 0) {
    return "You don't have any contacts yet. Start by adding some connections to build your network!"
  }

  const companies = contacts.filter(c => c.company).map(c => c.company)
  const uniqueCompanies = [...new Set(companies)]
  
  const prompt = `Analyze this contact network and provide insights:

Total contacts: ${contacts.length}
Companies represented: ${uniqueCompanies.length}
Recent contacts: ${contacts.slice(0, 3).map(c => c.name).join(", ")}

Provide insights about network diversity, potential opportunities, and suggestions for growth.`

  return await generateText(prompt)
}

export async function generateChatResponse(message: string): Promise<string> {
  const systemPrompt = `You are a helpful AI assistant for Netlink, a comprehensive AI-powered business networking platform. You help users with business networking, contact management, and professional communication.

ABOUT NETLINK COGNI PLATFORM:
Netlink is an AI-powered business networking and contact management platform that helps professionals build, manage, and grow their professional networks. The platform includes:

CORE FEATURES:
- Business Card Scanner: AI-powered OCR to extract contact information from business card photos
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
- Uses multiple AI providers (Google Gemini 2.5 Flash, OpenRouter, and Bytez) for intelligent processing with robust fallbacks
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

CRITICAL FORMATTING RULES - MUST FOLLOW STRICTLY:
1. NEVER use asterisks (*) or double asterisks (**) in your response under any circumstances
2. NEVER use asterisks for bold text, emphasis, bullet points, headings, or any other purpose
3. For bullet points: ALWAYS use plain dash (-) only, NEVER asterisks
4. Do not use asterisks in any formatting, anywhere, for any reason
5. Keep responses concise, professional, and to the point
6. Use clear, readable formatting with plain text only - no markdown, no asterisks, no special formatting characters

CORRECT Example of formatting:
Key Features:
- Business Networking
- Contact Management
- Professional Communication

WRONG Examples (NEVER DO THIS):
**Key Features:**
* Business Networking
* Contact Management

Be friendly, professional, and knowledgeable about the platform's capabilities. When users ask about features, explain how they work within Netlink.`

  const providerErrors: ChatProviderError[] = []

  try {
    return await retryWithBackoff(async () => {
      await assistantThrottle()
      return await callGemini(message, systemPrompt)
    }, 3, 1000)
  } catch (error) {
    console.error("Gemini chat failed, trying OpenRouter fallback", error)
    providerErrors.push(classifyChatError("gemini", error))
  }

  try {
    return await retryWithBackoff(async () => {
      await assistantThrottle()
      return await callOpenRouterChat(message, systemPrompt)
    }, 3, 1000)
  } catch (error) {
    console.error("OpenRouter chat fallback failed", error)
    providerErrors.push(classifyChatError("openrouter", error))
  }

  for (const model of CHAT_OPENROUTER_MODELS) {
    try {
      const result = await retryWithBackoff(async () => {
        await assistantThrottle()
        return await callOpenRouterChatModel(model, message, systemPrompt)
      }, 2, 1000)
      return result
    } catch (error) {
      console.error("OpenRouter chat model fallback failed", model, error)
      const classified = classifyChatError("openrouter", error)
      providerErrors.push({
        ...classified,
        message: `${model}: ${classified.message}`
      })
    }
  }

  for (const modelId of CHAT_BYTEZ_MODELS) {
    try {
      const result = await retryWithBackoff(async () => {
        await assistantThrottle()
        return await callBytezChatModel(modelId, message, systemPrompt)
      }, 2, 1000)
      return result
    } catch (error) {
      console.error("Bytez chat model fallback failed", modelId, error)
      const classified = classifyChatError("bytez", error)
      providerErrors.push({
        ...classified,
        message: `${modelId}: ${classified.message}`
      })
    }
  }

  const combined = providerErrors.map(e => `${e.provider}:${e.type}:${e.message}`).join(" | ")
  const error: any = new Error(
    providerErrors.length > 0
      ? `All AI providers failed for chat. Details: ${combined}`
      : "All AI providers failed for chat."
  )
  error.providerErrors = providerErrors
  throw error
}

async function callOpenRouterChatModel(
  model: string,
  message: string,
  systemPrompt: string
): Promise<string> {
  await assistantThrottle()
  const apiKey = getChatOpenRouterApiKey()

  const messages = [
    {
      role: "system",
      content: systemPrompt
    },
    {
      role: "user",
      content: message
    }
  ]

  const response = await fetch(
    `${CHAT_OPENROUTER_API_BASE}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Netlink"
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 2048
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter chat API error for ${model}: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const content = data.choices && data.choices[0]?.message?.content

  if (!content) {
    throw new Error(`No response content from OpenRouter chat model ${model}`)
  }

  return typeof content === "string"
    ? content
    : Array.isArray(content)
      ? content.map((part: any) => part.text || "").join("\n")
      : String(content)
}

async function callBytezChatModel(
  modelId: string,
  message: string,
  systemPrompt: string
): Promise<string> {
  await assistantThrottle()
  const apiKey = getChatBytezApiKey()

  const response = await fetch(
    `${CHAT_BYTEZ_API_BASE}/${encodeURIComponent(modelId)}`,
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
                text: `${systemPrompt}\n\nUser: ${message}`
              }
            ]
          }
        ],
        stream: false,
        params: {
          max_length: 2048,
          temperature: 0.7
        }
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Bytez chat API error for ${modelId}: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const output = data.output

  if (!output) {
    throw new Error(`No output field in Bytez response for model ${modelId}`)
  }

  const content = typeof output.content === "string" ? output.content : output.content?.toString?.() ?? JSON.stringify(output)

  if (!content) {
    throw new Error(`No content in Bytez output for model ${modelId}`)
  }

  return content
}
