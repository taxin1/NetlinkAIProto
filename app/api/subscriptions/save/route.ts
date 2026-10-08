import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { verifyPayPalSubscription } from "@/lib/paypal";

export async function POST(request: NextRequest) {
  try {
    // Verify user authentication
    const { user, supabase } = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subscriptionId, planName, amount, currency = "USD" } = body;

    if (!subscriptionId) {
      return NextResponse.json({ error: "Subscription ID is required" }, { status: 400 });
    }

    // Verify subscription status directly with PayPal REST API
    const verification = await verifyPayPalSubscription(subscriptionId);
    if (!verification.valid) {
      return NextResponse.json(
        {
          error: "Invalid or inactive PayPal subscription",
          message: verification.error || "Subscription could not be verified with PayPal",
        },
        { status: 400 }
      );
    }

    // Calculate expiration date (1 month from now for monthly subscription)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    const parsedAmount = parseFloat(amount || "0");
    let assignedPlan = planName || "professional";
    if (assignedPlan === "enterprise") {
      assignedPlan = "professional";
    }
    if (assignedPlan === "professional" && parsedAmount > 0 && parsedAmount < 15) {
      assignedPlan = "free";
    }

    // Create or update subscription in database
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: user.id,
          plan_name: assignedPlan,
          status: "active",
          paypal_subscription_id: subscriptionId,
          amount: parsedAmount,
          currency: currency,
          billing_period: "month",
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
        },
        {
          onConflict: "user_id",
        }
      )
      .select()
      .single();

    if (subError) {
      console.error("Error saving subscription:", subError);
      return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        subscriptionId: subscription.paypal_subscription_id,
        planName: subscription.plan_name,
        status: subscription.status,
      },
    });
  } catch (error) {
    console.error("Save subscription error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save subscription" },
      { status: 500 }
    );
  }
}
