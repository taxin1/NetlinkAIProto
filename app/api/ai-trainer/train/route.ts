import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { callGemini } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update training status
    await supabase
      .from("ai_trainer_status")
      .upsert({
        user_id: user.id,
        is_training: true,
        training_progress: 0,
        updated_at: new Date().toISOString(),
      })

    // Collect user data for training
    const [contactsResult, emailsResult, eventsResult] = await Promise.all([
      supabase
        .from("contacts")
        .select("name, company, position, notes, tags, linkedin_url")
        .eq("user_id", user.id)
        .limit(100),
      supabase
        .from("emails")
        .select("subject, body, status, created_at")
        .eq("user_id", user.id)
        .eq("status", "sent")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("events")
        .select("event_type, description, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ])

    const contacts = contactsResult.data || []
    const emails = emailsResult.data || []
    const events = eventsResult.data || []

    // Analyze email writing style
    if (emails.length > 0) {
      await supabase
        .from("ai_trainer_status")
        .update({ training_progress: 20 })
        .eq("user_id", user.id)

      const emailAnalysisPrompt = `Analyze the following emails and extract the user's writing style, tone, and preferences. Return a JSON object with:
- writing_style: (formal, casual, professional, friendly, etc.)
- tone: (warm, direct, enthusiastic, etc.)
- common_phrases: array of phrases the user frequently uses
- email_structure: how they structure emails (greeting style, closing style, etc.)
- key_themes: what topics they frequently discuss

Emails:
${emails.map((e, i) => `${i + 1}. Subject: ${e.subject}\nBody: ${e.body.substring(0, 500)}`).join("\n\n")}`

      try {
        const styleAnalysis = await callGemini(emailAnalysisPrompt, "You are an expert at analyzing communication patterns. Return only valid JSON.")
        const styleData = JSON.parse(styleAnalysis)

        // Store email style memories
        if (styleData.writing_style) {
          await supabase.from("ai_trainer_memories").upsert({
            user_id: user.id,
            memory_type: "email_style",
            memory_key: "writing_style",
            memory_value: styleData.writing_style,
            importance_score: 9,
            usage_count: 0,
          })
        }

        if (styleData.tone) {
          await supabase.from("ai_trainer_memories").upsert({
            user_id: user.id,
            memory_type: "email_style",
            memory_key: "tone",
            memory_value: styleData.tone,
            importance_score: 9,
            usage_count: 0,
          })
        }

        if (styleData.common_phrases && Array.isArray(styleData.common_phrases)) {
          await supabase.from("ai_trainer_memories").upsert({
            user_id: user.id,
            memory_type: "email_style",
            memory_key: "common_phrases",
            memory_value: JSON.stringify(styleData.common_phrases),
            importance_score: 7,
            usage_count: 0,
          })
        }
      } catch (error) {
        console.error("Error analyzing email style:", error)
      }
    }

    // Analyze networking preferences
    await supabase
      .from("ai_trainer_status")
      .update({ training_progress: 50 })
      .eq("user_id", user.id)

    if (contacts.length > 0) {
      const industries = contacts
        .map((c) => c.company)
        .filter(Boolean)
        .slice(0, 20)

      if (industries.length > 0) {
        await supabase.from("ai_trainer_memories").upsert({
          user_id: user.id,
          memory_type: "networking_preference",
          memory_key: "target_industries",
          memory_value: JSON.stringify(industries),
          importance_score: 6,
          usage_count: 0,
        })
      }
    }

    // Analyze communication patterns from events
    await supabase
      .from("ai_trainer_status")
      .update({ training_progress: 70 })
      .eq("user_id", user.id)

    if (events.length > 0) {
      const eventTypes = events.reduce((acc: any, event) => {
        acc[event.event_type] = (acc[event.event_type] || 0) + 1
        return acc
      }, {})

      await supabase.from("ai_trainer_memories").upsert({
        user_id: user.id,
        memory_type: "communication_pattern",
        memory_key: "preferred_interaction_types",
        memory_value: JSON.stringify(eventTypes),
        importance_score: 5,
        usage_count: 0,
      })
    }

    // Finalize training
    const { count } = await supabase
      .from("ai_trainer_memories")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    await supabase
      .from("ai_trainer_status")
      .update({
        is_training: false,
        training_progress: 100,
        last_trained_at: new Date().toISOString(),
        total_memories: count || 0,
        model_version: "1.0",
      })
      .eq("user_id", user.id)

    return NextResponse.json({
      success: true,
      message: "AI training completed successfully",
      memories_count: count || 0,
    })
  } catch (error) {
    console.error("AI training error:", error)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from("ai_trainer_status")
        .update({ is_training: false })
        .eq("user_id", user.id)
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Training failed" },
      { status: 500 }
    )
  }
}
