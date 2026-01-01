import { NextRequest, NextResponse } from "next/server";
import { getPayPalClient } from "@/lib/paypal";
// @ts-ignore - @paypal/checkout-server-sdk doesn't have TypeScript types
import checkoutNodeJssdk from "@paypal/checkout-server-sdk";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get("token");
    const planName = searchParams.get("planName") || "professional";

    if (!token) {
      return NextResponse.redirect(new URL(`/checkout?plan=${planName}&error=missing_token`, request.url));
    }

    const paypalClient = getPayPalClient();

    // Capture the order using legacy SDK
    const request_paypal = new checkoutNodeJssdk.orders.OrdersCaptureRequest(token);
    request_paypal.requestBody({});

    const capture = await paypalClient.execute(request_paypal);

    if (!capture.result?.id) {
      throw new Error("Failed to capture PayPal order");
    }

    const captureData = capture.result;
    const purchaseUnit = captureData.purchase_units?.[0];
    const payment = purchaseUnit?.payments?.captures?.[0];

    if (!payment || payment.status !== "COMPLETED") {
      return NextResponse.redirect(new URL(`/checkout?plan=${planName}&error=payment_not_completed`, request.url));
    }

    // Calculate expiration date (1 month from now for monthly subscription)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    // Create or update subscription in database
    const { error: subError } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: user.id,
          plan_name: planName,
          status: "active",
          paypal_order_id: token,
          amount: parseFloat(payment.amount?.value || "0"),
          currency: payment.amount?.currency_code || "USD",
          billing_period: "month",
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (subError) {
      console.error("Error creating subscription:", subError);
      // Payment was successful, but subscription creation failed
      // Redirect to success page anyway, but log the error
    }

    // Redirect to success page
    return NextResponse.redirect(new URL(`/checkout/success?orderId=${token}`, request.url));
  } catch (error) {
    console.error("PayPal capture error:", error);
    const planName = request.nextUrl.searchParams.get("planName") || "professional";
    return NextResponse.redirect(new URL(`/checkout?plan=${planName}&error=capture_failed`, request.url));
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, planName } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const paypalClient = getPayPalClient();

    // Capture the order using legacy SDK
    const request_paypal = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
    request_paypal.requestBody({});

    const capture = await paypalClient.execute(request_paypal);

    if (!capture.result?.id) {
      throw new Error("Failed to capture PayPal order");
    }

    const captureData = capture.result;
    const purchaseUnit = captureData.purchase_units?.[0];
    const payment = purchaseUnit?.payments?.captures?.[0];

    if (!payment || payment.status !== "COMPLETED") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    // Calculate expiration date (1 month from now for monthly subscription)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    // Create or update subscription in database
    const { error: subError } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: user.id,
          plan_name: planName || "professional",
          status: "active",
          paypal_order_id: orderId,
          amount: parseFloat(payment.amount?.value || "0"),
          currency: payment.amount?.currency_code || "USD",
          billing_period: "month",
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (subError) {
      console.error("Error creating subscription:", subError);
      // Payment was successful, but subscription creation failed
      // You might want to log this for manual review
    }

    return NextResponse.json({
      success: true,
      orderId: captureData.id,
      status: payment.status,
      subscriptionId: user.id, // You can use a more specific ID if needed
    });
  } catch (error) {
    console.error("PayPal capture error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to capture payment" },
      { status: 500 }
    );
  }
}
