import { cookies } from "next/headers"
import crypto from "crypto"

export const ADMIN_COOKIE = "admin_token"

export function getAdminSecretKey(): string {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || ""
}

export function getAdminCredentials() {
  const username = process.env.ADMIN_USERNAME || "admin"
  const password = process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET || ""
  return { username, password }
}

export function generateAdminSessionToken(): string {
  const secret = getAdminSecretKey() || "default-local-dev-fallback"
  return crypto.createHmac("sha256", secret).update("netlink-admin-authenticated-session").digest("hex")
}

export async function verifyAdminSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE)
  if (!token?.value) return false

  const expectedToken = generateAdminSessionToken()
  try {
    return crypto.timingSafeEqual(
      Buffer.from(token.value, "hex"),
      Buffer.from(expectedToken, "hex")
    )
  } catch {
    return token.value === expectedToken
  }
}
