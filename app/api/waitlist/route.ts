import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'

export async function POST(request: Request) {
  try {
    const { email, userId } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if email already exists in waitlist
    const { data: existing } = await supabase
      .from('waitlist')
      .select('*')
      .eq('email', email.toLowerCase())
      .single()

    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'You are already on the waitlist!',
        position: existing.position,
        earlyBird: existing.early_bird,
        data: existing
      })
    }

    // Insert into waitlist (trigger will assign position and early bird status)
    const { data: waitlistEntry, error: insertError } = await supabase
      .from('waitlist')
      .insert({
        email: email.toLowerCase(),
        user_id: userId || null,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting into waitlist:', JSON.stringify(insertError, null, 2))
      // Provide more detailed error message for debugging
      const errorMessage = insertError.message || insertError.code || insertError.hint || 'Failed to join waitlist'
      const errorDetails = insertError.details || insertError.code
      
      return NextResponse.json(
        { 
          error: 'Failed to join waitlist. Please try again.',
          details: process.env.NODE_ENV === 'development' ? {
            message: errorMessage,
            code: errorDetails,
            fullError: insertError
          } : undefined
        },
        { status: 500 }
      )
    }

    // Send confirmation email
    try {
      await sendWaitlistConfirmationEmail(
        email,
        waitlistEntry.position || 0,
        waitlistEntry.early_bird || false
      )

      // Update email_sent flag
      await supabase
        .from('waitlist')
        .update({ email_sent: true })
        .eq('id', waitlistEntry.id)
    } catch (emailError) {
      console.error('Error sending email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully joined the waitlist!',
      position: waitlistEntry.position,
      earlyBird: waitlistEntry.early_bird,
      data: waitlistEntry
    })
  } catch (error: any) {
    console.error('Error in waitlist API:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

async function sendWaitlistConfirmationEmail(
  email: string,
  position: number,
  earlyBird: boolean
) {
  const emailUser = process.env.GMAIL_USER
  const emailPass = process.env.GMAIL_APP_PASSWORD

  if (!emailUser || !emailPass) {
    console.warn('Email credentials not configured, skipping email send')
    return
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  })

  const earlyBirdMessage = earlyBird
    ? `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center;">
        <h2 style="color: white; margin: 0;">🎉 Congratulations!</h2>
        <p style="color: white; margin: 10px 0 0 0; font-size: 18px;">
          You're one of the first 100 users! You'll get <strong>FREE Pro access for 6 months</strong> now that we're live!
        </p>
      </div>
    `
    : ''

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to the Waitlist!</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0;">Welcome to Netlink AI - Network Link AI!</h1>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
        <p style="font-size: 16px; margin-bottom: 20px;">
          Thank you for joining our waitlist! We're excited to have you on board.
        </p>
        
        ${earlyBirdMessage}
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
          <p style="margin: 0 0 10px 0; font-weight: bold;">Your Position: <span style="color: #667eea; font-size: 24px;">#${position}</span></p>
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            We'll notify you as soon as the product is live!
          </p>
        </div>
        
        <div style="margin: 30px 0;">
          <h2 style="color: #1f2937; margin-bottom: 15px;">What to Expect:</h2>
          <ul style="list-style: none; padding: 0;">
            <li style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
              ✅ AI-powered business card scanning
            </li>
            <li style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
              ✅ Intelligent contact management
            </li>
            <li style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
              ✅ Automated email campaigns
            </li>
            <li style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
              ✅ Network analytics and insights
            </li>
            <li style="padding: 10px 0;">
              ✅ Voice-activated networking assistant
            </li>
          </ul>
        </div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
          We're working hard to deliver an amazing experience. Stay tuned for updates!
        </p>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
          Best regards,<br>
          The Netlink AI - Network Link AI Team
        </p>
      </div>
    </body>
    </html>
  `

  await transporter.sendMail({
    from: `"Netlink AI - Network Link AI" <${emailUser}>`,
    to: email,
    subject: 'Welcome to the Netlink AI - Network Link AI Waitlist! 🎉',
    html: emailHtml,
    text: `
Welcome to Netlink AI - Network Link AI!

Thank you for joining our waitlist! We're excited to have you on board.

Your Position: #${position}

${earlyBird ? '🎉 Congratulations! You\'re one of the first 100 users! You\'ll get FREE Pro access for 6 months now that we\'re live!' : ''}

What to Expect:
- AI-powered business card scanning
- Intelligent contact management
- Automated email campaigns
- Network analytics and insights
- Voice-activated networking assistant

We'll notify you as soon as the product is live!

Best regards,
The Netlink AI - Network Link AI Team
    `.trim(),
  })
}
