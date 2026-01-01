"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicNavigation } from "@/components/public-navigation";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("orderId");
  const couponCode = searchParams.get("coupon");
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (orderId) {
      // Fetch subscription details
      fetchSubscription();
    } else {
      setIsLoading(false);
    }
  }, [orderId]);

  const fetchSubscription = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      let query = supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id);

      // If it's a free subscription (orderId is "free"), get the latest subscription
      if (orderId === "free") {
        query = query.order("created_at", { ascending: false }).limit(1);
      } else {
        query = query.eq("paypal_order_id", orderId);
      }

      const { data, error } = await query.single();

      if (error) {
        console.error("Error fetching subscription:", error);
      } else {
        setSubscription(data);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <PublicNavigation />

      <section className="container mx-auto px-4 py-20 sm:py-28 relative z-10">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-green-500/20">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <CardTitle className="text-3xl">
                {orderId === "free" ? "Subscription Activated!" : "Payment Successful!"}
              </CardTitle>
              <CardDescription className="text-lg">
                {orderId === "free" && couponCode
                  ? `Your free subscription with coupon ${couponCode} has been activated successfully.`
                  : "Your subscription has been activated successfully."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {subscription && (
                    <div className="bg-muted/50 rounded-lg p-6 space-y-4">
                      <h3 className="font-semibold text-lg">Subscription Details</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Plan:</span>
                          <span className="font-medium capitalize">{subscription.plan_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Status:</span>
                          <span className="font-medium capitalize text-green-500">{subscription.status}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="font-medium">
                            ${subscription.amount} {subscription.currency}
                          </span>
                        </div>
                        {subscription.expires_at && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Next Billing:</span>
                            <span className="font-medium">
                              {new Date(subscription.expires_at).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {orderId && orderId !== "free" && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Order ID:</span>
                            <span className="font-mono text-xs">{orderId}</span>
                          </div>
                        )}
                        {couponCode && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Coupon Used:</span>
                            <span className="font-medium text-green-600 dark:text-green-400">{couponCode}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/dashboard" className="flex-1">
                      <Button className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700" size="lg">
                        Go to Dashboard
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="/pricing" className="flex-1">
                      <Button variant="outline" className="w-full" size="lg">
                        View Plans
                      </Button>
                    </Link>
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    You can manage your subscription from your dashboard settings.
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
