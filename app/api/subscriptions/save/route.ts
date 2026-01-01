import { NextRequest, NextResponse } from "next/server";
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
    const { subscriptionId, planName, amount, currency = "USD" } = body;

    if (!subscriptionId) {
      return NextResponse.json({ error: "Subscription ID is required" }, { status: 400 });
    }

    // Calculate expiration date (1 month from now for monthly subscription)
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    // Create or update subscription in database
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: user.id,
          plan_name: planName || "professional",
          status: "active",
          paypal_subscription_id: subscriptionId,
          amount: parseFloat(amount || "0"),
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
