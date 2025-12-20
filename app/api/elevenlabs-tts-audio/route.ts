import { NextRequest, NextResponse } from "next/server"

/**
 * ElevenLabs TTS Audio Endpoint
 * 
 * Generates audio from text using ElevenLabs and serves it for use in phone calls.
 * This endpoint is used by Twilio to play ElevenLabs-generated audio.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const text = searchParams.get("text")

    if (!text) {
      return NextResponse.json({ error: "Text parameter is required" }, { status: 400 })
    }

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "ElevenLabs API key not configured" },
        { status: 500 }
      )
    }

    const voiceId = "21m00Tcm4TlvDq8ikWAM" // Rachel voice
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text: decodeURIComponent(text),
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true,
          },
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("ElevenLabs TTS error:", errorText)
      return NextResponse.json(
        { error: "Failed to generate audio" },
        { status: response.status }
      )
    }

    const audioBuffer = await response.arrayBuffer()
    
    // Return audio with proper headers for Twilio
    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("TTS audio generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate audio" },
      { status: 500 }
    )
  }
}

