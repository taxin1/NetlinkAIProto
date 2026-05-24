/**
 * Full Google sign-in check (Firebase popup + Supabase bridge).
 * Optional: set GOOGLE_TEST_EMAIL and GOOGLE_TEST_PASSWORD in .env.local for automated login.
 */
import fs from "fs"
import { chromium } from "playwright"

function loadEnv() {
  const env = {}
  if (fs.existsSync(".env.local")) {
    for (const line of fs.readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "")
    }
  }
  return env
}

const env = loadEnv()
const baseUrl = process.env.TEST_BASE_URL || "http://localhost:3000"
const googleEmail = process.env.GOOGLE_TEST_EMAIL || env.GOOGLE_TEST_EMAIL
const googlePassword = process.env.GOOGLE_TEST_PASSWORD || env.GOOGLE_TEST_PASSWORD

const results = []

function record(name, ok, detail) {
  results.push({ name, ok, detail })
  console.log(`[${ok ? "PASS" : "FAIL"}] ${name}`)
  if (detail) console.log("  ", typeof detail === "string" ? detail : JSON.stringify(detail, null, 2))
}

async function main() {
  console.log("Google auth E2E check")
  console.log("Base URL:", baseUrl)
  console.log("Automated Google login:", Boolean(googleEmail && googlePassword))

  const browser = await chromium.launch({ headless: !process.env.HEADED })
  const context = await browser.newContext()
  await context.clearCookies()
  const page = await context.newPage()

  try {
    // 1. Login page loads and has Google button
    await page.goto(`${baseUrl}/auth/login`, { waitUntil: "domcontentloaded", timeout: 30000 })
    // Wait past "Checking authentication..." spinner
    await page.waitForFunction(
      () => !document.body.innerText.includes("Checking authentication"),
      { timeout: 20000 }
    ).catch(() => {})

    const currentPath = new URL(page.url()).pathname
    if (currentPath !== "/auth/login") {
      record("Login page reachable when signed out", false, {
        redirectedTo: page.url(),
        hint: "Clear site cookies or sign out first",
      })
    }

    const googleBtn = page.getByRole("button", { name: /continue with google/i })
    await googleBtn.waitFor({ state: "visible", timeout: 20000 })
    record("Login page shows Google button", true)

    // 2. Click Google — expect popup or redirect
    const popupPromise = page.waitForEvent("popup", { timeout: 15000 }).catch(() => null)
    await googleBtn.click()
    const popup = await popupPromise

    if (!popup) {
      record("Google OAuth popup opens", false, "No popup within 15s (blocked or redirect flow)")
      await browser.close()
      process.exit(1)
    }

    record("Google OAuth popup opens", true)

    const authPage = popup
    await authPage.waitForLoadState("domcontentloaded", { timeout: 20000 })
    const popupUrl = authPage.url()
    const isGoogle =
      popupUrl.includes("accounts.google.com") ||
      popupUrl.includes("firebaseapp.com") ||
      popupUrl.includes("google.com")

    record("Popup targets Google/Firebase OAuth", isGoogle, { url: popupUrl.slice(0, 120) })

    // Check popup for immediate Firebase errors (e.g. unauthorized domain)
    await authPage.waitForTimeout(3000)
    const popupBody = await authPage.locator("body").innerText().catch(() => "")
    const unauthorized =
      popupBody.includes("unauthorized-domain") ||
      popupBody.toLowerCase().includes("not authorized")
    record("No unauthorized-domain error in popup", !unauthorized, unauthorized ? popupBody.slice(0, 200) : "OK")

    if (!googleEmail || !googlePassword) {
      record(
        "Complete Google sign-in (automated)",
        false,
        "Set GOOGLE_TEST_EMAIL and GOOGLE_TEST_PASSWORD in .env.local to finish E2E"
      )
      await authPage.close()

      // Signup page: consent + Google opens same OAuth handler
      await page.goto(`${baseUrl}/auth/signup`, { waitUntil: "domcontentloaded" })
      await page.waitForFunction(
        () => !document.body.innerText.includes("Checking authentication"),
        { timeout: 15000 }
      ).catch(() => {})
      await page.locator("#consent").check()
      const signupPopupPromise = page.waitForEvent("popup", { timeout: 15000 })
      await page.getByRole("button", { name: /continue with google/i }).click()
      const signupPopup = await signupPopupPromise
      const signupPopupOk =
        signupPopup.url().includes("firebaseapp.com") ||
        signupPopup.url().includes("accounts.google.com")
      record("Signup page Google popup", signupPopupOk, { url: signupPopup.url().slice(0, 100) })
      await signupPopup.close()

      await browser.close()
      const infraOk = results.filter((r) => r.name !== "Complete Google sign-in (automated)").every((r) => r.ok)
      printSummary(infraOk)
      process.exit(infraOk ? 0 : 1)
    }

    // 3. Automated Google account picker / login
    await authPage.waitForTimeout(1500)
    const emailInput = authPage.locator('input[type="email"]')
    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailInput.fill(googleEmail)
      await authPage.getByRole("button", { name: /next/i }).click()
    }

    const passwordInput = authPage.locator('input[type="password"]')
    await passwordInput.waitFor({ state: "visible", timeout: 15000 })
    await passwordInput.fill(googlePassword)
    await authPage.getByRole("button", { name: /next/i }).click()

    // Consent / continue if shown
    const continueBtn = authPage.getByRole("button", { name: /continue|allow/i })
    if (await continueBtn.first().isVisible({ timeout: 8000 }).catch(() => false)) {
      await continueBtn.first().click()
    }

    // 4. Wait for app redirect after bridge
    await page.waitForURL(
      (url) =>
        url.pathname.includes("/dashboard") ||
        url.pathname.includes("/onboarding") ||
        url.pathname.includes("/auth/complete"),
      { timeout: 60000 }
    )

    const finalUrl = page.url()
    record("Redirected after Google sign-in", true, { finalUrl })

    await page.waitForTimeout(2000)
    const bodyText = await page.locator("body").innerText()
    const stillOnLogin =
      finalUrl.includes("/auth/login") || bodyText.toLowerCase().includes("welcome back")
    record("Session established (left login page)", !stillOnLogin, { finalUrl })

    // 5. Signup page Google button
    await page.goto(`${baseUrl}/auth/signup`, { waitUntil: "networkidle" })
    const consent = page.locator("#consent")
    await consent.check()
    const signupGoogle = page.getByRole("button", { name: /continue with google/i })
    await signupGoogle.waitFor({ state: "visible" })
    record("Signup page shows Google button (with consent)", true)

    printSummary(results.every((r) => r.ok))
    await browser.close()
    process.exit(results.every((r) => r.ok) ? 0 : 1)
  } catch (err) {
    record("Google auth E2E", false, err instanceof Error ? err.message : String(err))
    await browser.close()
    printSummary(false)
    process.exit(1)
  }
}

function printSummary(allOk) {
  console.log("\n--- Summary ---")
  for (const r of results) {
    console.log(`  ${r.ok ? "✓" : "✗"} ${r.name}`)
  }
  console.log(allOk ? "\nGoogle auth check passed." : "\nGoogle auth check incomplete or failed.")
}

main()
