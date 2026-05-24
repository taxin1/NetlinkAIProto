import { EMAIL_BRAND, getEmailBaseUrl, wrapEmailHtml } from "@/lib/email/template"

export type AuthNotificationType =
  | "login"
  | "signup"
  | "password_reset_requested"
  | "password_reset_success"
  | "oauth_login"

export interface AuthEmailMeta {
  email: string
  provider?: string
  appUrl?: string
}

function authBody(content: string, appUrl: string): string {
  return `${content}
    <p style="margin:24px 0 0;font-size:12px;color:${EMAIL_BRAND.colors.textMuted};border-top:1px solid ${EMAIL_BRAND.colors.cardBorder};padding-top:16px;">
      If you did not perform this action, secure your account at
      <a href="${appUrl}/auth/forgot-password" style="color:${EMAIL_BRAND.colors.accent};text-decoration:none;">reset your password</a>.
    </p>`
}

export function getAuthEmailContent(
  type: AuthNotificationType,
  meta: AuthEmailMeta
): { subject: string; html: string; text: string } {
  const appUrl =
    meta.appUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    getEmailBaseUrl()

  const time = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })

  const wrap = (
    title: string,
    preheader: string,
    body: string,
    cta?: { label: string; href: string }
  ) =>
    wrapEmailHtml({
      title,
      preheader,
      contentHtml: authBody(body, appUrl),
      cta,
      showSignature: true,
      footerNote: "Security notification for your Netlink AI account.",
    })

  switch (type) {
    case "login":
      return {
        subject: "New sign-in to your Netlink AI account",
        html: wrap(
          "Sign-in alert",
          `New sign-in to ${meta.email}`,
          `<h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#ffffff;">New sign-in</h1>
          <p style="margin:0 0 16px;color:${EMAIL_BRAND.colors.text};">
            Your ${EMAIL_BRAND.name} account (<strong style="color:#fff;">${meta.email}</strong>) was signed in with email and password.
          </p>
          <p style="margin:0;color:${EMAIL_BRAND.colors.textMuted};"><strong style="color:${EMAIL_BRAND.colors.text};">Time:</strong> ${time}</p>
          <p style="margin:16px 0 0;color:${EMAIL_BRAND.colors.text};">If this was you, no action is needed.</p>`
        ),
        text: `New sign-in to Netlink AI\n\nAccount: ${meta.email}\nTime: ${time}\n\nIf this wasn't you, reset your password at ${appUrl}/auth/forgot-password`,
      }

    case "oauth_login":
      return {
        subject: `New ${meta.provider || "OAuth"} sign-in to Netlink AI`,
        html: wrap(
          "OAuth sign-in",
          `Signed in via ${meta.provider || "Google"}`,
          `<h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#ffffff;">OAuth sign-in</h1>
          <p style="margin:0 0 16px;color:${EMAIL_BRAND.colors.text};">
            Your account (<strong style="color:#fff;">${meta.email}</strong>) was signed in via <strong style="color:#fff;">${meta.provider || "Google"}</strong>.
          </p>
          <p style="margin:0;color:${EMAIL_BRAND.colors.textMuted};"><strong style="color:${EMAIL_BRAND.colors.text};">Time:</strong> ${time}</p>`
        ),
        text: `OAuth sign-in to Netlink AI via ${meta.provider || "Google"}\n\nAccount: ${meta.email}\nTime: ${time}`,
      }

    case "signup":
      return {
        subject: "Welcome to Netlink AI — account created",
        html: wrap(
          "Welcome to Netlink AI",
          "Your Netlink AI account is ready",
          `<h1 style="margin:0 0 12px;font-size:24px;font-weight:700;color:#ffffff;">Welcome aboard</h1>
          <p style="margin:0 0 16px;color:${EMAIL_BRAND.colors.text};">
            Your account (<strong style="color:#fff;">${meta.email}</strong>) has been created. Start scanning cards, managing contacts, and growing your network with AI.
          </p>
          <p style="margin:0;font-size:14px;color:${EMAIL_BRAND.colors.textMuted};">
            If email verification is enabled, check your inbox for a confirmation link from our auth provider.
          </p>`,
          { label: "Go to Dashboard", href: `${appUrl}/dashboard` }
        ),
        text: `Welcome to Netlink AI!\n\nYour account ${meta.email} has been created.\nVisit ${appUrl}/dashboard to get started.`,
      }

    case "password_reset_requested":
      return {
        subject: "Password reset requested — Netlink AI",
        html: wrap(
          "Password reset",
          "Password reset requested for your account",
          `<h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#ffffff;">Password reset requested</h1>
          <p style="margin:0 0 16px;color:${EMAIL_BRAND.colors.text};">
            A password reset was requested for <strong style="color:#fff;">${meta.email}</strong>.
          </p>
          <p style="margin:0 0 12px;color:${EMAIL_BRAND.colors.text};">
            If you requested this, check your inbox for the reset link from our auth provider. The link expires after a short time.
          </p>
          <p style="margin:0;color:${EMAIL_BRAND.colors.textMuted};">
            If you did not request a reset, ignore this message — your password will not change.
          </p>`
        ),
        text: `Password reset requested for ${meta.email}.\n\nIf you didn't request this, ignore this email.`,
      }

    case "password_reset_success":
      return {
        subject: "Your Netlink AI password was changed",
        html: wrap(
          "Password changed",
          "Your Netlink AI password was updated",
          `<h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#ffffff;">Password updated</h1>
          <p style="margin:0 0 16px;color:${EMAIL_BRAND.colors.text};">
            The password for <strong style="color:#fff;">${meta.email}</strong> was successfully changed.
          </p>
          <p style="margin:0;color:${EMAIL_BRAND.colors.textMuted};"><strong style="color:${EMAIL_BRAND.colors.text};">Time:</strong> ${time}</p>`
        ),
        text: `Your Netlink AI password was changed at ${time}.\n\nAccount: ${meta.email}`,
      }

    default:
      return {
        subject: "Netlink AI account notification",
        html: wrap(
          "Account notification",
          "Account activity on Netlink AI",
          `<p style="margin:0;color:${EMAIL_BRAND.colors.text};">Account activity for <strong style="color:#fff;">${meta.email}</strong>.</p>`
        ),
        text: `Account notification for ${meta.email}.`,
      }
  }
}
