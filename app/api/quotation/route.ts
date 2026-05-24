import { NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { projectName, clientNeeds, projectBudget, rawTranscript } = body

    if (!projectName || !clientNeeds) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Configure Nodemailer transporter
    // We assume the user has configured standard email environment variables or we use a standard approach.
    // If SMTP credentials aren't present, we'll try to use a standard Gmail approach.
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || process.env.SMTP_USER,
        pass: process.env.EMAIL_PASSWORD || process.env.SMTP_PASSWORD,
      },
    })

    const mailOptions = {
      from: `"${user.email}" <${process.env.EMAIL_USER || process.env.SMTP_USER}>`,
      to: "cognisor.ai@gmail.com",
      subject: `New Quotation Request: ${projectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; margin-bottom: 20px;">New Project Quotation Request</h2>
          
          <div style="margin-bottom: 15px;">
            <strong>Client Email:</strong> ${user.email}
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong>Project Name:</strong> ${projectName}
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong>Project Budget:</strong> ${projectBudget || 'Not specified'}
          </div>
          
          <div style="margin-bottom: 15px;">
            <strong>Client Needs & Requirements:</strong>
            <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin-top: 5px; white-space: pre-wrap;">${clientNeeds}</div>
          </div>
          
          ${rawTranscript ? `
          <div style="margin-bottom: 15px;">
            <strong>Original Voice Transcript:</strong>
            <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; margin-top: 5px; font-style: italic;">"${rawTranscript}"</div>
          </div>
          ` : ''}
          
          <p style="color: #64748b; font-size: 12px; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
            Sent automatically from Netlink-Cogni Dashboard.
          </p>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({ success: true, message: "Quotation sent successfully" })
  } catch (error) {
    console.error("Error sending quotation email:", error)
    return NextResponse.json(
      { error: "Failed to send quotation. Please check your email settings." },
      { status: 500 }
    )
  }
}
