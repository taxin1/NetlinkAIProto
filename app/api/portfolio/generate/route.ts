import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { throttle, GEMINI_MODEL, GEMINI_API_BASE, getApiKey } from "@/lib/gemini"
import { PortfolioSection } from "@/types/portfolio"

/**
 * Clean and sanitize portfolio content by removing markdown formatting and asterisks
 * Converts markdown formatting to plain text with proper emphasis
 */
function sanitizePortfolioContent(content: string): string {
  if (!content) return content
  
  let cleaned = content
  
  // Remove markdown bold (**text** or __text__) - keep the text, remove the markers
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1') // **bold** -> bold
  cleaned = cleaned.replace(/__([^_]+)__/g, '$1') // __bold__ -> bold
  
  // Remove markdown italic (*text* or _text_) - keep the text, remove the markers
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1') // *italic* -> italic (single asterisk)
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1') // _italic_ -> italic (single underscore)
  
  // Convert asterisk bullets (* item) to dash bullets (- item)
  cleaned = cleaned.replace(/^\s*\*\s+/gm, '- ') // * item -> - item (at line start)
  cleaned = cleaned.replace(/\n\s*\*\s+/g, '\n- ') // * item -> - item (after newline)
  
  // Convert bullet point variations to dashes
  cleaned = cleaned.replace(/^\s*[•·◦‣⁃]\s+/gm, '- ') // • · ◦ ‣ ⁃ -> - (at line start)
  cleaned = cleaned.replace(/\n\s*[•·◦‣⁃]\s+/g, '\n- ') // • · ◦ ‣ ⁃ -> - (after newline)
  
  // Remove any remaining standalone asterisks used for emphasis (not bullets)
  // Only remove if they're not part of a word and not part of a bullet pattern
  cleaned = cleaned.replace(/\s+\*\s+/g, ' ') // space * space -> space
  
  // Clean up markdown headers (# Header -> Header)
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '')
  
  // Remove markdown links but keep the text [text](url) -> text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
  
  // Remove markdown code blocks and inline code
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '') // Code blocks
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1') // Inline code
  
  // Normalize multiple spaces to single space (but preserve intentional spacing)
  cleaned = cleaned.replace(/[ \t]+/g, ' ')
  
  // Clean up excessive line breaks (more than 2 consecutive newlines -> 2)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
  
  // Trim whitespace from each line while preserving structure
  cleaned = cleaned.split('\n').map(line => line.trim()).join('\n')
  
  // Final cleanup: remove any remaining asterisks that are standalone
  cleaned = cleaned.replace(/(^|\s)\*(\s|$)/g, '$1$2')
  
  return cleaned.trim()
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { networkProfile, additionalInfo, cvData } = await request.json()

    if (!networkProfile && !cvData) {
      return NextResponse.json(
        { error: "Network profile or CV/Resume is required" },
        { status: 400 }
      )
    }

    // Generate portfolio content using AI
    const profileInfo = networkProfile || {}
    
    // Build comprehensive prompt with CV data if available
    let cvInfoSection = ""
    if (cvData) {
      cvInfoSection = `\n\nCV/RESUME DATA (PRIMARY SOURCE - Use this detailed information):
Name: ${cvData.name || ''}
Email: ${cvData.email || ''}
Phone: ${cvData.phone || ''}
Title: ${cvData.title || ''}
Location: ${cvData.location || ''}
${cvData.summary ? `\nProfessional Summary:\n${cvData.summary}` : ''}
${cvData.experience ? `\nWork Experience:\n${cvData.experience}` : ''}
${cvData.education ? `\nEducation:\n${cvData.education}` : ''}
${cvData.skills ? `\nSkills:\n${cvData.skills}` : ''}
${cvData.certifications ? `\nCertifications:\n${cvData.certifications}` : ''}
${cvData.projects ? `\nProjects:\n${cvData.projects}` : ''}
${cvData.languages ? `\nLanguages:\n${cvData.languages}` : ''}
`
    }
    
    const prompt = `Generate a professional portfolio website based on the provided information. ${cvData ? 'PRIMARY SOURCE: Use the CV/Resume data below as the main source of information. Extract all details from the CV.' : ''}

PROFILE INFORMATION:
Name: ${cvData?.name || profileInfo.name || 'Professional'}
Title/Position: ${cvData?.title || profileInfo.title || ''}
Company: ${profileInfo.company || ''}
${profileInfo.linkedin ? `LinkedIn: ${profileInfo.linkedin}` : ''}
${cvData?.email || profileInfo.email ? `Email: ${cvData?.email || profileInfo.email}` : ''}
${cvData?.phone || profileInfo.phone ? `Phone: ${cvData?.phone || profileInfo.phone}` : ''}
${profileInfo.website ? `Website: ${profileInfo.website}` : ''}
${profileInfo.about ? `\nAbout: ${profileInfo.about}` : ''}
${profileInfo.summary ? `\nSummary: ${profileInfo.summary}` : ''}${cvInfoSection}
${additionalInfo ? `\nAdditional Information: ${additionalInfo}` : ''}

CRITICAL FORMATTING RULES - FOLLOW STRICTLY:
1. NEVER use asterisks (*) anywhere in the content - not for bullets, not for emphasis, never
2. Use ONLY dashes (-) for bullet points: "- Item one" not "* Item one" or "• Item one"
3. Do NOT use markdown formatting: NO **bold**, NO *italic*, NO # headers
4. For emphasis, use CAPITALIZATION or just plain text - no formatting symbols
5. Use plain text only - standard punctuation, dashes for bullets, line breaks for paragraphs
6. Return ONLY valid JSON - no markdown code blocks, no explanations, just JSON

Return ONLY valid JSON (no markdown, no asterisks, no formatting symbols):

{
  "title": "Professional title (2-8 words, plain text only)",
  "subtitle": "Subtitle (1-2 sentences, plain text only)",
  "bio": "Bio (5-8 sentences covering expertise, journey, achievements, value proposition, plain text only)",
  "sections": [
    {
      "id": "about-1",
      "type": "about",
      "title": "About Me",
      "content": "About section: 1-2 short paragraphs + bullet points using dashes (-) for key highlights. Example format:\n\nParagraph one with professional content.\n\n- Key highlight one\n- Key highlight two\n- Key highlight three",
      "order": 1
    },
    {
      "id": "experience-1",
      "type": "experience",
      "title": "Professional Experience",
      "content": "Experience section: Use dashes (-) for bullet points. Format: - Company Name, Title (Date Range): Key achievement or responsibility",
      "order": 2
    },
    {
      "id": "skills-1",
      "type": "skills",
      "title": "Skills & Expertise",
      "content": "Skills section: Organized by category with dashes (-) for bullet points. Format:\n\nCategory Name:\n- Skill one\n- Skill two",
      "order": 3
    },
    {
      "id": "projects-1",
      "type": "projects",
      "title": "Projects & Achievements",
      "content": "Projects section: Use dashes (-) for bullet points. For each project: - Project Name: Description with role, technologies, and achievements. List 3-5 major projects",
      "order": 4
    },
    {
      "id": "education-1",
      "type": "education",
      "title": "Education & Certifications",
      "content": "Education section: Use dashes (-) for bullet points. Format: - Degree, Institution (Year) or - Certification Name, Issuing Organization (Year)",
      "order": 5
    }
  ]
}

REMEMBER: Use dashes (-) ONLY for bullets. NO asterisks (*), NO markdown (**bold**), NO special formatting symbols. Plain text with dashes for bullets only.`

    try {
      // Use higher token limit for comprehensive portfolio generation
      await throttle()
      const apiKey = getApiKey()

      const response = await fetch(
        `${GEMINI_API_BASE}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              role: "user",
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 8192, // Increased for comprehensive portfolio content
            },
          }),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Gemini API request failed (${response.status}): ${errorText}`)
      }

      const data = await response.json()
      if (data.error) {
        throw new Error(`Gemini API error: ${data.error.message || JSON.stringify(data.error)}`)
      }

      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (!aiResponse) {
        throw new Error("Failed to generate response: No valid response from AI")
      }
      
      // Extract JSON from response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("Failed to extract JSON from AI response")
      }

      const portfolioData = JSON.parse(jsonMatch[0])

      // Sanitize all text content to remove asterisks and markdown formatting
      const sanitizedTitle = sanitizePortfolioContent(portfolioData.title || '')
      const sanitizedSubtitle = sanitizePortfolioContent(portfolioData.subtitle || '')
      const sanitizedBio = sanitizePortfolioContent(portfolioData.bio || '')

      // Validate and structure sections with sanitized content
      const sections: PortfolioSection[] = (portfolioData.sections || []).map((section: any, index: number) => ({
        id: section.id || `${section.type}-${index + 1}`,
        type: section.type || 'custom',
        title: sanitizePortfolioContent(section.title || 'Untitled Section'),
        content: sanitizePortfolioContent(section.content || ''),
        order: section.order || index + 1,
        metadata: section.metadata || {}
      }))

      const profileName = networkProfile?.name || cvData?.name || 'Professional'
      const profileTitle = networkProfile?.title || 'Professional'
      
      return NextResponse.json({
        success: true,
        portfolio: {
          title: sanitizedTitle || `${profileName}'s Portfolio`,
          subtitle: sanitizedSubtitle || `Professional ${profileTitle} Portfolio`,
          bio: sanitizedBio || '',
          sections: sections
        }
      })
    } catch (error) {
      console.error("AI portfolio generation error:", error)
      
      // Fallback: generate basic portfolio structure
      const fallbackName = networkProfile?.name || cvData?.name || 'I'
      const fallbackTitle = networkProfile?.title || 'professional'
      const fallbackCompany = networkProfile?.company || 'my organization'
      
      const fallbackSections: PortfolioSection[] = [
        {
          id: "about-1",
          type: "about",
          title: "About Me",
          content: `${fallbackName} am a ${fallbackTitle} at ${fallbackCompany}. ${additionalInfo || 'I am passionate about my work and dedicated to delivering excellence.'}`,
          order: 1
        },
        {
          id: "experience-1",
          type: "experience",
          title: "Experience",
          content: `Currently serving as ${fallbackTitle} at ${fallbackCompany}. ${additionalInfo || 'With a track record of success and dedication to continuous improvement.'}`,
          order: 2
        }
      ]

      return NextResponse.json({
        success: true,
        portfolio: {
          title: `${fallbackName}'s Portfolio`,
          subtitle: fallbackTitle + ' Portfolio',
          bio: `Welcome to my portfolio. I'm ${fallbackName} ${fallbackTitle ? `working as a ${fallbackTitle}` : ''}${fallbackCompany ? ` at ${fallbackCompany}` : ''}.`,
          sections: fallbackSections
        }
      })
    }
  } catch (error) {
    console.error("Portfolio generation API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate portfolio" },
      { status: 500 }
    )
  }
}
