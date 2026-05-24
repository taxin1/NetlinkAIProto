import { NextRequest, NextResponse } from "next/server"

/**
 * Test endpoint to check if environment variables are accessible
 * This helps debug Netlify deployment issues
 */
export async function GET(request: NextRequest) {
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY
  const hasGeminiKey = !!process.env.GEMINI_API_KEY
  const hasOpenRouterKey = !!process.env.OPENROUTER_API_KEY
  const hasBytezKey = !!process.env.BYTEZ_API_KEY
  const nodeEnv = process.env.NODE_ENV
  
  return NextResponse.json({
    success: true,
    environment: {
      nodeEnv,
      hasOpenAIKey,
      hasGeminiKey,
      hasOpenRouterKey,
      hasBytezKey,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    message: hasOpenAIKey
      ? "OPENAI_API_KEY is set (primary AI provider)"
      : hasGeminiKey || hasOpenRouterKey || hasBytezKey
        ? "Fallback AI keys configured; set OPENAI_API_KEY for primary provider"
        : "No AI API keys configured",
    timestamp: new Date().toISOString(),
  })
}
