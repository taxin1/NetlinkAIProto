import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  return await sendTestEmail()
}

export async function POST(request: NextRequest) {
  return await sendTestEmail()
}

async function sendTestEmail() {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Try to get user's email settings first
    const { data: userSettings, error: settingsError } = await supabase
      .from("user_email_settings")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .single()

    let transporter
    let senderEmail
    let senderName

    if (userSettings && !settingsError) {
      // Use user's configured email settings
      senderEmail = userSettings.email_address
      senderName = userSettings.from_name || userSettings.email_address

      if (userSettings.email_provider === "gmail") {
        transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: userSettings.email_address,
            pass: userSettings.email_password,
          },
        })
      } else if (userSettings.email_provider === "outlook") {
        transporter = nodemailer.createTransport({
          service: "outlook",
          auth: {
            user: userSettings.email_address,
            pass: userSettings.email_password,
          },
        })
      } else if (userSettings.email_provider === "smtp") {
        transporter = nodemailer.createTransport({
          host: userSettings.smtp_host,
          port: userSettings.smtp_port || 587,
          secure: userSettings.smtp_secure || false,
          auth: {
            user: userSettings.email_address,
            pass: userSettings.email_password,
          },
        })
      } else {
        return NextResponse.json(
          { error: "Unsupported email provider" },
          { status: 400 }
        )
      }
    } else {
      // Fall back to system Gmail credentials
      const gmailUser = process.env.GMAIL_USER
      const gmailPassword = process.env.GMAIL_APP_PASSWORD

      if (!gmailUser || !gmailPassword) {
        return NextResponse.json(
          { 
            error: "Email not configured",
            message: "Please configure your email settings in the settings page",
          },
          { status: 400 }
        )
      }

      senderEmail = gmailUser
      senderName = "Netlink"

      transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailUser,
          pass: gmailPassword,
        },
      })
    }

    // Send test email to the sender's email address
    const testEmailContent = `
      <h2>🎉 Netlink Test Email</h2>
      <p>This is a test email from your Netlink application.</p>
      <p><strong>Status:</strong> ✅ Email sending is working correctly!</p>
      <p><strong>Sent from:</strong> ${senderEmail}</p>
      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      <hr>
      <p>Your email integration is configured properly and ready to send emails.</p>
      <p><em>Powered by Netlink AI Email Agent</em></p>
    `

    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to: senderEmail, // Send to yourself
      subject: "✅ Test Email - Netlink Email Agent",
      text: "This is a test email from Netlink. If you're reading this, email sending is working!",
      html: testEmailContent,
    })

    console.log("Test email sent successfully:", info.messageId)

    return NextResponse.json({
      success: true,
      message: "Test email sent successfully!",
      details: {
        messageId: info.messageId,
        from: senderEmail,
        to: senderEmail,
        timestamp: new Date().toISOString(),
        usedUserSettings: !!userSettings,
      },
      nextSteps: "Check your inbox (and spam folder) for the test email!"
    })
  } catch (error) {
    console.error("Test email error:", error)
    
    let errorMessage = "Failed to send test email"
    let troubleshooting = {}

    if (error instanceof Error) {
      errorMessage = error.message
      
      if (error.message.includes("Invalid login")) {
        troubleshooting = {
          issue: "Invalid email credentials",
          solution: "Check that your email address and password are correct",
          note: "For Gmail, make sure you're using an App Password, not your regular Gmail password"
        }
      } else if (error.message.includes("self signed certificate")) {
        troubleshooting = {
          issue: "SSL certificate issue",
          solution: "This is usually a network/firewall issue",
        }
      }
    }

    return NextResponse.json(
      { 
        error: errorMessage,
        troubleshooting,
        fullError: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    )
  }
}
