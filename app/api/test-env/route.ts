import { NextRequest, NextResponse } from "next/server"

/**
 * Test endpoint to check if environment variables are accessible
 * This helps debug Netlify deployment issues
 */
export async function GET(request: NextRequest) {
  const hasGeminiKey = !!process.env.GEMINI_API_KEY
  const geminiKeyLength = process.env.GEMINI_API_KEY?.length || 0
  const nodeEnv = process.env.NODE_ENV
  
  // Don't expose the actual key, just check if it exists
  return NextResponse.json({
    success: true,
    environment: {
      nodeEnv,
      hasGeminiKey,
      geminiKeyLength,
      // Check other important env vars
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    message: hasGeminiKey 
      ? "GEMINI_API_KEY is set" 
      : "GEMINI_API_KEY is NOT set - this is the problem!",
    timestamp: new Date().toISOString(),
  })
}

