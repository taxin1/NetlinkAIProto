// @ts-ignore - @paypal/checkout-server-sdk doesn't have TypeScript types
import checkoutNodeJssdk from "@paypal/checkout-server-sdk";

// PayPal Checkout Server SDK client
// Using @paypal/checkout-server-sdk (legacy but functional SDK)

export function getPayPalCheckoutClient() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables in your .env.local file.");
  }

  // Validate client ID format (PayPal client IDs typically start with specific prefixes)
  const isSandboxId = clientId.startsWith("A") || clientId.includes("sandbox");
  const isLiveId = clientId.startsWith("A") && !clientId.includes("sandbox");
  const environment = process.env.PAYPAL_ENVIRONMENT;

  // Warn if environment doesn't match client ID format
  if (environment === "live" && isSandboxId) {
    console.warn("Warning: PAYPAL_ENVIRONMENT is set to 'live' but client ID appears to be a sandbox ID.");
  } else if (environment !== "live" && isLiveId) {
    console.warn("Warning: Using sandbox environment but client ID appears to be a live ID.");
  }

  const paypalEnvironment =
    environment === "live"
      ? new checkoutNodeJssdk.core.LiveEnvironment(
          clientId.trim(),
          clientSecret.trim()
        )
      : new checkoutNodeJssdk.core.SandboxEnvironment(
          clientId.trim(),
          clientSecret.trim()
        );

  return new checkoutNodeJssdk.core.PayPalHttpClient(paypalEnvironment);
}

// Export for backward compatibility with getPayPalClient name
export function getPayPalClient() {
  return getPayPalCheckoutClient();
}

// Legacy export for backward compatibility
export const paypalClient = (() => {
  try {
    return getPayPalCheckoutClient();
  } catch (error) {
    // Return a dummy client that will throw when used if credentials are missing
    // This prevents the module from failing at import time
    return null as any;
  }
})();