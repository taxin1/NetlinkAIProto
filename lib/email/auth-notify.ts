import { getAuthEmailContent, type AuthNotificationType } from "@/lib/email/auth-templates"
import { sendSystemEmail } from "@/lib/email/smtp"

export async function sendAuthNotificationEmail(
  type: AuthNotificationType,
  email: string,
  extra?: { provider?: string }
): Promise<void> {
  const { subject, html, text } = getAuthEmailContent(type, {
    email,
    provider: extra?.provider,
  })

  const result = await sendSystemEmail({
    to: email,
    subject,
    html,
    text,
  })

  if (!result.success) {
    console.warn(`[Auth email] Skipped ${type} for ${email}:`, result.error)
  }
}
