import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getGmailRepliesToSentEmails, GmailToken } from '@/lib/gmail'

export async function POST(request: NextRequest) {
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

    // Fetch recent replies
    const replies = await getGmailRepliesToSentEmails(token, 100)
    
    let syncedCount = 0
    let newRepliesCount = 0

    // Sync each reply
    for (const reply of replies) {
      // Check if reply already exists
      const { data: existingReply } = await supabase
        .from('email_replies')
        .select('*')
        .eq('gmail_message_id', reply.id)
        .eq('user_id', user.id)
        .single()

      if (existingReply) {
        syncedCount++
        continue
      }

      // Try to find matching email
      const subjectWithoutRe = reply.subject.replace(/^(Re:|RE:)\s*/i, '').trim()
      const { data: matchingEmails } = await supabase
        .from('emails')
        .select('*, contacts(*)')
        .eq('user_id', user.id)
        .or(`subject.ilike.%${subjectWithoutRe}%,subject.ilike.%${reply.subject}%`)
        .order('created_at', { ascending: false })
        .limit(1)

      const matchingEmail = matchingEmails?.[0]

      // Extract email from "Name <email@example.com>" format
      const emailMatch = reply.from.match(/<(.+)>/)
      const fromEmail = emailMatch ? emailMatch[1] : reply.from

      // Try to find contact by email
      let contactId = matchingEmail?.contact_id || null
      if (!contactId && fromEmail) {
        const { data: contact } = await supabase
          .from('contacts')
          .select('id')
          .eq('user_id', user.id)
          .ilike('email', fromEmail)
          .single()
        
        contactId = contact?.id || null
      }

      // Store new reply
      const { error: insertError } = await supabase.from('email_replies').insert({
        user_id: user.id,
        email_id: matchingEmail?.id || null,
        contact_id: contactId,
        gmail_message_id: reply.id,
        gmail_thread_id: reply.threadId,
        subject: reply.subject,
        body: reply.body,
        from_email: fromEmail,
        snippet: reply.snippet,
        received_at: new Date(reply.date).toISOString(),
        is_read: false,
      })

      if (!insertError) {
        newRepliesCount++
        syncedCount++
      }
    }

    return NextResponse.json({
      success: true,
      synced: syncedCount,
      new: newRepliesCount,
      total: replies.length,
    })
  } catch (error: any) {
    console.error('Error syncing Gmail replies:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to sync Gmail replies' },
      { status: 500 }
    )
  }
}
