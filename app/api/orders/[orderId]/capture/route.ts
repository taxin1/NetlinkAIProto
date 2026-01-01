import { NextRequest, NextResponse } from "next/server";
import { getPayPalClient } from "@/lib/paypal";
// @ts-ignore - @paypal/checkout-server-sdk doesn't have TypeScript types
import checkoutNodeJssdk from "@paypal/checkout-server-sdk";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> | { orderId: string } }
) {
  try {
    // Verify user authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    const orderId = resolvedParams.orderId;

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
    
    // Check if order requires payer action (e.g., 3D Secure authentication)
    if (captureData.status === "PAYER_ACTION_REQUIRED") {
      const payerActionUrl = captureData.links?.find((link: any) => link.rel === "payer-action")?.href;
      return NextResponse.json({
        status: "PAYER_ACTION_REQUIRED",
        payerActionUrl,
        id: captureData.id,
        links: captureData.links,
      });
    }
    
    const purchaseUnit = captureData.purchase_units?.[0];
    const transaction =
      purchaseUnit?.payments?.captures?.[0] ||
      purchaseUnit?.payments?.authorizations?.[0];

    if (!transaction) {
      return NextResponse.json(
        {
          error: "No transaction found",
          details: [{ issue: "TRANSACTION_NOT_FOUND", description: "No transaction found in capture response" }],
          debug_id: captureData.id || Date.now().toString(),
        },
        { status: 400 }
      );
    }

    // Check if transaction was declined
    if (transaction.status === "DECLINED") {
      return NextResponse.json(
        {
          error: "Transaction declined",
          details: [{ issue: "INSTRUMENT_DECLINED", description: "The payment instrument was declined" }],
          debug_id: captureData.id || Date.now().toString(),
        },
        { status: 400 }
      );
    }

    // Check for other errors
    const errorDetail = captureData.details?.[0];
    if (errorDetail || transaction.status !== "COMPLETED") {
      return NextResponse.json(
        {
          error: errorDetail?.description || `Transaction status: ${transaction.status}`,
          details: errorDetail ? [errorDetail] : [{ issue: "CAPTURE_FAILED", description: `Transaction status: ${transaction.status}` }],
          debug_id: captureData.id || Date.now().toString(),
        },
        { status: 400 }
      );
    }

    // Extract plan name from request body if provided
    const body = await request.json().catch(() => ({}));
    const planName = body.planName || "professional";

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
          paypal_order_id: orderId,
          amount: parseFloat(transaction.amount?.value || "0"),
          currency: transaction.amount?.currency_code || "USD",
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
      // Log the error but still return success for the payment
    }

    // Return response in the format expected by the client code
    return NextResponse.json({
      id: captureData.id,
      status: transaction.status,
      purchase_units: [
        {
          payments: {
            captures: [transaction],
            authorizations: purchaseUnit?.payments?.authorizations || [],
          },
        },
      ],
      debug_id: captureData.id || Date.now().toString(),
    });
  } catch (error) {
    console.error("PayPal capture error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to capture payment";
    return NextResponse.json(
      {
        error: errorMessage,
        details: [{ issue: "CAPTURE_ERROR", description: errorMessage }],
        debug_id: Date.now().toString(),
      },
      { status: 500 }
    );
  }
}
