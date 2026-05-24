import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

interface FirebaseLookupUser {
  localId: string
  email?: string
  displayName?: string
}

async function verifyFirebaseIdToken(
  idToken: string
): Promise<{ email: string; uid: string; name?: string } | null> {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  if (!apiKey) return null

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  )

  if (!res.ok) return null

  const data = (await res.json()) as { users?: FirebaseLookupUser[] }
  const user = data.users?.[0]
  if (!user?.email) return null

  return {
    email: user.email,
    uid: user.localId,
    name: user.displayName,
  }
}

async function ensureSupabaseUser(
  email: string,
  firebaseUid: string,
  displayName?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient()

  const { error: createError } = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      firebase_uid: firebaseUid,
      full_name: displayName,
      provider: "firebase",
    },
  })

  if (!createError) return { ok: true }

  const alreadyExists =
    createError.message?.toLowerCase().includes("already") ||
    createError.message?.toLowerCase().includes("registered")

  if (alreadyExists) return { ok: true }

  return { ok: false, error: createError.message }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const idToken = body?.idToken as string | undefined
    const redirectTo =
      typeof body?.redirectTo === "string" && body.redirectTo.startsWith("/")
        ? body.redirectTo
        : "/dashboard"

    if (!idToken) {
      return NextResponse.json({ success: false, error: "Missing Firebase ID token." }, { status: 400 })
    }

    const firebaseUser = await verifyFirebaseIdToken(idToken)
    if (!firebaseUser) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired Firebase session." },
        { status: 401 }
      )
    }

    const ensured = await ensureSupabaseUser(
      firebaseUser.email,
      firebaseUser.uid,
      firebaseUser.name
    )
    if (!ensured.ok) {
      return NextResponse.json({ success: false, error: ensured.error }, { status: 500 })
    }

    const admin = createAdminClient()
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: firebaseUser.email,
    })

    if (linkError || !linkData?.properties?.email_otp) {
      return NextResponse.json(
        {
          success: false,
          error: linkError?.message || "Could not create Supabase session.",
        },
        { status: 500 }
      )
    }

    const cookieStore = await cookies()
    const origin = new URL(request.url).origin
    const isProduction = origin.startsWith("https://")
    const completePath = `/auth/complete?next=${encodeURIComponent(redirectTo)}`
    const response = NextResponse.json({
      success: true,
      redirectTo: completePath,
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
              const cookieOptions: Record<string, unknown> = {
                ...options,
                path: options?.path ?? "/",
                secure: options?.secure ?? isProduction,
                sameSite: (options?.sameSite as "lax" | "strict" | "none") ?? "lax",
                httpOnly: options?.httpOnly ?? (name.startsWith("sb-") ? true : undefined),
              }
              if (options?.domain) cookieOptions.domain = options.domain
              if ("name" in cookieOptions) delete cookieOptions.name
              response.cookies.set(
                name,
                value,
                cookieOptions as Parameters<typeof response.cookies.set>[2]
              )
            })
          },
        },
      }
    )

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: firebaseUser.email,
      token: linkData.properties.email_otp,
      type: "email",
    })

    if (verifyError) {
      return NextResponse.json(
        { success: false, error: verifyError.message || "Session verification failed." },
        { status: 500 }
      )
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Supabase session was not created." },
        { status: 500 }
      )
    }

    return response
  } catch (error) {
    console.error("[Firebase Bridge] Error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected server error.",
      },
      { status: 500 }
    )
  }
}
