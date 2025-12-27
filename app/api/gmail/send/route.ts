import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendGmailMessage, GmailToken } from '@/lib/gmail'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { to, subject, body, inReplyTo, threadId, emailId } = await request.json()

    if (!to || !subject || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, body' },
        { status: 400 }
      )
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

    // Send email via Gmail API
    const result = await sendGmailMessage(token, to, subject, body, inReplyTo, threadId)

    // Update email status if emailId provided
    if (emailId) {
      await supabase
        .from('emails')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .eq('id', emailId)
    }

    return NextResponse.json({
      success: true,
      messageId: result.id,
      threadId: result.threadId,
    })
  } catch (error: any) {
    console.error('Error sending Gmail message:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email via Gmail' },
      { status: 500 }
    )
  }
}

