import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GEMINI_MODEL, GEMINI_API_BASE } from '@/lib/gemini'

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

    console.log('Fetching webpage:', url)

    // Fetch the actual webpage content with comprehensive headers
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
      },
      // Follow redirects
      redirect: 'follow'
    })

    if (!response.ok) {
      console.error('Fetch failed:', response.status, response.statusText)
      throw new Error(`Failed to fetch webpage: ${response.status} ${response.statusText}. The website may be blocking automated requests.`)
    }

    const html = await response.text()
    
    console.log('HTML length:', html.length)
    
    // Extract meta tags for preview image - try multiple patterns
    let previewImage = ''
    let previewTitle = ''
    let previewDescription = ''
    
    // Helper function to extract meta content
    const extractMetaContent = (html: string, patterns: string[]): string => {
      for (const pattern of patterns) {
        const regex = new RegExp(pattern, 'i')
        const match = html.match(regex)
        if (match && match[1]) {
          return match[1].trim()
        }
      }
      return ''
    }
    
    // Try multiple patterns for OG image (property first, then content)
    previewImage = extractMetaContent(html, [
      '<meta\\s+property=["\']og:image["\']\\s+content=["\']([^"\']+)["\']',
      '<meta\\s+content=["\']([^"\']+)["\']\\s+property=["\']og:image["\']',
      '<meta\\s+property=["\']og:image:secure_url["\']\\s+content=["\']([^"\']+)["\']',
    ])
    
    // Try Twitter Card image if OG not found
    if (!previewImage) {
      previewImage = extractMetaContent(html, [
        '<meta\\s+name=["\']twitter:image["\']\\s+content=["\']([^"\']+)["\']',
        '<meta\\s+content=["\']([^"\']+)["\']\\s+name=["\']twitter:image["\']',
        '<meta\\s+name=["\']twitter:image:src["\']\\s+content=["\']([^"\']+)["\']',
      ])
    }
    
    // Try other image meta tags
    if (!previewImage) {
      previewImage = extractMetaContent(html, [
        '<meta\\s+name=["\']image["\']\\s+content=["\']([^"\']+)["\']',
        '<meta\\s+itemprop=["\']image["\']\\s+content=["\']([^"\']+)["\']',
      ])
    }
    
    // Extract OG title
    previewTitle = extractMetaContent(html, [
      '<meta\\s+property=["\']og:title["\']\\s+content=["\']([^"\']+)["\']',
      '<meta\\s+content=["\']([^"\']+)["\']\\s+property=["\']og:title["\']',
    ])
    
    // Extract OG description
    previewDescription = extractMetaContent(html, [
      '<meta\\s+property=["\']og:description["\']\\s+content=["\']([^"\']+)["\']',
      '<meta\\s+content=["\']([^"\']+)["\']\\s+property=["\']og:description["\']',
      '<meta\\s+name=["\']description["\']\\s+content=["\']([^"\']+)["\']',
    ])
    
    console.log('=== META TAG EXTRACTION ===')
    console.log('Preview Image URL:', previewImage || 'NOT FOUND')
    console.log('Preview Title:', previewTitle || 'NOT FOUND')
    console.log('Preview Description:', previewDescription || 'NOT FOUND')
    
    // If we found an image, validate and potentially fix the URL
    if (previewImage) {
      // Handle relative URLs
      if (previewImage.startsWith('//')) {
        previewImage = 'https:' + previewImage
      } else if (previewImage.startsWith('/')) {
        const urlObj = new URL(url)
        previewImage = urlObj.origin + previewImage
      }
      console.log('Final Image URL:', previewImage)
    }
    
    // Extract text content from HTML (remove scripts, styles, etc.)
    const cleanText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 15000) // Limit to first 15000 chars for API

    console.log('Extracted text length:', cleanText.length)

    // Use Gemini to analyze the page content
    const apiKey = process.env.GEMINI_API_KEY!
    
    const prompt = `Analyze this webpage content and extract event information. Be precise and only extract information that is clearly stated.

URL: ${url}

PAGE CONTENT:
${cleanText}

Extract the following if present:
1. Event Title/Name
2. Event Description (brief, 1-2 sentences)
3. Date and Time (CRITICAL: Look carefully for dates, times, day of week, month names)
4. Location/Venue (physical address or platform)
5. Organizer/Host

IMPORTANT RULES FOR DATES:
- Look for patterns like: "March 15, 2025", "3/15/2025", "15th March", "Monday, March 15"
- Look for time patterns: "9:00 AM", "09:00", "9am", "9:00 PM", "18:00"
- Convert ANY date/time you find to YYYY-MM-DDTHH:MM format
- If only date is found (no time), use "09:00" as default time
- If you see "TBD" or "To be announced", return null
- Current year is 2025, use this if year is not specified
- Parse relative dates: "Tomorrow", "Next Monday", "This Saturday"
- Time zones: Convert to 24-hour format, ignore timezone for now

EXAMPLES OF DATE EXTRACTION:
- "Saturday, March 15, 2025 at 9:00 AM" → "2025-03-15T09:00"
- "March 15 at 9am" → "2025-03-15T09:00"
- "15/03/2025 18:00" → "2025-03-15T18:00"
- "Next Monday at 6pm" → Calculate Monday's date → "2025-XX-XXT18:00"
- "Feb 10, 9:00 AM - 5:00 PM" → start: "2025-02-10T09:00", end: "2025-02-10T17:00"

OTHER RULES:
- Only extract information that is EXPLICITLY stated in the content
- Be factual, do not infer or guess
- For video conferences without event details, use generic platform name

CRITICAL FORMATTING RULES:
- NEVER use asterisks (*) or double asterisks (**) anywhere in your response
- NEVER use asterisks for any purpose whatsoever
- Return ONLY a JSON object (no markdown, no asterisks, no extra text):
{
  "title": "extracted event title",
  "description": "brief description",
  "startTime": "YYYY-MM-DDTHH:MM" or null,
  "endTime": "YYYY-MM-DDTHH:MM" or null,
  "location": "location or platform",
  "organizer": "organizer name if found"
}

CRITICAL: If you find ANY date/time information on the page, you MUST extract it and format it properly. Do not return null unless there is truly no date/time information.`

    const geminiResponse = await fetch(
      `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      },
    )

    const data = await geminiResponse.json()

    if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
      const text = data.candidates[0].content.parts[0].text
      console.log('AI response text:', text)
      
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const eventData = JSON.parse(jsonMatch[0])
        
        // Add the preview image to the event data
        if (previewImage) {
          eventData.imageUrl = previewImage
        }
        
        // Use meta tags as fallback if AI didn't extract title/description
        if (!eventData.title && previewTitle) {
          eventData.title = previewTitle
        }
        if (!eventData.description && previewDescription) {
          eventData.description = previewDescription
        }
        
        console.log('=== FINAL EVENT DATA ===')
        console.log(JSON.stringify(eventData, null, 2))
        console.log('Image URL in response:', eventData.imageUrl || 'NONE')
        
        // Log specifically if dates are missing
        if (!eventData.startTime) {
          console.warn('⚠️ No start time extracted from page')
        }
        if (!eventData.endTime) {
          console.warn('⚠️ No end time extracted from page')
        }
        
        return NextResponse.json({ eventData }, { status: 200 })
      }
    }

    console.error('Failed to parse AI response:', data)
    throw new Error('Failed to parse event data from AI response')

  } catch (error) {
    console.error('Event page scraping error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to scrape event page' },
      { status: 500 }
    )
  }
}

