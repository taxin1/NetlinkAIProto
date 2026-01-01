"use client"

import { createClient } from "@/lib/supabase/client"
import { PlanName, PlanLimits, PLAN_LIMITS } from "@/lib/plan-features-shared"

/**
 * Get user's subscription plan (client-side)
 * Returns 'free' if no subscription found
 */
export async function getUserPlan(userId: string): Promise<PlanName> {
  const supabase = createClient()
  
  const { data: subscription, error } = await supabase
    .from("subscriptions")
    .select("plan_name, status")
    .eq("user_id", userId)
    .eq("status", "active")
    .single()
  
  if (error || !subscription) {
    return 'free'
  }
  
  return subscription.plan_name as PlanName
}

/**
 * Get user's plan limits (client-side)
 */
export async function getUserPlanLimits(userId: string): Promise<PlanLimits> {
  const plan = await getUserPlan(userId)
  return PLAN_LIMITS[plan]
}

/**
 * Check if user can perform an action based on usage limits (client-side)
 */
export async function checkUsageLimitClient(
  userId: string,
  limitType: 'contacts' | 'campaignContacts',
  currentUsage?: number
): Promise<{ allowed: boolean; limit: number | null; remaining: number | null; message?: string }> {
  const limits = await getUserPlanLimits(userId)
  const plan = await getUserPlan(userId)
  
  let limit: number | null = null
  let usage: number = currentUsage || 0
  
  switch (limitType) {
    case 'contacts':
      limit = limits.maxContacts
      if (currentUsage === undefined) {
        const supabase = createClient()
        const { count } = await supabase
          .from("contacts")
          .select("*", { count: 'exact', head: true })
          .eq("user_id", userId)
        
        usage = count || 0
      }
      break
      
    case 'campaignContacts':
      limit = limits.emailCampaignsMaxContacts
      // This is checked per campaign, so currentUsage should be provided
      break
  }
  
  // If limit is null, it means unlimited
  if (limit === null) {
    return {
      allowed: true,
      limit: null,
      remaining: null,
    }
  }
  
  const remaining = Math.max(0, limit - usage)
  const allowed = usage < limit
  
  let message: string | undefined
  if (!allowed) {
    const planName = plan.charAt(0).toUpperCase() + plan.slice(1)
    switch (limitType) {
      case 'contacts':
        message = `You've reached your limit of ${limit} contacts on the ${planName} plan. Upgrade to Professional for unlimited contacts.`
        break
      case 'campaignContacts':
        message = `Campaigns are limited to ${limit} contacts on the ${planName} plan. Upgrade to Professional for unlimited campaign contacts.`
        break
    }
  }
  
  return {
    allowed,
    limit,
    remaining,
    message,
  }
}
