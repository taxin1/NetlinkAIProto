import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedUser } from "@/lib/supabase/server"
import { generateAIContent } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedUser(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { campaignName, campaignPurpose, generatePurpose, generateSubject } = await request.json()

    if (!campaignName || (!generatePurpose && !generateSubject)) {
      return NextResponse.json({ error: "Campaign name and at least one generation type are required" }, { status: 400 })
    }

    const userProfile = {
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      email: user.email || '',
    }

    const result: { purpose?: string; subject?: string } = {}

    if (generatePurpose) {
      const purposePrompt = `Create a detailed email campaign purpose for "${campaignName}". Write 4-6 sentences explaining goals, context, value to recipients, and desired actions. No asterisks, plain text only.`

      result.purpose = (
        await generateAIContent({
          message: purposePrompt,
          systemPrompt: "You write concise email campaign purposes.",
          maxTokens: 512,
        })
      ).trim()
    }

    if (generateSubject) {
      const purposeContext = result.purpose || campaignPurpose || ''
      const subjectPrompt = `Create an email subject line for campaign "${campaignName}". ${purposeContext ? `Purpose: ${purposeContext}` : ''} Keep under 60 characters, professional, no spam words. Return ONLY the subject line.`

      result.subject = (
        await generateAIContent({
          message: subjectPrompt,
          systemPrompt: "You write email subject lines. Return only the subject line.",
          maxTokens: 100,
        })
      ).trim()
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Campaign content generation error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to generate campaign content" }, { status: 500 })
  }
}
