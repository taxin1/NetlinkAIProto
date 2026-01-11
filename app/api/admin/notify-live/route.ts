import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import nodemailer from 'nodemailer'

export async function POST(request: Request) {
  try {
    const { secret } = await request.json()

    // Simple security check - you might want to use a better way or just run this locally
    if (secret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Get all waitlist users
    const { data: waitlist, error: fetchError } = await supabase
      .from('waitlist')
      .select('*')
      .is('live_notified', null) // Only those not yet notified

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!waitlist || waitlist.length === 0) {
      return NextResponse.json({ message: 'No more users to notify' })
    }

    const emailUser = process.env.GMAIL_USER
    const emailPass = process.env.GMAIL_APP_PASSWORD

    if (!emailUser || !emailPass) {
      return NextResponse.json({ error: 'Email credentials not configured' }, { status: 500 })
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

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const entry of waitlist) {
      try {
        const earlyBirdMessage = entry.early_bird
          ? `<p>As an early bird member, your <strong>6 months of FREE Pro access</strong> has been activated!</p>`
          : ''

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Netlink AI is Live!</title>
          </head>
          <body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; color: white;">
              <h1 style="margin: 0;">Netlink AI is Live! 🚀</h1>
            </div>
            
            <div style="padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
              <p>Hi there,</p>
              <p>Great news! The wait is over. <strong>Netlink AI is now officially live and open for everyone!</strong></p>
              
              ${earlyBirdMessage}
              
              <p>You can now sign up and start using our AI-powered networking tools:</p>
              <ul>
                <li>AI Business Card Scanner</li>
                <li>Intelligent Contact Management</li>
                <li>Automated Email Campaigns</li>
                <li>Network Analytics</li>
                <li>Voice-Activated Networking Assistant</li>
              </ul>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://netlink-ai.vercel.app/auth/signup" style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                  Get Started Now
                </a>
              </div>
              
              <p>We can't wait to see how Netlink AI helps you grow your professional network.</p>
              
              <p>Best regards,<br>The Netlink AI Team</p>
            </div>
          </body>
          </html>
        `

        await transporter.sendMail({
          from: `"Netlink AI" <${emailUser}>`,
          to: entry.email,
          subject: 'Netlink AI is Now LIVE! 🚀',
          html: emailHtml,
          text: `Netlink AI is Now LIVE! 🚀\n\nGreat news! The wait is over. Netlink AI is now officially live and open for everyone!\n\nGet started now: https://netlink-ai.vercel.app/auth/signup\n\nBest regards,\nThe Netlink AI Team`,
        })

        // Update status in DB
        await supabase
          .from('waitlist')
          .update({ live_notified: true, notified_at: new Date().toISOString() })
          .eq('id', entry.id)

        results.success++
      } catch (err: any) {
        console.error(`Failed to notify ${entry.email}:`, err)
        results.failed++
        results.errors.push(`${entry.email}: ${err.message}`)
      }
    }

    return NextResponse.json({
      message: `Notification process completed. Success: ${results.success}, Failed: ${results.failed}`,
      errors: results.errors.length > 0 ? results.errors : undefined
    })

  } catch (error: any) {
    console.error('Error in notify-live API:', error)
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
