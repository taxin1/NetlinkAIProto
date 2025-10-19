import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { fetchUrlPreview } from '@/lib/gemini'

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

    // Fetch preview using Gemini AI
    const preview = await fetchUrlPreview(url)

    return NextResponse.json({ preview }, { status: 200 })
  } catch (error) {
    console.error('URL preview error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch URL preview' },
      { status: 500 }
    )
  }
}
