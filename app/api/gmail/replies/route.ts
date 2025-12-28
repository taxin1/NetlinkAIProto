import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGmailRepliesToSentEmails, GmailToken } from '@/lib/gmail'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get Gmail connection
    const { data: connection, error: connError } = await supabase
      .from('gmail_connections')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (connError || !connection) {
      return NextResponse.json(
        { error: 'Gmail not connected. Please connect your Gmail account first.' },
        { status: 400 }
      )
    }

    const token: GmailToken = {
      access_token: connection.access_token,
      refresh_token: connection.refresh_token || undefined,
      expiry_date: connection.token_expires_at 
        ? new Date(connection.token_expires_at).getTime() 
        : undefined,
    }

    // Fetch replies
    const maxResults = parseInt(request.nextUrl.searchParams.get('maxResults') || '50')
    const replies = await getGmailRepliesToSentEmails(token, maxResults)

    // Match replies with sent emails in database
    const enrichedReplies = await Promise.all(
      replies.map(async (reply) => {
        // Try to find matching email by subject or contact email
        const { data: matchingEmail } = await supabase
          .from('emails')
          .select('*, contacts(*)')
          .eq('user_id', user.id)
          .ilike('subject', `%${reply.subject.replace(/^(Re:|RE:)\s*/i, '')}%`)
          .limit(1)
          .single()

        // Check if reply already exists
        const { data: existingReply } = await supabase
          .from('email_replies')
          .select('*')
          .eq('gmail_message_id', reply.id)
          .eq('user_id', user.id)
          .single()

        if (!existingReply) {
          // Store new reply
          await supabase.from('email_replies').insert({
            user_id: user.id,
            email_id: matchingEmail?.id || null,
            contact_id: matchingEmail?.contact_id || null,
            gmail_message_id: reply.id,
            gmail_thread_id: reply.threadId,
            subject: reply.subject,
            body: reply.body,
            from_email: reply.from,
            snippet: reply.snippet,
            received_at: new Date(reply.date).toISOString(),
            is_read: false,
          })
        }

        return {
          ...reply,
          emailId: matchingEmail?.id,
          contactId: matchingEmail?.contact_id,
          contact: matchingEmail?.contacts,
        }
      })
    )

    return NextResponse.json({ replies: enrichedReplies })
  } catch (error: any) {
    console.error('Error fetching Gmail replies:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Gmail replies' },
      { status: 500 }
    )
  }
}
