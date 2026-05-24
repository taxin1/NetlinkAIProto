import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendGmailMessage, GmailToken } from '@/lib/gmail'
import { sendEmailWithSettings } from '@/lib/email/smtp'
import { wrapUserEmailBody } from '@/lib/email/template'

export async function POST(request: Request) {
  const { emailId, contactEmail, subject, body, useGmailApi } = await request.json()
  const supabase = await createClient()
  
  try {
    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if Gmail API is connected and should be used
    if (useGmailApi !== false) {
      const { data: gmailConnection } = await supabase
        .from('gmail_connections')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (gmailConnection) {
        try {
          const token: GmailToken = {
            access_token: gmailConnection.access_token,
            refresh_token: gmailConnection.refresh_token || undefined,
            expiry_date: gmailConnection.token_expires_at 
              ? new Date(gmailConnection.token_expires_at).getTime() 
              : undefined,
          }

          const htmlBody = wrapUserEmailBody(body, { subject })
          const result = await sendGmailMessage(
            token,
            contactEmail.trim(),
            subject,
            htmlBody
          )

          // Update email status to 'sent' in database
          if (emailId) {
            await supabase
              .from('emails')
              .update({ 
                status: 'sent',
                sent_at: new Date().toISOString()
              })
              .eq('id', emailId)
          }

          return NextResponse.json({ 
            success: true,
            message: 'Email sent successfully via Gmail API',
            messageId: result.id,
            threadId: result.threadId,
          })
        } catch (gmailError: any) {
          console.error('Gmail API error, falling back to SMTP:', gmailError)
          // Fall through to SMTP method
        }
      }
    }

    // Fallback to SMTP (existing logic)
    // Get user's personal email settings
    const { data: settings, error: settingsError } = await supabase
      .from('user_email_settings')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (!contactEmail || !contactEmail.trim()) {
      return NextResponse.json(
        { error: 'No recipients defined. Please provide a valid email address.' },
        { status: 400 }
      )
    }

    const htmlBody = wrapUserEmailBody(body, { subject })

    const sendResult = await sendEmailWithSettings(settings ?? null, {
      to: contactEmail.trim(),
      subject,
      text: body,
      html: htmlBody,
      fallbackFromName: user.email ?? undefined,
    })

    if (!sendResult.success) {
      return NextResponse.json(
        {
          error: sendResult.error,
          needsConfiguration: sendResult.needsConfiguration,
        },
        { status: sendResult.needsConfiguration ? 400 : 500 }
      )
    }

    // Update email status to 'sent' in database
    if (emailId) {
      await supabase
        .from('emails')
        .update({ 
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', emailId)
    }

    // Auto-train AI with this email (background, non-blocking)
    if (user && body && subject) {
      // Don't await - let it run in background
      supabase
        .from("ai_trainer_memories")
        .upsert({
          user_id: user.id,
          memory_type: "email_style",
          memory_key: `email_${Date.now()}`,
          memory_value: JSON.stringify({ subject, body_preview: body.substring(0, 200) }),
          importance_score: 3,
          usage_count: 0,
        })
        .then(() => {
          console.log("Auto-trained AI with new email")
        })
        .catch((err) => {
          console.error("Auto-training error:", err)
        })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Email sent successfully' 
    })
  } catch (error: any) {
    console.error('Error sending email:', error)
    
    // Update email status to 'failed' if emailId was provided
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user && emailId) {
        await supabase
          .from('emails')
          .update({ 
            status: 'failed'
          })
          .eq('id', emailId)
      }
    } catch (updateError) {
      console.error('Error updating email status to failed:', updateError)
    }
    
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}
