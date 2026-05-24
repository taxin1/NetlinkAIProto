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
    hostname: "www.networklinkai.com",
    allowNavigation: ["www.networklinkai.com", "*.networklinkai.com"],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      launchAutoHide: true,
      backgroundColor: "#FFFFFF",
      showSpinner: false,
      androidSplashResourceName: "icon",
      androidScaleType: "FIT_CENTER",
      splashFadeInDuration: 300,
      splashFullScreen: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#FFFFFF",
    },
  },
}

export default config
