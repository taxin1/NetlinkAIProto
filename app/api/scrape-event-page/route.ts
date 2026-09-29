import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAIContent } from '@/lib/ai/providers'

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

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
      redirect: 'follow'
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch webpage: ${response.status}`)
    }

    const html = await response.text()

    // Extract meta tags
    const extractMeta = (patterns: string[]): string => {
      for (const pattern of patterns) {
        const match = html.match(new RegExp(pattern, 'i'))
        if (match?.[1]) return match[1].trim()
      }
      return ''
    }

    let previewImage = extractMeta([
      '<meta\\s+property=["\']og:image["\']\\s+content=["\']([^"\']+)["\']',
      '<meta\\s+content=["\']([^"\']+)["\']\\s+property=["\']og:image["\']',
    ])

    if (previewImage?.startsWith('//')) previewImage = 'https:' + previewImage
    else if (previewImage?.startsWith('/')) previewImage = new URL(url).origin + previewImage

    const cleanText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 15000)

    const prompt = `Analyze this webpage and extract event information. Return ONLY a JSON object:
{
  "title": "event title",
  "description": "brief description",
  "startTime": "YYYY-MM-DDTHH:MM" or null,
  "endTime": "YYYY-MM-DDTHH:MM" or null,
  "location": "location or platform",
  "organizer": "organizer if found"
}

URL: ${url}
PAGE CONTENT: ${cleanText}`

    const aiResponse = await generateAIContent({
      message: prompt,
      systemPrompt: "You extract structured event data from web page content. Return only a valid JSON object, no markdown.",
      maxTokens: 1024,
      temperature: 0.2,
    })

    if (!aiResponse) {
      throw new Error('No response from AI service')
    }

    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response')
    }

    const eventData = JSON.parse(jsonMatch[0])
    if (previewImage) eventData.imageUrl = previewImage

    return NextResponse.json(eventData)
  } catch (error) {
    console.error('Scrape event page error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to scrape event page' },
      { status: 500 }
    )
  }
}
