import type { CapacitorConfig } from "@capacitor/cli"

/**
 * Loads the production Netlink web app inside a native shell.
 * The Next.js app is NOT bundled here — deploy web changes on Vercel only.
 */
const config: CapacitorConfig = {
  appId: "com.networklinkai.app",
  appName: "Netlink AI",
  webDir: "www",
  server: {
    url: process.env.CAPACITOR_SERVER_URL || "https://www.networklinkai.com",
    cleartext: false,
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#1D4ED8",
      showSpinner: false,
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#1D4ED8",
    },
  },
}

export default config
