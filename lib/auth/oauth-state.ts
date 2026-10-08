import crypto from "crypto"

export interface OAuthStateData {
  userId: string
  returnUrl?: string
  provider?: string
  timestamp: number
}

function getSecret(): string {
  return (
    process.env.ADMIN_SECRET ||
    process.env.ADMIN_PASSWORD ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "netlink_oauth_state_hmac_secret"
  )
}

/**
 * Creates an HMAC-signed OAuth state string to prevent state tampering and OAuth hijacking.
 */
export function createSignedOAuthState(data: Omit<OAuthStateData, "timestamp">): string {
  const fullData: OAuthStateData = {
    ...data,
    timestamp: Date.now(),
  }
  const payload = Buffer.from(JSON.stringify(fullData)).toString("base64url")
  const hmac = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url")
  return `${payload}.${hmac}`
}

/**
 * Verifies an HMAC-signed OAuth state string.
 * Returns decoded data if valid and not expired (15 minute TTL), otherwise null.
 */
export function verifySignedOAuthState(stateRaw?: string | null): OAuthStateData | null {
  if (!stateRaw || !stateRaw.includes(".")) return null
  const parts = stateRaw.split(".")
  if (parts.length !== 2) return null
  const [payload, hmac] = parts

  try {
    const expectedHmac = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url")
    const hmacBuf = Buffer.from(hmac)
    const expectedBuf = Buffer.from(expectedHmac)
    if (hmacBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(hmacBuf, expectedBuf)) {
      return null
    }

    const data: OAuthStateData = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"))
    // State valid for 15 minutes
    if (Date.now() - data.timestamp > 15 * 60 * 1000) {
      return null
    }
    return data
  } catch {
    return null
  }
}

