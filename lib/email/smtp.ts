import nodemailer from "nodemailer"
import type { Transporter } from "nodemailer"
import type SMTPTransport from "nodemailer/lib/smtp-transport"

export interface SmtpConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
}

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  replyTo?: string
  from?: string
}

export interface UserEmailSettings {
  email_address: string
  email_password: string
  email_provider?: string
  smtp_host?: string | null
  smtp_port?: number | null
  smtp_secure?: boolean | null
  from_name?: string | null
}

/** Normalize host when SMTP_HOST was set to an email address by mistake. */
export function resolveSmtpHost(host?: string | null): string {
  const raw = (host || process.env.SMTP_HOST || "smtp.gmail.com").trim()
  if (raw.includes("@") || !raw.includes(".")) {
    return "smtp.gmail.com"
  }
  return raw
}

export function isSmtpConfigured(): boolean {
  return Boolean(getSmtpConfig())
}

/** Server-wide SMTP credentials from environment (with legacy fallbacks). */
export function getSmtpConfig(): SmtpConfig | null {
  const user =
    process.env.SMTP_USER ||
    process.env.GMAIL_USER ||
    process.env.EMAIL_USER

  const pass =
    process.env.SMTP_PASS ||
    process.env.SMTP_PASSWORD ||
    process.env.GMAIL_APP_PASSWORD ||
    process.env.EMAIL_PASSWORD

  if (!user || !pass) {
    return null
  }

  const port = parseInt(process.env.SMTP_PORT || "587", 10)
  const secure =
    process.env.SMTP_SECURE === "true" || port === 465

  const from =
    process.env.SMTP_FROM?.trim() ||
    `"Netlink AI" <${user}>`

  return {
    host: resolveSmtpHost(),
    port,
    secure,
    user,
    pass: pass.replace(/\s/g, ""),
    from,
  }
}

export function getSmtpConfigFromUserSettings(
  settings: UserEmailSettings,
  fallbackDisplayName?: string
): SmtpConfig | null {
  if (!settings.email_address || !settings.email_password) {
    return null
  }

  const provider = settings.email_provider || "gmail"
  let host = resolveSmtpHost(settings.smtp_host)
  let port = settings.smtp_port || 587
  let secure = settings.smtp_secure ?? false

  if (provider === "gmail") {
    host = "smtp.gmail.com"
    port = settings.smtp_port || 587
    secure = port === 465
  } else if (provider === "outlook") {
    host = settings.smtp_host || "smtp-mail.outlook.com"
    port = settings.smtp_port || 587
    secure = settings.smtp_secure ?? false
  }

  const displayName =
    settings.from_name || fallbackDisplayName || settings.email_address

  return {
    host,
    port,
    secure: secure || port === 465,
    user: settings.email_address,
    pass: settings.email_password.replace(/\s/g, ""),
    from: `"${displayName}" <${settings.email_address}>`,
  }
}

export function createSmtpTransporter(
  config: SmtpConfig
): Transporter<SMTPTransport.SentMessageInfo> {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  })
}

export function getSystemTransporter():
  | Transporter<SMTPTransport.SentMessageInfo>
  | null {
  const config = getSmtpConfig()
  if (!config) return null
  return createSmtpTransporter(config)
}

/** Send using server SMTP env vars. Returns false if SMTP is not configured. */
export async function sendSystemEmail(
  options: SendEmailOptions
): Promise<{ success: true; messageId: string } | { success: false; error: string }> {
  const config = getSmtpConfig()
  if (!config) {
    return {
      success: false,
      error:
        "SMTP not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in environment.",
    }
  }

  try {
    const transporter = createSmtpTransporter(config)
    const info = await transporter.sendMail({
      from: options.from || config.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
    })
    return { success: true, messageId: info.messageId }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send email"
    console.error("[SMTP] sendSystemEmail error:", message)
    return { success: false, error: message }
  }
}

/** Send using per-user SMTP settings or server fallback. */
export async function sendEmailWithSettings(
  settings: UserEmailSettings | null,
  options: SendEmailOptions & { fallbackFromName?: string }
): Promise<{ success: true; messageId: string } | { success: false; error: string; needsConfiguration?: boolean }> {
  const userConfig = settings
    ? getSmtpConfigFromUserSettings(settings, options.fallbackFromName)
    : null
  const config = userConfig ?? getSmtpConfig()

  if (!config) {
    return {
      success: false,
      error:
        "Email not configured. Set SMTP credentials in environment or configure email in Settings.",
      needsConfiguration: true,
    }
  }

  try {
    const transporter = createSmtpTransporter(config)
    const info = await transporter.sendMail({
      from: options.from || config.from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo || config.user,
    })
    return { success: true, messageId: info.messageId }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send email"
    console.error("[SMTP] sendEmailWithSettings error:", message)
    return { success: false, error: message }
  }
}
