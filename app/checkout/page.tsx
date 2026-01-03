"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicNavigation } from "@/components/public-navigation";
import { Loader2, CheckCircle, XCircle, ArrowLeft, Tag } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PayPalButton } from "@/components/paypal-button";

const PLANS = {
  professional: {
    name: "Professional",
    price: "15",
    description: "Unlimited features and AI-powered networking",
  },
  enterprise: {
    name: "Enterprise",
    price: "Custom",
    description: "Custom pricing for teams and organizations",
  },
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const planName = (searchParams.get("plan") || "professional") as keyof typeof PLANS;
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isFreeCheckout, setIsFreeCheckout] = useState(false);

  const plan = PLANS[planName] || PLANS.professional;

  // Check authentication and handle errors
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push(`/auth/login?redirect=/checkout?plan=${planName}`);
          return;
        }
        
        setIsAuthenticated(true);
        
        // Check for error parameter from PayPal redirect
        const errorParam = searchParams.get("error");
        if (errorParam) {
          setError(
            errorParam === "missing_token" 
              ? "Missing payment token. Please try again."
              : errorParam === "payment_not_completed"
              ? "Payment was not completed. Please try again."
              : errorParam === "capture_failed"
              ? "Failed to process payment. Please contact support."
              : "An error occurred during payment processing."
          );
        }
      } catch (err) {
        console.error("Auth check error:", err);
        router.push(`/auth/login?redirect=/checkout?plan=${planName}`);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, planName, searchParams]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError("Please enter a coupon code");
      return;
    }

    setIsValidatingCoupon(true);
    setCouponError(null);

    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code: couponCode.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid coupon code");
      }

      setAppliedCoupon(data.coupon);
      setCouponError(null);
      
      // If coupon gives free months, show free checkout option
      if (data.coupon.freeMonths > 0) {
        setIsFreeCheckout(true);
      }
    } catch (err) {
      console.error("Coupon validation error:", err);
      setCouponError(err instanceof Error ? err.message : "Failed to validate coupon");
      setAppliedCoupon(null);
      setIsFreeCheckout(false);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode("");
    setAppliedCoupon(null);
    setCouponError(null);
    setIsFreeCheckout(false);
  };

  const handleFreeCheckout = async () => {
    if (!appliedCoupon || !isAuthenticated) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch("/api/subscriptions/create-free", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planName,
          couponId: appliedCoupon.id,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        // If response is not valid JSON, get text instead
        const text = await response.text();
        console.error("Subscription creation failed - invalid JSON response:", text);
        throw new Error(`Failed to create subscription: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        console.error("Subscription creation failed:", data);
        const errorMessage = data?.error 
          ? (data.details 
              ? `${data.error}: ${data.details}` 
              : data.error)
          : data?.message || `Failed to create subscription (${response.status})`;
        throw new Error(errorMessage);
      }

      // Redirect to success page
      router.push(`/checkout/success?orderId=free&coupon=${appliedCoupon.code}`);
    } catch (err) {
      console.error("Free checkout error:", err);
      setError(err instanceof Error ? err.message : "Failed to activate free subscription");
      setIsProcessing(false);
    }
  };

  const handlePayPalSuccess = (orderId: string) => {
    // Redirect to success page
    router.push(`/checkout/success?orderId=${orderId}`);
  };

  const handlePayPalError = (errorMessage: string) => {
    setError(errorMessage);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <PublicNavigation />

      <section className="container mx-auto px-4 py-20 sm:py-28 relative z-10">
        <div className="max-w-2xl mx-auto">
          <Link href="/pricing" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pricing
          </Link>

          {isLoading ? (
            <Card className="border-2">
              <CardContent className="py-12">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-3xl">Checkout</CardTitle>
                <CardDescription>Complete your subscription purchase</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Order Summary */}
                <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                  <h3 className="font-semibold text-lg">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plan:</span>
                      <span className="font-medium">{plan.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Description:</span>
                      <span className="font-medium text-sm">{plan.description}</span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between text-green-600 dark:text-green-400 pt-2 border-t">
                        <span className="flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          Coupon: {appliedCoupon.code}
                        </span>
                        <span className="font-medium">
                          {appliedCoupon.freeMonths > 0
                            ? `${appliedCoupon.freeMonths} month${appliedCoupon.freeMonths > 1 ? "s" : ""} free`
                            : "Applied"}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold pt-2 border-t">
                      <span>Total:</span>
                      <span>
                        {isFreeCheckout && appliedCoupon ? (
                          <span className="flex items-center gap-2">
                            <span className="line-through text-muted-foreground">${plan.price}</span>
                            <span className="text-green-600 dark:text-green-400">$0</span>
                          </span>
                        ) : (
                          `$${plan.price}${plan.price !== "Custom" ? "/month" : ""}`
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Coupon Code Section */}
                <div className="space-y-3">
                  <Label htmlFor="coupon-code">Have a coupon code?</Label>
                  <div className="flex gap-2">
                    <Input
                      id="coupon-code"
                      type="text"
                      placeholder="Enter coupon code (e.g., NETLINKFREE)"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !appliedCoupon) {
                          handleApplyCoupon();
                        }
                      }}
                      disabled={isValidatingCoupon || !!appliedCoupon || isProcessing}
                      className="flex-1"
                    />
                    {appliedCoupon ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleRemoveCoupon}
                        disabled={isProcessing}
                      >
                        Remove
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleApplyCoupon}
                        disabled={isValidatingCoupon || !couponCode.trim() || isProcessing}
                      >
                        {isValidatingCoupon ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    )}
                  </div>
                  {couponError && (
                    <p className="text-sm text-destructive">{couponError}</p>
                  )}
                  {appliedCoupon && appliedCoupon.description && (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {appliedCoupon.description}
                    </p>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-destructive">Payment Error</p>
                      <p className="text-sm text-muted-foreground mt-1">{error}</p>
                    </div>
                  </div>
                )}

                {/* Free Checkout Button (if coupon applied) */}
                {isFreeCheckout && appliedCoupon ? (
                  <>
                    <Button
                      onClick={handleFreeCheckout}
                      disabled={isProcessing || !isAuthenticated}
                      className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-12 text-lg"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Activating Free Subscription...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-5 w-5" />
                          Activate Free {appliedCoupon.freeMonths} Month{appliedCoupon.freeMonths > 1 ? "s" : ""}
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Your free subscription will be activated immediately. No payment required.
                    </p>
                  </>
                ) : (
                  <>
                {/* PayPal Smart Payment Buttons */}
                {plan.price !== "Custom" && isAuthenticated ? (
                  <PayPalButton
                    amount={plan.price}
                    planName={planName}
                    currency="USD"
                    onSuccess={handlePayPalSuccess}
                    onError={handlePayPalError}
                    disabled={isProcessing || !!appliedCoupon}
                    subscriptionMode={false} // Use one-time payments instead of subscriptions (simpler)
                  />
                ) : plan.price === "Custom" ? (
                  <Button
                    onClick={() => router.push("/public/about")}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                    size="lg"
                  >
                    Contact Sales
                  </Button>
                ) : null}

                {plan.price !== "Custom" && (
                  <p className="text-xs text-center text-muted-foreground">
                    Pay with PayPal or use your credit/debit card. No PayPal account required for card payments.
                  </p>
                )}
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
