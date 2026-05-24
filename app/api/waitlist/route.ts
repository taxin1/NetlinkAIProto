import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSystemEmail } from '@/lib/email/smtp'
import { buildWaitlistWelcomeEmail } from '@/lib/email/template'

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
  const { html, text, subject } = buildWaitlistWelcomeEmail(position, earlyBird)

  const result = await sendSystemEmail({
    to: email,
    subject,
    html,
    text,
  })

  if (!result.success) {
    console.warn('Waitlist email not sent:', result.error)
  }
}
