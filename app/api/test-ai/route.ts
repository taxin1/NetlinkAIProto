import { NextRequest, NextResponse } from "next/server"
import { GEMINI_API_BASE, GEMINI_MODEL } from "@/lib/gemini"

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "GEMINI_API_KEY is not set in environment variables",
        checks: {
          apiKeyExists: false,
          apiKeyLength: 0
        }
      }, { status: 500 })
    }

    // Test the AI API with a simple request
    const testPrompt = "Say 'AI is working' if you can read this."
    
    try {
      const response = await fetch(
        `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: testPrompt }]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 50,
            },
          }),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        return NextResponse.json({
          success: false,
          error: `API request failed (${response.status})`,
          details: errorText,
          checks: {
            apiKeyExists: true,
            apiKeyLength: apiKey.length,
            apiResponseStatus: response.status,
            apiResponseText: errorText.substring(0, 200)
          }
        }, { status: response.status })
      }

      const data = await response.json()

      if (data.error) {
        return NextResponse.json({
          success: false,
          error: "API returned an error",
          details: data.error,
          checks: {
            apiKeyExists: true,
            apiKeyLength: apiKey.length,
            apiError: data.error
          }
        }, { status: 500 })
      }

      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response"

      return NextResponse.json({
        success: true,
        message: "AI is working correctly!",
        aiResponse: aiResponse,
        checks: {
          apiKeyExists: true,
          apiKeyLength: apiKey.length,
          apiResponseStatus: response.status,
          model: GEMINI_MODEL,
          responseReceived: true
        }
      })
    } catch (fetchError) {
      return NextResponse.json({
        success: false,
        error: "Failed to connect to AI API",
        details: fetchError instanceof Error ? fetchError.message : String(fetchError),
        checks: {
          apiKeyExists: true,
          apiKeyLength: apiKey.length,
          connectionError: true
        }
      }, { status: 500 })
    }
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
      checks: {
        apiKeyExists: false
      }
    }, { status: 500 })
  }
}

