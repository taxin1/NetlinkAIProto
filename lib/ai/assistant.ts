import { generateText } from "@/lib/gemini"
import { callAIWithFallbacks } from "@/lib/ai/providers"
import {
  buildAIContextPrompt,
  buildContactUtilizationGuide,
  type UserAIContext,
} from "@/lib/ai/contact-context"

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
  userContext?: UserAIContext
}

interface ChatOptions {
  language?: string
  userContext?: UserAIContext
  conversationHistory?: Array<{ role: string; content: string }>
}

export async function generateAIResponse(context: AssistantContext): Promise<AIResponse> {
  const { message, conversationHistory, userContext } = context

  const networkContext = userContext
    ? buildAIContextPrompt(userContext, message)
    : `Contacts: ${context.contacts.length} | Emails: ${context.recentEmails.length}`

  const systemPrompt = `You are an AI networking assistant for Network Link AI, a comprehensive AI-powered business networking and contact management platform.

ABOUT NETWORK LINK AI:
Network Link AI helps professionals build, manage, and grow their professional networks through AI-powered features:

PLATFORM FEATURES:
- Business Card Scanner: Upload photos to automatically extract contact information using AI
- Contact Management: Store contacts with where_met (where you met) and met_at (date met) for relationship memory
- AI Email Generation: Generate professional emails using meeting context and interaction history
- Email Campaigns: Send personalized bulk emails with AI-generated unique content per recipient
- Event Management: Create and manage calendar events with automatic URL scraping (Zoom, Meet, Teams, Eventbrite)
- Voice Commands: Hands-free control to send emails, add contacts, view events, check statistics
- AI Assistant: Get networking advice, email writing help, contact analysis, and relationship insights
- Analytics: Track networking activity, email performance, contact growth
- Real-time Updates: Live notifications for new contacts, events, email activity

${buildContactUtilizationGuide()}

${networkContext}

Current user message: "${message}"

CRITICAL FORMATTING RULES - MUST FOLLOW STRICTLY:
1. NEVER use asterisks (*) or double asterisks (**) in your response under any circumstances
2. NEVER use asterisks for bold text, emphasis, bullet points, headings, or any other purpose
3. For bullet points: ALWAYS use plain dash (-) only, NEVER asterisks
4. Do not use asterisks in any formatting, anywhere, for any reason
5. Keep responses concise, professional, and actionable
6. Reference specific Network Link AI features when relevant
7. Use clear, readable formatting with plain text only - no markdown, no asterisks, no special formatting characters

CORRECT Example of formatting:
Key Features:
- Business Networking
- Contact Management

WRONG Examples (NEVER DO THIS):
**Key Features:**
* Business Networking
* Contact Management

Provide helpful, actionable advice. When the user asks about a contact, use their where_met and met_at data. Suggest specific next steps to utilize each relationship. When explaining features, describe how they work within the Network Link AI platform.`

  const conversationContext = conversationHistory
    .slice(-8)
    .map(msg => `${msg.type || msg.role}: ${msg.content}`)
    .join("\n")

  const fullPrompt = `${systemPrompt}\n\nConversation context:\n${conversationContext || "None"}\n\nUser: ${message}\n\nAssistant:`

  try {
    const response = await generateText(fullPrompt)
    const suggestions = generateSuggestions(message, userContext)

    return {
      content: response,
      suggestions
    }
  } catch (error) {
    console.error("AI Assistant error:", error)
    throw new Error("Failed to generate AI response")
  }
}

function generateSuggestions(message: string, userContext?: UserAIContext): string[] {
  const lowerMessage = message.toLowerCase()

  if (lowerMessage.includes("email") || lowerMessage.includes("write") || lowerMessage.includes("send")) {
    const recentContact = userContext?.contacts.find((c) => c.where_met)
    if (recentContact) {
      return [
        `Write a follow-up to ${recentContact.name} from ${recentContact.where_met}`,
        "Who should I email first from my recent event?",
        "Draft a warm intro email using meeting context",
        "Create a thank you email after networking"
      ]
    }
    return [
      "Help me write a follow-up email",
      "Generate an introduction email",
      "Create a thank you email",
      "Draft a meeting request email"
    ]
  }

  if (
    lowerMessage.includes("contact") ||
    lowerMessage.includes("network") ||
    lowerMessage.includes("connection") ||
    lowerMessage.includes("met")
  ) {
    const eventGroup = userContext?.contacts.find((c) => c.where_met)?.where_met
    if (eventGroup) {
      return [
        `Who did I meet at ${eventGroup}?`,
        "Suggest follow-ups for contacts I met this week",
        "Which contacts need meeting context added?",
        "Create a networking strategy by event"
      ]
    }
    return [
      "Analyze my contact network",
      "Who should I follow up with this week?",
      "Group my contacts by where I met them",
      "Create a networking strategy"
    ]
  }

  if (lowerMessage.includes("follow") || lowerMessage.includes("next") || lowerMessage.includes("plan")) {
    return [
      "Create a follow-up timeline by date met",
      "Suggest follow-up activities for recent contacts",
      "Plan post-event outreach",
      "Set relationship goals"
    ]
  }

  return [
    "Who should I follow up with?",
    "How can I use my contacts from last event?",
    "Analyze my recent activity",
    "Suggest conversation starters with meeting context"
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

export async function generateChatResponse(
  message: string,
  options: ChatOptions | string = "en"
): Promise<string> {
  const opts: ChatOptions =
    typeof options === "string" ? { language: options } : options
  const { language = "en", userContext, conversationHistory = [] } = opts

  const languagePrompt = language === "ja" || language === "japanese"
    ? "IMPORTANT: RESPOND IN JAPANESE. すべての回答は日本語で行ってください。"
    : "IMPORTANT: RESPOND IN ENGLISH."

  const networkBlock = userContext
    ? `\n\n${buildContactUtilizationGuide()}\n\n${buildAIContextPrompt(userContext, message)}`
    : ""

  const historyBlock =
    conversationHistory.length > 0
      ? `\n\nRecent conversation:\n${conversationHistory
          .slice(-8)
          .map((m) => `${m.role}: ${m.content}`)
          .join("\n")}`
      : ""

  const systemPrompt = `You are a helpful AI networking assistant for Network Link AI. You help users build relationships, follow up with contacts, and utilize their network effectively.

${languagePrompt}

You have access to the user's real contact data including where they met each person and the date they met. Use this context to give specific, personalized advice — not generic networking tips.

CORE CAPABILITIES:
- Remember and reference where_met (event, conference, LinkedIn, intro) and met_at (date met) for each contact
- Suggest how to utilize specific contacts (follow-up emails, intros, calls, invites)
- Group contacts by event for post-conference outreach
- Recommend who to follow up with based on days since met and email history
- Help draft emails that reference the meeting context naturally
${networkBlock}

CRITICAL FORMATTING RULES - MUST FOLLOW STRICTLY:
1. NEVER use asterisks (*) or double asterisks (**) in your response under any circumstances
2. NEVER use asterisks for bold text, emphasis, bullet points, headings, or any other purpose
3. For bullet points: ALWAYS use plain dash (-) only, NEVER asterisks
4. Do not use asterisks in any formatting, anywhere, for any reason
5. Keep responses concise, professional, and to the point
6. Use clear, readable formatting with plain text only - no markdown, no asterisks, no special formatting characters

When users ask about contacts, name specific people from their data. When meeting context is missing, suggest they add where_met and met_at in the contact profile.`

  const userMessage =
    conversationHistory.length > 0
      ? `${historyBlock}\n\nUser: ${message}`
      : message

  try {
    const { text } = await callAIWithFallbacks({
      message: userMessage,
      systemPrompt,
    })
    return text
  } catch (error) {
    console.error("All AI providers failed for chat", error)
    const providerErrors = (error as { providerErrors?: unknown }).providerErrors
    const errorMessage = error instanceof Error ? error.message : "All AI providers failed for chat."
    const combined: Error & { providerErrors?: unknown } = new Error(errorMessage)
    if (providerErrors) combined.providerErrors = providerErrors
    throw combined
  }
}
