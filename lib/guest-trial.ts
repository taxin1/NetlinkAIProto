import { createClient } from "@/lib/supabase/client"

export const GUEST_COOKIE_NAME = "netlink_guest_id"
export const TRIAL_LIMITS = {
  ACTIONS: 15, // Total AI-powered actions allowed for guests
  CONTACTS: 5,  // Max contacts a guest can have
}

export interface GuestUsage {
  actions: number
  contacts: number
  lastUpdated: string
}

export function isGuest(userId?: string): boolean {
  // If we have a real user ID from Supabase, they aren't a guest
  if (userId && !userId.startsWith('guest_')) return false
  
  if (typeof window === 'undefined') return false
  return !!document.cookie.includes(GUEST_COOKIE_NAME)
}

export function getGuestId(): string | null {
  if (typeof window === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + GUEST_COOKIE_NAME + '=([^;]+)'))
  return match ? match[2] : null
}

export function startGuestSession(): string {
  const guestId = `guest_${Math.random().toString(36).substring(2, 15)}`
  document.cookie = `${GUEST_COOKIE_NAME}=${guestId}; path=/; max-age=${60 * 60 * 24 * 7}` // 7 days
  
  // Initialize usage in local storage
  const initialUsage: GuestUsage = {
    actions: 0,
    contacts: 0,
    lastUpdated: new Date().toISOString()
  }
  localStorage.setItem(`usage_${guestId}`, JSON.stringify(initialUsage))
  
  return guestId
}

export function getGuestUsage(): GuestUsage {
  const guestId = getGuestId()
  if (!guestId) return { actions: 0, contacts: 0, lastUpdated: new Date().toISOString() }
  
  const stored = localStorage.getItem(`usage_${guestId}`)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (e) {
      console.error("Error parsing guest usage", e)
    }
  }
  
  return { actions: 0, contacts: 0, lastUpdated: new Date().toISOString() }
}

export function incrementGuestUsage(type: 'actions' | 'contacts'): boolean {
  const guestId = getGuestId()
  if (!guestId) return false
  
  const usage = getGuestUsage()
  
  if (type === 'actions' && usage.actions >= TRIAL_LIMITS.ACTIONS) return false
  if (type === 'contacts' && usage.contacts >= TRIAL_LIMITS.CONTACTS) return false
  
  usage[type]++
  usage.lastUpdated = new Date().toISOString()
  
  localStorage.setItem(`usage_${guestId}`, JSON.stringify(usage))
  return true
}

export function hasReachedLimit(type: 'actions' | 'contacts'): boolean {
  const usage = getGuestUsage()
  if (type === 'actions') return usage.actions >= TRIAL_LIMITS.ACTIONS
  if (type === 'contacts') return usage.contacts >= TRIAL_LIMITS.CONTACTS
  return false
}
