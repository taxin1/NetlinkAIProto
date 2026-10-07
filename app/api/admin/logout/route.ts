import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { ADMIN_COOKIE } from '@/lib/admin/auth'

export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete(ADMIN_COOKIE)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
