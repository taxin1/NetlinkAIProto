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

export const paypalClient = (() => {
  try {
    return getPayPalCheckoutClient();
  } catch (error) {
    // Return a dummy client that will throw when used if credentials are missing
    // This prevents the module from failing at import time
    return null as any;
  }
})();

/**
 * Verifies a subscription ID directly with the PayPal REST API.
 * Ensures the subscription exists, is active/approved, and retrieves server-verified details.
 */
export async function verifyPayPalSubscription(subscriptionId: string): Promise<{
  valid: boolean;
  status?: string;
  planId?: string;
  customId?: string;
  error?: string;
}> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("PayPal credentials not configured");
  }

  const isLive = process.env.PAYPAL_ENVIRONMENT === "live";
  const baseUrl = isLive ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

  try {
    // 1. Get access token
    const auth = Buffer.from(`${clientId.trim()}:${clientSecret.trim()}`).toString("base64");
    const tokenRes = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      return { valid: false, error: `Failed to authenticate with PayPal: ${errText}` };
    }

    const { access_token } = await tokenRes.json();

    // 2. Fetch subscription details from PayPal
    const subRes = await fetch(`${baseUrl}/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!subRes.ok) {
      return { valid: false, error: `Subscription not found: ${subRes.status}` };
    }

    const subData = await subRes.json();
    const status = (subData.status || "").toUpperCase();
    const valid = status === "ACTIVE" || status === "APPROVED";

    return {
      valid,
      status,
      planId: subData.plan_id,
      customId: subData.custom_id,
    };
  } catch (err: any) {
    return { valid: false, error: err.message };
  }
}

