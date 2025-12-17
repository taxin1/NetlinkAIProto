import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 })
    }

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 500 }
      )
    }

    // Create form data for ElevenLabs
    const elevenLabsFormData = new FormData()
    elevenLabsFormData.append("file", audioFile)
    elevenLabsFormData.append("model_id", "scribe_v1") // ElevenLabs STT model

    const response = await fetch(
      "https://api.elevenlabs.io/v1/speech-to-text",
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
        },
        body: elevenLabsFormData,
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("ElevenLabs STT error:", errorText)
      return NextResponse.json(
        { error: "Failed to transcribe audio" },
        { status: response.status }
      )
    }

    const result = await response.json()
    const transcribedText = result.text || ""
    
    return NextResponse.json({
      text: transcribedText.trim(),
      language: result.language_code || "en",
    })
  } catch (error) {
    console.error("STT error:", error)
    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    )
  }
}
