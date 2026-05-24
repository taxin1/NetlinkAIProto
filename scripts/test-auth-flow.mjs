import fs from "fs"

function loadEnv() {
  const env = {}
  if (fs.existsSync("../.env.local")) {
    for (const line of fs.readFileSync("../.env.local", "utf8").split(/\r?\n/)) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "")
    }
  }
  return env
}

const env = loadEnv()
const apiKey = env.NEXT_PUBLIC_FIREBASE_API_KEY
const baseUrl = process.env.TEST_BASE_URL || "http://localhost:3000"
const testEmail = `auth-test-${Date.now()}@netlink-test.local`
const testPassword = "TestAuth123!"

async function firebaseSignUp(email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  )
  return { ok: res.ok, status: res.status, data: await res.json() }
}

async function firebaseSignIn(email, password) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  )
  return { ok: res.ok, status: res.status, data: await res.json() }
}

async function bridge(idToken, redirectTo = "/dashboard") {
  const res = await fetch(`${baseUrl}/api/auth/firebase-bridge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ idToken, redirectTo }),
  })
  return { ok: res.ok, status: res.status, data: await res.json() }
}

function log(step, ok, detail) {
  console.log(`[${ok ? "PASS" : "FAIL"}] ${step}`, detail ? `- ${JSON.stringify(detail)}` : "")
}

async function main() {
  const signUp = await firebaseSignUp(testEmail, testPassword)
  log("Email sign up", signUp.ok, signUp.data?.error?.message)

  const bridgeUp = await bridge(signUp.data?.idToken, "/onboarding")
  log("Bridge after sign up", bridgeUp.ok && bridgeUp.data?.success, bridgeUp.data)

  const signIn = await firebaseSignIn(testEmail, testPassword)
  log("Email sign in", signIn.ok, signIn.data?.error?.message)

  const bridgeIn = await bridge(signIn.data?.idToken, "/dashboard")
  log("Bridge after sign in", bridgeIn.ok && bridgeIn.data?.success, bridgeIn.data)

  const pass = signUp.ok && bridgeUp.ok && signIn.ok && bridgeIn.ok
  process.exit(pass ? 0 : 1)
}

main()
