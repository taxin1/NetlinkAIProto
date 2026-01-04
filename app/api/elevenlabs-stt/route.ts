import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get("audio") as File
    const language = formData.get("language") as string || "en"

    if (!audioFile || audioFile.size === 0) {
      return NextResponse.json({ error: "Audio file is required and must not be empty" }, { status: 400 })
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
    
    if (language) {
      elevenLabsFormData.append("language_code", language)
    }

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
      let errorMessage = "Failed to transcribe audio"
      try {
        // Read response as text first, then try to parse as JSON
        const errorText = await response.text()
        if (errorText) {
          try {
            const errorData = JSON.parse(errorText)
            errorMessage = errorData.detail?.message || errorData.error?.message || errorData.message || errorText
          } catch {
            // If not JSON, use the text as-is
            errorMessage = errorText
          }
        }
      } catch {
        // Fall back to default message if reading fails
      }
      console.error("ElevenLabs STT error:", errorMessage, `(Status: ${response.status})`)
      return NextResponse.json(
        { error: errorMessage },
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
