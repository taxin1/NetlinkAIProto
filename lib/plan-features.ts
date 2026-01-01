import { createClient } from "@/lib/supabase/server"
import { Subscription } from "@/types/subscription"
import { PlanName, PlanLimits, PLAN_LIMITS, FREE_TRIAL_LIMIT } from "@/lib/plan-features-shared"

// Re-export for backward compatibility
export type { PlanName, PlanLimits }
export { PLAN_LIMITS, FREE_TRIAL_LIMIT }

/**
 * Get user's subscription plan
 * Returns 'free' if no subscription found
 */
export async function getUserPlan(userId: string): Promise<PlanName> {
  const supabase = await createClient()
  
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
 * Get user's plan limits
 */
export async function getUserPlanLimits(userId: string): Promise<PlanLimits> {
  const plan = await getUserPlan(userId)
  return PLAN_LIMITS[plan]
}

/**
 * Check if user has access to a feature
 */
export async function hasFeatureAccess(
  userId: string,
  feature: keyof PlanLimits
): Promise<boolean> {
  const limits = await getUserPlanLimits(userId)
  const value = limits[feature]
  
  // For boolean features, return the value directly
  if (typeof value === 'boolean') {
    return value
  }
  
  // For numeric features, if null means unlimited, return true
  // Otherwise, we'd need to check actual usage (implemented separately)
  return value !== null && value !== 0
}

/**
 * Check if user can perform an action based on usage limits
 */
export async function checkUsageLimit(
  userId: string,
  limitType: 'aiEmailGeneration' | 'aiAssistantMessages' | 'businessCardScans' | 'contacts' | 'events' | 'dailyEmails' | 'monthlyEmails' | 'campaignContacts' | 'networkingMode' | 'aiCampaign',
  currentUsage?: number
): Promise<{ allowed: boolean; limit: number | null; remaining: number | null; message?: string }> {
  const limits = await getUserPlanLimits(userId)
  const plan = await getUserPlan(userId)
  
  let limit: number | null = null
  let usage: number = currentUsage || 0
  
  switch (limitType) {
    case 'aiEmailGeneration':
      limit = limits.aiEmailGenerationPerMonth
      if (currentUsage === undefined) {
        // Count AI emails generated this month
        const supabase = await createClient()
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)
        
        const { count } = await supabase
          .from("emails")
          .select("*", { count: 'exact', head: true })
          .eq("user_id", userId)
          .gte("created_at", startOfMonth.toISOString())
          .not("body", "is", null)
        
        usage = count || 0
      }
      break
      
    case 'aiAssistantMessages':
      limit = limits.aiAssistantMessagesPerDay
      if (currentUsage === undefined) {
        // Count AI messages today
        const supabase = await createClient()
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        // Note: This assumes you track AI messages somewhere
        // You might need to create a table for this or track in a different way
        usage = 0 // Placeholder - implement based on your tracking method
      }
      break
      
    case 'businessCardScans':
      limit = limits.businessCardScansPerMonth
      if (currentUsage === undefined) {
        // Count scans this month
        const supabase = await createClient()
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)
        
        // Assuming scans are tracked when contacts are created via scanner
        // You might need to add a flag or separate table for this
        const { count } = await supabase
          .from("contacts")
          .select("*", { count: 'exact', head: true })
          .eq("user_id", userId)
          .gte("created_at", startOfMonth.toISOString())
        
        usage = count || 0
      }
      break
      
    case 'contacts':
      limit = limits.maxContacts
      if (currentUsage === undefined) {
        const supabase = await createClient()
        const { count } = await supabase
          .from("contacts")
          .select("*", { count: 'exact', head: true })
          .eq("user_id", userId)
        
        usage = count || 0
      }
      break
      
    case 'events':
      limit = limits.eventsPerMonth
      if (currentUsage === undefined) {
        const supabase = await createClient()
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)
        
        const { count } = await supabase
          .from("events")
          .select("*", { count: 'exact', head: true })
          .eq("user_id", userId)
          .gte("created_at", startOfMonth.toISOString())
        
        usage = count || 0
      }
      break
      
    case 'dailyEmails':
      limit = limits.dailyEmailLimit
      if (currentUsage === undefined) {
        const supabase = await createClient()
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        const { count } = await supabase
          .from("emails")
          .select("*", { count: 'exact', head: true })
          .eq("user_id", userId)
          .eq("status", "sent")
          .gte("sent_at", today.toISOString())
        
        usage = count || 0
      }
      break
      
    case 'monthlyEmails':
      limit = limits.monthlyEmailLimit
      if (currentUsage === undefined) {
        const supabase = await createClient()
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)
        
        const { count } = await supabase
          .from("emails")
          .select("*", { count: 'exact', head: true })
          .eq("user_id", userId)
          .eq("status", "sent")
          .gte("sent_at", startOfMonth.toISOString())
        
        usage = count || 0
      }
      break
      
    case 'campaignContacts':
      limit = limits.emailCampaignsMaxContacts
      // This is checked per campaign, so currentUsage should be provided
      break
      
    case 'networkingMode':
      limit = limits.networkingModeFreeTrial
      if (currentUsage === undefined) {
        const supabase = await createClient()
        const { data: usageData } = await supabase
          .from("networking_mode_usage")
          .select("usage_count")
          .eq("user_id", userId)
          .single()
        
        usage = usageData?.usage_count || 0
      }
      break
      
    case 'aiCampaign':
      limit = limits.aiCampaignFreeTrial
      if (currentUsage === undefined) {
        const supabase = await createClient()
        const { data: usageData } = await supabase
          .from("ai_campaign_usage")
          .select("usage_count")
          .eq("user_id", userId)
          .single()
        
        usage = usageData?.usage_count || 0
      }
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
      case 'aiEmailGeneration':
        message = `You've reached your limit of ${limit} AI email generations per month on the ${planName} plan. Upgrade to Professional for unlimited AI emails.`
        break
      case 'aiAssistantMessages':
        message = `You've reached your limit of ${limit} AI assistant messages per day on the ${planName} plan. Upgrade to Professional for unlimited messages.`
        break
      case 'businessCardScans':
        message = `You've reached your limit of ${limit} business card scans per month on the ${planName} plan. Upgrade to Professional for unlimited scans.`
        break
      case 'contacts':
        message = `You've reached your limit of ${limit} contacts on the ${planName} plan. Upgrade to Professional for unlimited contacts.`
        break
      case 'events':
        message = `You've reached your limit of ${limit} events per month on the ${planName} plan. Upgrade to Professional for unlimited events.`
        break
      case 'dailyEmails':
        message = `You've reached your daily email limit of ${limit} on the ${planName} plan. Upgrade to Professional for higher limits.`
        break
      case 'monthlyEmails':
        message = `You've reached your monthly email limit of ${limit} on the ${planName} plan. Upgrade to Professional for higher limits.`
        break
      case 'campaignContacts':
        message = `Campaigns are limited to ${limit} contacts on the ${planName} plan. Upgrade to Professional for unlimited campaign contacts.`
        break
      case 'networkingMode':
        message = `You've used all ${limit} free networking mode emails. Upgrade to Professional for unlimited networking mode.`
        break
      case 'aiCampaign':
        message = `You've used all ${limit} free AI campaign runs. Upgrade to Professional for unlimited AI campaigns.`
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


/**
 * Check networking mode trial usage
 * Returns usage info and whether user can use networking mode
 */
export async function checkNetworkingModeTrial(
  userId: string
): Promise<{ allowed: boolean; usage: number; limit: number; remaining: number; message?: string }> {
  const supabase = await createClient()
  const plan = await getUserPlan(userId)
  
  // Pro and Enterprise plans have unlimited access
  if (plan === 'professional' || plan === 'enterprise') {
    return {
      allowed: true,
      usage: 0,
      limit: FREE_TRIAL_LIMIT,
      remaining: null as any, // unlimited
    }
  }
  
  // Get or create subscription record to track usage
  let { data: subscription } = await supabase
    .from("subscriptions")
    .select("networking_mode_usage")
    .eq("user_id", userId)
    .single()
  
  // If no subscription record exists, create one (for free users)
  if (!subscription) {
    const { data: newSub } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan_name: 'free',
        status: 'active',
        amount: 0,
        networking_mode_usage: 0,
        ai_campaign_usage: 0,
      })
      .select()
      .single()
    subscription = newSub
  }
  
  const usage = subscription?.networking_mode_usage || 0
  const remaining = Math.max(0, FREE_TRIAL_LIMIT - usage)
  const allowed = usage < FREE_TRIAL_LIMIT
  
  let message: string | undefined
  if (!allowed) {
    message = `You've used all ${FREE_TRIAL_LIMIT} free networking mode uses. Upgrade to Pro for unlimited networking mode access.`
  }
  
  return {
    allowed,
    usage,
    limit: FREE_TRIAL_LIMIT,
    remaining,
    message,
  }
}

/**
 * Check AI campaign trial usage
 * Returns usage info and whether user can run AI campaigns
 */
export async function checkAICampaignTrial(
  userId: string
): Promise<{ allowed: boolean; usage: number; limit: number; remaining: number; message?: string }> {
  const supabase = await createClient()
  const plan = await getUserPlan(userId)
  
  // Pro and Enterprise plans have unlimited access
  if (plan === 'professional' || plan === 'enterprise') {
    return {
      allowed: true,
      usage: 0,
      limit: FREE_TRIAL_LIMIT,
      remaining: null as any, // unlimited
    }
  }
  
  // Get or create subscription record to track usage
  let { data: subscription } = await supabase
    .from("subscriptions")
    .select("ai_campaign_usage")
    .eq("user_id", userId)
    .single()
  
  // If no subscription record exists, create one (for free users)
  if (!subscription) {
    const { data: newSub } = await supabase
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan_name: 'free',
        status: 'active',
        amount: 0,
        networking_mode_usage: 0,
        ai_campaign_usage: 0,
      })
      .select()
      .single()
    subscription = newSub
  }
  
  const usage = subscription?.ai_campaign_usage || 0
  const remaining = Math.max(0, FREE_TRIAL_LIMIT - usage)
  const allowed = usage < FREE_TRIAL_LIMIT
  
  let message: string | undefined
  if (!allowed) {
    message = `You've used all ${FREE_TRIAL_LIMIT} free AI campaign runs. Upgrade to Pro for unlimited AI campaigns.`
  }
  
  return {
    allowed,
    usage,
    limit: FREE_TRIAL_LIMIT,
    remaining,
    message,
  }
}

/**
 * Increment networking mode usage
 */
export async function incrementNetworkingModeUsage(userId: string): Promise<void> {
  const supabase = await createClient()
  const plan = await getUserPlan(userId)
  
  // Only increment for free plan users
  if (plan === 'free') {
    // Get current subscription record
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("networking_mode_usage")
      .eq("user_id", userId)
      .single()
    
    if (subscription) {
      // Update existing record
      await supabase
        .from("subscriptions")
        .update({ networking_mode_usage: (subscription.networking_mode_usage || 0) + 1 })
        .eq("user_id", userId)
    } else {
      // Create subscription record if it doesn't exist
      await supabase
        .from("subscriptions")
        .insert({
          user_id: userId,
          plan_name: 'free',
          status: 'active',
          amount: 0,
          networking_mode_usage: 1,
          ai_campaign_usage: 0,
        })
    }
  }
}

/**
 * Increment AI campaign usage
 */
export async function incrementAICampaignUsage(userId: string): Promise<void> {
  const supabase = await createClient()
  const plan = await getUserPlan(userId)
  
  // Only increment for free plan users
  if (plan === 'free') {
    // Get current subscription record
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("ai_campaign_usage")
      .eq("user_id", userId)
      .single()
    
    if (subscription) {
      // Update existing record
      await supabase
        .from("subscriptions")
        .update({ ai_campaign_usage: (subscription.ai_campaign_usage || 0) + 1 })
        .eq("user_id", userId)
    } else {
      // Create subscription record if it doesn't exist
      await supabase
        .from("subscriptions")
        .insert({
          user_id: userId,
          plan_name: 'free',
          status: 'active',
          amount: 0,
          networking_mode_usage: 0,
          ai_campaign_usage: 1,
        })
    }
  }
}