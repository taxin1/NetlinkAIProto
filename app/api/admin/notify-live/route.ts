import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSystemEmail, isSmtpConfigured } from '@/lib/email/smtp'
import { buildLiveNotificationEmail } from '@/lib/email/template'

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

    if (!isSmtpConfigured()) {
      return NextResponse.json({ error: 'SMTP not configured (SMTP_USER, SMTP_PASS)' }, { status: 500 })
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    for (const entry of waitlist) {
      try {
        const { html, text, subject } = buildLiveNotificationEmail(
          Boolean(entry.early_bird)
        )

        const sendResult = await sendSystemEmail({
          to: entry.email,
          subject,
          html,
          text,
        })

        if (!sendResult.success) {
          throw new Error(sendResult.error)
        }

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
