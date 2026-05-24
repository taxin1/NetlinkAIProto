import { cookies } from "next/headers"

const ADMIN_COOKIE = "admin_token"
const ADMIN_TOKEN = "cognisor_admin_secure"

export async function verifyAdminSession(): Promise<boolean> {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE)
  return token?.value === ADMIN_TOKEN
}

export function getAdminSecretKey(): string {
  return process.env.ADMIN_SECRET || "Cognisor@2025"
}
