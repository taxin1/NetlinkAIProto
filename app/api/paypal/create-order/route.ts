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

    const { planName, amount, currency = "USD" } = await request.json();

    // Validate plan
    const validPlans = ["professional", "enterprise"];
    if (!validPlans.includes(planName)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    const paypalClient = getPayPalClient();

    // Create PayPal order request using legacy SDK
    const request_paypal = new checkoutNodeJssdk.orders.OrdersCreateRequest();
    request_paypal.prefer("return=representation");
    request_paypal.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          description: `${planName.charAt(0).toUpperCase() + planName.slice(1)} Plan Subscription`,
          amount: {
            currency_code: currency,
            value: amount.toString(),
          },
        },
      ],
      application_context: {
        brand_name: "Netlink",
        landing_page: "BILLING", // Prioritize card payment (guest checkout) over PayPal account login
        user_action: "PAY_NOW",
        return_url: `${request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL}/api/paypal/capture-order?planName=${planName}`,
        cancel_url: `${request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL}/checkout?plan=${planName}`,
      },
    });

    // Execute the order creation
    const order = await paypalClient.execute(request_paypal);

    if (!order.result?.id) {
      throw new Error("Failed to create PayPal order");
    }

    // Return order ID for Smart Payment Buttons
    return NextResponse.json({
      orderId: order.result.id,
      approveUrl: order.result.links?.find((link: any) => link.rel === "approve")?.href,
    });
  } catch (error) {
    console.error("PayPal order creation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create order" },
      { status: 500 }
    );
  }
}
