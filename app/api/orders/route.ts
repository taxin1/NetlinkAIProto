import { NextRequest, NextResponse } from "next/server";
import { getPayPalClient } from "@/lib/paypal";
// @ts-ignore - @paypal/checkout-server-sdk doesn't have TypeScript types
import checkoutNodeJssdk from "@paypal/checkout-server-sdk";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { cart, planName, amount, currency = "USD" } = body;

    // If cart is provided, use it; otherwise use planName and amount
    let finalAmount = amount;
    let description = "Subscription";

    if (cart && cart.length > 0) {
      // Handle cart-based orders
      const product = cart[0];
      finalAmount = product.amount || amount || "15";
      description = product.description || `${planName || "Professional"} Plan Subscription`;
    } else if (planName) {
      // Handle plan-based orders
      const planAmounts: Record<string, string> = {
        professional: "15",
        enterprise: "Custom",
      };
      finalAmount = planAmounts[planName] || amount || "15";
      description = `${planName.charAt(0).toUpperCase() + planName.slice(1)} Plan Subscription`;
    }

    // Validate amount
    if (!finalAmount || finalAmount === "Custom" || parseFloat(finalAmount) <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Check PayPal credentials before attempting to create client
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("PayPal credentials missing:", {
        hasClientId: !!clientId,
        hasClientSecret: !!clientSecret,
      });
      return NextResponse.json(
        {
          error: "PayPal credentials not configured",
          error_description: "Client Authentication failed - invalid or missing PayPal credentials. Please set PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in your .env.local file.",
          details: [
            {
              issue: "ORDER_CREATION_FAILED",
              description: "Client Authentication failed - invalid or missing PayPal credentials. Please configure PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables.",
            },
          ],
          debug_id: Date.now().toString(),
        },
        { status: 401 }
      );
    }

    let paypalClient;
    try {
      paypalClient = getPayPalClient();
    } catch (clientError: any) {
      console.error("Failed to create PayPal client:", clientError);
      return NextResponse.json(
        {
          error: "PayPal client initialization failed",
          error_description: clientError?.message || "Failed to initialize PayPal client. Please check your credentials.",
          details: [
            {
              issue: "ORDER_CREATION_FAILED",
              description: clientError?.message || "Client Authentication failed - invalid or missing PayPal credentials",
            },
          ],
          debug_id: Date.now().toString(),
        },
        { status: 401 }
      );
    }

    // Create PayPal order request using legacy SDK
    const request_paypal = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request_paypal.prefer("return=representation");
    request_paypal.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          description,
          amount: {
            currency_code: currency,
            value: finalAmount.toString(),
          },
        },
      ],
      application_context: {
        brand_name: "Netlink",
        landing_page: "NO_PREFERENCE", // Prioritize guest checkout (card payment)
        user_action: "PAY_NOW",
        return_url: `${request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL}/checkout/success`,
        cancel_url: `${request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL}/checkout`,
      },
    });

    // Execute the order creation
    const order = await paypalClient.execute(request_paypal);

    if (!order.result?.id) {
      throw new Error("Failed to create PayPal order");
    }

    // Return order ID and full order details in the format expected by the client code
    return NextResponse.json({
      id: order.result.id,
      orderId: order.result.id,
      status: order.result.status,
      approveUrl: order.result.links?.find((link: any) => link.rel === "approve")?.href,
      payerActionUrl: order.result.links?.find((link: any) => link.rel === "payer-action")?.href,
      links: order.result.links,
    });
  } catch (error: any) {
    console.error("PayPal order creation error:", error);

    // Check if it's a PayPal API error
    let errorDetail = "Failed to create order";
    let errorDescription = error instanceof Error ? error.message : "Unknown error";
    let statusCode = 500;

    // PayPal SDK errors often have statusCode and message
    if (error?.statusCode) {
      statusCode = error.statusCode;
      errorDescription = error.message || errorDescription;

      // Check for authentication errors
      if (error.statusCode === 401 || error.message?.includes("invalid_client") || error.message?.includes("Client Authentication failed")) {
        errorDetail = "PayPal authentication failed. Please check your PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET environment variables.";
        errorDescription = "Client Authentication failed - invalid or missing PayPal credentials";
        statusCode = 401;
      }
    }

    // Check error message for authentication issues
    if (errorDescription?.includes("invalid_client") || errorDescription?.includes("Client Authentication failed")) {
      errorDetail = "PayPal authentication failed. Please verify your PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are correct and match your PayPal environment (sandbox/live).";
      errorDescription = "Client Authentication failed - invalid or missing PayPal credentials";
      statusCode = 401;
    }

    return NextResponse.json(
      {
        error: errorDetail,
        error_description: errorDescription,
        details: [{ issue: "ORDER_CREATION_FAILED", description: errorDescription }],
        debug_id: Date.now().toString(),
      },
      { status: statusCode }
    );
  }
}
