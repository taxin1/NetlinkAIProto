import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminCredentials, generateAdminSessionToken, ADMIN_COOKIE } from '@/lib/admin/auth'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username, password } = body

    const expected = getAdminCredentials()

    // Ensure an admin password has been configured or allow development login
    if (!expected.password) {
      return NextResponse.json(
        { error: 'Admin credentials not configured. Please set ADMIN_PASSWORD or ADMIN_SECRET in server environment.' },
        { status: 500 }
      )
    }

    if (
      username?.trim().toLowerCase() === expected.username.toLowerCase() &&
      password === expected.password
    ) {
      const sessionToken = generateAdminSessionToken()
      const cookieStore = await cookies()
      cookieStore.set(ADMIN_COOKIE, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 1 day
        path: '/',
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
