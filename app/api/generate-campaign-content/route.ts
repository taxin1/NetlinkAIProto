import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { GEMINI_MODEL, GEMINI_API_BASE } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const { campaignName, campaignPurpose, generatePurpose, generateSubject, userId } = await request.json()

    if (!campaignName || (!generatePurpose && !generateSubject)) {
      return NextResponse.json({ error: "Campaign name and at least one generation type are required" }, { status: 400 })
    }

    const supabase = await createClient()
    let userProfile: any = {}

    if (userId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        userProfile = {
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
        }
      }
    }

    const senderName = userProfile?.name || "I"
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY environment variable is not set" }, { status: 500 })
    }

    const result: { purpose?: string; subject?: string } = {}

    if (generatePurpose) {
      const purposePrompt = `Create a detailed email campaign purpose for "${campaignName}". Write 4-6 sentences explaining goals, context, value to recipients, and desired actions. No asterisks, plain text only.`

      const purposeResponse = await fetch(
        `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: purposePrompt }] }] }),
        },
      )

      if (purposeResponse.ok) {
        const purposeData = await purposeResponse.json()
        if (purposeData.candidates?.[0]?.content?.parts?.[0]?.text) {
          result.purpose = purposeData.candidates[0].content.parts[0].text.trim()
        }
      }
    }

    if (generateSubject) {
      const purposeContext = result.purpose || campaignPurpose || ''
      const subjectPrompt = `Create an email subject line for campaign "${campaignName}". ${purposeContext ? `Purpose: ${purposeContext}` : ''} Keep under 60 characters, professional, no spam words. Return ONLY the subject line.`

      const subjectResponse = await fetch(
        `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: subjectPrompt }] }] }),
        },
      )

      if (subjectResponse.ok) {
        const subjectData = await subjectResponse.json()
        if (subjectData.candidates?.[0]?.content?.parts?.[0]?.text) {
          result.subject = subjectData.candidates[0].content.parts[0].text.trim()
        }
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Campaign content generation error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to generate campaign content" }, { status: 500 })
  }
}
