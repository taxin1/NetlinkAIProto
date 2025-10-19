import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { extractEventDataFromUrl } from '@/lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    // Extract event data using Gemini AI
    const eventData = await extractEventDataFromUrl(url)

    return NextResponse.json({ eventData }, { status: 200 })
  } catch (error) {
    console.error('Event data extraction error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extract event data' },
      { status: 500 }
    )
  }
}

