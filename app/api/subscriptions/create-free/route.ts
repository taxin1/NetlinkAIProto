import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planName, couponId } = await request.json();

    if (!planName) {
      return NextResponse.json({ error: "Plan name is required" }, { status: 400 });
    }

    // Validate coupon if provided
    let coupon = null;
    if (couponId) {
      const { data: couponData, error: couponError } = await supabase
        .from("coupons")
        .select("*")
        .eq("id", couponId)
        .eq("active", true)
        .single();

      if (couponError || !couponData) {
        return NextResponse.json({ error: "Invalid coupon" }, { status: 400 });
      }

      // Check if user has already used this coupon
      const { data: existingUse } = await supabase
        .from("coupon_uses")
        .select("id")
        .eq("coupon_id", couponId)
        .eq("user_id", user.id)
        .single();

      if (existingUse) {
        return NextResponse.json({ error: "Coupon already used" }, { status: 400 });
      }

      coupon = couponData;
    }

    // Calculate expiration date (1 month from now, or free_months if coupon)
    const expiresAt = new Date();
    const freeMonths = coupon?.free_months || 0;
    expiresAt.setMonth(expiresAt.getMonth() + 1 + freeMonths);

    // Create subscription
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .upsert(
        {
          user_id: user.id,
          plan_name: planName,
          status: "active",
          amount: 0, // Free subscription
          currency: "USD",
          billing_period: "month",
          started_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          coupon_id: couponId || null,
        },
        {
          onConflict: "user_id",
        }
      )
      .select()
      .single();

    if (subError) {
      console.error("Error creating subscription:", subError);
      return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
    }

    // Record coupon use
    if (couponId && subscription) {
      const { error: useError } = await supabase.from("coupon_uses").insert({
        coupon_id: couponId,
        user_id: user.id,
        subscription_id: subscription.id,
      });

      if (useError) {
        console.error("Error recording coupon use:", useError);
        // Don't fail the request, just log it
      }

      // Update coupon current_uses count (fetch current count first to avoid race conditions)
      const { data: currentCoupon } = await supabase
        .from("coupons")
        .select("current_uses")
        .eq("id", couponId)
        .single();

      if (currentCoupon) {
        await supabase
          .from("coupons")
          .update({ current_uses: (currentCoupon.current_uses || 0) + 1 })
          .eq("id", couponId);
      }
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        planName: subscription.plan_name,
        status: subscription.status,
        expiresAt: subscription.expires_at,
        couponUsed: coupon?.code || null,
      },
    });
  } catch (error) {
    console.error("Create free subscription error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create subscription" },
      { status: 500 }
    );
  }
}
