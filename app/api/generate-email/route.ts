import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateEmailWithGemini } from "@/lib/gemini"

export async function POST(request: NextRequest) {
  try {
    const { contactName, contactCompany, purpose, contactId, userId } = await request.json()

    if (!contactName || !purpose) {
      return NextResponse.json(
        { error: "Contact name and purpose are required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    let userProfile: any = {}
    let contactDetails: any = {}
    let previousEmails: any[] = []

    // Fetch user profile information
    if (userId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        userProfile = {
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          email: user.email || '',
          // Extract name from email if no full_name
          displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || ''
        }
      }
    }

    // Fetch detailed contact information if contactId provided
    if (contactId && userId) {
      const { data: contact } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .eq('user_id', userId)
        .single()

      if (contact) {
        contactDetails = {
          name: contact.name,
          email: contact.email,
          company: contact.company,
          position: contact.position,
          notes: contact.notes,
          linkedin_url: contact.linkedin_url,
          tags: contact.tags || []
        }

        // Fetch previous emails with this contact for context
        const { data: emails } = await supabase
          .from('emails')
          .select('subject, body, created_at, status')
          .eq('contact_id', contactId)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(3)

        previousEmails = emails || []

        // Fetch recent events/interactions with this contact
        const { data: events } = await supabase
          .from('events')
          .select('event_type, description, created_at')
          .eq('contact_id', contactId)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(3)

        if (events && events.length > 0) {
          contactDetails.recentInteractions = events
        }
      }
    }

    try {
      // Ensure we have required fields
      if (!contactName || !purpose) {
        return NextResponse.json(
          { error: "Contact name and purpose are required" },
          { status: 400 }
        )
      }

      const emailBody = await generateEmailWithGemini({
        contactName: contactDetails.name || contactName,
        contactCompany: contactDetails.company || contactCompany || "",
        contactPosition: contactDetails.position || "",
        contactNotes: contactDetails.notes || "",
        contactLinkedIn: contactDetails.linkedin_url || "",
        contactTags: contactDetails.tags || [],
        userProfile: Object.keys(userProfile).length > 0 ? userProfile : undefined,
        purpose: purpose,
        previousEmails: previousEmails.length > 0 ? previousEmails : undefined,
        recentInteractions: (contactDetails.recentInteractions && contactDetails.recentInteractions.length > 0) ? contactDetails.recentInteractions : undefined
      })
      
      if (!emailBody || typeof emailBody !== 'string') {
        console.error("Invalid email body returned:", emailBody)
        return NextResponse.json(
          { error: "Failed to generate email: Invalid response from AI" },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        emailBody,
      })
    } catch (error) {
      console.error("Email generation error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to generate email"
      console.error("Error details:", {
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined
      })
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Generate email API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

