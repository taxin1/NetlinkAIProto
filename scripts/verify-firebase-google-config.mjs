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
const projectId = env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

async function main() {
  if (!apiKey) {
    console.error("Missing NEXT_PUBLIC_FIREBASE_API_KEY")
    process.exit(1)
  }

  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/projects?key=${apiKey}`
  )
  const projects = await res.json().catch(() => ({}))

  const configRes = await fetch(
    `https://identitytoolkit.googleapis.com/v2/projects/${projectId}/config?key=${apiKey}`
  )
  const config = await configRes.json().catch(() => ({}))

  console.log("Project ID:", projectId)
  console.log("Config API status:", configRes.status)

  const signIn = config?.signIn ?? config
  const providers = signIn?.allowPasswordUser || signIn?.emailPasswordEnabled
  console.log("Email/password enabled (config):", signIn?.email?.enabled ?? signIn?.allowPasswordUser ?? "see providers")

  const authorizedDomains =
    config?.authorizedDomains ??
    signIn?.authorizedDomains ??
    []
  console.log("Authorized domains:", authorizedDomains.length ? authorizedDomains : "(none in response)")

  const hasLocalhost = authorizedDomains.some(
    (d) => d === "localhost" || d.endsWith(".localhost")
  )
  console.log("localhost authorized:", hasLocalhost ? "YES" : "UNKNOWN/MISSING")

  const googleProvider =
    signIn?.providers?.find?.((p) => p.providerId === "google.com") ??
    signIn?.idpConfig?.find?.((p) => p.provider === "GOOGLE")
  console.log("Google provider in config:", googleProvider ? "present" : "not listed (may still be enabled)")

  if (!hasLocalhost && authorizedDomains.length) {
    console.warn("\nWARN: Add 'localhost' in Firebase Console → Auth → Settings → Authorized domains")
  }

  if (projects?.error) {
    console.log("Projects lookup:", projects.error.message)
  }
}

main()
