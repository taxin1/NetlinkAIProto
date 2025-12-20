import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateEmailWithGemini } from "@/lib/gemini"
import { GEMINI_API_BASE, GEMINI_MODEL } from "@/lib/gemini"

interface CommandIntent {
  action: string
  parameters: Record<string, any>
  needsConfirmation: boolean
  response: string
}

export async function POST(request: NextRequest) {
  try {
    const { command, userId } = await request.json()

    if (!command || !userId) {
      return NextResponse.json(
        { error: "Command and userId are required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Fetch comprehensive data from all parts of the website
    const [
      contactsResult,
      emailsResult,
      eventsResult,
      campaignsResult,
      statsResult
    ] = await Promise.all([
      // Contacts - get all contacts with details
      supabase
        .from("contacts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
      
      // Emails - get recent emails with status
      supabase
        .from("emails")
        .select(`
          *,
          contacts (name, email, company)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
      
      // Calendar events - upcoming events
      supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", userId)
        .order("event_date", { ascending: true })
        .limit(10),
      
      // Email campaigns - all campaigns with status
      supabase
        .from("email_campaigns")
        .select(`
          *,
          campaign_contacts (
            contact_id,
            contacts (id, name, email, company)
          )
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
      
      // Statistics - get counts
      Promise.all([
        supabase.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("emails").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "sent"),
        supabase.from("calendar_events").select("*", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("email_campaigns").select("*", { count: "exact", head: true }).eq("user_id", userId),
      ])
    ])

    const contacts = contactsResult.data || []
    const emails = emailsResult.data || []
    const events = eventsResult.data || []
    const campaigns = campaignsResult.data || []
    
    // Calculate stats
    const stats = {
      totalContacts: statsResult[0].count || 0,
      sentEmails: statsResult[1].count || 0,
      totalEvents: statsResult[2].count || 0,
      totalCampaigns: statsResult[3].count || 0,
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set")
    }

    // Build comprehensive context string
    const contactsSummary = contacts.length > 0 
      ? contacts.slice(0, 10).map(c => `${c.name}${c.email ? ` (${c.email})` : ''}${c.company ? ` at ${c.company}` : ''}`).join(", ")
      : "No contacts yet"
    
    const emailsSummary = emails.length > 0
      ? emails.slice(0, 5).map(e => {
          const contact = e.contacts || {}
          return `${contact.name || 'Unknown'}: "${e.subject}" (${e.status})`
        }).join(", ")
      : "No emails yet"
    
    const eventsSummary = events.length > 0
      ? events.slice(0, 5).map(e => `"${e.title}" on ${e.event_date}`).join(", ")
      : "No upcoming events"
    
    const campaignsSummary = campaigns.length > 0
      ? campaigns.map(c => `"${c.name}" (${c.status}, ${c.sent_count || 0}/${c.total_count || 0} sent)`).join(", ")
      : "No campaigns yet"

    const prompt = `You are a voice command parser for Netlink Cogni, an AI-powered business networking platform.

AVAILABLE VOICE ACTIONS:
- write_email: Generate/write an email for a contact (requires: recipient name/email, purpose/topic)
- send_email: Send an email to a contact (requires: recipient name/email, subject, body/message)
- create_campaign: Create an email campaign (requires: campaign name, purpose, subject, contact names/emails)
- view_contacts: Show the user's contacts list
- view_emails: Show recent emails
- view_events: Show upcoming events
- view_campaigns: Show email campaigns
- view_stats: Show dashboard statistics (contacts, emails, events, campaigns)
- search_contact: Search for a specific contact by name
- create_contact: Add a new contact with name, email, company, phone, LinkedIn, notes
- create_event: Create a new calendar event
- get_stats: Show dashboard statistics
- general_query: Answer general questions about the platform or data

Voice command: "${command}"

USER'S DATA:
- Contacts (${stats.totalContacts} total): ${contactsSummary}
- Recent Emails (${stats.sentEmails} sent total): ${emailsSummary}
- Upcoming Events (${stats.totalEvents} total): ${eventsSummary}
- Email Campaigns (${stats.totalCampaigns} total): ${campaignsSummary}

For write_email action, extract:
- recipient: contact name or email
- purpose: what the email is about (e.g., "schedule a meeting", "follow up", "introduction")
- Optional: subject if mentioned

For send_email action, extract:
- recipient: contact name or email
- subject: email subject line
- body/message: email content

For create_campaign action, extract:
- campaign_name: name of the campaign
- purpose: what the campaign is for
- subject: email subject line
- contacts: list of contact names or "all contacts" or specific names

Respond with ONLY a JSON object:
{
  "action": "action_name",
  "parameters": {},
  "needsConfirmation": true/false,
  "response": "Natural language response (no asterisks, plain text)"
}`

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
              parts: [
                {
                  text: `You are a voice command parser for Netlink Cogni. Always respond with ONLY a valid JSON object, no other text.\n\n${prompt}`
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
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

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      throw new Error("No valid response from Gemini API")
    }

    const responseText = data.candidates[0].content.parts[0].text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      return NextResponse.json({
        action: "general_query",
        parameters: {},
        needsConfirmation: false,
        response: "I'm not sure what you'd like me to do. Could you please rephrase that?",
      })
    }

    const intent: CommandIntent = JSON.parse(jsonMatch[0])

    if (!intent.needsConfirmation) {
      switch (intent.action) {
        case "write_email":
          // Generate email content
          if (intent.parameters.recipient && intent.parameters.purpose) {
            // Find the contact
            const recipientName = intent.parameters.recipient.toLowerCase()
            const contact = contacts.find(c => 
              c.name?.toLowerCase().includes(recipientName) || 
              c.email?.toLowerCase().includes(recipientName)
            )
            
            if (contact && contact.email) {
              try {
                // Fetch additional contact details and context
                const { data: fullContact } = await supabase
                  .from('contacts')
                  .select('*')
                  .eq('id', contact.id)
                  .eq('user_id', userId)
                  .single()

                // Fetch previous emails for context
                const { data: previousEmails } = await supabase
                  .from('emails')
                  .select('subject, body, created_at, status')
                  .eq('contact_id', contact.id)
                  .eq('user_id', userId)
                  .order('created_at', { ascending: false })
                  .limit(3)

                // Fetch recent interactions
                const { data: events } = await supabase
                  .from('events')
                  .select('event_type, description, created_at')
                  .eq('contact_id', contact.id)
                  .eq('user_id', userId)
                  .order('created_at', { ascending: false })
                  .limit(3)

                // Get user profile
                const { data: { user } } = await supabase.auth.getUser()
                const userProfile = user ? {
                  name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                  email: user.email || '',
                  displayName: user.user_metadata?.full_name || user.email?.split('@')[0] || ''
                } : undefined

                // Generate email directly using the function
                const emailBody = await generateEmailWithGemini({
                  contactName: fullContact?.name || contact.name,
                  contactCompany: fullContact?.company || contact.company || "",
                  contactPosition: fullContact?.position || "",
                  contactNotes: fullContact?.notes || "",
                  contactLinkedIn: fullContact?.linkedin_url || "",
                  contactTags: fullContact?.tags || [],
                  userProfile: userProfile,
                  purpose: intent.parameters.purpose,
                  previousEmails: previousEmails || undefined,
                  recentInteractions: events || undefined
                })
                
                intent.parameters.generatedEmail = emailBody
                intent.parameters.contactId = contact.id
                intent.parameters.contactEmail = contact.email
                intent.parameters.contactName = contact.name
                intent.needsConfirmation = true
                intent.response = `I've written an email to ${contact.name} about ${intent.parameters.purpose}. Would you like me to send it?`
              } catch (error) {
                console.error("Error generating email:", error)
                intent.response = "I encountered an error while generating the email. Please try again."
              }
            } else {
              intent.needsConfirmation = true
              intent.response = `I couldn't find a contact named "${intent.parameters.recipient}". Could you provide the email address?`
            }
          } else {
            intent.needsConfirmation = true
            intent.response = "To write an email, I need the recipient's name and what the email should be about."
          }
          break
          
        case "send_email":
          intent.needsConfirmation = true
          intent.response = `I'll help you send an email. ${intent.response}`
          break
          
        case "create_campaign":
          // Create email campaign
          if (intent.parameters.campaign_name && intent.parameters.purpose && intent.parameters.subject) {
            // Determine which contacts to include
            let contactIds: string[] = []
            
            if (intent.parameters.contacts === "all" || intent.parameters.contacts === "all contacts") {
              contactIds = contacts.filter(c => c.email).map(c => c.id)
            } else if (Array.isArray(intent.parameters.contacts)) {
              // Find contacts by name
              const contactNames = intent.parameters.contacts.map((n: string) => n.toLowerCase())
              contactIds = contacts
                .filter(c => contactNames.some((name: string) => 
                  c.name?.toLowerCase().includes(name) || 
                  c.email?.toLowerCase().includes(name)
                ))
                .filter(c => c.email)
                .map(c => c.id)
            } else if (typeof intent.parameters.contacts === "string") {
              const contactName = intent.parameters.contacts.toLowerCase()
              const found = contacts.find(c => 
                c.name?.toLowerCase().includes(contactName) || 
                c.email?.toLowerCase().includes(contactName)
              )
              if (found && found.email) {
                contactIds = [found.id]
              }
            }
            
            if (contactIds.length === 0) {
              // Default to all contacts with emails
              contactIds = contacts.filter(c => c.email).map(c => c.id)
            }
            
            if (contactIds.length === 0) {
              intent.response = "I couldn't find any contacts with email addresses to include in the campaign."
            } else {
              try {
                // Create campaign
                const { data: campaign, error: campaignError } = await supabase
                  .from("email_campaigns")
                  .insert({
                    user_id: userId,
                    name: intent.parameters.campaign_name,
                    purpose: intent.parameters.purpose,
                    subject: intent.parameters.subject,
                    status: "draft",
                    total_count: contactIds.length,
                  })
                  .select()
                  .single()
                
                if (campaignError) throw campaignError
                
                // Add contacts to campaign
                const campaignContacts = contactIds.map(contactId => ({
                  campaign_id: campaign.id,
                  contact_id: contactId,
                }))
                
                const { error: contactsError } = await supabase
                  .from("campaign_contacts")
                  .insert(campaignContacts)
                
                if (contactsError) throw contactsError
                
                intent.response = `I've created the campaign "${intent.parameters.campaign_name}" with ${contactIds.length} contacts. Would you like me to start sending emails now?`
                intent.parameters.campaignId = campaign.id
                intent.needsConfirmation = true
              } catch (error) {
                intent.response = "I encountered an error while creating the campaign. Please try again."
              }
            }
          } else {
            intent.needsConfirmation = true
            intent.response = "To create a campaign, I need a campaign name, purpose, subject, and which contacts to include."
          }
          break
          
        case "create_contact":
          if (intent.parameters.name && intent.parameters.email) {
            const { error } = await supabase.from("contacts").insert({
              user_id: userId,
              name: intent.parameters.name,
              email: intent.parameters.email,
              company: intent.parameters.company || null,
              phone: intent.parameters.phone || null,
              notes: intent.parameters.notes || null,
            })
            intent.response = error ? "I encountered an error while adding the contact." : `Great! I've added ${intent.parameters.name} to your contacts.`
          } else {
            intent.needsConfirmation = true
            intent.response = "To add a contact, I need at least a name and email address."
          }
          break
          
        case "view_contacts":
          if (contacts.length === 0) {
            intent.response = "You don't have any contacts yet."
          } else {
            const contactsList = contacts.slice(0, 10).map(c => 
              `${c.name}${c.company ? ` at ${c.company}` : ''}${c.email ? ` (${c.email})` : ''}`
            ).join(", ")
            intent.response = `You have ${stats.totalContacts} contacts. Recent ones: ${contactsList}.`
          }
          break
          
        case "view_emails":
          if (emails.length === 0) {
            intent.response = "You haven't sent any emails yet."
          } else {
            const emailsList = emails.slice(0, 5).map(e => {
              const contact = e.contacts || {}
              return `"${e.subject}" to ${contact.name || 'Unknown'} (${e.status})`
            }).join(", ")
            intent.response = `You have ${stats.sentEmails} sent emails. Recent ones: ${emailsList}.`
          }
          break
          
        case "view_events":
          if (events.length === 0) {
            intent.response = "You don't have any upcoming events scheduled."
          } else {
            const eventsList = events.slice(0, 5).map(e => `"${e.title}" on ${e.event_date}`).join(", ")
            intent.response = `You have ${stats.totalEvents} events. Upcoming: ${eventsList}.`
          }
          break
          
        case "view_campaigns":
          if (campaigns.length === 0) {
            intent.response = "You don't have any email campaigns yet."
          } else {
            const campaignsList = campaigns.map(c => 
              `"${c.name}" (${c.status}, ${c.sent_count || 0}/${c.total_count || 0} sent)`
            ).join(", ")
            intent.response = `You have ${stats.totalCampaigns} campaigns: ${campaignsList}.`
          }
          break
          
        case "view_stats":
        case "get_stats":
          intent.response = `Here are your statistics: ${stats.totalContacts} contacts, ${stats.sentEmails} sent emails, ${stats.totalEvents} events, and ${stats.totalCampaigns} email campaigns.`
          break
          
        case "search_contact":
          if (intent.parameters.name) {
            const searchName = intent.parameters.name.toLowerCase()
            const found = contacts.find(c => 
              c.name?.toLowerCase().includes(searchName) || 
              c.email?.toLowerCase().includes(searchName)
            )
            if (found) {
              intent.response = `Found ${found.name}${found.email ? ` (${found.email})` : ''}${found.company ? ` at ${found.company}` : ''}${found.position ? `, ${found.position}` : ''}.`
            } else {
              intent.response = `I couldn't find a contact named "${intent.parameters.name}".`
            }
          } else {
            intent.response = "Please provide a contact name to search for."
          }
          break
      }
    }

    return NextResponse.json(intent)
  } catch (error) {
    console.error("Voice command error:", error)
    return NextResponse.json(
      { error: "Failed to process voice command", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
