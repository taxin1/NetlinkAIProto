import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GEMINI_MODEL, GEMINI_API_BASE } from "@/lib/gemini"

// Retry utility for handling transient errors
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error: any) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      const isRetryable = 
        (error instanceof Error && 
         (error.message.includes("503") || 
          error.message.includes("429") || 
          error.message.includes("overloaded") ||
          error.message.includes("UNAVAILABLE") ||
          error.message.includes("network") ||
          error.message.includes("ECONNRESET"))) ||
        (error?.response?.status === 503 || error?.response?.status === 429)
      
      if (!isRetryable || attempt === maxRetries - 1) {
        throw lastError
      }
      
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
      console.log(`Campaign content generation retry (attempt ${attempt + 1}/${maxRetries}), waiting ${Math.round(delay)}ms...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError || new Error("Failed after retries")
}

export async function POST(request: NextRequest) {
  try {
    const { campaignName, campaignPurpose, generatePurpose, generateSubject, userId } = await request.json()

    if (!campaignName || (!generatePurpose && !generateSubject)) {
      return NextResponse.json(
        { error: "Campaign name and at least one generation type are required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    let userProfile: any = {}

    // Fetch user profile information
    if (userId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        userProfile = {
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || ''
        }
      }
    }

    const senderName = userProfile?.name || userProfile?.displayName || "I"
    const apiKey = process.env.GEMINI_API_KEY!

    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY environment variable is not set" },
        { status: 500 }
      )
    }

    const result: { purpose?: string; subject?: string } = {}

    // Generate purpose if requested
    if (generatePurpose) {
      const purposePrompt = `You are an expert email marketing strategist helping ${senderName} create a detailed, comprehensive email campaign purpose.

CAMPAIGN NAME: "${campaignName}"

TASK: Write a detailed, comprehensive email campaign purpose that thoroughly explains what this campaign is trying to achieve. This purpose will be used to generate personalized emails for each recipient, so include all relevant context, goals, and details.

REQUIREMENTS:
- Be VERY detailed and comprehensive - this is NOT a short description
- Include specific goals, objectives, and desired outcomes
- Explain the context and background if relevant
- Mention what value or benefit the recipients will get
- Include what action you want recipients to take
- Explain why this campaign is important or timely
- Include any relevant details about the product, service, event, or opportunity
- Make it 4-6 sentences minimum to provide full context for email generation
- Be specific and actionable, not generic or template-like
- Professional but comprehensive tone

FORMATTING RULES:
- NEVER use asterisks (*) anywhere in the response
- Use plain text formatting only
- Use plain dash (-) for lists if needed
- Write in paragraph form with clear sentences

EXAMPLE GOOD DETAILED PURPOSES:
- "This campaign aims to invite our professional network contacts to attend our Q1 Product Launch event scheduled for March 15th. The event will showcase our latest innovations in business productivity tools, including live demonstrations, networking opportunities, and exclusive early-access offers. We want to encourage attendance by highlighting the value attendees will receive, including product previews, expert presentations, and the opportunity to connect with industry leaders. The campaign should emphasize the exclusive nature of the event and include a clear call-to-action to RSVP through the provided link. We're specifically targeting business professionals, potential partners, and existing clients who would benefit from our new solutions."

- "This campaign is designed to follow up with contacts we met at Tech Conference 2025 held last month. Our goal is to continue the conversations we started at the conference and schedule one-on-one meetings to discuss potential partnership opportunities. We want to remind them of our previous interactions, reference specific topics we discussed, and propose next steps for collaboration. The emails should highlight how a partnership would be mutually beneficial and suggest a concrete meeting time to explore possibilities. We're particularly interested in strategic partnerships that could help both parties expand their market reach and offer complementary services to clients."

- "This campaign focuses on reconnecting with past clients we haven't worked with in the last 6-12 months. Our objective is to re-establish relationships by sharing updates about our latest service offerings and industry developments that might benefit them. We want to show that we've continued to evolve our services and are offering new solutions that address current market challenges. The campaign should invite them to a personalized consultation to discuss how our updated services can help address their current business needs. We want to position ourselves as a trusted partner who understands their business and has relevant solutions for their current situation."

Generate a comprehensive, detailed purpose statement - include all context, goals, and details that will help create effective personalized emails. Make it thorough and specific, not brief.`

      try {
        result.purpose = await retryWithBackoff(async () => {
          const purposeResponse = await fetch(
            `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: purposePrompt,
                      },
                    ],
                  },
                ],
              }),
            },
          )

          if (!purposeResponse.ok) {
            const errorText = await purposeResponse.text()
            const error: any = new Error(`Failed to generate purpose (${purposeResponse.status}): ${errorText}`)
            error.status = purposeResponse.status
            error.response = { status: purposeResponse.status }
            throw error
          }

          const purposeData = await purposeResponse.json()

          if (purposeData.error) {
            throw new Error(`Gemini API error: ${purposeData.error.message || JSON.stringify(purposeData.error)}`)
          }

          if (purposeData.candidates?.[0]?.content?.parts?.[0]?.text) {
            return purposeData.candidates[0].content.parts[0].text.trim()
          }

          throw new Error("No valid response from Gemini API for purpose generation")
        }, 3, 1000)
      } catch (error) {
        console.error("Error generating purpose:", error)
      }
    }

    // Generate subject if requested
    if (generateSubject) {
      const purposeContext = result.purpose || campaignPurpose || ''
      const subjectPrompt = `You are an expert email marketer helping ${senderName} create an email subject line for a campaign.

CAMPAIGN NAME: "${campaignName}"
${purposeContext ? `CAMPAIGN PURPOSE: "${purposeContext}"` : ''}

TASK: Write a compelling, professional email subject line for this campaign.

REQUIREMENTS:
- Be specific and relevant to the campaign
- Keep it concise (under 60 characters ideally, max 78 characters)
- Avoid spam words like "free", "urgent", "act now"
- Make it engaging but professional
- Personal and direct tone preferred

FORMATTING RULES:
- NEVER use asterisks (*) anywhere
- Use plain text only
- No special characters unless necessary (avoid: !!!!, ????, etc.)

EXAMPLE GOOD SUBJECTS:
- "Quick question about your business"
- "Invitation: Q1 Product Launch Event"
- "Following up from Tech Conference"
- "Partnership opportunity discussion"

Generate ONLY the subject line - no labels, no quotes, just the subject text.`

      try {
        result.subject = await retryWithBackoff(async () => {
          const subjectResponse = await fetch(
            `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      {
                        text: subjectPrompt,
                      },
                    ],
                  },
                ],
              }),
            },
          )

          if (!subjectResponse.ok) {
            const errorText = await subjectResponse.text()
            const error: any = new Error(`Failed to generate subject (${subjectResponse.status}): ${errorText}`)
            error.status = subjectResponse.status
            error.response = { status: subjectResponse.status }
            throw error
          }

          const subjectData = await subjectResponse.json()

          if (subjectData.error) {
            throw new Error(`Gemini API error: ${subjectData.error.message || JSON.stringify(subjectData.error)}`)
          }

          if (subjectData.candidates?.[0]?.content?.parts?.[0]?.text) {
            return subjectData.candidates[0].content.parts[0].text.trim()
          }

          throw new Error("No valid response from Gemini API for subject generation")
        }, 3, 1000)
      } catch (error) {
        console.error("Error generating subject:", error)
      }
    }

    return NextResponse.json({
      success: true,
      ...result,
    })
  } catch (error) {
    console.error("Generate campaign content error:", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate campaign content",
      },
      { status: 500 }
    )
  }
}

