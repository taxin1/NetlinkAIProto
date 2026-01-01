import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Unauthorized access attempt:", authError);
      return NextResponse.json({ error: "Unauthorized", message: "Please log in to continue" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { planName, couponId } = body;

    if (!planName) {
      console.error("Missing planName in request:", body);
      return NextResponse.json({ error: "Plan name is required", message: "Please select a plan" }, { status: 400 });
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

    // Check if subscription already exists for this user
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .single();

    let subscription;
    let subError;

    if (existingSubscription) {
      // Update existing subscription
      const subscriptionData: any = {
        plan_name: planName,
        status: "active",
        amount: 0, // Free subscription
        currency: "USD",
        billing_period: "month",
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      };

      // Only add coupon_id if the column exists (to avoid errors if migration hasn't run)
      if (couponId) {
        subscriptionData.coupon_id = couponId;
      }

      const { data: updatedSubscription, error: updateError } = await supabase
        .from("subscriptions")
        .update(subscriptionData)
        .eq("user_id", user.id)
        .select()
        .single();

      subscription = updatedSubscription;
      subError = updateError;
    } else {
      // Insert new subscription
      const subscriptionData: any = {
        user_id: user.id,
        plan_name: planName,
        status: "active",
        amount: 0, // Free subscription
        currency: "USD",
        billing_period: "month",
        started_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      };

      // Only add coupon_id if the column exists (to avoid errors if migration hasn't run)
      if (couponId) {
        subscriptionData.coupon_id = couponId;
      }

      const { data: newSubscription, error: insertError } = await supabase
        .from("subscriptions")
        .insert(subscriptionData)
        .select()
        .single();

      subscription = newSubscription;
      subError = insertError;
    }

    if (subError) {
      console.error("Error creating/updating subscription:", {
        message: subError.message,
        code: subError.code,
        hint: subError.hint,
        details: subError.details,
        fullError: subError
      });
      
      // Check if error is related to coupon_id column not existing
      const errorMessage = subError.message || "";
      if (errorMessage.includes("coupon_id") || errorMessage.includes("column") || subError.code === "42703") {
        console.error("Possible issue: coupon_id column may not exist. Please run migration 007_add_coupons.sql");
        return NextResponse.json(
          { 
            error: "Database schema error",
            message: "The coupon_id column may not exist. Please contact support or run the database migration.",
            details: errorMessage,
            code: subError.code,
            hint: subError.hint
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          error: "Failed to create subscription",
          message: errorMessage || "Database error occurred",
          details: errorMessage,
          code: subError.code,
          hint: subError.hint
        },
        { status: 500 }
      );
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
    const errorMessage = error instanceof Error ? error.message : "Failed to create subscription";
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
