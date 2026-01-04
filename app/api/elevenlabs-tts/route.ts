import { NextRequest, NextResponse } from "next/server"

// Gemini doesn't have TTS, so we'll signal the client to use browser TTS
// This route now returns a JSON response indicating to use browser fallback
export async function POST(request: NextRequest) {
  try {
    const { text, language = "en" } = await request.json()

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    // Check if ElevenLabs is configured - if so, use it
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY
    if (elevenLabsKey) {
      const voiceId = "21m00Tcm4TlvDq8ikWAM" // Rachel voice
      
      // Use multilingual model for non-English or when explicitly requested
      const modelId = language === "ja" || language === "japanese" 
        ? "eleven_multilingual_v2" 
        : "eleven_monolingual_v1"

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": elevenLabsKey,
          },
          body: JSON.stringify({
            text,
            model_id: modelId,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
              style: 0.5,
              use_speaker_boost: true,
            },
          }),
        }
      )

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer()
        return new NextResponse(audioBuffer, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Content-Length": audioBuffer.byteLength.toString(),
          },
        })
      }
    }

    // No ElevenLabs or it failed - signal browser to use Web Speech API
    return NextResponse.json(
      { useBrowserTTS: true, text },
      { status: 200 }
    )
  } catch (error) {
    console.error("TTS error:", error)
    // On error, signal to use browser TTS
    return NextResponse.json(
      { useBrowserTTS: true },
      { status: 200 }
    )
  }
}
