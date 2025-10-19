import { generateText } from "@/lib/gemini"

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

export async function generateAIResponse(context: AssistantContext): Promise<AIResponse> {
  const { message, contacts, recentEmails, conversationHistory } = context

  // Create context-aware prompt
  const systemPrompt = `You are an AI networking assistant for Netlink Cogni, a business networking and contact management platform. You help users with:

1. Contact management and networking strategies
2. Email writing and communication
3. Follow-up planning and relationship building
4. Professional networking advice

User's Context:
- Recent contacts: ${contacts.length} contacts (${contacts.slice(0, 3).map(c => c.name).join(', ')})
- Recent emails: ${recentEmails.length} emails sent
- Conversation history: ${conversationHistory.length} previous messages

Current user message: "${message}"

FORMATTING RULES (CRITICAL):
1. For titles and headings: Use Title 
2. For bullet points: Use plain dash (-) NOT asterisks (*)
3. NEVER use single asterisk (*) for any purpose
4. NEVER use asterisk (*) for bullet points or lists
5. Keep responses concise, professional, and to the point

Example of correct formatting:
Key Features:
- Business Networking
- Contact Management

Provide helpful, actionable advice. If the user asks about specific contacts or emails, reference the context when relevant.`

  const conversationContext = conversationHistory
    .slice(-6) // Last 6 messages for context
    .map(msg => `${msg.type}: ${msg.content}`)
    .join('\n')

  const fullPrompt = `${systemPrompt}\n\nConversation context:\n${conversationContext}\n\nUser: ${message}\n\nAssistant:`

  try {
    const response = await generateText(fullPrompt)
    
    // Generate contextual suggestions based on the message
    const suggestions = generateSuggestions(message, contacts, recentEmails)
    
    return {
      content: response,
      suggestions
    }
  } catch (error) {
    console.error('AI Assistant error:', error)
    throw new Error('Failed to generate AI response')
  }
}

function generateSuggestions(message: string, contacts: any[], recentEmails: any[]): string[] {
  const lowerMessage = message.toLowerCase()
  
  // Email-related suggestions
  if (lowerMessage.includes('email') || lowerMessage.includes('write') || lowerMessage.includes('send')) {
    return [
      "Help me write a follow-up email",
      "Generate an introduction email",
      "Create a thank you email",
      "Draft a meeting request email"
    ]
  }
  
  // Contact-related suggestions
  if (lowerMessage.includes('contact') || lowerMessage.includes('network') || lowerMessage.includes('connection')) {
    return [
      "Analyze my contact network",
      "Suggest new networking opportunities",
      "Help me organize my contacts",
      "Create a networking strategy"
    ]
  }
  
  // Follow-up related suggestions
  if (lowerMessage.includes('follow') || lowerMessage.includes('next') || lowerMessage.includes('plan')) {
    return [
      "Create a follow-up timeline",
      "Suggest follow-up activities",
      "Plan networking events",
      "Set relationship goals"
    ]
  }
  
  // General suggestions
  return [
    "Help me write an email",
    "Give me networking tips",
    "Analyze my recent activity",
    "Suggest conversation starters"
  ]
}

// Specialized functions for different AI tasks
export async function generateEmailContent(
  type: 'introduction' | 'follow-up' | 'thank-you' | 'meeting-request',
  contactName: string,
  context?: string
): Promise<string> {
  const prompts = {
    introduction: `Write a professional introduction email to ${contactName}. ${context ? `Context: ${context}` : ''}`,
    'follow-up': `Write a follow-up email to ${contactName}. ${context ? `Context: ${context}` : ''}`,
    'thank-you': `Write a thank you email to ${contactName}. ${context ? `Context: ${context}` : ''}`,
    'meeting-request': `Write a meeting request email to ${contactName}. ${context ? `Context: ${context}` : ''}`
  }

  return await generateText(prompts[type])
}

export async function generateNetworkingAdvice(contacts: any[], recentActivity: any[]): Promise<string> {
  const prompt = `Based on these contacts and recent activity, provide networking advice:

Contacts: ${contacts.slice(0, 5).map(c => `${c.name} (${c.company || 'No company'})`).join(', ')}
Recent Activity: ${recentActivity.slice(0, 3).map(a => a.description || a.event_type).join(', ')}

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
Recent contacts: ${contacts.slice(0, 3).map(c => c.name).join(', ')}

Provide insights about network diversity, potential opportunities, and suggestions for growth.`

  return await generateText(prompt)
}

