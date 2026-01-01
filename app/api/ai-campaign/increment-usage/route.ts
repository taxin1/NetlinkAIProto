import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkUsageLimit } from '@/lib/plan-features'

export async function POST() {
  const supabase = await createClient()
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user can use AI campaign
    const usageCheck = await checkUsageLimit(user.id, 'aiCampaign')
    
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { 
          error: usageCheck.message || 'AI campaign limit reached',
          requiresPro: true
        },
        { status: 403 }
      )
    }

    // Increment usage count
    const { data: existingUsage, error: fetchError } = await supabase
      .from('ai_campaign_usage')
      .select('usage_count')
      .eq('user_id', user.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw fetchError
    }

    const currentCount = existingUsage?.usage_count || 0
    const newCount = currentCount + 1

    const { error: upsertError } = await supabase
      .from('ai_campaign_usage')
      .upsert({
        user_id: user.id,
        usage_count: newCount,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (upsertError) {
      throw upsertError
    }

    return NextResponse.json({
      success: true,
      usageCount: newCount,
      remaining: usageCheck.remaining !== null ? usageCheck.remaining - 1 : null
    })
  } catch (error: any) {
    console.error('Error incrementing AI campaign usage:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to increment usage' },
      { status: 500 }
    )
  }
}
