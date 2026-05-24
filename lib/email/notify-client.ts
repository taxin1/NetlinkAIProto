import type { AuthNotificationType } from "@/lib/email/auth-templates"

/** Fire-and-forget auth notification (never blocks UI). */
export function notifyAuthEvent(
  type: AuthNotificationType,
  extra?: { provider?: string; email?: string }
): void {
  fetch("/api/auth/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, ...extra }),
  }).catch((err) => {
    console.warn("[Auth notify] Failed to send notification:", err)
  })
}
