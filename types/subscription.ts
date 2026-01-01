export interface Subscription {
  id: string
  user_id: string
  plan_name: 'free' | 'professional' | 'enterprise'
  status: 'active' | 'canceled' | 'expired' | 'pending'
  paypal_order_id: string | null
  paypal_subscription_id: string | null
  amount: number
  currency: string
  billing_period: 'month' | 'year'
  started_at: string
  expires_at: string | null
  canceled_at: string | null
  created_at: string
  updated_at: string
}
