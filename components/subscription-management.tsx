"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  CreditCard, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Crown,
  Zap,
  Calendar,
  DollarSign,
  ExternalLink
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Subscription } from "@/types/subscription"
import Link from "next/link"

interface SubscriptionManagementProps {
  userId: string
}

export function SubscriptionManagement({ userId }: SubscriptionManagementProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      fetchSubscription()
    } else {
      setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const fetchSubscription = async () => {
    if (!userId) return
    
    try {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found" error
        throw fetchError
      }

      setSubscription(data || null)
      setError(null)
    } catch (err) {
      console.error("Error fetching subscription:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch subscription")
    } finally {
      setIsLoading(false)
    }
  }

  const getPlanDisplayName = (planName: string) => {
    switch (planName) {
      case 'free':
        return 'Free'
      case 'professional':
        return 'Professional'
      case 'enterprise':
        return 'Enterprise'
      default:
        return planName.charAt(0).toUpperCase() + planName.slice(1)
    }
  }

  const getPlanBadgeVariant = (planName: string) => {
    switch (planName) {
      case 'free':
        return 'secondary'
      case 'professional':
        return 'default'
      case 'enterprise':
        return 'default'
      default:
        return 'secondary'
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'canceled':
        return 'destructive'
      case 'expired':
        return 'secondary'
      case 'pending':
        return 'outline'
      default:
        return 'secondary'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-white/60 dark:border-gray-800/60 shadow-2xl">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-white/60 dark:border-gray-800/60 shadow-2xl">
      <CardHeader className="border-b border-gray-200/50 dark:border-gray-800/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/50 dark:to-purple-950/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Manage Subscription
              </CardTitle>
              <CardDescription className="mt-1">
                View and manage your account subscription
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-8">
        {error && (
          <div className="p-4 rounded-xl border-2 border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/30">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {!subscription ? (
          <div className="text-center py-8">
            <div className="mb-4">
              <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Active Subscription</h3>
              <p className="text-muted-foreground mb-6">
                You're currently on a free account. Upgrade to unlock premium features!
              </p>
              <Link href="/checkout">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  <Zap className="mr-2 h-4 w-4" />
                  Upgrade to Pro
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Plan Info */}
            <div className="p-6 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Crown className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="text-lg font-semibold">Current Plan</h3>
                    <p className="text-sm text-muted-foreground">Your active subscription plan</p>
                  </div>
                </div>
                <Badge 
                  variant={getPlanBadgeVariant(subscription.plan_name)}
                  className="text-base px-4 py-2"
                >
                  {getPlanDisplayName(subscription.plan_name)}
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="text-sm font-medium">Status</p>
                    <Badge 
                      variant={getStatusBadgeVariant(subscription.status)}
                      className="mt-1"
                    >
                      {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    </Badge>
                  </div>
                </div>

                {subscription.amount > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                    <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-sm font-medium">Amount</p>
                      <p className="text-base font-semibold">
                        ${subscription.amount.toFixed(2)} {subscription.currency} / {subscription.billing_period}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                  <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <div>
                    <p className="text-sm font-medium">Started</p>
                    <p className="text-base font-semibold">
                      {formatDate(subscription.started_at)}
                    </p>
                  </div>
                </div>

                {subscription.expires_at && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                    <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <div>
                      <p className="text-sm font-medium">Expires</p>
                      <p className="text-base font-semibold">
                        {formatDate(subscription.expires_at)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Subscription Details */}
            <div className="p-6 rounded-xl border border-gray-200/50 dark:border-gray-800/50 bg-background/50">
              <h4 className="text-lg font-semibold mb-4">Subscription Details</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Plan Name</span>
                  <span className="font-medium capitalize">{subscription.plan_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Billing Period</span>
                  <span className="font-medium capitalize">{subscription.billing_period}ly</span>
                </div>
                {subscription.paypal_order_id && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Order ID</span>
                    <span className="font-mono text-xs">{subscription.paypal_order_id}</span>
                  </div>
                )}
                {subscription.paypal_subscription_id && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Subscription ID</span>
                    <span className="font-mono text-xs">{subscription.paypal_subscription_id}</span>
                  </div>
                )}
                {subscription.canceled_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Canceled At</span>
                    <span className="font-medium">{formatDate(subscription.canceled_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {subscription.status === 'active' && (
                <Link href="/checkout" className="flex-1">
                  <Button 
                    variant="outline" 
                    className="w-full"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Upgrade Plan
                  </Button>
                </Link>
              )}
              {subscription.plan_name === 'free' && (
                <Link href="/checkout" className="flex-1">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                    <Zap className="mr-2 h-4 w-4" />
                    Upgrade to Pro
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
