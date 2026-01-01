import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'
import { sendGmailMessage, GmailToken } from '@/lib/gmail'

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

          // Send via Gmail API
          const result = await sendGmailMessage(
            token,
            contactEmail.trim(),
            subject,
            body.replace(/\n/g, '<br>')
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

    // Prioritize user's personal email configuration
    let emailUser, emailPass, smtpHost, smtpPort, fromName

    if (settings) {
      // Use user's personal email settings
      emailUser = settings.email_address
      emailPass = settings.email_password
      smtpHost = settings.smtp_host || 'smtp.gmail.com'
      smtpPort = settings.smtp_port || 587
      fromName = settings.from_name || user.email
      
      console.log(`Using personal email settings for ${user.email}`)
    } else {
      // Fallback to shared Gmail (only if user hasn't configured their own)
      emailUser = process.env.GMAIL_USER
      emailPass = process.env.GMAIL_APP_PASSWORD
      smtpHost = 'smtp.gmail.com'
      smtpPort = 587
      fromName = user.email
      
      console.log(`Using default Gmail settings for ${user.email}`)
    }

    if (!emailUser || !emailPass) {
      return NextResponse.json(
        { 
          error: 'Email not configured. Please go to Settings → Email Configuration to set up your email account.',
          needsConfiguration: true
        },
        { status: 400 }
      )
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    })

    // Validate recipient email
    if (!contactEmail || !contactEmail.trim()) {
      return NextResponse.json(
        { error: 'No recipients defined. Please provide a valid email address.' },
        { status: 400 }
      )
    }

    // Send email
    await transporter.sendMail({
      from: `"${fromName}" <${emailUser}>`,
      to: contactEmail.trim(),
      subject: subject,
      text: body,
      html: body.replace(/\n/g, '<br>'),
      replyTo: emailUser,
    })

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
