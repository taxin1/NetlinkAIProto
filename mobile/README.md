# Netlink AI — Mobile App

Native **Android** and **iOS** shells for [Network Link AI](https://www.networklinkai.com). This folder is completely separate from the Next.js web app in the repo root. **No web code is modified** when you work here.

The app loads your live Vercel deployment inside a Capacitor WebView. Deploy web changes on Vercel as usual — the mobile app picks them up automatically.

## Structure

```
mobile/
├── android/          # Android Studio project (Play Store)
├── ios/              # Xcode project (App Store — build on macOS)
├── www/              # Offline fallback only (not the real app)
├── capacitor.config.ts
└── package.json
```

## Prerequisites

| Platform | Requirements |
|----------|----------------|
| Android | [Android Studio](https://developer.android.com/studio), JDK 17+ |
| iOS | macOS, [Xcode](https://developer.apple.com/xcode/), CocoaPods |
| Both | Node.js 20+ |

## Quick start

```bash
cd mobile
npm install
npm run sync
```

### Android (Windows / Mac / Linux)

```bash
npm run open:android
```

**If you see `Unable to launch Android Studio`:** Android Studio is not installed yet.

1. Download and install: https://developer.android.com/studio (use default options)
2. Run `npm run open:android` again

**Manual open (works without `cap open`):**

1. Open **Android Studio**
2. **File → Open** → select the `mobile/android` folder (not `mobile/`)
3. Wait for Gradle sync, then click **Run**

**Custom install path (PowerShell):**

```powershell
$env:CAPACITOR_ANDROID_STUDIO_PATH = "C:\Path\To\Android Studio\bin\studio64.exe"
npm run open:android
```

In Android Studio:

1. Wait for Gradle sync
2. Run on a device/emulator to test
3. **Build → Generate Signed Bundle / APK** for Play Store (`.aab`)

### iOS (macOS only)

```bash
cd ios/App
pod install
cd ../..
npm run open:ios
```

In Xcode:

1. Select your signing team
2. Run on simulator or device
3. **Product → Archive** → upload to App Store Connect

## Configuration

Production URL (default): `https://www.networklinkai.com`

To point at a different environment during development:

```bash
# PowerShell
$env:CAPACITOR_SERVER_URL="http://10.0.2.2:3000"; npm run sync   # Android emulator → localhost
$env:CAPACITOR_SERVER_URL="http://localhost:3000"; npm run sync   # iOS simulator

# Bash
CAPACITOR_SERVER_URL=http://localhost:3000 npm run sync
```

Unset `CAPACITOR_SERVER_URL` before store builds so the app uses production.

## Store submission checklist

### Accounts

- [Google Play Developer](https://play.google.com/console) — $25 one-time
- [Apple Developer Program](https://developer.apple.com/programs/) — $99/year

### Before submitting

- [ ] Test login (email + Google OAuth)
- [ ] Test business card camera scan
- [ ] Test voice features (microphone permission)
- [ ] Privacy policy: https://www.networklinkai.com/privacy
- [ ] App icon & screenshots (1024×1024 icon for iOS)
- [ ] Supabase redirect URLs include `https://www.networklinkai.com/**`

### Billing (important)

Paid plans use PayPal on the web. For App Store compliance, avoid in-app PayPal checkout on iOS — let users subscribe at networklinkai.com and sign in in the app. See Apple guideline 3.1.1.

## Supabase / OAuth

In Supabase → Authentication → URL Configuration:

- **Site URL:** `https://www.networklinkai.com`
- **Redirect URLs:** `https://www.networklinkai.com/**`

If Google OAuth fails inside the app WebView, open auth in the system browser (Capacitor Browser plugin is already installed).

## Updating the app shell

After changing `capacitor.config.ts` or adding Capacitor plugins:

```bash
npm run sync
```

Web feature updates require **no mobile release** — they deploy with Vercel.

## Bundle ID

`com.networklinkai.app` — set this in Play Console and App Store Connect when creating the app listing.
