/**
 * Netlink AI branded email templates.
 * Table-based, inline-styled HTML for broad client support (Gmail, Outlook, Apple Mail).
 */

export const EMAIL_BRAND = {
  name: "Netlink AI",
  tagline: "Networking Reinvented with AI",
  colors: {
    pageBg: "#030712",
    cardBg: "#0f172a",
    cardBorder: "#1e3a5f",
    headerBg: "#0c4a6e",
    text: "#e2e8f0",
    textMuted: "#94a3b8",
    accent: "#06b6d4",
    accentBlue: "#2563eb",
    accentPurple: "#7c3aed",
    highlightBg: "#0c4a6e33",
    success: "#10b981",
  },
} as const

export function getEmailBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.networklinkai.com"
  ).replace(/\/$/, "")
}

export function getLogoUrl(): string {
  return `${getEmailBaseUrl()}/logo.png`
}

export interface EmailCta {
  label: string
  href: string
}

export interface EmailTemplateOptions {
  /** Shown in browser tab / some clients */
  title?: string
  /** Hidden preview line in inbox */
  preheader?: string
  /** Main body HTML (already sanitized if user-provided) */
  contentHtml: string
  cta?: EmailCta
  footerNote?: string
  showSignature?: boolean
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

/** Escape then convert newlines to <br> for plain-text email bodies. */
export function plainTextToHtml(text: string): string {
  return escapeHtml(text).replace(/\n/g, "<br>")
}

/** Strip tags for text/plain alternative. */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/**
 * Wrap arbitrary HTML content in the Netlink AI branded shell.
 */
export function wrapEmailHtml(options: EmailTemplateOptions): string {
  const {
    title = `${EMAIL_BRAND.name} — ${EMAIL_BRAND.tagline}`,
    preheader = "",
    contentHtml,
    cta,
    footerNote,
    showSignature = true,
  } = options

  const baseUrl = getEmailBaseUrl()
  const logoUrl = getLogoUrl()
  const year = new Date().getFullYear()

  const ctaBlock = cta
    ? `
      <tr>
        <td align="center" style="padding: 8px 32px 32px;">
          <!--[if mso]>
          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(cta.href)}" style="height:48px;v-text-anchor:middle;width:220px;" arcsize="12%" strokecolor="${EMAIL_BRAND.colors.accent}" fillcolor="${EMAIL_BRAND.colors.accentBlue}">
            <w:anchorlock/>
            <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:bold;">${escapeHtml(cta.label)}</center>
          </v:roundrect>
          <![endif]-->
          <!--[if !mso]><!-->
          <a href="${escapeHtml(cta.href)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:linear-gradient(135deg, ${EMAIL_BRAND.colors.accent} 0%, ${EMAIL_BRAND.colors.accentBlue} 100%);color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:10px;box-shadow:0 4px 14px rgba(6,182,212,0.35);">
            ${escapeHtml(cta.label)}
          </a>
          <!--<![endif]-->
        </td>
      </tr>`
    : ""

  const signatureBlock = showSignature
    ? `
      <p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:${EMAIL_BRAND.colors.text};">
        Best regards,<br>
        <strong style="color:#ffffff;">The ${EMAIL_BRAND.name} Team</strong>
      </p>`
    : ""

  const footerExtra = footerNote
    ? `<p style="margin:0 0 12px;font-size:12px;line-height:1.5;color:${EMAIL_BRAND.colors.textMuted};">${footerNote}</p>`
    : ""

  const preheaderBlock = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${EMAIL_BRAND.colors.pageBg};">${escapeHtml(preheader)}</div>`
    : ""

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width: 620px) {
      .email-container { width: 100% !important; }
      .email-padding { padding-left: 20px !important; padding-right: 20px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${EMAIL_BRAND.colors.pageBg};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  ${preheaderBlock}
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:${EMAIL_BRAND.colors.pageBg};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" class="email-container" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg, ${EMAIL_BRAND.colors.accent} 0%, ${EMAIL_BRAND.colors.accentBlue} 55%, ${EMAIL_BRAND.colors.accentPurple} 100%);background-color:${EMAIL_BRAND.colors.headerBg};border-radius:16px 16px 0 0;padding:0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding:28px 32px 24px;">
                    <a href="${escapeHtml(baseUrl)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none;">
                      <img src="${escapeHtml(logoUrl)}" alt="${EMAIL_BRAND.name} logo" width="140" height="auto" style="display:block;border:0;outline:none;max-width:140px;height:auto;" />
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 32px 24px;">
                    <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.9);">
                      ${EMAIL_BRAND.tagline}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Accent line -->
          <tr>
            <td style="height:3px;background:linear-gradient(90deg, ${EMAIL_BRAND.colors.accent}, ${EMAIL_BRAND.colors.accentBlue}, ${EMAIL_BRAND.colors.accentPurple});font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <!-- Body card -->
          <tr>
            <td style="background-color:${EMAIL_BRAND.colors.cardBg};border:1px solid ${EMAIL_BRAND.colors.cardBorder};border-top:none;border-radius:0 0 16px 16px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td class="email-padding" style="padding:36px 32px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.65;color:${EMAIL_BRAND.colors.text};">
                    ${contentHtml}
                    ${signatureBlock}
                  </td>
                </tr>
                ${ctaBlock}
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding:28px 16px 8px;">
              ${footerExtra}
              <p style="margin:0 0 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:12px;line-height:1.5;color:${EMAIL_BRAND.colors.textMuted};">
                <a href="${escapeHtml(baseUrl)}" style="color:${EMAIL_BRAND.colors.accent};text-decoration:none;">${escapeHtml(baseUrl.replace(/^https?:\/\//, ""))}</a>
              </p>
              <p style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:11px;color:${EMAIL_BRAND.colors.textMuted};">
                © ${year} ${EMAIL_BRAND.name}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

/** Wrap a plain-text user message in the branded template (for outbound contact emails). */
export function wrapUserEmailBody(body: string, options?: { subject?: string }): string {
  const contentHtml = `
    <div style="color:${EMAIL_BRAND.colors.text};">
      ${plainTextToHtml(body)}
    </div>
    <p style="margin:20px 0 0;font-size:12px;color:${EMAIL_BRAND.colors.textMuted};border-top:1px solid ${EMAIL_BRAND.colors.cardBorder};padding-top:16px;">
      Sent via ${EMAIL_BRAND.name}
    </p>`

  return wrapEmailHtml({
    title: options?.subject || EMAIL_BRAND.name,
    preheader: body.slice(0, 120).replace(/\s+/g, " "),
    contentHtml,
    showSignature: false,
    footerNote: "You received this message from a Netlink AI user.",
  })
}

export function buildTestEmail(): { html: string; text: string; subject: string } {
  const contentHtml = `
    <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#ffffff;line-height:1.3;">
      Email delivery is working
    </h1>
    <p style="margin:0 0 20px;color:${EMAIL_BRAND.colors.text};">
      This is a test message from your <strong style="color:#ffffff;">${EMAIL_BRAND.name}</strong> account. If you can read this, SMTP and your email integration are configured correctly.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 8px;">
      <tr>
        <td style="background-color:${EMAIL_BRAND.colors.highlightBg};border-left:4px solid ${EMAIL_BRAND.colors.accent};border-radius:0 8px 8px 0;padding:16px 20px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${EMAIL_BRAND.colors.accent};text-transform:uppercase;letter-spacing:0.05em;">Status</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:#ffffff;">Ready to send</p>
        </td>
      </tr>
    </table>
    <p style="margin:16px 0 0;font-size:14px;color:${EMAIL_BRAND.colors.textMuted};">
      <strong style="color:${EMAIL_BRAND.colors.text};">Sent at:</strong> ${escapeHtml(new Date().toLocaleString())}
    </p>`

  const html = wrapEmailHtml({
    title: "Test Email — Netlink AI",
    preheader: "Your Netlink AI email integration is working.",
    contentHtml,
    cta: { label: "Open Dashboard", href: `${getEmailBaseUrl()}/dashboard` },
    showSignature: true,
  })

  const text = [
    "Netlink AI — Email Test",
    "",
    "Your email integration is working correctly.",
    "",
    `Dashboard: ${getEmailBaseUrl()}/dashboard`,
    "",
    `Sent at: ${new Date().toLocaleString()}`,
    "",
    `— The ${EMAIL_BRAND.name} Team`,
  ].join("\n")

  return {
    html,
    text,
    subject: "Test Email — Netlink AI is ready",
  }
}

export function buildWaitlistWelcomeEmail(
  position: number,
  earlyBird: boolean
): { html: string; text: string; subject: string } {
  const earlyBirdHtml = earlyBird
    ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
        <tr>
          <td style="background:linear-gradient(135deg, ${EMAIL_BRAND.colors.accent}22, ${EMAIL_BRAND.colors.accentPurple}22);border:1px solid ${EMAIL_BRAND.colors.accent};border-radius:12px;padding:20px;text-align:center;">
            <p style="margin:0 0 8px;font-size:22px;line-height:1;">🎉</p>
            <p style="margin:0;font-size:17px;font-weight:700;color:#ffffff;">Early bird unlocked</p>
            <p style="margin:10px 0 0;font-size:15px;color:${EMAIL_BRAND.colors.text};">
              You're in the first 100 — <strong style="color:${EMAIL_BRAND.colors.accent};">6 months of Pro, free</strong> when we go live.
            </p>
          </td>
        </tr>
      </table>`
    : ""

  const contentHtml = `
    <h1 style="margin:0 0 12px;font-size:26px;font-weight:700;color:#ffffff;line-height:1.25;">
      You're on the list
    </h1>
    <p style="margin:0 0 24px;color:${EMAIL_BRAND.colors.text};">
      Thanks for joining the ${EMAIL_BRAND.name} waitlist. We're building the future of AI-powered professional networking — and you're along for the ride.
    </p>
    ${earlyBirdHtml}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px;">
      <tr>
        <td align="center" style="background-color:${EMAIL_BRAND.colors.highlightBg};border-radius:12px;padding:24px;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:${EMAIL_BRAND.colors.textMuted};text-transform:uppercase;letter-spacing:0.06em;">Your position</p>
          <p style="margin:0;font-size:42px;font-weight:800;color:${EMAIL_BRAND.colors.accent};line-height:1;">#${position}</p>
        </td>
      </tr>
    </table>
    <h2 style="margin:0 0 14px;font-size:18px;font-weight:700;color:#ffffff;">What's coming</h2>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      ${featureRow("AI business card scanning")}
      ${featureRow("Intelligent contact management")}
      ${featureRow("Personalized email campaigns")}
      ${featureRow("Network analytics & insights")}
      ${featureRow("Voice-activated networking assistant", true)}
    </table>`

  const html = wrapEmailHtml({
    title: "Welcome to the Netlink AI Waitlist",
    preheader: `You're #${position} on the waitlist. We'll notify you at launch.`,
    contentHtml,
    showSignature: true,
  })

  const text = [
    `Welcome to the ${EMAIL_BRAND.name} waitlist!`,
    "",
    `Your position: #${position}`,
    earlyBird ? "Early bird: 6 months Pro free at launch!" : "",
    "",
    "What's coming:",
    "- AI business card scanning",
    "- Intelligent contact management",
    "- Personalized email campaigns",
    "- Network analytics",
    "- Voice networking assistant",
    "",
    `— The ${EMAIL_BRAND.name} Team`,
  ]
    .filter(Boolean)
    .join("\n")

  return {
    html,
    text,
    subject: "You're on the Netlink AI waitlist",
  }
}

function featureRow(label: string, last = false): string {
  const border = last ? "none" : `1px solid ${EMAIL_BRAND.colors.cardBorder}`
  return `
    <tr>
      <td style="padding:12px 0;border-bottom:${border};">
        <span style="color:${EMAIL_BRAND.colors.accent};font-weight:bold;margin-right:8px;">✓</span>
        <span style="color:${EMAIL_BRAND.colors.text};font-size:15px;">${escapeHtml(label)}</span>
      </td>
    </tr>`
}

export function buildLiveNotificationEmail(earlyBird: boolean): {
  html: string
  text: string
  subject: string
} {
  const earlyBirdHtml = earlyBird
    ? `<p style="margin:0 0 20px;padding:16px;background-color:${EMAIL_BRAND.colors.highlightBg};border-left:4px solid ${EMAIL_BRAND.colors.success};border-radius:0 8px 8px 0;color:${EMAIL_BRAND.colors.text};">
        Your <strong style="color:#ffffff;">6 months of free Pro</strong> is ready — sign up with this email to activate it.
      </p>`
    : ""

  const contentHtml = `
    <h1 style="margin:0 0 16px;font-size:28px;font-weight:700;color:#ffffff;line-height:1.2;">
      We're live
    </h1>
    <p style="margin:0 0 20px;color:${EMAIL_BRAND.colors.text};">
      The wait is over. <strong style="color:#ffffff;">${EMAIL_BRAND.name}</strong> is officially open — scan cards, automate outreach, and grow your network with AI.
    </p>
    ${earlyBirdHtml}
    <h2 style="margin:0 0 12px;font-size:17px;font-weight:700;color:#ffffff;">Start with</h2>
    <ul style="margin:0 0 8px;padding-left:20px;color:${EMAIL_BRAND.colors.text};">
      <li style="margin-bottom:8px;">AI business card scanner</li>
      <li style="margin-bottom:8px;">Smart contact CRM</li>
      <li style="margin-bottom:8px;">Automated email campaigns</li>
      <li style="margin-bottom:8px;">Network analytics</li>
      <li>Voice networking assistant</li>
    </ul>`

  const signupUrl = `${getEmailBaseUrl()}/auth/signup`

  const html = wrapEmailHtml({
    title: "Netlink AI is Live",
    preheader: "Netlink AI is now open. Create your account and start networking with AI.",
    contentHtml,
    cta: { label: "Get Started Free", href: signupUrl },
    showSignature: true,
  })

  const text = [
    `${EMAIL_BRAND.name} is now live!`,
    "",
    earlyBird ? "Your 6 months of free Pro is ready — sign up with this email." : "",
    "",
    `Get started: ${signupUrl}`,
    "",
    `— The ${EMAIL_BRAND.name} Team`,
  ]
    .filter(Boolean)
    .join("\n")

  return {
    html,
    text,
    subject: "Netlink AI is live — start networking with AI",
  }
}

export function buildQuotationRequestEmail(data: {
  clientEmail: string
  projectName: string
  projectBudget?: string
  clientNeeds: string
  rawTranscript?: string
}): { html: string; text: string } {
  const contentHtml = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#ffffff;">
      New quotation request
    </h1>
    <p style="margin:0 0 24px;color:${EMAIL_BRAND.colors.textMuted};font-size:14px;">
      Submitted from the Netlink AI dashboard
    </p>
    ${detailRow("Client", data.clientEmail)}
    ${detailRow("Project", data.projectName)}
    ${detailRow("Budget", data.projectBudget || "Not specified")}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:16px 0;">
    <tr>
      <td style="padding:16px;background-color:${EMAIL_BRAND.colors.highlightBg};border-radius:8px;border:1px solid ${EMAIL_BRAND.colors.cardBorder};">
        <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:${EMAIL_BRAND.colors.accent};text-transform:uppercase;">Requirements</p>
        <p style="margin:0;font-size:15px;color:${EMAIL_BRAND.colors.text};white-space:pre-wrap;">${escapeHtml(data.clientNeeds)}</p>
      </td>
    </tr>
  </table>
  ${
    data.rawTranscript
      ? `
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 8px;">
    <tr>
      <td style="padding:16px;background-color:${EMAIL_BRAND.colors.cardBg};border-radius:8px;border:1px dashed ${EMAIL_BRAND.colors.cardBorder};">
        <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:${EMAIL_BRAND.colors.textMuted};text-transform:uppercase;">Voice transcript</p>
        <p style="margin:0;font-size:14px;font-style:italic;color:${EMAIL_BRAND.colors.textMuted};">"${escapeHtml(data.rawTranscript)}"</p>
      </td>
    </tr>
  </table>`
      : ""
  }`

  const html = wrapEmailHtml({
    title: `Quotation: ${data.projectName}`,
    preheader: `New project request from ${data.clientEmail}`,
    contentHtml,
    showSignature: false,
    footerNote: "Internal notification — Netlink AI quotation system",
  })

  const text = [
    "New Quotation Request",
    "",
    `Client: ${data.clientEmail}`,
    `Project: ${data.projectName}`,
    `Budget: ${data.projectBudget || "Not specified"}`,
    "",
    "Requirements:",
    data.clientNeeds,
    data.rawTranscript ? `\nTranscript: "${data.rawTranscript}"` : "",
  ].join("\n")

  return { html, text }
}

function detailRow(label: string, value: string): string {
  return `
    <p style="margin:0 0 12px;font-size:15px;color:${EMAIL_BRAND.colors.text};">
      <strong style="color:#ffffff;display:inline-block;min-width:80px;">${escapeHtml(label)}:</strong>
      ${escapeHtml(value)}
    </p>`
}
